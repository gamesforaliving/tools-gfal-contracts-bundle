// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "../../utils/OracleConsumer/IGFALOracleConsumer.sol";
import "../../utils/Proxy/IGFALProxy.sol";

/**
@title GFAL Consumibles Games Objects - GAMES FOR A LIVING
@dev This smart contract implements a collection of consumibles represented as ERC1155 tokens.
Users can mint consumibles either by being whitelisted or by purchasing them using a payment method.
The contract also supports burning consumibles and creating new consumibles.
*/
contract GFALConsumiblesGameObjects is ERC1155URIStorage {
    using SafeERC20 for IERC20;

    struct Consumible {
        uint256 price; // Price must be set in USD
        uint256 maxSupplySale;
        uint256 totalSold;
        uint256 maxClaimableSupply;
        uint256 totalClaimed;
        bytes32 hashRoot;
    }

    IGFALProxy private immutable gfalProxy;

    uint16 private royaltyFraction; // Royalty percentage to send to feeCollector when sold in secondary market, but not our marketplace. (royaltyFraction / 10.000)¡
    uint256 public consumibleCounter; // counter for the total collections of Consumibles created

    mapping(uint256 => Consumible) public consumibles; // consumibleId => Consumible details
    mapping(uint256 => mapping(address => bool)) public isMinted; // Tracker for minted Consumible ID. (tokenID => wallet => claimed)

    /**
     * @dev Modifier to restrict access to only the admin set in the GFALProxy contract.
     */
    modifier onlyPrivileges() {
        require(
            gfalProxy.checkAdmin(msg.sender) ||
                gfalProxy.checkSuperAdmin(msg.sender),
            "Not Admin or Super Admin"
        );
        _;
    }
    /**
     * @dev Modifier to check if the user is whitelisted for minting the a specific Consumible ID.
     * @param consumibleId The ID of the consumible being minted.
     * @param proof The Merkle proof for verifying the user's eligibility.
     */
    modifier isWhitelist(uint256 consumibleId, bytes32[] calldata proof) {
        require(
            !isMinted[consumibleId][msg.sender],
            "Consumible already claimed"
        );
        bool success = MerkleProof.verify(
            proof,
            consumibles[consumibleId].hashRoot,
            keccak256(abi.encodePacked(msg.sender))
        );
        require(success, "You are not in the whitelist for minting");
        _;
    }

    event MintWhitelisted(
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 amount
    );
    event Mint(
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 amount,
        uint256 price
    );
    event ConsumibleCreated(
        uint256 consumibleId,
        uint256 price, // Price must be set in USD
        uint256 maxSupplySale,
        uint256 maxClaimableSupply,
        bytes32 hashRoot
    );
    event consumibleBurned(address indexed owner, uint256 consumibleId);

    /**
     * @dev Initializes the Consumibles contract.
     * @param _baseUri The base URI for the consumible URIs.
     * @param _gfalProxy The address of the GFALProxy contract.
     */
    constructor(
        string memory _baseUri,
        address _gfalProxy,
        uint16 _royaltyFraction
    ) ERC1155(_baseUri) {
        require(_gfalProxy != address(0), "Use a valid address");
        gfalProxy = IGFALProxy(_gfalProxy);
        _setBaseURI(_baseUri);
        royaltyFraction = _royaltyFraction;
    }

    /**
     * @dev Mints a whitelisted consumible to the specified recipient.
     * @param to The address of the recipient.
     * @param consumibleId The ID of the consumible to be minted.
     * @param proof The Merkle proof for verifying the user's eligibility.
     * Note: Users should mint 1 if they are in the whitelist.
     */
    function mintWhitelisted(
        address to,
        uint256 consumibleId,
        bytes32[] calldata proof
    ) external isWhitelist(consumibleId, proof) {
        require(consumibleCounter > consumibleId, "Invalid consumibleId");
        isMinted[consumibleId][msg.sender] = true;
        consumibles[consumibleId].totalClaimed++;
        _mint(msg.sender, consumibleId, 1, "");
        emit MintWhitelisted(address(0), to, consumibleId, 1);
    }

    /**
     * @dev Mints a consumible to the specified recipient.
     * @param to The address of the recipient.
     * @param consumibleId The ID of the consumible to be minted.
     * Note: Users should mint 1 Consumible by buying with card or GFAL. If they buy with card we will mint for them.
     */
    function mint(address to, uint256 consumibleId) external {
        require(consumibleCounter > consumibleId, "Invalid consumibleId");
        uint256 consumiblePrice;
        Consumible storage _consumible = consumibles[consumibleId];
        require(
            _consumible.totalSold < _consumible.maxSupplySale,
            "consumibleId maxsupply reached"
        );
        _consumible.totalSold++;

        if (
            gfalProxy.checkAdmin(msg.sender) ||
            gfalProxy.checkSuperAdmin(msg.sender)
        ) {
            _mint(to, consumibleId, 1, "");
        } else {
            // Get the conversion from USD to GFAL
            consumiblePrice = IGFALOracleConsumer(gfalProxy.getOracleConsumer())
                .getConversionRate(_consumible.price);
            // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
            IERC20(gfalProxy.getGfalToken()).safeTransferFrom(
                to,
                gfalProxy.getFeeCollector(),
                consumiblePrice
            );
            _mint(to, consumibleId, 1, "");
        }
        emit Mint(address(0), to, consumibleId, 1, consumiblePrice);
    }

    /**
     * @dev Burns a consumible owned by the caller.
     * @param consumibleId The ID of the consumible to be burned.
     */
    function burn(uint256 consumibleId) external {
        _burn(msg.sender, consumibleId, 1);
        emit consumibleBurned(msg.sender, consumibleId);
    }

    /**
     * @dev Creates a new consumible collection with the specified parameters.
     * @param price The price of the consumible in USD. It will be exchanged to GFAL by the rate set in the OracleConsumer contract.
     * @param maxSupplySale The maximum supply of consumibles available for sale.
     * @param maxClaimableSupply The maximum supply of consumibles that can be claimed.
     * @param hashRoot The Merkle root for whitelisted addresses.
     */
    function createConsumible(
        uint256 price,
        uint256 maxSupplySale,
        uint256 maxClaimableSupply,
        bytes32 hashRoot
    ) external onlyPrivileges {
        uint256 consumibleId = consumibleCounter;

        consumibles[consumibleId] = Consumible(
            price,
            maxSupplySale,
            0,
            maxClaimableSupply,
            0,
            hashRoot
        );
        _setURI(consumibleId, Strings.toString(consumibleId));
        consumibleCounter = consumibleId + 1;
        emit ConsumibleCreated(
            consumibleId,
            price,
            maxSupplySale,
            maxClaimableSupply,
            hashRoot
        );
    }

    /**
     * @dev Updates the royalty fraction set for secondary market sale.
     * @param feeNumerator The new royalty fraction to set. 100(feeNumerator) / 10.0000 = 0.01% as fee
     * Note: It will take effect only in secondary market place (Not in our own market place)
     */
    function setTokenRoyalty(uint16 feeNumerator) external onlyPrivileges {
        require(feeNumerator < 10001, "Royalty fee will exceed salePrice");
        royaltyFraction = feeNumerator;
    }

    /**
     * @dev Updates the BaseURI set.
     * @param newUri The new base URI to set.
     */
    function updateBaseURI(string memory newUri) external onlyPrivileges {
        _setBaseURI(newUri);
    }

    /**
     * @dev Returns the fee collector and the royaltyAmount to transfer.
     * @param salePrice Total sale price.
     * Note: It will take effect only in secondary market place. (Not in our own market place)
     */
    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) public view returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyFraction) / 10000;

        return (gfalProxy.getFeeCollector(), royaltyAmount);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     * Note: Added interface for ERC2981 (for being Royalties compatible)
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155) returns (bool) {
        return
            interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }
}
