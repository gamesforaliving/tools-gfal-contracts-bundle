# GFAL Consumible Game Objects

This smart contract allows users to mint and manage consumibles objects for the GFAL games. Consumibles can be claimed or purchased using the GFAL token or a card payment. The contract supports whitelisting for minting and keeps track of consumible details, including price, supply, and ownership.

## Features

The Consumible smart contract offers the following features:

- **Mint Whitelisted Consumibles:** Users can mint whitelisted consumibles by providing a valid consumible ID and proof.
- **Mint Consumibles:** Users can mint consumibles by purchasing them with the GFAL token or a card payment.
- **Burn Consumibles:** Owners can burn their consumibles to remove them from their inventory.
- **Create Consumibles:** Administrators can create new consumibles by specifying the price, maximum supply for sale, maximum claimable supply, and hash root.

## Dependencies

The Consumible smart contract relies on the following dependencies:

- IERC20: an interface for interacting with ERC20 tokens.
- SafeERC20: a library for safely handling ERC20 token transfers.
- MerkleProof: a library for verifying Merkle proofs.
- ERC1155URIStorage: an extension for ERC1155 tokens with URI storage.
- IOracleConsumer: an interface for getting exchange rates from an oracle.
- IG4ALProxy: an interface for storing contract addresses.

## Structures

### Consumible

- price: The price of the consumible in USD.
- maxSupplySale: The maximum supply of consumibles available for sale.
- totalSold: The total number of consumibles sold.
- maxClaimableSupply: The maximum number of consumibles that can be claimed.
- totalClaimed: The total number of consumibles claimed.
- hashRoot: The Merkle root hash used for whitelisting.

## Events

- MintWhitelisted: Emitted when a whitelisted consumible is minted.
- Mint: Emitted when a consumible is minted.
- ConsumibleCreated: Emitted when a new consumible is created.
- consumibleBurned: Emitted when a consumible is burned (destroyed).

## Modifiers

- onlyAdmin: Requires that the caller is the contract's admin.
- isWhitelist: Requires that the caller is whitelisted to mint a specific consumible.

## Smart Contract Methods

### mintWhitelisted

Mints a whitelisted consumible for a specific user. Requires the user to be whitelisted and the consumible ID to be valid.

### mint

Mints a consumible for a specific user. Requires the consumible ID to be valid and available for sale.
The consumible can be purchased by 2 ways:

- Using GFAL token as a payment method. In this case the user calls the `mint` function.
- By Card payment. In this case the mint function will be called by the admin once the user pays through our platform setting the user wallet as the `to` parameter

### burn

Burns a consumible, removing it from the owner's inventory.

### createConsumible

Creates a new consumible with the specified details. Requires the caller to be the contract's admin.

### setTokenRoyalty

Sets the new feeNumerator for the royaltyAmount.(ERC2981)

## Getters

- consumibles: Returns the details of a specific consumible, including price, supply, and ownership.

- isMinted: Returns if an address claimed or not a specific consumible collection, requiring as parameters the ConsumibleId and the public address.

- royaltyInfo: Returns the Royalty receiver and the the royaltyAmount. (ERC2981)

## Solidity Version

0.8.19

## License

This smart contract is released under the MIT License.
