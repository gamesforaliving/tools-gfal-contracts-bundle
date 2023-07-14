// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "../utils/OracleConsumer/IGFALOracleConsumer.sol";
import "../utils/Proxy/IGFALProxy.sol";

// This contract has been created as a MockUp for testing the Marketplace using ERC1155 tokens.
contract Erc1155MockUp is ERC1155Supply {
    using SafeERC20 for IERC20;
    uint256 public mintedNFTs; //Total amount of Different NFTs minted
    IGFALProxy public gfalProxy;

    // modifier onlyOwner() {
    //     require(msg.sender == gfal.proxy.owner(), "Not owner");
    //     _;
    // }

    constructor(
        address _proxy,
        string memory _uri,
        uint256 basicsPoints
    ) ERC1155(_uri) {
        gfalProxy = IGFALProxy(_proxy);
        _setURI(_uri);
    }

    function mint(uint256 _amount) external {
        mintedNFTs++;
        _mint(msg.sender, mintedNFTs, _amount, "");
        setApprovalForAll(gfalProxy.getMarketPlace(), true);
    }

    function updateBaseURI(string memory newUri) external {
        _setURI(newUri);
    }
}
