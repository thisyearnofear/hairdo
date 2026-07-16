// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title StyleCredential — Soulbound NFT for verifiable hair history
/// @notice Each attested cut mints a non-transferable NFT recording the style,
///         barber, date, hair type, and photo hash. The user's wallet becomes
///         their portable, tamper-proof hair history on Lisk.
/// @dev    Implements ERC-721 with all transfer functions disabled (soulbound).
///         Minting requires payment of an attestation fee in LSK tokens.
contract StyleCredential {
    // ─── ERC-721 storage ────────────────────────────────────────────────
    string public name = "HAIRDO Style Credential";
    string public symbol = "HAIRDO-SC";

    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    // ─── Credential metadata ───────────────────────────────────────────
    struct CredentialData {
        string styleId;       // e.g. "skin-fade"
        string styleName;     // e.g. "Skin Fade"
        address barber;       // barber's wallet (address(0) if self-attested)
        uint64 timestamp;     // block.timestamp at mint
        string hairType;      // e.g. "4C"
        bytes32 photoHash;    // SHA-256 of source photo (never the image)
    }

    mapping(uint256 => CredentialData) public credentials;

    // ─── Payment ───────────────────────────────────────────────────────
    IERC20 public constant LSK_TOKEN =
        IERC20(0xac485391EB2d7D88253a7F1eF18C37f4242D1A24);
    uint256 public attestationFee = 1e18; // 1 LSK (18 decimals)
    address public owner;
    bool public paused;

    // ─── Events ────────────────────────────────────────────────────────
    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed user,
        address indexed barber,
        string styleId,
        uint64 timestamp
    );
    event FeeUpdated(uint256 newFee);
    event PausedToggled(bool newState);
    event Withdrawn(address recipient, uint256 amount);

    // ERC-721 events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ─── Modifiers ─────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Minting ───────────────────────────────────────────────────────

    /// @notice Mint a Style Credential after paying the attestation fee
    /// @param styleId     Style identifier from data/styles.json
    /// @param styleName   Human-readable style name
    /// @param barber      Barber's wallet address (address(0) if self-attested)
    /// @param hairType    User's hair type (e.g. "4C")
    /// @param photoHash   SHA-256 hash of the source photo
    /// @param tokenURI_   URI for offchain metadata (IPFS or Redis-backed)
    /// @return tokenId The minted token ID
    function mintCredential(
        string calldata styleId,
        string calldata styleName,
        address barber,
        string calldata hairType,
        bytes32 photoHash,
        string calldata tokenURI_
    ) external whenNotPaused returns (uint256) {
        // Collect attestation fee in LSK
        require(
            LSK_TOKEN.transferFrom(msg.sender, address(this), attestationFee),
            "LSK payment failed — check approval and balance"
        );

        uint256 tokenId = _nextTokenId++;

        // Store credential data onchain
        credentials[tokenId] = CredentialData({
            styleId: styleId,
            styleName: styleName,
            barber: barber,
            timestamp: uint64(block.timestamp),
            hairType: hairType,
            photoHash: photoHash
        });

        // Mint NFT to caller
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        _tokenURIs[tokenId] = tokenURI_;

        emit Transfer(address(0), msg.sender, tokenId);
        emit CredentialMinted(tokenId, msg.sender, barber, styleId, uint64(block.timestamp));

        return tokenId;
    }

    /// @notice Get all credential data for a token
    /// @param tokenId The token ID to query
    /// @return styleId, styleName, barber, timestamp, hairType, photoHash
    function getCredential(uint256 tokenId)
        external
        view
        returns (
            string memory styleId,
            string memory styleName,
            address barber,
            uint64 timestamp,
            string memory hairType,
            bytes32 photoHash
        )
    {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        CredentialData memory c = credentials[tokenId];
        return (c.styleId, c.styleName, c.barber, c.timestamp, c.hairType, c.photoHash);
    }

    /// @notice Get the token URI for offchain metadata
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        return _tokenURIs[tokenId];
    }

    /// @notice Get all tokens owned by a user (for growth agent reads)
    /// @dev    This is a view function — offchain indexers should use
    ///         Transfer events for efficiency. This is for onchain reads.
    function tokensOfOwner(address user)
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = _balances[user];
        uint256[] memory result = new uint256[](balance);
        uint256 idx = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_owners[i] == user) {
                result[idx] = i;
                idx++;
                if (idx == balance) break;
            }
        }
        return result;
    }

    // ─── Soulbound enforcement ─────────────────────────────────────────
    // All transfer functions are disabled. Credentials are non-transferable.

    function transferFrom(address, address, uint256) public pure {
        revert("Style Credentials are soulbound — non-transferable");
    }

    function safeTransferFrom(address, address, uint256) public pure {
        revert("Style Credentials are soulbound — non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) public pure {
        revert("Style Credentials are soulbound — non-transferable");
    }

    // Approvals are also disabled since transfers are impossible
    function approve(address, uint256) public pure {
        revert("Style Credentials are soulbound — no approvals needed");
    }

    function setApprovalForAll(address, bool) public pure {
        revert("Style Credentials are soulbound — no approvals needed");
    }

    // ─── ERC-721 view functions ────────────────────────────────────────

    function balanceOf(address user) public view returns (uint256) {
        require(user != address(0), "Zero address");
        return _balances[user];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Credential does not exist");
        return tokenOwner;
    }

    function getApproved(uint256) public pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) public pure returns (bool) {
        return false;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ─── Admin ─────────────────────────────────────────────────────────

    function setAttestationFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be > 0");
        attestationFee = newFee;
        emit FeeUpdated(newFee);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PausedToggled(paused);
    }

    function withdrawLSK() external onlyOwner {
        uint256 balance = LSK_TOKEN.balanceOf(address(this));
        require(balance > 0, "No LSK to withdraw");
        require(LSK_TOKEN.transfer(owner, balance), "Withdrawal failed");
        emit Withdrawn(owner, balance);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd;   // ERC-721
    }
}

// ─── Interface ──────────────────────────────────────────────────────────
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}
