// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../utils/Proxy/IGFALProxy.sol";
import "./BasicWallet.sol";

/**
 * A sample factory contract for Wallet
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createWallet, in this sample factory).
 * The factory's createWallet returns the target Wallet address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the Wallet is created.
 */
contract BasicWalletFactory {
    IGFALProxy public GFALProxy;

    event BasicWalletCreated(address Owner, address BasicWallet);

    constructor(address _GFALProxy) {
        GFALProxy = IGFALProxy(_GFALProxy);
    }

    /**
     * create a Wallet, and return its address.
     * returns the address even if the Wallet is already deployed.
     * Note that during UserOperation execution, this method is called only if the Wallet is not deployed.
     * This method returns an existing Wallet address so that entryPoint.getSenderAddress() would work even after Wallet creation
     */
    function createWallet(
        address owner,
        uint256 salt
    ) public returns (BasicWallet ret) {
        require(true == GFALProxy.checkAdmin(msg.sender), "Not allowed");
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return BasicWallet(payable(addr));
        }
        ret = BasicWallet(
            new BasicWallet{salt: bytes32(salt)}(owner, address(GFALProxy))
        );
        require(addr == address(ret), "Invalid address");
        emit BasicWalletCreated(owner, address(ret));
    }

    /**
     * calculate the counterfactual address of this Wallet as it would be returned by createWallet()
     */
    function getAddress(
        address owner,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(BasicWallet).creationCode,
                        abi.encode(owner, address(GFALProxy))
                    )
                )
            );
    }
}
