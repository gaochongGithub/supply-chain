import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("SupplyChain Contract Tests", function () {
  let supplyChain: Contract;
  let owner: any;
  let admin: any;
  let seller: any;
  let buyer: any;
  const orderNumber = 1001;

  before(async () => {
    [owner, admin, seller, buyer] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.deployed();
  });

  // 1. 用户注册测试
  describe("User Registration", () => {

    it("Should register buyer successfully", async () => {
      await supplyChain.connect(buyer).registerUser(0); // 0 = Buyer
      const user = await supplyChain.users(buyer.address);
      expect(user.role).to.equal(0);
      expect(user.isActive).to.be.true;
    });

    it("Should prevent duplicate registration", async () => {
      await expect(supplyChain.connect(buyer).registerUser(1)) // 尝试注册为Seller
        .to.be.revertedWith("User exists");
    });

    it("Should register seller successfully", async () => {
      await supplyChain.connect(seller).registerUser(1); // 1 = Seller
      const user = await supplyChain.users(seller.address);
      expect(user.role).to.equal(1);
    });
  });

  // 2. 商品上传测试
  describe("Product Management", () => {

    it("Should allow seller to create Clothing product", async () => {

      // 调用 createProduct 创建衣物商品
      await supplyChain.connect(seller).createProduct(
        0,  // Clothing 类型
        orderNumber,
        "Nike",
        "China",
        10,
        "XL",  // specificAttr = 尺码
        500,   // commonAttr = 重量
        0,     // jewelryMaterial 不适用于 Clothing，设置为 0
        0      // foodType 不适用于 Clothing，设置为 0
      );

      const product = await supplyChain.products(orderNumber);
      expect(product.brand).to.equal("Nike");
      expect(product.pType).to.equal(0); // Clothing = 0
      expect(product.quantity).to.equal(10);

      // 验证 ProductAttributes
      const productAttrs = await supplyChain.productAttrs(orderNumber);
      expect(productAttrs.clothingSize).to.equal("XL");
      expect(Number(productAttrs.weight)).to.equal(500);
    });

    it("Should allow seller to create Jewelry product", async () => {
      const orderNumber = 1002;
      
      // 调用 createProduct 创建珠宝商品
      await supplyChain.connect(seller).createProduct(
        1,  // Jewelry 类型
        orderNumber,
        "Tiffany",
        "USA",
        5,
        "",   // 服装尺寸不适用
        50,   // commonAttr = 重量
        1,    // jewelryMaterial = 1 (Silver)
        0     // foodType 不适用于 Jewelry，设置为 0
      );
      
      const product = await supplyChain.products(orderNumber);
      expect(product.brand).to.equal("Tiffany");
      expect(product.pType).to.equal(1); // Jewelry = 1
      expect(product.quantity).to.equal(5);
  
      // 验证 ProductAttributes
      const productAttrs = await supplyChain.productAttrs(orderNumber);
      expect(Number(productAttrs.jewelryMaterial)).to.equal(1); // Silver
      expect(Number(productAttrs.weight)).to.equal(50);
    });
  
    it("Should allow seller to create Food product", async () => {
      const orderNumber = 1003;
      
      // 调用 createProduct 创建食物商品
      await supplyChain.connect(seller).createProduct(
        2,  // Food 类型
        orderNumber,
        "OrganicFarm",
        "USA",
        100,
        "",   // 服装尺寸不适用
        365,  // commonAttr = 食物保质期
        0,    // jewelryMaterial 不适用于 Food，设置为 0
        2     // foodType = 2 (Meat)
      );
      
      const product = await supplyChain.products(orderNumber);
      expect(product.brand).to.equal("OrganicFarm");
      expect(product.pType).to.equal(2); // Food = 2
      expect(product.quantity).to.equal(100);
  
      // 验证 ProductAttributes
      const productAttrs = await supplyChain.productAttrs(orderNumber);
      expect(Number(productAttrs.foodType)).to.equal(2); // Meat
      expect(Number(productAttrs.foodExpiry)).to.equal(365);
    });
  
  });

  // 3. 权限管理测试
  describe("Admin Permissions", () => {
    before(async () => {
      await supplyChain.connect(owner).setAdmin(admin.address);
    });

    it("Should allow admin to remove user", async () => {
      await supplyChain.connect(admin).removeUser(buyer.address, 0); // 0 = Buyer
      const user = await supplyChain.users(buyer.address);
      expect(user.isActive).to.be.false;
      expect(user.addr).to.be.revertedWith('0x0000000000000000000000000000000000000000');
    });

    it("Should prevent non-admin from removing user", async () => {
      await expect(
        supplyChain.connect(seller).removeUser(admin.address, 2) // 2 = Admin
      ).to.be.revertedWith("Admin only");
    });
  });

  // 4. Owner权限测试
  describe("Owner Functions", () => {
    it("Should transfer ownership", async () => {
      await supplyChain.connect(owner).transferOwnership(admin.address);
      expect(await supplyChain.owner()).to.equal(admin.address);
    });

    it("Should Remove Admin", async () => {
      await supplyChain.connect(owner).removeAdmin(admin.address);
      expect(await supplyChain.isAdmin(admin.address)).to.be.false;
    });

  });

  // 5. 物流管理测试
  describe("Logistics Management", () => {
    it("Should allow admin to add logistics node", async () => {
      await supplyChain.connect(admin).addLogisticsNode(
        orderNumber,
        "31.2304",
        "121.4737"
      );
      const path = await supplyChain.getLogisticsPath(orderNumber);
      expect(path[0].latitude).to.equal("31.2304");
    });
  });

  // 6. 购买流程测试
  describe("Purchase Process", () => {
    it("Should allow buyer to purchase product", async () => {
      await supplyChain.connect(buyer).buyProduct(orderNumber);
      const product = await supplyChain.products(orderNumber);
      expect(product.buyer).to.equal(buyer.address);
    });

    it("Should update product status to Delivered", async () => {
      await supplyChain.connect(admin).markAsDelivered(orderNumber);
      const status = await supplyChain.getProductStatus(orderNumber);
      expect(status).to.equal(2); // Delivered
    });
  });

  // 7. 数据查询测试
  describe("Data Queries", () => {
    it("Should return seller's product list", async () => {
      const products = await supplyChain.getSellerProducts(seller.address);
      expect(products[0]).to.equal(orderNumber);
    });
  });

});