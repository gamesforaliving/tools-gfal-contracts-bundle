// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Constants
const TEMPORARY_URI = "https://token-tracker.elementalraiders.com/";
const ROYALTIES_IN_BASIS_POINTS = 500; // 5%
const proxyAddress = "0x4e3BDf3776E7ea6FD7931Fd29a5e1d933A55357C";

async function main() {
  // -ERC721 Token
  const Items = await ethers.getContractFactory("Items");
  const items = await Items.deploy(
    proxyAddress,
    TEMPORARY_URI,
    ROYALTIES_IN_BASIS_POINTS
  );

  await items.updateBaseURI(`${TEMPORARY_URI}${items.address}/`);

  console.log(`Items deployed to ${items.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
