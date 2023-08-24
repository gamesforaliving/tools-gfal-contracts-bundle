const ethers = require("ethers");

const chainId = 97; // Replace with your desired chainId

// 1. Get CallData before hashing.
function getCallData(functionId, typesArgs, functionArgs) {
  // Function selector for the function you want to call
  const functionSelector = ethers.utils.id(functionId); // ERC-20 transfer
  const formatedFunctionSelector = functionSelector.substring(0, 10);

  // Encode the arguments
  const encodedArgs = ethers.utils.defaultAbiCoder.encode(
    typesArgs,
    functionArgs
  );

  // Combine function selector and encoded arguments to get call data
  const callData = formatedFunctionSelector + encodedArgs.substring(2); // Remove '0x' from the encodedArgs

  // console.log("\n- Call Data:", callData);
  return callData;
}

// 2. Hash Transaction Data.
function getUserOperationHashed(target, nonce, callData, value, chainId) {
  const abiCoder = new ethers.utils.AbiCoder();
  const packedData = abiCoder.encode(
    ["address", "uint256", "bytes", "uint256", "uint256"],
    [target, nonce, callData, value, chainId]
  );

  const messageHash = ethers.utils.keccak256(packedData);
  // console.log("\n- Message Hash:", messageHash);
  return ethers.utils.arrayify(messageHash);
}

// 3. Sign Transaction Data by the Owner set in the Smart Account.
async function signMessage(hashedMessage, privateKey) {
  const wallet = new ethers.Wallet(privateKey);

  const signature = await wallet.signMessage(hashedMessage);

  // console.log("\n- Signed by: " + wallet.address);
  // console.log("\n- Hashed Message:", hashedMessage);
  // console.log("\n- Signature:", signature);
  // console.log("\n");
  return signature;
}

async function getSignatureAndValidate(
  basicWallet,
  signerPrivateKey,
  functionId,
  typesArgs,
  functionArgs,
  target,
  value,
  nonce
) {
  const callData = getCallData(functionId, typesArgs, functionArgs);
  const userOpHash = getUserOperationHashed(
    target,
    nonce,
    callData,
    value,
    chainId
  );
  const signature = await signMessage(userOpHash, signerPrivateKey);

  if (
    await basicWallet.verifySignature(target, callData, value, nonce, signature)
  ) {
    return { callData, signature };
  }
  throw "\n- ❌ Signature error...";
}

async function getBNBTxSignatureAndValidate(
  basicWallet,
  signerPrivateKey,
  receiver,
  value,
  nonce
) {
  const callData = "0x";
  const userOpHash = getUserOperationHashed(
    receiver,
    nonce,
    callData,
    value,
    chainId
  );

  const signature = await signMessage(userOpHash, signerPrivateKey);

  if (
    await basicWallet.verifySignature(
      receiver,
      callData,
      value,
      nonce,
      signature
    )
  ) {
    return { callData, signature };
  }
  throw "\n- ❌ Signature error...";
}

// main();

module.exports = {
  getCallData,
  getUserOperationHashed,
  signMessage,
  getSignatureAndValidate,
  getBNBTxSignatureAndValidate,
};
