// SPDX-License-Identifier: MIT
/**
 * @title GFALToken
 * @dev GFALToken is an ERC20 token contract for Games For A Living platform. (Utility token)
 * @dev The token symbol is "GFAL" and the name is "Games For A Living".
 */
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Constructor function that initializes the GFALToken contract.
 * @dev It mints 10 billion GFAL tokens and assigns them to the contract deployer.
 */
contract GFALToken is ERC20 {
    constructor() ERC20("Games For A Living", "GFAL") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}
