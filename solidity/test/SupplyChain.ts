import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("Supply Contract Tests", function () {
  let supplyChain: Contract;
  let owner: any;
  let admin: any;
  let seller: any;
  let buyer: any;
  const orderNumber = 1000000;

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
      const params = {
        pType: 0, // Clothing
        orderNumber: orderNumber,
        brand: "Nike",
        productionLocation: "China",
        quantity: 10,
        path:'shanghai',
        color: "Red",
        size: 1, // M
        jewelryMaterial: 0, // 未使用时可填0
        foodExpiry: 0,       // 未使用时可填0
        productionDate: 0,   // 未使用时可填0
        foodType: 0,         // 未使用时可填0
        
    };
      // 调用 createProduct 创建衣物商品
      await supplyChain.connect(seller).createProduct(params);

      const {base, attrs, logistics} = await supplyChain.getProductFullInfo(orderNumber);
      // console.log(base, "product====")
      expect(base.brand).to.equal("Nike");
      expect(base.pType).to.equal(0); // Clothing = 0
      expect(base.quantity).to.equal(10);

      // 验证 ProductAttributes
      expect(attrs.clothingSize).to.equal(1);
      // 验证路径
      console.log(logistics, "返回路径=====")
      // expect(logistics[0][1]).to.equal("31.2304");
    });

    // it("Should allow seller to create Jewelry product", async () => {
    //   const orderNumber = 1002;
      
    //   // 调用 createProduct 创建珠宝商品
    //   await supply.connect(seller).createProduct(
    //     1,  // Jewelry 类型
    //     orderNumber,
    //     "Tiffany",
    //     "USA",
    //     5,
    //     "yellow",   // 颜色
    //     0,   // 服装尺寸不适用
    //     1,    // jewelryMaterial = 1 (Silver)
    //     0,     // 食物保质期
    //     0,
    //     0       
    //   );
      
    //   const product = await supply.products(orderNumber);
    //   expect(product.brand).to.equal("Tiffany");
    //   expect(product.pType).to.equal(1); // Jewelry = 1
    //   expect(product.quantity).to.equal(5);
  
    //   // 验证 ProductAttributes
    //   const productAttrs = await supply.productAttrs(orderNumber);
    //   expect(Number(productAttrs.jewelryMaterial)).to.equal(1); // Silver
    // });
  
    // it("Should allow seller to create Food product", async () => {
    //   const orderNumber = 1003;
      
    //   // 调用 createProduct 创建食物商品
    //   await supply.connect(seller).createProduct(
    //     2,  // Food 类型
    //     orderNumber,
    //     "OrganicFarm",
    //     "USA",
    //     100,
    //     "",   // 颜色
    //     0,  // 尺寸
    //     0,    // jewelryMaterial 不适用于 Food，设置为 0
    //     200,     // 保质期
    //     300,   //生产日期
    //     0,     //食物种类
    //   );
      
    //   const product = await supply.products(orderNumber);
    //   expect(product.brand).to.equal("OrganicFarm");
    //   expect(product.pType).to.equal(2); // Food = 2
    //   expect(product.quantity).to.equal(100);
  
    //   // 验证 ProductAttributes
    //   const productAttrs = await supply.productAttrs(orderNumber);
    //   expect(Number(productAttrs.foodType)).to.equal(0); // Meat
    //   expect(Number(productAttrs.foodExpiry)).to.equal(200);
    // });
  
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
    // 需要先购买
    before(async () => {
      await supplyChain.connect(buyer).buyProduct(orderNumber, "beijing");
    });
    it("Should allow admin to add logistics node", async () => {
      await supplyChain.connect(admin).addLogisticsNode(orderNumber,['guangzhou', "shanghai", "zhengzhou"])
      const path = await supplyChain.getFullLogisticsPath(orderNumber)
      expect(path.length).to.equal(5); // Delivered
      // console.log(path, "添加后返回路径=====")
      // await expect(
      //   supplyChain.connect(admin).addLogisticsNode(orderNumber,['guangzhou, shanghai, zhengzhou'])
      // ).to.be.revertedWith("Not in transit");
    });

    it("Should update product status to Delivered", async () => {
      await supplyChain.connect(admin).markAsDelivered(orderNumber);
      const status = await supplyChain.getProductStatus(orderNumber);
      console.log(status, "返回当前商品状态===")
      expect(Number(status)).to.equal(2); // Delivered
    });

    // it("Should allow admin to add logistcsNode", async () => {
    //   await expect(
    //     supply.connect(admin).addLogisticsNode(orderNumber,'200', "201")
    //   ).to.be.revertedWith("Not in transit");
    // });
  });

  // 6. 购买流程测试
  // describe("Purchase Process", () => {
  //   it("Should allow buyer to purchase product", async () => {
  //     await supplyChain.connect(buyer).buyProduct(orderNumber, "nanjing");
  //     const { logistics } = await supplyChain.getProductFullInfo(orderNumber);
  //     console.log(logistics, "Buy Product")
  //     // expect(logistics[1][1].buyer).to.equal("500");
  //   });

  //   it("Should allow admin to add logistcsNode", async () => {
  //     await supplyChain.connect(admin).addLogisticsNode(orderNumber, ["zhengzhou", "xinyang"])
  //     const { logistics } = await supplyChain.getProductFullInfo(orderNumber);
  //     console.log(logistics, "Admin add logists")
  //     // expect(logistics[2][1].buyer).to.equal("200");
  //   });

  // });

  // 7. 数据查询测试
  describe("Data Queries", () => {
    it("Should return seller's product list", async () => {
      const products = await supplyChain.getSellerProducts(seller.address);
      console.log(products, "products====")
      expect(Number(products[0])).to.equal(orderNumber);
    });
  });

});