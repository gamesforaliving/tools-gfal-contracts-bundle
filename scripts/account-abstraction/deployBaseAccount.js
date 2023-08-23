const hre = require("hardhat");
const { ethers } = require("hardhat");

// IT WILL DEPLOY TO MAINNET!
async function main() {
  const salt = "1";

  const BasicWalletFactoryAddress = process.env.ACCOUNT_FACTORY_MAINNET;
  const signer = process.env.SIGNER_MAINNET;
  const bundlerPrivateKey = process.env.AA_SIGNER_PRIVATE_KEY;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_MAIN
  );
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  console.log("BasicWalletFactoryAddress: ", BasicWalletFactoryAddress);
  console.log("signer: ", signer);
  console.log("bundler: ", bundler.address);

  const BasicWalletFactory = await ethers.getContractAt(
    "BasicWalletFactory",
    BasicWalletFactoryAddress
  );

  const receipt = await BasicWalletFactory.connect(bundler)
    .createWallet(signer, salt)
    .then((tx) => tx.wait());

  console.log(receipt.events);
  if (receipt.events.length > 0) {
    const baseAccountAddress = receipt.events[3].args[0];
    console.log(
      `\nBaseAccount for USER ${signer} deployed to ${baseAccountAddress}`
    );
  } else {
    console.log(receipt);
    const walletDeployed = await BasicWalletFactory.getAddress(signer, salt);
    console.log(
      `This USER already deployed a Smart Account with the same SALT. Smart Account address: ${walletDeployed}`
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
