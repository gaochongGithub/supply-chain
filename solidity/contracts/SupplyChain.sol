// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "hardhat/console.sol";

contract SupplyChain {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    // ================== 枚举类型 ==================
    enum NodeType { Initial, Sold, Intransit, Delivered } //路径类型
    enum UserRole { Buyer, Seller }                 //用户类型
    enum ProductType { Clothing, Jewelry, Food }    //商品类型
    enum ProductStatus { NotSold, InTransit, Delivered }//商品状态
    enum ClothingSize { S, M, L, XL, XXL }              //衣服尺寸
    enum JewelryMaterial { Silver, Gold, Diamond }      //珠宝成分
    enum FoodType { Fruit, Rice, Noodles, Meat }        //食物种类

    // ================== 数据结构 ==================
    struct ProductBase {
        ProductType pType;
        string brand;
        uint256 orderNumber;
        string productionLocation;
        uint256 quantity;
        uint256 issueDate;
        address seller;
        ProductStatus status;
        address buyer;
    }

    struct ProductAttributes {
        string color;
        ClothingSize clothingSize;
        JewelryMaterial jewelryMaterial;
        uint256 foodExpiry;
        uint256 productionDate;
        FoodType foodType;
    }

    struct LogisticsNode {
        uint256 timestamp;
        string path;
        NodeType nodeType;
        address addedBy;
        bool isBuyer;
    }

    struct Product {
        ProductBase base;
        ProductAttributes attrs;
        bool exists;
    }

    struct User {
        address addr;
        UserRole role;
        bool isActive;
        uint256 time;
    }

    struct CreateProductParams {
        ProductType pType; //商品种类
        uint256 orderNumber;//订单号
        string brand;//品牌
        string productionLocation;//生产地
        uint256 quantity;//数量(克重)
        string path; //发货地路径
        string color;//衣服，珠宝颜色
        uint8 size;// 衣服尺寸
        uint8 jewelryMaterial;// 新增：珠宝材质枚举值
        uint256 foodExpiry;//食物保质期
        uint256 productionDate;//食物生产日期
        uint8 foodType;// 新增：食物种类枚举值
    }

    // ================== 状态变量 ==================
    address public owner;
    mapping(address => User) public users;
    mapping(uint256 => Product) private products;
    mapping(uint256 => LogisticsNode[]) private logisticsPaths;
    EnumerableSet.AddressSet private sellers;
    EnumerableSet.AddressSet private buyers;
    EnumerableSet.UintSet private allProducts;
    mapping(address => EnumerableSet.UintSet) private sellerProducts;
    mapping(address => EnumerableSet.UintSet) private buyerProducts;
    mapping(address => bool) public isAdmin;

    // ================== 事件定义 ==================
    event UserRegistered(address indexed user, UserRole role);
    event UserRemoved(address indexed user, UserRole role);
    event ProductCreated(uint256 indexed orderNumber);
    event ProductDeleted(uint256 indexed orderNumber);
    event LogisticsAdded(uint256 indexed orderNumber, NodeType nodeType);
    event ProductPurchased(uint256 indexed orderNumber, address buyer);
    event AdminUpdated(address indexed admin, bool added);
    event ProductStatusChanged(uint256 indexed orderNumber, ProductStatus status);
    event OwnershipTransferred(address indexed newOwner);

    // ================== 修饰器 ==================
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
        require(products[orderNumber].exists, "Product not exist");
        _;
    }
    
    modifier onlyProductSeller(uint256 orderNumber) {
        require(products[orderNumber].base.seller == msg.sender, "Not your product");
        _;
    }

    // 路径验证修饰器
    modifier validLogisticsSequence(uint256 orderNumber) {
        LogisticsNode[] storage path = logisticsPaths[orderNumber];
        if (path.length > 0) {
            require(
                block.timestamp > path[path.length-1].timestamp,
                "Timestamp must be increasing"
            );
        }
        _;
    }
    // ================== 构造函数 ==================
    constructor() {
        owner = msg.sender;
        isAdmin[owner] = true;
        emit AdminUpdated(owner, true);
    }

    // ================== 用户管理 ==================
    function registerUser(UserRole role) external {
        require(!users[msg.sender].isActive, "User exists");
        require(role == UserRole.Buyer || role == UserRole.Seller, "Invalid role");
        
        users[msg.sender] = User(msg.sender, role, true, block.timestamp);
        
        if (role == UserRole.Seller) {
            sellers.add(msg.sender);
        } else {
            buyers.add(msg.sender);
        }
        
        emit UserRegistered(msg.sender, role);
    }

    function removeUser(address userAddr, UserRole role) external onlyAdmin {
        require(users[userAddr].isActive, "User not active");
        users[userAddr].isActive = false;

        if (role == UserRole.Seller) {
            // 删除卖家所有商品
            uint256[] memory productList = sellerProducts[userAddr].values();
            for (uint256 i = 0; i < productList.length; i++) {
                _deleteProduct(productList[i]);
            }
            sellers.remove(userAddr);
        } else {
            buyers.remove(userAddr);
        }

        emit UserRemoved(userAddr, role);
    }

    // ================== 商品管理 ==================
    function createProduct(CreateProductParams calldata params) external onlySeller {
        require(!products[params.orderNumber].exists, "Product exists");
        require(bytes(params.path).length > 0, "Path cannot be empty");
        require(params.quantity > 0, "quantity is not");
        
        ProductBase memory base = ProductBase({
            pType: params.pType,
            brand: params.brand,
            orderNumber: params.orderNumber,
            productionLocation: params.productionLocation,
            quantity: params.quantity,
            issueDate: block.timestamp,
            seller: msg.sender,
            status: ProductStatus.NotSold,
            buyer: address(0)
        });

        ProductAttributes memory attrs;
        if (params.pType == ProductType.Clothing) {
            attrs.clothingSize = ClothingSize(params.size);
            attrs.color = params.color;
        } else if (params.pType == ProductType.Jewelry) {
            require(params.jewelryMaterial <= uint8(JewelryMaterial.Diamond), "Invalid material");
            attrs.jewelryMaterial = JewelryMaterial(params.jewelryMaterial);
            attrs.color = params.color;
        } else if (params.pType == ProductType.Food) {
            require(params.foodType <= uint8(FoodType.Meat), "Invalid food type");
            attrs.foodType = FoodType(params.foodType);
            attrs.foodExpiry = params.foodExpiry;
            attrs.productionDate = params.productionDate;
        }

        products[params.orderNumber] = Product({
            base: base,
            attrs: attrs,
            exists: true
        });
         // 添加初始节点
        logisticsPaths[params.orderNumber].push(LogisticsNode({
            timestamp: block.timestamp,
            path: params.path,
            nodeType: NodeType.Initial,
            addedBy: msg.sender,
            isBuyer: false
        }));

        allProducts.add(params.orderNumber);
        sellerProducts[msg.sender].add(params.orderNumber);

        emit LogisticsAdded(params.orderNumber, NodeType.Initial); // 修改事件触发
        emit ProductCreated(params.orderNumber);
    }

    function deleteProduct(uint256 orderNumber) external onlyAdmin productExists(orderNumber) {
        _deleteProduct(orderNumber);
        emit ProductDeleted(orderNumber);
    }

    function _deleteProduct(uint256 orderNumber) private {
        Product storage product = products[orderNumber];
        require(product.exists, "Product not exist");

        // 清理关联数据
        sellerProducts[product.base.seller].remove(orderNumber);
        if (product.base.buyer != address(0)) {
            buyerProducts[product.base.buyer].remove(orderNumber);
        }
        allProducts.remove(orderNumber);

        delete products[orderNumber];
    }

    // ================== 交易与物流 ==================
    function buyProduct(uint256 orderNumber, string memory path) external onlyBuyer productExists(orderNumber) {
        Product storage product = products[orderNumber];
        require(product.base.status == ProductStatus.NotSold, "Already sold");
        require(logisticsPaths[orderNumber].length == 1, "Missing initial node");
        require(bytes(path).length > 0, "Path cannot be empty");

        product.base.buyer = msg.sender;
        product.base.status = ProductStatus.InTransit;
        buyerProducts[msg.sender].add(orderNumber);

         logisticsPaths[orderNumber].push(LogisticsNode({
            timestamp: block.timestamp,
            path: path,
            nodeType: NodeType.Sold,   // 设置最终类型
            addedBy: msg.sender,          // 记录买家地址
            isBuyer: true
        }));

        emit LogisticsAdded(orderNumber, NodeType.Sold); 
        emit ProductPurchased(orderNumber, msg.sender);
        emit ProductStatusChanged(orderNumber, ProductStatus.InTransit);
    }

    function addLogisticsNode(
        uint256 orderNumber,
        string[] memory paths
    ) external onlyAdmin productExists(orderNumber) validLogisticsSequence(orderNumber) {
        Product storage product = products[orderNumber];
        require(product.base.status == ProductStatus.InTransit, "Not in transit");
        require(logisticsPaths[orderNumber].length >= 2, "Missing base nodes");

        LogisticsNode[] storage pathChain = logisticsPaths[orderNumber];

        uint256 lastTimestamp = pathChain.length > 0 ? 
            pathChain[pathChain.length - 1].timestamp : block.timestamp;

        // 遍历路径，依次插入
        for (uint256 i = 0; i < paths.length; i++) {
            pathChain.push(LogisticsNode({
                timestamp: lastTimestamp + 1,  // 保证时间递增
                path: paths[i],
                nodeType: NodeType.Intransit,  // 中间节点
                addedBy: msg.sender,
                isBuyer: false
            }));

            lastTimestamp++;  // 更新时间戳
        }

        emit LogisticsAdded(orderNumber, NodeType.Intransit); 
    }

    // 路径验证函数
    function validateLogisticsPath(uint256 orderNumber) public view returns (bool) {
        LogisticsNode[] storage path = logisticsPaths[orderNumber];
        if (path.length < 2) return false;
        
        // 验证首尾节点类型
        if (path[0].nodeType != NodeType.Intransit || 
            path[path.length-1].nodeType != NodeType.Delivered) {
            return false;
        }

        // 验证时间顺序
        for (uint i = 1; i < path.length; i++) {
            if (path[i].timestamp <= path[i-1].timestamp) return false;
        }
        
        return true;
    }

    function markAsDelivered(uint256 orderNumber) external onlyAdmin productExists(orderNumber) {
        // require(validateLogisticsPath(orderNumber), "Invalid logistics path");//模拟真实时间顺序，但前端展示效果会慢，因此先屏蔽，后续根据接入模拟
        Product storage product = products[orderNumber];
        require(product.base.status == ProductStatus.InTransit);
        
        product.base.status = ProductStatus.Delivered;
        emit ProductStatusChanged(orderNumber, ProductStatus.Delivered);
    }

    // ================== 管理员功能 ==================
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
    function getProductFullInfo(uint256 orderNumber) external view productExists(orderNumber) returns (
        ProductBase memory base,
        ProductAttributes memory attrs,
        LogisticsNode[] memory logistics
    ) {
        Product storage product = products[orderNumber];
        return (product.base, product.attrs, logisticsPaths[orderNumber]);
    }

    function isFoodExpired(uint256 orderNumber) public view returns (bool) {
        Product storage product = products[orderNumber];
        require(product.base.pType == ProductType.Food, "Not food");
        return block.timestamp > (product.attrs.productionDate + product.attrs.foodExpiry);
    }

    // 批量获取函数
    function getAllProducts() external view returns (uint256[] memory) {
        return allProducts.values();
    }

    function getSellerProducts(address seller) external view returns (uint256[] memory) {
        return sellerProducts[seller].values();
    }

    function getBuyerProducts(address buyer) external view returns (uint256[] memory) {
        return buyerProducts[buyer].values();
    }

    function getAllSellers() external view returns (address[] memory) {
        return sellers.values();
    }

    function getAllBuyers() external view returns (address[] memory) {
        return buyers.values();
    }

    function getProductStatus(uint256 orderNumber) external view returns (uint) {
        return uint(products[orderNumber].base.status);
    }
    // 获取完整路径函数
    function getFullLogisticsPath(uint256 orderNumber) external view returns (LogisticsNode[] memory) {
        return logisticsPaths[orderNumber];
    }
}