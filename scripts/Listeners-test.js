// THIS SCRIPT WILL DEPLOY AND SET THE CONTRACTS FOR PRODUCTION!
const hre = require("hardhat");
const { ethers } = require("hardhat");

const TEMPORARY_URI = "https://token-tracker.elementalraiders.com/";
// Prices
const ROYALTIES_IN_BASIS_POINTS = 480; // 4.8%
// Standars
const ERC721 = 0;
const ERC1155 = 1;

// -OracleConsumer set RateValue (GFAL -> USD) price
const RateValue = ethers.utils.parseUnits("0.013", "ether"); // here we are converting the float to wei to work as "intFloat"

// Addresses (Roles)
const OWNER_PUBLIC_KEY = process.env.OWNER_PUBLIC_KEY;
const SUPERADMIN_PUBLIC_KEY = process.env.SUPERADMIN_PUBLIC_KEY;
const FEECOLLECTOR_PUBLIC_KEY = process.env.FEECOLLECTOR_PUBLIC_KEY;
const ROYALTIESCOLLECTOR_PUBLIC_KEY = process.env.ROYALTIESCOLLECTOR_PUBLIC_KEY;

// Wait for 10 second to do not overload the block
async function wait() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (e) {
    console.log(e);
  }
}
// npx hardhat run scripts/massive-deploy-set.js --network bsctest
async function main() {
  const [Admin, User] = await ethers.getSigners();

  // -ERC20 Token
  const GFALToken = await ethers.getContractFactory("GFALToken");
  const gfalToken = await GFALToken.deploy();
  await gfalToken.deployed();
  console.log("*GFALToken deployed to:", gfalToken.address);

  // -Proxy Contract
  const GFALProxy = await ethers.getContractFactory("GFALProxy", Admin);
  const gfalProxy = await GFALProxy.deploy(
    gfalToken.address,
    OWNER_PUBLIC_KEY,
    FEECOLLECTOR_PUBLIC_KEY,
    ROYALTIESCOLLECTOR_PUBLIC_KEY,
    SUPERADMIN_PUBLIC_KEY
  );
  await gfalProxy.deployed();
  console.log("*GFALProxy deployed to:", gfalProxy.address);

  // -OracleConsumer Contract
  const OracleConsumer = await ethers.getContractFactory(
    "OracleConsumer",
    Admin
  );
  const oracleConsumer = await OracleConsumer.deploy(
    gfalProxy.address,
    RateValue
  );
  await oracleConsumer.deployed();
  console.log("*OracleConsumer deployed to:", oracleConsumer.address);

  // -ERC721 Token
  const Items = await ethers.getContractFactory("Items", Admin);
  const items = await Items.deploy(
    gfalProxy.address,
    TEMPORARY_URI,
    ROYALTIES_IN_BASIS_POINTS
  );
  await items.deployed();

  await items.connect(Admin).updateBaseURI(`${TEMPORARY_URI}${items.address}/`);

  console.log("*Items deployed to:", items.address);

  // -Market place ERC721 & ERC1155
  const GFALMarketplace = await ethers.getContractFactory(
    "GFALMarketplace",
    Admin
  );
  const gfalMarketplace = await GFALMarketplace.deploy(
    ROYALTIES_IN_BASIS_POINTS,
    gfalProxy.address
  );
  await gfalMarketplace.deployed();
  console.log("*GFALMarketplace deployed to:", gfalMarketplace.address);

  await wait(); // Wait for 10 second to do not overload the block

  // SET CONTRACTS
  // -Proxy Contract set addresses
  await gfalProxy.connect(Admin).updateOracleConsumer(oracleConsumer.address);
  await gfalProxy.connect(Admin).updateMarketPlace(gfalMarketplace.address);
  console.log("\n*Set OracleConsumer address & MarketPlace in GFALProxy");

  // -Marketplace Set NFT collections in whitelist
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(items.address, ERC721, true);

  console.log("*Items collections are set in the Marketplace");

  await wait(); // Wait for 10 second to do not overload the block

  await items.createCollection(250);
  await items.createCollection(170);
  await items.createCollection(25);
  await items.createCollection(75);
  console.log("Collections created in Items");

  for (let i = 0; i < 10; i++) {
    await items.safeMint(User.address, 0, 0);
    await items.safeMint(User.address, 1, 0);
    await items.safeMint(User.address, 2, 0);
    await items.safeMint(User.address, 3, 0);
  }

  console.log("10 NFTs minted for User of each Item Id (0 to 39 in total)");

  for (let i = 0; i < 4; i++) {
    await gfalMarketplace
      .connect(User)
      .sellToken(
        items.address,
        i,
        1,
        ethers.utils.parseUnits("100", "ether"),
        false
      );

    console.log(`NFT ${i} listed on sale`);
  }

  console.log("1 NFT of each collection is on sale");
  console.log("\n Workflow finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
