const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const GFALToken = require("../artifacts/contracts/_mock/GFALToken.sol/GFALToken.json");

// NOTE: The requirement to run this test is to have a valid fork of BSC mainnet and to impersonate a wallet with enough BNB balance to complete the swap.
describe("MultiSwap BNB/GFAL", function () {
  async function deployContracts() {
    // Hard coded amount to send in BNB
    const BNBSwap = "1";
    const GFALSwap = ethers.utils.parseUnits("1000", "ether");
    // Hard coded amount to receive  to avoid front running (It should be equivalent to the GFAL amount we are expecting to receive)
    const amountOutMinSwapBNB = "13200553541451765";
    const amountOutMinSwapGFAL = "60049909999999994";

    const GFAL_ADDRESS = process.env.GFAL_TOKEN_MAINNET;
    const USDT_ADDRESS = process.env.USDT_TOKEN_MAINNET;
    const WBNB_ADDRESS = process.env.WBNB_ADDRESS;
    const WBNB_WHALE_SIGNER = process.env.BNB_WHALE_HOLDER;
    const GFAL_WHALE_SIGNER = process.env.GFAL_WHALE_SIGNER;

    console.log("BNB_WHALE_HOLDER: ", WBNB_WHALE_SIGNER);
    const GFALWhaleSigner = await ethers.getImpersonatedSigner(
      GFAL_WHALE_SIGNER
    );

    const BNBWhaleSigner = await ethers.getImpersonatedSigner(
      WBNB_WHALE_SIGNER
    );
    const Wale_BNB_Balance = await ethers.provider.getBalance(
      BNBWhaleSigner.address
    );

    const gfalToken = await ethers.getContractAt(GFALToken.abi, GFAL_ADDRESS);
    const wbnbToken = await ethers.getContractAt(GFALToken.abi, WBNB_ADDRESS);
    const usdtToken = await ethers.getContractAt(GFALToken.abi, USDT_ADDRESS);

    const SwapBNBGFAL = await ethers.getContractFactory(
      "SwapBNBGFAL",
      BNBWhaleSigner
    );
    const swapBNBGFAL = await SwapBNBGFAL.deploy();
    await swapBNBGFAL.deployed();

    // Approve the GFAL tokens for swapping
    await gfalToken
      .connect(GFALWhaleSigner)
      .approve(
        swapBNBGFAL.address,
        ethers.utils.parseUnits("10000000", "ether")
      );

    console.log(
      `${BNBWhaleSigner.address}: Owns ${ethers.utils.formatEther(
        Wale_BNB_Balance,
        "wei"
      )} BNB`
    );

    return {
      BNBWhaleSigner,
      swapBNBGFAL,
      WBNB_ADDRESS,
      gfalToken,
      GFAL_ADDRESS,
      Wale_BNB_Balance,
      USDT_ADDRESS,
      wbnbToken,
      usdtToken,
      BNBSwap,
      amountOutMinSwapBNB,
      GFALWhaleSigner,
      amountOutMinSwapGFAL,
      GFALSwap,
    };
  }

  describe("Deployment", () => {
    it("Swap BNB for GFAL", async () => {
      const {
        BNBWhaleSigner,
        swapBNBGFAL,
        gfalToken,
        wbnbToken,
        usdtToken,
        BNBSwap,
        amountOutMinSwapBNB,
      } = await loadFixture(deployContracts);

      const balanceBeforeSwapGFAL = await gfalToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapWBNB = await wbnbToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapUSDT = await usdtToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapBNB = await ethers.provider.getBalance(
        BNBWhaleSigner.address
      );

      await swapBNBGFAL
        .connect(BNBWhaleSigner)
        .swapBNBforGFAL(amountOutMinSwapBNB, {
          // Hard
          value: ethers.utils.parseUnits(BNBSwap, "ether"),
        });

      // console.log(" RESULT:", result);

      const balanceAfterSwapGFAL = await gfalToken.balanceOf(
        BNBWhaleSigner.address
      );

      const balanceAfterSwapWBNB = await wbnbToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceAfterSwapUSDT = await usdtToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceAfterSwapBNB = await ethers.provider.getBalance(
        BNBWhaleSigner.address
      );

      console.log("\n******** SWAPPING GFAL TO BNB RESULT ******** \n");
      console.log(
        `\nBalance BEFORE GFAL: ${ethers.utils.formatEther(
          balanceBeforeSwapGFAL
        )}`
      );
      console.log(
        `Balance AFTER GFAL: ${ethers.utils.formatEther(balanceAfterSwapGFAL)}`
      );

      console.log(
        `\nBalance BEFORE WBNB: ${ethers.utils.formatEther(
          balanceBeforeSwapWBNB
        )}`
      );
      console.log(
        `Balance AFTER WBNB: ${ethers.utils.formatEther(balanceAfterSwapWBNB)}`
      );
      console.log(
        `\nBalance BEFORE USDT: ${ethers.utils.formatEther(
          balanceBeforeSwapUSDT
        )}`
      );
      console.log(
        `Balance AFTER USDT: ${ethers.utils.formatEther(balanceAfterSwapUSDT)}`
      );
      console.log(
        `\nBalance BEFORE BNB: ${ethers.utils.formatEther(
          balanceBeforeSwapBNB
        )}`
      );
      console.log(
        `Balance AFTER BNB: ${ethers.utils.formatEther(balanceAfterSwapBNB)}`
      );

      const GFALbalanceAFTER = ethers.utils.formatEther(balanceAfterSwapGFAL);
      const GFALbalanceBEFORE = ethers.utils.formatEther(balanceBeforeSwapGFAL);

      console.log(`\nGFAL DIFF: +${GFALbalanceAFTER - GFALbalanceBEFORE}`);

      const balanceBEFORESwapBNB =
        ethers.utils.formatEther(balanceBeforeSwapBNB);
      const balanceAFTERSwapBNB = ethers.utils.formatEther(balanceAfterSwapBNB);

      console.log(`BNB DIFF: ${balanceAFTERSwapBNB - balanceBEFORESwapBNB}`);

      expect(balanceAfterSwapGFAL).to.be.greaterThan(amountOutMinSwapBNB);
      expect(balanceAfterSwapGFAL).to.be.greaterThan(balanceBeforeSwapGFAL);
      expect(balanceBeforeSwapBNB).to.be.greaterThan(balanceAfterSwapBNB);
      expect(balanceAfterSwapUSDT).to.equal(balanceBeforeSwapUSDT);
      expect(balanceAfterSwapWBNB).to.equal(balanceAfterSwapWBNB);
    });

    //Test that the contract rejects swaps when the sent BNB amount is zero:
    it("Should revert when swapping with zero BNB", async () => {
      const { swapBNBGFAL, amountOutMinSwapBNB } = await loadFixture(
        deployContracts
      );

      await expect(
        swapBNBGFAL.swapBNBforGFAL(amountOutMinSwapBNB, { value: 0 })
      ).to.be.revertedWith("BNB cannot be 0");
    });

    //Test that the contract rejects swaps when the amountOutMinSwapBNB is zero:
    it("Should revert when swapping with zero amountOutMinSwapBNB", async () => {
      const { swapBNBGFAL, BNBSwap } = await loadFixture(deployContracts);

      await expect(
        swapBNBGFAL.swapBNBforGFAL(0, {
          value: ethers.utils.parseUnits(BNBSwap, "ether"),
        })
      ).to.be.revertedWith("AmountOutMin cannot be 0");
    });

    //Test that the contract emits the correct event when a swap occurs:
    it("Should emit SwappedBNBtoGFAL event on successful swap", async () => {
      const { swapBNBGFAL, BNBWhaleSigner, amountOutMinSwapBNB, BNBSwap } =
        await loadFixture(deployContracts);

      await expect(
        swapBNBGFAL.swapBNBforGFAL(amountOutMinSwapBNB, {
          value: ethers.utils.parseUnits(BNBSwap, "ether"),
        })
      )
        .to.emit(swapBNBGFAL, "SwappedBNBtoGFAL")
        .withArgs(
          ethers.utils.parseUnits(BNBSwap, "ether"),
          anyValue, // GFAL amount received
          BNBWhaleSigner.address
        );
    });

    //Test the balances of BNB, WBNB, USDT, and GFAL tokens before and after the swap to ensure they are updated correctly:
    it("Should update token balances correctly after the swap", async () => {
      const {
        swapBNBGFAL,
        BNBWhaleSigner,
        gfalToken,
        wbnbToken,
        usdtToken,
        amountOutMinSwapBNB,
        BNBSwap,
      } = await loadFixture(deployContracts);

      const balanceBeforeSwapGFAL = await gfalToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapWBNB = await wbnbToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapUSDT = await usdtToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceBeforeSwapBNB = await ethers.provider.getBalance(
        BNBWhaleSigner.address
      );

      await swapBNBGFAL
        .connect(BNBWhaleSigner)
        .swapBNBforGFAL(amountOutMinSwapBNB, {
          value: ethers.utils.parseUnits(BNBSwap, "ether"),
        });

      const balanceAfterSwapGFAL = await gfalToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceAfterSwapWBNB = await wbnbToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceAfterSwapUSDT = await usdtToken.balanceOf(
        BNBWhaleSigner.address
      );
      const balanceAfterSwapBNB = await ethers.provider.getBalance(
        BNBWhaleSigner.address
      );

      expect(balanceAfterSwapGFAL).to.be.gt(balanceBeforeSwapGFAL);
      expect(balanceAfterSwapWBNB).to.be.equal(balanceBeforeSwapWBNB);
      expect(balanceAfterSwapUSDT).to.equal(balanceBeforeSwapUSDT);
      expect(balanceAfterSwapBNB).to.be.lt(balanceBeforeSwapBNB);
    });

    // Test the swapGFALforBNB function
    it("Swap GFAL for BNB", async () => {
      const {
        GFALWhaleSigner,
        swapBNBGFAL,
        gfalToken,
        wbnbToken,
        usdtToken,
        GFALSwap,
        amountOutMinSwapGFAL,
      } = await loadFixture(deployContracts);

      const balanceBeforeSwapGFAL = await gfalToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapWBNB = await wbnbToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapUSDT = await usdtToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapBNB = await ethers.provider.getBalance(
        GFALWhaleSigner.address
      );

      // Swap GFAL for BNB
      await swapBNBGFAL
        .connect(GFALWhaleSigner)
        .swapGFALforBNB(GFALSwap, amountOutMinSwapGFAL, {
          value: 0,
        });

      const balanceAfterSwapGFAL = await gfalToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapWBNB = await wbnbToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapUSDT = await usdtToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapBNB = await ethers.provider.getBalance(
        GFALWhaleSigner.address
      );

      expect(balanceAfterSwapGFAL).to.be.lt(balanceBeforeSwapGFAL);
      expect(balanceAfterSwapWBNB).to.be.equal(balanceBeforeSwapWBNB);
      expect(balanceAfterSwapUSDT).to.equal(balanceBeforeSwapUSDT);
      expect(balanceAfterSwapBNB).to.be.gt(balanceBeforeSwapBNB);
    });

    it("Should revert when swapping with zero GFAL amount", async () => {
      const { swapBNBGFAL, amountOutMinSwapGFAL } = await loadFixture(
        deployContracts
      );

      await expect(
        swapBNBGFAL.swapGFALforBNB(0, amountOutMinSwapGFAL, {
          value: 0,
        })
      ).to.be.revertedWith("amountGFAL cannot be 0");
    });

    it("Should revert when swapping with zero amountOutMinSwapBNB", async () => {
      const { swapBNBGFAL, amountOutMinSwapGFAL, GFALSwap } = await loadFixture(
        deployContracts
      );

      await expect(
        swapBNBGFAL.swapGFALforBNB(GFALSwap, 0, {
          value: 0,
        })
      ).to.be.revertedWith("AmountOutMin cannot be 0");
    });

    it("Should update token balances correctly after the swap", async () => {
      const {
        swapBNBGFAL,
        GFALWhaleSigner,
        gfalToken,
        wbnbToken,
        usdtToken,
        amountOutMinSwapGFAL,
        GFALSwap,
      } = await loadFixture(deployContracts);

      const balanceBeforeSwapGFAL = await gfalToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapWBNB = await wbnbToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapUSDT = await usdtToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceBeforeSwapBNB = await ethers.provider.getBalance(
        GFALWhaleSigner.address
      );

      await swapBNBGFAL
        .connect(GFALWhaleSigner)
        .swapGFALforBNB(GFALSwap, amountOutMinSwapGFAL, {
          value: 0,
        });

      const balanceAfterSwapGFAL = await gfalToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapWBNB = await wbnbToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapUSDT = await usdtToken.balanceOf(
        GFALWhaleSigner.address
      );
      const balanceAfterSwapBNB = await ethers.provider.getBalance(
        GFALWhaleSigner.address
      );

      expect(balanceAfterSwapGFAL).to.be.lt(balanceBeforeSwapGFAL);
      expect(balanceAfterSwapWBNB).to.be.equal(balanceBeforeSwapWBNB);
      expect(balanceAfterSwapUSDT).to.equal(balanceBeforeSwapUSDT);
      expect(balanceAfterSwapBNB).to.be.gt(balanceBeforeSwapBNB);
      console.log("\n******** SWAPPING BNB TO GFAL RESULT ******** \n");

      console.log(
        `\nBalance BEFORE GFAL: ${ethers.utils.formatEther(
          balanceBeforeSwapGFAL
        )}`
      );
      console.log(
        `Balance AFTER GFAL: ${ethers.utils.formatEther(balanceAfterSwapGFAL)}`
      );

      console.log(
        `\nBalance BEFORE WBNB: ${ethers.utils.formatEther(
          balanceBeforeSwapWBNB
        )}`
      );
      console.log(
        `Balance AFTER WBNB: ${ethers.utils.formatEther(balanceAfterSwapWBNB)}`
      );
      console.log(
        `\nBalance BEFORE USDT: ${ethers.utils.formatEther(
          balanceBeforeSwapUSDT
        )}`
      );
      console.log(
        `Balance AFTER USDT: ${ethers.utils.formatEther(balanceAfterSwapUSDT)}`
      );
      console.log(
        `\nBalance BEFORE BNB: ${ethers.utils.formatEther(
          balanceBeforeSwapBNB
        )}`
      );
      console.log(
        `Balance AFTER BNB: ${ethers.utils.formatEther(balanceAfterSwapBNB)}`
      );

      const balanceBEFORESwapGFAL = ethers.utils.formatEther(
        balanceBeforeSwapGFAL
      );
      const balanceAFTERSwapGFAL =
        ethers.utils.formatEther(balanceAfterSwapGFAL);

      console.log(
        `\nGFAL DIFF: ${balanceAFTERSwapGFAL - balanceBEFORESwapGFAL}`
      );

      const balanceBEFORESwapBNB =
        ethers.utils.formatEther(balanceBeforeSwapBNB);
      const balanceAFTERSwapBNB = ethers.utils.formatEther(balanceAfterSwapBNB);

      console.log(`BNB DIFF: +${balanceAFTERSwapBNB - balanceBEFORESwapBNB}`);
    });
  });
});
