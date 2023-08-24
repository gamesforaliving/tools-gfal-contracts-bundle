const hre = require("hardhat");
const { ethers } = require("hardhat");
const { getSignatureAndValidate } = require("./userOp-signer");

const bundlerPrivateKey = process.env.BUNDLER_PRIVATE_KEY_TESTNET;
const walletOwnerPrivateKey = process.env.SIGNER_MAINNET_PRIVATE_KEY;
const basicWalletAddress = process.env.BASIC_WALLET_ADDRESS_MAINNET;
// const receiverGFALAddress = process.env.AA_SIGNER_PUBLIC_KEY;
const receiverGFALAddress = "0xA6086628befd7D894F465507e645A9049CE21Dc9";
const SwapperGFALBNBAddress = process.env.SWAPPER_GFAL_BNB_ADDRESS;

const GFALTokenAddress = process.env.GFAL_TOKEN_MAINNET;

const BNB_GFAL_RATE = 14369; // How much GFAL is 1 BNB? NO DECIMALS.

// Gfal Approve:
const functionIdApprove = "approve(address,uint256)";
const typesArgsApprove = ["address", "uint256"];
const functionArgsApprove = [
  SwapperGFALBNBAddress,
  ethers.utils.parseEther("1"),
];
// Gfal Transfer:
const functionIdTransfer = "transfer(address,uint256)";
const typesArgsTransfer = ["address", "uint256"];
const functionArgsTransfer = [
  receiverGFALAddress,
  ethers.utils.parseEther("1"),
];

// IT WILL INTERACT WITH MAINNET!
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_TEST
  );

  const GFALToken = await ethers.getContractAt("GFALToken", GFALTokenAddress);

  const walletOwner = new ethers.Wallet(walletOwnerPrivateKey, provider);
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  const balanceBundler = await ethers.provider.getBalance(bundler.address);
  console.log("basicWalletAddress: ", basicWalletAddress);
  console.log("walletOwnerAddress: ", walletOwner.address);
  console.log("bundler: ", bundler.address);
  console.log(
    "BNB Balance Bundler: ",
    ethers.utils.formatEther(balanceBundler)
  );

  const basicWallet = await ethers.getContractAt(
    "BasicWallet",
    basicWalletAddress
  );
  console.log("basicWallet: ", basicWalletAddress);

  if (
    (await GFALToken.balanceOf(basicWallet.address)) < functionArgsTransfer[1]
  ) {
    console.log(
      "\n************************ Not enough GFAL in Smart Wallet to transfer *************************"
    );
    return;
  }

  const approvalRes = await getSignatureAndValidate(
    basicWallet,
    walletOwnerPrivateKey,
    functionIdApprove,
    typesArgsApprove,
    functionArgsApprove,
    GFALTokenAddress,
    0,
    await basicWallet.nonce()
  );
  console.log("\n- ✅ Approval Tx signature: ", approvalRes.signature);

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
  console.log("\n- ✅ transferGFAL Tx signature: ", transferRes.signature);

  // const Tx = await basicWallet
  //   .connect(bundler)
  //   .handleOps(
  //     [GFALTokenAddress, GFALTokenAddress],
  //     [0, 0],
  //     [approvalRes.callData, transferRes.callData],
  //     [approvalRes.signature, transferRes.signature],
  //     await ethers.provider.getGasPrice(),
  //     BNB_GFAL_RATE,
  //     { gasPrice: await provider.getGasPrice() }
  //   );

  const Tx = await basicWallet
    .connect(bundler)
    .handleOp(
      GFALTokenAddress,
      0,
      transferRes.callData,
      transferRes.signature,
      await ethers.provider.getGasPrice(),
      BNB_GFAL_RATE,
      false,
      { gasPrice: await provider.getGasPrice() }
    );

  const receipt = await Tx.wait();
  console.log("\n *Smart Wallet Receipt*: ", receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
