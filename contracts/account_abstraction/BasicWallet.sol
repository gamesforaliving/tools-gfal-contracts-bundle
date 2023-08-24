// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../utils/Proxy/IGFALProxy.sol";
import "../utils/Swaps/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

// import "hardhat/console.sol";

contract BasicWallet {
    bytes32 private constant _HASHED_NAME = keccak256("GFAL Fee Smart Account");
    string public version = "1.0";

    address payable public owner;
    uint256 public nonce;
    uint256 private CHAIN_ID = 97; // Testnet 97, Mainnet 56

    uint256 private constant POST_OP_GAS = 51494; // Estimated Gass spended for ERC-20Transfer

    IGFALProxy immutable GFALProxy;

    event postOpFinished(uint256 gfalReceipt, uint256 gasReceipt);

    constructor(address _owner, address _GFALProxy) {
        owner = payable(_owner);
        GFALProxy = IGFALProxy(_GFALProxy);
    }

    /*********************************************************VERIFICATION PROCESS*/

    function verifySignature(
        address target,
        bytes memory callData,
        uint256 value,
        uint256 _nonce,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = getMessageHash(target, callData, value, _nonce);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == owner;
    }

    function getMessageHash(
        address target,
        bytes memory callData,
        uint256 value,
        uint256 _nonce
    ) public view returns (bytes32) {
        bytes memory packedData = abi.encode(
            target,
            _nonce,
            callData,
            value,
            CHAIN_ID
        );
        bytes32 messageHash = keccak256(packedData);
        return messageHash;
    }

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) internal pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    function _requireBundlerOrOwner() internal view {
        require(
            msg.sender == owner || true == GFALProxy.checkAdmin(msg.sender),
            "Not allowed"
        );
    }

    /*********************************************************EXECUTION PROCESS*/
    // execute a SINGLE of transactions
    function handleOp(
        address target,
        uint256 value,
        bytes memory callData,
        bytes memory signature,
        uint256 gasPrice,
        uint256 BNB_GFAL_Rate, // 1BNB to GFAL
        bool isSponsored
    ) public payable {
        uint256 preGas = gasleft();
        require(BNB_GFAL_Rate != 0, "GasPrice cannot be 0");
        require(gasPrice != 0, "GasPrice cannot be 0");
        _requireBundlerOrOwner();
        executeOp(target, value, callData, signature);
        // Pay gas back in GFAL or deal with any logic
        if (GFALProxy.checkAdmin(msg.sender) && !isSponsored) {
            uint256 gasLeft = gasleft();
            postOp(preGas - gasLeft, gasPrice, BNB_GFAL_Rate);
        }
    }

    // execute MULTIPLE transactions
    function handleOps(
        address[] memory target,
        uint256[] memory value,
        bytes[] memory callData,
        bytes[] memory signature,
        uint256 gasPrice,
        uint256 BNB_GFAL_Rate, // 1BNB to GFAL
        bool isSponsored
    ) external payable {
        uint256 preGas = gasleft();
        require(target.length == callData.length, "wrong array lengths");
        require(value.length == callData.length, "wrong array lengths");
        require(signature.length == callData.length, "wrong array lengths");
        require(BNB_GFAL_Rate != 0, "GasPrice cannot be 0");
        require(gasPrice != 0, "GasPrice cannot be 0");
        _requireBundlerOrOwner();

        uint256 iterations = target.length;
        for (uint256 i = 0; i < iterations; ) {
            executeOp(target[i], value[i], callData[i], signature[i]);
            unchecked {
                i++;
            }
        }

        // Pay gas back in GFAL or deal with any logic
        uint256 gasLeft = gasleft();
        if (GFALProxy.checkAdmin(msg.sender) && !isSponsored) {
            postOp(preGas - gasLeft, gasPrice, BNB_GFAL_Rate);
        }
    }

    function executeOp(
        address target,
        uint256 value,
        bytes memory callData,
        bytes memory signature
    ) internal returns (bytes memory) {
        bool verified = verifySignature(
            target,
            callData,
            value,
            nonce,
            signature
        );
        require(verified, "Invalid signature");
        unchecked {
            nonce++;
        }
        return _call(target, value, callData);
    }

    function _call(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bytes memory) {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        return result;
    }

    // Post op called if Bundler is caller
    function postOp(
        uint256 gasUsed,
        uint256 gasPrice,
        uint256 BNB_GFAL_Rate // 1BNB to GFAL
    ) internal {
        uint256 gasReceipt = (((gasUsed + POST_OP_GAS + 21000))) * (gasPrice);
        uint256 GFALFee = gasReceipt * BNB_GFAL_Rate;

        IERC20(GFALProxy.getGfalToken()).transfer(msg.sender, GFALFee);
        emit postOpFinished(GFALFee, gasReceipt);
    }

    receive() external payable {}
}
