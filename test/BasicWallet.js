const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getSignatureAndValidate,
  getBNBTxSignatureAndValidate,
} = require("../scripts/account-abstraction/userOp-signer");

const AA_SIGNER_PUBLIC_KEY = process.env.AA_SIGNER_PUBLIC_KEY;
const BNB_WHALE_ADDRESS = process.env.BNB_WHALE_HOLDER;
const GFAL_TOKEN_MAINNET = "0x47c454cA6be2f6DEf6f32b638C80F91c9c3c5949";
const GFAL_WHALE_SIGNER = process.env.GFAL_WHALE_SIGNER;
const SWAPPER_GFAL_BNB_ADDRESS = process.env.SWAPPER_GFAL_BNB_ADDRESS;
const PROXY_ADDRESS = "0x4e3BDf3776E7ea6FD7931Fd29a5e1d933A55357C";
const SIGNER_MAINNET_PRIVATE_KEY = process.env.SIGNER_MAINNET_PRIVATE_KEY;

const BNB_GFAL_RATE = 14369; // How much GFAL is 1 BNB? NO DECIMALS.

const Provider = new ethers.providers.JsonRpcProvider(
  process.env.WEB3_HTTP_PROVIDER_MAIN
);
const target = GFAL_TOKEN_MAINNET;
const value = 0;
const chainId = 97; // Replace with your desired chainId

// Gfal Transfer:
const functionIdTransfer = "transfer(address,uint256)";
const typesArgsTransfer = ["address", "uint256"];
const functionArgsTransfer = [
  AA_SIGNER_PUBLIC_KEY,
  ethers.utils.parseEther("1"),
];

// Gfal Balance:
const functionIdBalance = "balanceOf(address)";
const typesArgsBalance = ["address"];
const functionArgsBalance = [GFAL_WHALE_SIGNER];

// Gfal Approve:
const functionIdApprove = "approve(address,uint256)";
const typesArgsApprove = ["address", "uint256"];
const functionArgsApprove = [
  SWAPPER_GFAL_BNB_ADDRESS,
  ethers.utils.parseEther("1"),
];

