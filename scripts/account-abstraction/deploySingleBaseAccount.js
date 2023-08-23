const hre = require("hardhat");
const { ethers } = require("hardhat");

// IT WILL DEPLOY TO MAINNET!
async function main() {
  const signer = process.env.SIGNER_MAINNET;
  const bundlerPrivateKey = process.env.AA_SIGNER_PRIVATE_KEY;
  const GFALProxy = process.env.PROXY_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_TEST
  );
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  console.log("signer: ", signer);
  console.log("bundler: ", bundler.address);
  console.log("GFALProxy: ", GFALProxy);

  const BasicWallet = await ethers.getContractFactory("BasicWallet", bundler);
  const basicWallet = await BasicWallet.deploy(signer, GFALProxy);
  await basicWallet.deployed();

  console.log(
    `\nBaseAccount for USER ${signer} deployed to ${basicWallet.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
