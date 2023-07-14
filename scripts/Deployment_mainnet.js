// THIS SCRIPT WILL DEPLOY AND SET THE CONTRACTS FOR PRODUCTION!
const hre = require("hardhat");
const { ethers } = require("hardhat");

const TEMPORARY_URI = "https://token-tracker.elementalraiders.com/";
const ROYALTIES_IN_BASIS_POINTS = 500; // 5%
const SKILLS_PRICE_GFAL = ethers.utils.parseUnits("10", "ether");
const SKILLS_PRICE_BUSD = ethers.utils.parseUnits("1", "ether");
const HEROES_PRICE_GFAL = ethers.utils.parseUnits("50", "ether");
const HEROES_PRICE_BUSD = ethers.utils.parseUnits("5", "ether");
const ERC1155_PRICE_GFAL = ethers.utils.parseUnits("100", "ether");
const GFAL_TOKEN_MAINNET = process.env.GFAL_TOKEN_MAINNET;
const GFAL_TOKEN_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "subtractedValue", type: "uint256" },
    ],
    name: "decreaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "addedValue", type: "uint256" },
    ],
    name: "increaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const ERC721 = 0;
const ERC1155 = 1;
// -OracleConsumer set RateValue (GFAL -> USD) price
const RateValue = ethers.utils.parseUnits("0.1", "ether"); // here we are converting the float to wei to work as "intFloat"

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
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_MAIN
  );

  const Admin = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider); // Ganache or local

  // -ERC20 Token
  const gfalToken = new ethers.Contract(
    GFAL_TOKEN_MAINNET,
    GFAL_TOKEN_ABI,
    Admin
  );

  // -Proxy Contract
  const GFALProxy = await ethers.getContractFactory("GFALProxy", Admin);
  const gfalProxy = await GFALProxy.deploy(gfalToken.address, Admin.address);
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

  // // TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  // // -ERC1155 Token (Mockup)
  // const ERC1155MockUp = await ethers.getContractFactory("Erc1155MockUp", Admin);
  // const erc1155MockUp = await ERC1155MockUp.deploy(
  //   gfalProxy.address,
  //   TEMPORARY_URI,
  //   ROYALTIES_IN_BASIS_POINTS
  // );
  // await erc1155MockUp.deployed();
  // console.log("\n*ERC1155MockUp deployed to:", erc1155MockUp.address);

  // -ERC721 Token
  const ElementalRaidersSkills = await ethers.getContractFactory(
    "ElementalRaidersSkills",
    Admin
  );
  const elementalRaidersSkills = await ElementalRaidersSkills.deploy(
    gfalProxy.address,
    `${TEMPORARY_URI}${elementalRaidersSkills.address}/`,
    ROYALTIES_IN_BASIS_POINTS
  );
  await elementalRaidersSkills.deployed();
  console.log(
    "*ElementalRaidersSkills deployed to:",
    elementalRaidersSkills.address
  );

  const ElementalRaidersHeroes = await ethers.getContractFactory(
    "ElementalRaidersHeroes",
    Admin
  );
  const elementalRaidersHeroes = await ElementalRaidersHeroes.deploy(
    gfalProxy.address,
    `${TEMPORARY_URI}${elementalRaidersHeroes.address}/`,
    ROYALTIES_IN_BASIS_POINTS
  );
  await elementalRaidersHeroes.deployed();
  console.log(
    "*ElementalRaidersHeroes deployed to:",
    elementalRaidersHeroes.address
  );

  // -Market place ERC721 & ERC721
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
  await gfalProxy.updateOracleConsumer(oracleConsumer.address);
  await gfalProxy.updateMarketPlace(gfalMarketplace.address);
  console.log("\n*Set OracleConsumer address & MarketPlace in GFALProxy");

  // -Marketplace Set NFT collections in whitelist
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(elementalRaidersSkills.address, ERC721, true);
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(elementalRaidersHeroes.address, ERC721, true);
  // //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  // await gfalMarketplace
  //   .connect(Admin)
  //   .updateCollection(erc1155MockUp.address, ERC1155, true);

  console.log("*Heroes & Skills collections is set in the Marketplace");

  await wait(); // Wait for 10 second to do not overload the block

  // -HEROES NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersHeroes
      .connect(Admin)
      .updateMintingPrice(i, ethers.utils.parseUnits("1", "ether"));
  }
  console.log("*Rarities 1 to 4 are set in HEROES NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // NO NEED TO APPROVE AS THE RARITY IS  0 so 0 GFAL

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersHeroes.connect(Admin).safeMint(Admin.address, 0);
  }
  console.log("*Minted 10 HEROES NFTs rarity 0 (Price 0)");

  await wait(); // Wait for 10 second to do not overload the block

  // -Skills NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersSkills
      .connect(Admin)
      .updateMintingPrice(i, ethers.utils.parseUnits("1", "ether"));
  }
  console.log("*Rarities 1 to 4 are set in HEROES NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkills.connect(Admin).safeMint(Admin.address, 0);
  }
  console.log("*Minted 10 Skills NFTs rarity 0 (Price 0)");

  // //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  // for (let i = 0; i < 10; i++) {
  //   await erc1155MockUp.connect(Admin).mint(100);
  // }
  // console.log("*Minted 10 ERC1155MockUp NFTs (100 copies each)");

  await wait(); // Wait for 10 second to do not overload the block

  // // - Allow Marketplace to manage NFTs
  // for (let i = 0; i < 10; i++) {
  //   await elementalRaidersSkills
  //     .connect(Admin)
  //     .approve(gfalMarketplace.address, i);
  //   await elementalRaidersHeroes
  //     .connect(Admin)
  //     .approve(gfalMarketplace.address, i);
  //   //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  //   await erc1155MockUp
  //     .connect(Admin)
  //     .setApprovalForAll(gfalMarketplace.address, true);
  // }
  // console.log(
  //   "*Approved Marketplace to manage NFTs (Skills & HEROES) from 0 to 9 (So 10 NFTs each collection)"
  // );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 HEROES in GFAL "Sale Price"
  for (let i = 0; i < 5; i++) {
    await gfalMarketplace
      .connect(Admin)
      .sellToken(
        elementalRaidersSkills.address,
        i,
        1,
        SKILLS_PRICE_GFAL,
        false
      );

    await gfalMarketplace
      .connect(Admin)
      .sellToken(
        elementalRaidersHeroes.address,
        i,
        1,
        HEROES_PRICE_GFAL,
        false
      );

    //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
    await gfalMarketplace
      .connect(Admin)
      .sellToken(erc1155MockUp.address, i, 20, ERC1155_PRICE_GFAL, false);
  }
  console.log(
    "*Listed in Marketplace (Skills & HEROES) in GFAL from 0 to 4 (So 5 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 HEROES in BUSD "Sale Price"
  for (let i = 5; i < 10; i++) {
    await gfalMarketplace
      .connect(Admin)
      .sellToken(
        elementalRaidersSkills.address,
        i,
        1,
        SKILLS_PRICE_BUSD,
        false
      );

    await gfalMarketplace
      .connect(Admin)
      .sellToken(
        elementalRaidersHeroes.address,
        i,
        1,
        HEROES_PRICE_BUSD,
        false
      );
  }
  console.log(
    "*Listed in Marketplace (Skills & HEROES) in BUSD from 5 to 9 (So 5 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  await elementalRaidersHeroes
    .connect(Admin)
    .safeMint("0x7045A2B9147d8406cfd8502aD1FD43530d1E042c");
  await elementalRaidersHeroes
    .connect(Admin)
    .safeMint("0x7045A2B9147d8406cfd8502aD1FD43530d1E042c");
  await elementalRaidersHeroes
    .connect(Admin)
    .safeMint("0x7045A2B9147d8406cfd8502aD1FD43530d1E042c");

  console.log("\n Workflow finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
