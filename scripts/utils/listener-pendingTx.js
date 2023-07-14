const ethers = require("ethers");

async function filterPendingTransactionsByWallet(walletAddress) {
  // Connect to the Ethereum network using an HTTP provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_MAIN
  );

  // Create an instance of the wallet using the wallet address
  const wallet = walletAddress;

  // Get the transaction count of the wallet to calculate the nonce
  const transactionCount = await provider.getTransactionCount(wallet);

  // Retrieve pending transactions
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber, true);
  const pendingTransactions = block.transactions.filter(
    (tx) => tx.from === wallet && tx.blockNumber === null
  );
  console.log("[ALL PENDING TXs]", pendingTransactions);
  console.log("[TRANSACTION COUNT]:", transactionCount);

  // Print details of pending transactions
  pendingTransactions.forEach((tx) => {
    console.log("Transaction Hash:", tx.hash);
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", ethers.utils.formatEther(tx.value));
    console.log("Gas Limit:", tx.gasLimit.toString());
    console.log("Gas Price:", ethers.utils.formatUnits(tx.gasPrice, "gwei"));
    console.log("Nonce:", tx.nonce);
    console.log("-----------------------------------");
  });
}

// Replace 'your-wallet-address' with the actual wallet address
filterPendingTransactionsByWallet("<ADD THE PUBLIC KEY>");