describe("BasicWallet", function () {
  async function deployContracts() {
    const GFAL_WHALE = await ethers.getImpersonatedSigner(GFAL_WHALE_SIGNER);
    const BNB_WHALE = await ethers.getImpersonatedSigner(BNB_WHALE_ADDRESS);
    const walletOwner = new ethers.Wallet(SIGNER_MAINNET_PRIVATE_KEY, Provider);
    const bundler = await ethers.getImpersonatedSigner(AA_SIGNER_PUBLIC_KEY);

    const feeData = await ethers.provider.getFeeData();

    // Fill up GFAL_WHALE for fees
    const tx1BNB = {
      to: GFAL_WHALE.address,
      value: ethers.utils.parseEther("1"),
    };
    const tx2BNB = {
      to: bundler.address,
      value: ethers.utils.parseEther("1"),
    };
    await BNB_WHALE.sendTransaction(tx1BNB);
    await BNB_WHALE.sendTransaction(tx2BNB);
    console.log(
      `- GFAL Whale transferred ${tx2BNB.value} BNB to Bundler and GFAL Whale`
    );

    const BasicWalletFactory = await ethers.getContractFactory(
      "BasicWalletFactory"
    );
    const basicWalletFactory = await BasicWalletFactory.deploy(PROXY_ADDRESS);
    await basicWalletFactory.deployed();

    const counterfactualWallet = await basicWalletFactory.getAddress(
      walletOwner.address,
      "1"
    );

    const walletCreated = await basicWalletFactory
      .connect(bundler)
      .createWallet(walletOwner.address, "1");

    const receipt = await walletCreated.wait();

    const userProfile = {
      owner: receipt.events[0].args[0],
      accountAddress: receipt.events[0].args[1],
    };

    console.log(`\n- EXPECTED USER: ${walletOwner.address}`);
    console.log(`- OWNER: ${userProfile.owner}`);
    console.log(`\n- EXPECTED SMART WALLET Addr: ${counterfactualWallet}`);
    console.log(`- SMART WALLET Addr: ${userProfile.accountAddress}`);

    console.log(
      `\n- User (${userProfile.owner}) created a Smart Account to (${userProfile.accountAddress})`
    );

    const basicWallet = await ethers.getContractAt(
      "BasicWallet",
      userProfile.accountAddress
    );

    const GFALToken = await ethers.getContractAt(
      "GFALToken",
      GFAL_TOKEN_MAINNET
    );

    console.log("- BasicWallet deployed to: ", basicWallet.address);

    await GFALToken.connect(GFAL_WHALE).transfer(
      basicWallet.address,
      ethers.utils.parseUnits("10000", "ether")
    );

    const balanceGFALaccount = await GFALToken.balanceOf(basicWallet.address);

    console.log(
      `- Smart Account filled up with ${ethers.utils.formatEther(
        balanceGFALaccount.toString()
      )} GFALs`
    );

    console.log(`- Bundler/Admin wallet is: ${bundler.address}`);

    return {
      bundler,
      walletOwner,
      basicWallet,
      basicWalletFactory,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      GFALToken,
      counterfactualWallet,
      basicWallet, // Wallet 1 deployed
      userProfile,
      AA_SIGNER_PUBLIC_KEY,
      GFAL_WHALE,
      BNB_WHALE,
      feeData,
    };
  }

  it("Verify expected Wallet deployed Matches the deployed wallet", async () => {
    const { userProfile, counterfactualWallet, walletOwner, basicWallet } =
      await loadFixture(deployContracts);

    expect(await basicWallet.owner()).to.equal(walletOwner.address);
    expect(userProfile.owner).to.equal(walletOwner.address);
    expect(counterfactualWallet).to.equal(userProfile.accountAddress);
    expect(userProfile.accountAddress).to.equal(basicWallet.address);
  });

  it("Transfer Value from the Smart Wallet (BNB)", async () => {
    const { userProfile, basicWallet, bundler, BNB_WHALE } = await loadFixture(
      deployContracts
    );

    const BNBtopUp = {
      to: userProfile.accountAddress,
      value: ethers.utils.parseEther("1"),
    };

    await BNB_WHALE.sendTransaction(BNBtopUp);

    const WalletBNBbalanceBefore = await ethers.provider.getBalance(
      userProfile.accountAddress
    );
    const SignerBNBbalanceBefore = await ethers.provider.getBalance(
      userProfile.owner
    );
    console.log(
      "BNB Balance Wallet After BNB Topped up: ",
      ethers.utils.formatEther(WalletBNBbalanceBefore)
    );

    const BNBtransferRes = await getBNBTxSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      userProfile.owner,
      ethers.utils.parseUnits("0.1", "ether"),
      await basicWallet.nonce()
    );

    console.log("\n- ✅ BNB Transfer signature: ", BNBtransferRes.signature);

    const Tx = await basicWallet
      .connect(bundler)
      .handleOp(
        userProfile.owner,
        ethers.utils.parseUnits("0.1", "ether"),
        BNBtransferRes.callData,
        BNBtransferRes.signature,
        await ethers.provider.getGasPrice(),
        BNB_GFAL_RATE,
        false
      );

    await Tx.wait();

    const WalletBNBbalanceAfter = await ethers.provider.getBalance(
      userProfile.accountAddress
    );
    const SignerBNBbalanceAfter = await ethers.provider.getBalance(
      userProfile.owner
    );

    console.log(
      "- WalletBNBbalanceBefore: ",
      ethers.utils.formatEther(WalletBNBbalanceBefore)
    );
    console.log(
      "- WalletBNBbalanceAfter",
      ethers.utils.formatEther(WalletBNBbalanceAfter)
    );

    console.log(
      "\n- SignerBNBbalanceBefore: ",
      ethers.utils.formatEther(SignerBNBbalanceBefore)
    );
    console.log(
      "- SignerBNBbalanceAfter",
      ethers.utils.formatEther(SignerBNBbalanceAfter)
    );

    expect(WalletBNBbalanceAfter).to.be.lessThan(WalletBNBbalanceBefore);
    expect(SignerBNBbalanceBefore).to.be.lessThan(SignerBNBbalanceAfter);
  });

  it("If Sponsored is true, None GFAL should be transferred", async () => {
    const { bundler, GFALToken, basicWallet } = await loadFixture(
      deployContracts
    );

    const GFALBalanceBefore = await GFALToken.balanceOf(bundler.address);

    const transferRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      GFALToken.address,
      0,
      await basicWallet.nonce()
    );

    await basicWallet
      .connect(bundler)
      .handleOp(
        GFALToken.address,
        0,
        transferRes.callData,
        transferRes.signature,
        await ethers.provider.getGasPrice(),
        BNB_GFAL_RATE,
        true
      );

    expect(await GFALToken.balanceOf(bundler.address)).to.equal(
      GFALBalanceBefore + functionArgsTransfer[1]
    );
  });

  it("Verify expected wallet address matches Deployed Wallet Address SAME OWNER", async function () {
    const { basicWalletFactory, bundler, walletOwner } = await loadFixture(
      deployContracts
    );

    // 2nd Wallet creation
    const counterfactualWallet2 = await basicWalletFactory.getAddress(
      walletOwner.address,

      "2"
    );

    const basicWallet2 = await basicWalletFactory
      .connect(bundler)
      .createWallet(walletOwner.address, "2");

    const receipt2 = await basicWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    // 3rd Wallet creation
    const counterfactualWallet3 = await basicWalletFactory.getAddress(
      walletOwner.address,
      "3"
    );

    const basicWallet3 = await basicWalletFactory
      .connect(bundler)
      .createWallet(walletOwner.address, "3");
    const receipt3 = await basicWallet3.wait();

    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(walletOwner.address).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.equal(userProfile2.accountAddress);
    expect(walletOwner.address).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.equal(userProfile3.accountAddress);
  });

  it("Verify expected wallet address matches Deployed Wallet Address DIFFERENT OWNER", async function () {
    const { basicWalletFactory, GFAL_WHALE, bundler, walletOwner, feeData } =
      await loadFixture(deployContracts);

    // 2nd Wallet creation
    const counterfactualWallet2 = await basicWalletFactory.getAddress(
      GFAL_WHALE.address,
      "1"
    );

    const basicWallet2 = await basicWalletFactory
      .connect(bundler)
      .createWallet(GFAL_WHALE.address, "1");
    const receipt2 = await basicWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    // 3rd Wallet creation
    const counterfactualWallet3 = await basicWalletFactory.getAddress(
      GFAL_WHALE.address,
      "2"
    );

    const basicWallet3 = await basicWalletFactory
      .connect(bundler)
      .createWallet(GFAL_WHALE.address, "2");
    const receipt3 = await basicWallet3.wait();

    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(GFAL_WHALE.address).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.equal(userProfile2.accountAddress);
    expect(GFAL_WHALE.address).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.equal(userProfile3.accountAddress);
  });

  it("Verify expected wallet address does not match deployed wallet if different address", async function () {
    const { basicWalletFactory, GFAL_WHALE, bundler, walletOwner, feeData } =
      await loadFixture(deployContracts);

    const counterfactualWallet2 = await basicWalletFactory.getAddress(
      walletOwner.address,
      "1"
    );
    const basicWallet2 = await basicWalletFactory
      .connect(bundler)
      .createWallet(GFAL_WHALE.address, "1");
    const receipt2 = await basicWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    const counterfactualWallet3 = await basicWalletFactory.getAddress(
      walletOwner.address,
      "2"
    );

    const basicWallet3 = await basicWalletFactory
      .connect(bundler)
      .createWallet(GFAL_WHALE.address, "2");
    const receipt3 = await basicWallet3.wait();
    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(GFAL_WHALE.address).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.not.equal(userProfile2.accountAddress);
    expect(GFAL_WHALE.address).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.not.equal(userProfile3.accountAddress);
  });

  it("Verify signature", async function () {
    const {
      basicWallet,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      GFALToken,
    } = await loadFixture(deployContracts);

    const balanceRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      GFALToken.address,
      0,
      await basicWallet.nonce()
    );

    await basicWallet.verifySignature(
      target,
      balanceRes.callData,
      value,
      await basicWallet.nonce(),
      balanceRes.signature
    );
  });

  it("Approve GFAL from the Smart Account to Swapper", async function () {
    const {
      basicWallet,
      bundler,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      feeData,
      GFALToken,
    } = await loadFixture(deployContracts);

    const approvalRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      GFALToken.address,
      0,
      await basicWallet.nonce()
    );

    const resultCoded = await basicWallet
      .connect(bundler)
      .handleOp(
        target,
        value,
        approvalRes.callData,
        approvalRes.signature,
        feeData.gasPrice,
        BNB_GFAL_RATE,
        false
      );

    const resultDecoded = ethers.utils.defaultAbiCoder.decode(
      ["bool"],
      ethers.utils.hexDataSlice(resultCoded.data, 4)
    );

    expect(resultDecoded[0]).to.equal(true);
  });

  it("Transfer GFAL from the Smart Account to Bundler", async function () {
    const {
      basicWallet,
      bundler,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      GFALToken,
      feeData,
    } = await loadFixture(deployContracts);

    const balanceBefore = await GFALToken.balanceOf(bundler.address);

    const transferRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      GFALToken.address,
      0,
      await basicWallet.nonce()
    );

    await basicWallet
      .connect(bundler)
      .handleOp(
        target,
        value,
        transferRes.callData,
        transferRes.signature,
        feeData.gasPrice,
        BNB_GFAL_RATE,
        false
      );

    const balanceAfter = await GFALToken.balanceOf(bundler.address);

    console.log("- Bundler GFAL Balance Before: " + balanceBefore);
    console.log(
      "- Bundler GFAL Balance After: " + ethers.utils.formatEther(balanceAfter)
    );
    expect(balanceBefore).to.be.lessThan(balanceAfter);
  });

  it("Approve & Transfer GFAL from the Smart Account to another wallet", async function () {
    const {
      basicWallet,
      bundler,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      GFALToken,
      feeData,
    } = await loadFixture(deployContracts);

    const balanceGFALBefore = await GFALToken.balanceOf(basicWallet.address);
    const balanceBNBBefore = await ethers.provider.getBalance(bundler.address);

    const approvalRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      GFALToken.address,
      0,
      await basicWallet.nonce()
    );

    const transferRes = await getSignatureAndValidate(
      basicWallet,
      SIGNER_MAINNET_PRIVATE_KEY,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      GFALToken.address,
      0,
      (await basicWallet.nonce()) + 1
    );

    await basicWallet
      .connect(bundler)
      .handleOps(
        [target, target],
        [value, value],
        [approvalRes.callData, transferRes.callData],
        [approvalRes.signature, transferRes.signature],
        feeData.gasPrice,
        BNB_GFAL_RATE,
        false,
        { gasPrice: feeData.gasPrice }
      );

    const balanceGFALAfter = await GFALToken.balanceOf(basicWallet.address);
    const GFALresult =
      ethers.utils.formatUnits(balanceGFALAfter, "wei") -
      ethers.utils.formatUnits(balanceGFALBefore, "wei");

    const balanceBNBAfter = await ethers.provider.getBalance(bundler.address);
    const BNBresult = balanceBNBBefore - balanceBNBAfter;
    console.log("balanceBNBAfter", ethers.utils.formatEther(balanceBNBAfter));
    console.log("balanceBNBBefore", ethers.utils.formatEther(balanceBNBBefore));
    console.log(
      "\n- BALANCE GFAL BEFORE: " + ethers.utils.formatUnits(balanceGFALBefore)
    );
    console.log(
      "- BALANCE GFAL AFTER: " + ethers.utils.formatUnits(balanceGFALAfter)
    );
    console.log(
      "\n- BALANCE BNB BEFORE: " + ethers.utils.formatUnits(balanceBNBBefore)
    );
    console.log(
      "- BALANCE BNB AFTER: " + ethers.utils.formatUnits(balanceBNBAfter)
    );
    console.log(
      `\n- User transferred ${ethers.utils.formatUnits(
        functionArgsTransfer[1]
      )} GFALs`
    );

    const GFALFeesPaid = Number(functionArgsTransfer[1]) + GFALresult;
    const GFALAfterFeeReceived = await GFALToken.balanceOf(bundler.address);
    console.log(
      `\n- User just Transferred and spent a Fee of  ${ethers.utils.formatEther(
        GFALFeesPaid.toString()
      )} GFALs`
    );
    console.log(
      "- Bundler got refunded in GFAL as fee: ",
      ethers.utils.formatEther(
        (GFALAfterFeeReceived - functionArgsTransfer[1]).toString()
      )
    );
    console.log(
      `- Bundler just paid a Fee of -${ethers.utils.formatEther(
        BNBresult.toString()
      )} BNBs`
    );
  });
});
