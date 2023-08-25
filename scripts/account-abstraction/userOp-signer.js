const ethers = require("ethers");

const chainId = 97; // Replace with your desired chainId

// 1. Get CallData before hashing.
function getCallData(functionId, typesArgs, functionArgs) {
  // Function selector for the function you want to call
  let functionSelector = ethers.utils.id(functionId); // ERC-20 transfer
  let formatedFunctionSelector = functionSelector.substring(0, 10);

  // Encode the arguments
  let encodedArgs = ethers.utils.defaultAbiCoder.encode(
    typesArgs,
    functionArgs
  );

  // Combine function selector and encoded arguments to get call data
  let callData = formatedFunctionSelector + encodedArgs.substring(2); // Remove '0x' from the encodedArgs
  return callData;
}

// 2. Hash Transaction Data.
function getUserOperationHashed(target, nonce, callData, value, chainId) {
  let abiCoder = new ethers.utils.AbiCoder();
  let packedData = abiCoder.encode(
    ["address", "uint256", "bytes", "uint256", "uint256"],
    [target, nonce, callData, value, chainId]
  );
  let messageHash = ethers.utils.keccak256(packedData);
  return ethers.utils.arrayify(messageHash);
}

// 3. Sign Transaction Data by the Owner set in the Smart Account.
async function signMessage(hashedMessage, privateKey) {
  let wallet = new ethers.Wallet(privateKey);
  let signature = await wallet.signMessage(hashedMessage);
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
  let callData = getCallData(functionId, typesArgs, functionArgs);
  let userOpHash = getUserOperationHashed(
    target,
    nonce,
    callData,
    value,
    chainId
  );
  let signature = await signMessage(userOpHash, signerPrivateKey);

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
  let callData = "0x";
  let userOpHash = getUserOperationHashed(
    receiver,
    nonce,
    callData,
    value,
    chainId
  );

  let signature = await signMessage(userOpHash, signerPrivateKey);

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

module.exports = {
  getSignatureAndValidate,
  getBNBTxSignatureAndValidate,
};
