const hre = require("hardhat");
const { ethers } = require("hardhat");
const { getSignatureAndValidate } = require("./userOp-signer");

const basicWalletABI = require("../../artifacts/contracts/account_abstraction/BasicWallet.sol/BasicWallet.json");
const bundlerPrivateKey = process.env.AA_SIGNER_PRIVATE_KEY;
const walletOwnerPrivateKey = process.env.SIGNER_MAINNET_PRIVATE_KEY;
const basicWalletAddress = process.env.BASIC_WALLET_ADDRESS_MAINNET;
const receiverGFALAddress = "0x5a3D951B49DCdDd3ba14d80b46e44Ccc1C221cAF";
const BNB_GFAL_RATE = 14369; // How much GFAL is 1 BNB? NO DECIMALS.

const GFALTokenAddress = process.env.GFAL_TOKEN_MAINNET;

// Gfal Transfer:
const functionIdTransfer = "transfer(address,uint256)";
const typesArgsTransfer = ["address", "uint256"];
const functionArgsTransfer = [
  receiverGFALAddress,
  ethers.utils.parseEther("200"),
];
// IT WILL INTERACT WITH MAINNET!
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_MAIN
  );

  const walletOwner = new ethers.Wallet(walletOwnerPrivateKey, provider);
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  const balanceBundler = await ethers.provider.getBalance(bundler.address);

  const gasPrice = await ethers.provider.getGasPrice();

  console.log("basicWalletAddress: ", basicWalletAddress);
  console.log("walletOwnerAddress: ", walletOwner.address);
  console.log("bundler: ", bundler.address);
  console.log(
    "BNB Balance Bundler: ",
    ethers.utils.formatEther(balanceBundler)
  );
  console.log("Gas Price: ", gasPrice);

  // const basicWallet = await ethers.getContractAt(
  //   "BasicWallet",
  //   basicWalletAddress
  // );

  const basicWallet = new ethers.Contract(
    basicWalletAddress,
    basicWalletABI.abi,
    provider
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
  console.log("\n- ✅ transferGFAL Tx signature: ", transferRes.signature);
  console.log("\n- ✅ transferGFAL Tx callData: ", transferRes.callData);

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
      BNB_GFAL_RATE,
    ]),
    nonce: await provider.getTransactionCount(bundler.address),
    // gasLimit: 650103,
    gasPrice: gasPrice,
  };

  const gasEstimation = await provider.estimateGas(tx);
  const txFee = Number(gasPrice) * Number(gasEstimation);

  console.log("gasEstimation:", gasEstimation);
  console.log("txFee in BNB:", ethers.utils.formatEther(txFee.toString()));

  // bundler.sendTransaction(tx).then((transaction) => {
  //   console.log(transaction);
  // });
  // const Tx = await basicWallet
  //   .connect(bundler)
  //   .handleOp(
  //     GFALTokenAddress,
  //     0,
  //     transferRes.callData,
  //     transferRes.signature,
  //     gasPrice,
  //     { gasLimit: 650103 }
  //   );

  // const receipt = await Tx.wait();
  // console.log("Transfer GFAL Receipt: ", receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
