// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract SupplyChain {
    // ================== 数据结构 ==================
    enum UserRole { Buyer, Seller }
    enum ProductType { Clothing, Jewelry, Food }
    enum ProductStatus { NotSold, InTransit, Delivered }
    enum JewelryMaterial { Silver, Gold, Diamond }
    enum FoodType { Fruit, Rice, Noodles, Meat }
    
    struct User {
        address addr;
        UserRole role;
        bool isActive;
    }
    
    struct ProductBase {
        ProductType pType; // 商品种类
        address seller; // 卖家地址
        string brand; // 品牌
        uint256 orderNumber; // 订单号
        uint256 issueDate; // 发货日期
        string productionLocation; // 生产地点
        uint256 quantity; // 数量 (衣物数量/食物克重/珠宝克重)
        ProductStatus status; // 商品状态
        address buyer; // 购买者
    }
    
    struct ProductAttributes {
        string clothingSize; // 尺寸
        JewelryMaterial jewelryMaterial; // 珠宝材质
        uint256 weight; // 克重
        uint256 foodExpiry; // 食物的保质期（时间戳）
        uint256 productionDate; // 生产日期（时间戳）
        FoodType foodType; // 食物类型
    }
    
    struct LogisticsNode {
        uint256 timestamp;
        string latitude;  // 新增：拆分经纬度
        string longitude;
    }

    // ================== 状态变量 ==================
    address public owner;
    mapping(address => User) public users;
    mapping(uint256 => ProductBase) public products;
    mapping(uint256 => ProductAttributes) public productAttrs;
    mapping(uint256 => LogisticsNode[]) logisticsPaths;
    mapping(address => uint256[]) sellerProducts;
    mapping(address => uint256[]) buyerProducts;
    mapping(address => bool) public isAdmin;
    address[] allSellers;
    address[] allBuyers;
    uint256[] productList;

    // 高效数组删除辅助
    mapping(address => uint256) public sellerIndex;  // 卖家地址 → 在allSellers中的索引
    mapping(address => uint256) public buyerIndex;   // 买家地址 → 在allBuyers中的索引

    // ================== 事件定义 ==================
    event UserRegistered(address indexed user, UserRole role);
    event UserRoleRemoved(address indexed user, UserRole role);  // 合并事件
    event ProductCreated(uint256 indexed orderNumber);
    event ProductDeleted(uint256 indexed orderNumber);
    event LogisticsAdded(uint256 indexed orderNumber, string latitude, string longitude);
    event ProductPurchased(uint256 indexed orderNumber, address buyer);
    event AdminUpdated(address indexed admin, bool added);
    event ProductStatusChanged(uint256 indexed orderNumber, ProductStatus status);
    event OwnershipTransferred(address indexed newOwner);

    // ================== 权限修饰器 ==================
    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
    }
    
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Admin only");
        _;
    }
    
    modifier onlySeller() {
        require(users[msg.sender].role == UserRole.Seller, "Seller only");
        _;
    }

    modifier onlyBuyer() {
        require(users[msg.sender].role == UserRole.Buyer, "Buyer only");
        _;
    }

    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "User inactive");
        _;
    }
    
    modifier productExists(uint256 orderNumber) {
        require(products[orderNumber].orderNumber != 0, "Product not exist");
        _;
    }
    
    modifier onlyProductSeller(uint256 orderNumber) {
        require(products[orderNumber].seller == msg.sender, "Not your product");
        _;
    }

    // ================== 构造函数 ==================
    constructor() {
        owner = msg.sender;
        isAdmin[owner] = true;  // 初始化管理员权限
        emit AdminUpdated(owner, true);
    }

    // ================== 用户管理 ==================
    function registerUser(UserRole role) external {
        require(!users[msg.sender].isActive, "User exists");
        require(role == UserRole.Buyer || role == UserRole.Seller, "Invalid role");
        
        users[msg.sender] = User(msg.sender, role, true);
        
        // 记录全局列表和索引
        if (role == UserRole.Seller) {
            allSellers.push(msg.sender);
            sellerIndex[msg.sender] = allSellers.length - 1;
        } else {
            allBuyers.push(msg.sender);
            buyerIndex[msg.sender] = allBuyers.length - 1;
        }
        
        emit UserRegistered(msg.sender, role);
    }

    function removeUser(address userAddr, UserRole role) external onlyAdmin {
        require(users[userAddr].isActive, "User not active");
        users[userAddr].isActive = false;

        delete users[userAddr];
        // 从全局列表中高效删除
        if (role == UserRole.Seller) {
            uint256 index = sellerIndex[userAddr];
            address lastSeller = allSellers[allSellers.length - 1];
            allSellers[index] = lastSeller;
            sellerIndex[lastSeller] = index;
            allSellers.pop();
            delete sellerIndex[userAddr];
        } else {
            uint256 index = buyerIndex[userAddr];
            address lastBuyer = allBuyers[allBuyers.length - 1];
            allBuyers[index] = lastBuyer;
            buyerIndex[lastBuyer] = index;
            allBuyers.pop();
            delete buyerIndex[userAddr];
        }

        // 清理关联数据
        if (role == UserRole.Seller) {
            delete sellerProducts[userAddr];
        } else {
            delete buyerProducts[userAddr];
        }

        emit UserRoleRemoved(userAddr, role);
    }

    // ================== 商品管理 ==================
    function createProduct(
        ProductType pType, //商品种类
        uint256 orderNumber, //订单号
        string memory brand, //品牌
        string memory productionLocation, //生产地
        uint256 quantity, //数量
        string memory specificAttr, // 衣服尺寸
        uint256 commonAttr, //克重
        uint8 jewelryMaterial,  // 新增：珠宝材质枚举值
        uint8 foodType  // 新增：食物种类枚举值
    ) external onlySeller {
        require(products[orderNumber].orderNumber == 0, "Product exists");
        require(commonAttr > 0, "Weight/Expiry must > 0");

        products[orderNumber] = ProductBase({
            pType: pType,
            seller: msg.sender,
            brand: brand,
            orderNumber: orderNumber,
            issueDate: block.timestamp,
            productionLocation: productionLocation,
            quantity: quantity,
            status: ProductStatus.NotSold,
            buyer: address(0)
        });

        // 处理不同商品类型的具体属性
        if (pType == ProductType.Clothing) {
            productAttrs[orderNumber].clothingSize = specificAttr;
            productAttrs[orderNumber].weight = commonAttr;
        } else if (pType == ProductType.Jewelry) {
            // 限制珠宝材质必须是合法枚举值
            require(jewelryMaterial >= uint8(JewelryMaterial.Silver) && jewelryMaterial <= uint8(JewelryMaterial.Diamond), "Invalid jewelry material");
            productAttrs[orderNumber].jewelryMaterial = JewelryMaterial(jewelryMaterial);
            productAttrs[orderNumber].weight = commonAttr;
        } else if (pType == ProductType.Food) {
            // 限制食物种类必须是合法枚举值
            require(foodType >= uint8(FoodType.Fruit) && foodType <= uint8(FoodType.Meat), "Invalid food type");
            productAttrs[orderNumber].foodType = FoodType(foodType);
            productAttrs[orderNumber].foodExpiry = commonAttr;
        }

        productList.push(orderNumber);
        sellerProducts[msg.sender].push(orderNumber);

        emit ProductCreated(orderNumber);
    }

    function deleteProduct(uint256 orderNumber) external onlyAdmin productExists(orderNumber) {
        address seller = products[orderNumber].seller;
        
        // 从卖家商品列表删除
        uint256[] storage orders = sellerProducts[seller];
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i] == orderNumber) {
                orders[i] = orders[orders.length - 1];
                orders.pop();
                break;
            }
        }

        // 从全局列表删除
        for (uint256 i = 0; i < productList.length; i++) {
            if (productList[i] == orderNumber) {
                productList[i] = productList[productList.length - 1];
                productList.pop();
                break;
            }
        }

        delete products[orderNumber];
        delete productAttrs[orderNumber];
        delete logisticsPaths[orderNumber];

        emit ProductDeleted(orderNumber);
    }

    // ================== 交易与物流 ==================
    function buyProduct(uint256 orderNumber) external onlyBuyer productExists(orderNumber) {
        ProductBase storage product = products[orderNumber];
        require(product.status == ProductStatus.NotSold, "Already sold");
        require(product.buyer == address(0), "Buyer exists");

        product.buyer = msg.sender;
        product.status = ProductStatus.InTransit;
        buyerProducts[msg.sender].push(orderNumber);

        emit ProductPurchased(orderNumber, msg.sender);
        emit ProductStatusChanged(orderNumber, ProductStatus.InTransit);
    }

    function addLogisticsNode(
        uint256 orderNumber,
        string memory latitude,
        string memory longitude
    ) external onlyAdmin productExists(orderNumber) {
        logisticsPaths[orderNumber].push(LogisticsNode(
            block.timestamp,
            latitude,
            longitude
        ));
        emit LogisticsAdded(orderNumber, latitude, longitude);
    }

    function getLogisticsPath(uint256 orderNumber) external view returns (LogisticsNode[] memory path) {
        path = logisticsPaths[orderNumber];
    }

    function markAsDelivered(uint256 orderNumber) external onlyAdmin productExists(orderNumber) {
        ProductBase storage product = products[orderNumber];
        require(product.status == ProductStatus.InTransit, "Not in transit");
        product.status = ProductStatus.Delivered;
        emit ProductStatusChanged(orderNumber, ProductStatus.Delivered);
    }

    // ================== 管理员权限 ==================
    function setAdmin(address newAdmin) external onlyOwner {
        require(!isAdmin[newAdmin], "Already admin");
        isAdmin[newAdmin] = true;
        emit AdminUpdated(newAdmin, true);
    }

    function removeAdmin(address adminAddr) external onlyOwner {
        require(isAdmin[adminAddr], "Not admin");
        isAdmin[adminAddr] = false;
        emit AdminUpdated(adminAddr, false);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    // ================== 查询接口 ==================
    // 判断食物是否过期
    function isFoodExpired(uint256 orderNumber) public view returns (bool) {
        ProductAttributes memory attributes = productAttrs[orderNumber];
        ProductBase memory product = products[orderNumber];
        require(product.pType == ProductType.Food, "Not food product");

        return block.timestamp > (attributes.productionDate + attributes.foodExpiry);
    }

    function getProductFullInfo(uint256 orderNumber) external view returns (
        ProductBase memory base,
        ProductAttributes memory attrs,
        LogisticsNode[] memory path
    ) {
        base = products[orderNumber];
        attrs = productAttrs[orderNumber];
        path = logisticsPaths[orderNumber];
    }

    function getSellerProducts(address seller) external view returns (uint256[] memory) {
        return sellerProducts[seller];
    }

    function getBuyerProducts(address buyer) external view returns (uint256[] memory) {
        return buyerProducts[buyer];
    }

    function getAllSellers() external view returns (address[] memory) {
        return allSellers;
    }

    function getAllBuyers() external view returns (address[] memory) {
        return allBuyers;
    }

    function getAllProducts() external view returns (uint256[] memory) {
        return productList;
    }

    function getProductStatus(uint256 orderNumber) external view returns (uint) {
        return uint(products[orderNumber].status);
    }
}