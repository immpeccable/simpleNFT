// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error SimpleNft__OutOfBounds(uint256 randomNumber);
error SimpleNft__NotEnoughEth(uint256 eth);

contract SimpleNft is VRFConsumerBaseV2, ERC721URIStorage {
    enum CatBreed {
        CAT_1,
        CAT_2,
        CAT_3,
        CAT_4,
        CAT_5
    }

    event Nft_Requested(uint256 indexed requestId, address indexed requester);
    event Nft_Minted(uint256 indexed requestId, address indexed minter);

    uint256 private s_tokenCounter;

    uint64 private immutable i_subscriptionId;
    VRFCoordinatorV2Interface private immutable i_coordinator;
    uint32 private immutable i_callbackGasLimit;
    bytes32 private immutable i_gaslane;
    uint256 private immutable i_mintFee;
    string[] internal s_catUris;

    uint32 private constant NUM_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 1;
    uint256 private constant MODE = 124;
    string constant BASE_URI = "ipfs://";

    mapping(uint256 => address) private s_requests;
    uint8[5] internal rarity = [4, 12, 28, 60, 124];

    constructor(
        string memory name_,
        string memory symbol_,
        bytes32 gasLane,
        address VRFCoordinatorV2InterfaceAddress,
        uint64 subId,
        string[] memory catUris,
        uint32 callbackGasLimit,
        uint256 mintFee
    )
        ERC721(name_, symbol_)
        VRFConsumerBaseV2(VRFCoordinatorV2InterfaceAddress)
    {
        s_tokenCounter = 0;
        i_coordinator = VRFCoordinatorV2Interface(
            VRFCoordinatorV2InterfaceAddress
        );
        s_catUris = catUris;
        i_subscriptionId = subId;
        i_callbackGasLimit = callbackGasLimit;
        i_gaslane = gasLane;
        i_mintFee = mintFee;
    }

    function requestNft() external payable {
        if (msg.value < i_mintFee) {
            revert SimpleNft__NotEnoughEth(msg.value);
        }
        uint256 requestId = i_coordinator.requestRandomWords(
            i_gaslane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requests[requestId] = msg.sender;
        s_tokenCounter++;
        emit Nft_Requested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 randomNumber = randomWords[0] % MODE;
        address minter = s_requests[requestId];
        CatBreed breed = getCatIndex(randomNumber);
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter++;
        _setTokenURI(newTokenId, s_catUris[uint256(breed)]);
        _safeMint(minter, newTokenId);
        emit Nft_Minted(requestId, minter);
    }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }

    function getCatIndex(
        uint256 randomNumber
    ) internal view returns (CatBreed) {
        uint256 numberOfCats = rarity.length;
        CatBreed breed;
        for (uint256 i = 0; i < numberOfCats; i++) {
            if (randomNumber <= rarity[i]) {
                breed = CatBreed.CAT_1;
            } else {
                return breed;
            }
        }
        revert SimpleNft__OutOfBounds(randomNumber);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getRequestConfirmations() public pure returns (uint64) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRequester(uint256 requestId) public view returns (address) {
        return s_requests[requestId];
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getGaslane() public view returns (bytes32) {
        return i_gaslane;
    }

    function getCatUri(uint256 catIndex) public view returns (string memory) {
        return s_catUris[catIndex];
    }
}
