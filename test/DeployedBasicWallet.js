const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getSignatureAndValidate,
} = require("../scripts/account-abstraction/userOp-signer");

const Provider = new ethers.providers.JsonRpcProvider(
  process.env.WEB3_HTTP_PROVIDER_MAIN
);
const basicWalletAddress = process.env.BASIC_WALLET_ADDRESS_MAINNET;
const receiverGFALAddress = "0xA6086628befd7D894F465507e645A9049CE21Dc9";
const walletOwnerPrivateKey = process.env.SIGNER_MAINNET_PRIVATE_KEY;
const GFALTokenAddress = process.env.GFAL_TOKEN_MAINNET;
const GFAL_WHALE_SIGNER = process.env.GFAL_WHALE_SIGNER;
const BNB_WHALE_ADDRESS = process.env.BNB_WHALE_HOLDER;

// Gfal Transfer:
const functionIdTransfer = "transfer(address,uint256)";
const typesArgsTransfer = ["address", "uint256"];
const functionArgsTransfer = [
  receiverGFALAddress,
  ethers.utils.parseEther("1"),
];

describe("BasicWallet", function () {
  async function deployContracts() {
    const GFAL_WHALE = await ethers.getImpersonatedSigner(GFAL_WHALE_SIGNER);
    const BNB_WHALE = await ethers.getImpersonatedSigner(BNB_WHALE_ADDRESS);
    const walletOwner = new ethers.Wallet(walletOwnerPrivateKey, Provider);
    const bundler = await ethers.getImpersonatedSigner(
      process.env.AA_SIGNER_PUBLIC_KEY
    );
    const gasPrice = await ethers.provider.getGasPrice();

    const basicWallet = await ethers.getContractAt(
      "BasicWallet",
      basicWalletAddress
    );

    const GFALToken = await ethers.getContractAt("GFALToken", GFALTokenAddress);

    // Fill up GFAL_WHALE for fees
    const tx1BNB = {
      to: GFAL_WHALE.address,
      value: ethers.utils.parseEther("1"),
    };
    await BNB_WHALE.sendTransaction(tx1BNB);

    await GFALToken.connect(GFAL_WHALE).transfer(
      basicWallet.address,
      ethers.utils.parseUnits("10000", "ether")
    );

    console.log("basicWalletAddress: ", basicWalletAddress);
    console.log("walletOwnerAddress: ", walletOwner.address);
    console.log("bundler: ", bundler.address);
    const balanceGFALaccount = await GFALToken.balanceOf(basicWallet.address);

    console.log(
      "- Smart account GFAL Balance: ",
      ethers.utils.formatEther(balanceGFALaccount)
    );

    const transferRes = await getSignatureAndValidate(
      basicWallet,
      walletOwnerPrivateKey,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      GFALTokenAddress,
      0,
      await basicWallet.nonce()
    );

    return {
      bundler,
      walletOwner,
      basicWallet,
      transferRes,
      GFALToken,
      balanceGFALaccount,
      gasPrice,
    };
  }

  it("Send Tx and check gas used", async () => {
    const {
      bundler,
      walletOwner,
      basicWallet,
      transferRes,
      GFALToken,
      balanceGFALaccount,
      gasPrice,
    } = await loadFixture(deployContracts);
    const balanceBundler = await ethers.provider.getBalance(bundler.address);
    console.log(
      "\n- BNB Balance Bundler: ",
      ethers.utils.formatEther(balanceBundler)
    );

    const tx = {
      from: bundler.address,
      to: basicWallet.address,
      value: ethers.utils.parseEther("0"), // 0 Ether
      data: basicWallet.interface.encodeFunctionData("handleOp", [
        GFALTokenAddress,
        0,
        transferRes.callData,
        transferRes.signature,
        gasPrice,
      ]),
      nonce: await ethers.provider.getTransactionCount(bundler.address),
      gasLimit: 650103,
      gasPrice: gasPrice,
    };

    const gasEstimation = await ethers.provider.estimateGas(tx);
    const txFee = Number(gasPrice) * Number(gasEstimation);

    console.log("\n- gasEstimation:", gasEstimation);
    console.log("- txFee in BNB:", ethers.utils.formatEther(txFee.toString()));

    await bundler.sendTransaction(tx);

    const balancebasicWalletAfterGFAL = await GFALToken.balanceOf(
      basicWallet.address
    );
    // const GFALSpent = balanceGFALaccount - balancebasicWalletAfterGFAL;
    console.log(
      "TOTAL Gfal Balance Before: ",
      ethers.utils.formatEther(balanceGFALaccount)
    );
    console.log(
      "TOTAL Gfal Balance After: ",
      ethers.utils.formatEther(balancebasicWalletAfterGFAL)
    );
    // console.log("Total Gfal Spent:", ethers.utils.formatEther(GFALSpent));

    console.log("Total GFAL spent in Fees");
    // console.log("here2:", ethers.utils.formatEther(GFALSpent) - 1);
    // const GFALFee = GFALSpent - 1;

    const balanceBundlerAfter = await ethers.provider.getBalance(
      bundler.address
    );
    const BNBSpent = balanceBundler - balanceBundlerAfter;
    console.log(
      "- BNB balance after Tx: ",
      ethers.utils.formatEther(balanceBundlerAfter)
    );

    // console.log(`* GFAL Diference of ${ethers.utils.formatEther(GFALFee)}`);
    console.log(`* BNB Diference of - ${ethers.utils.formatEther(BNBSpent)}`);
  });
});
