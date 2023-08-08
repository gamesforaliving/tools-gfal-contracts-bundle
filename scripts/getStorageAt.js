const { ethers } = require("hardhat");

// Script created for debuggin Storage for the Smart contract.
const provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed1.binance.org/"
);

const contractAddress = "0xb5e0271004b6a9eD2cc6f8728F1Ff0bc1062602A";
const contractABI = [];

const contract = new ethers.Contract(contractAddress, contractABI, provider);

async function getStorageAt(slot) {
  try {
    const storageValue = await contract.provider.getStorageAt(
      contractAddress,
      slot
    );
    console.log(`Storage value at slot ${slot}:`, storageValue);
    return storageValue;
  } catch (error) {
    console.error("Error getting storage value:", error);
    return null;
  }
}

const slotToQuery = "0x0"; // Replace with the actual slot you want to query
getStorageAt(slotToQuery);
