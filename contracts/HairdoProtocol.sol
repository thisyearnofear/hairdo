// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title HairdoProtocol — The onchain trust graph for Black men's hair care
/// @notice A unified protocol contract that replaces the proof-of-concept
///         HairdoPayment.sol. Encodes the full agentic + onchain primitive set:
///
///         1. Style Registry — maintenance windows onchain, verifiable growth tracking
///         2. Style Credentials — soulbound NFTs recording each attested cut
///         3. Barber Registry — barbers stake LSK, declare specialties, build trust
///         4. Cut Attestation — barbers attest cuts for clients (two-sided trust)
///         5. Trust Score — computed onchain from real attestation events
///         6. Staking + Slashing — economic security for the trust graph
///         7. Growth Tracking — isOverdue() view function the agent reads
///
/// @dev    The contract IS the trust graph. The Hair Growth Agent reads from it.
///         Barber trust scores are computed from onchain events, not offchain JSON.
///         Every credential is a data point that compounds the graph's value.
contract HairdoProtocol {
    // ═══════════════════════════════════════════════════════════════════
    // ─── ERC-721 Storage (Style Credentials are SBTs) ──────────────────
    // ═══════════════════════════════════════════════════════════════════

    string public constant name = "HAIRDO Style Credential";
    string public constant symbol = "HAIRDO-SC";

    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;

    // ═══════════════════════════════════════════════════════════════════
    // ─── Style Registry ─────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Maintenance windows live onchain so isOverdue() is verifiable.
    // The agent doesn't compute growth — it reads it from the contract.

    struct StyleInfo {
        string styleId;         // e.g. "skin-fade"
        string styleName;       // e.g. "Skin Fade"
        uint16 maintenanceDays; // how long before the style grows out
        bool exists;
    }

    mapping(bytes32 => StyleInfo) private _styles;       // keyed by keccak256(styleId)
    bytes32[] private _styleKeys;

    // ═══════════════════════════════════════════════════════════════════
    // ─── Style Credentials (Soulbound NFTs) ────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Each attested cut mints a non-transferable NFT. The credential
    // records who, what, when, and who attested it. This is the user's
    // portable, verifiable hair history.

    struct Credential {
        bytes32 styleKey;       // links to StyleInfo
        address barber;         // address(0) = self-attested (no barber)
        address client;         // the person who got the cut
        uint64 timestamp;       // when the cut was attested
        uint16 hairTypeCode;    // encoded hair type (1=1A ... 12=4C)
        bytes32 photoHash;      // SHA-256 of source photo (never the image)
        bool barberAttested;    // true = barber verified this cut
    }

    mapping(uint256 => Credential) public credentials;

    // ═══════════════════════════════════════════════════════════════════
    // ─── Barber Registry ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Barbers stake LSK to register. Stake = skin in the game.
    // Slashing for bad cuts creates economic security for the trust graph.

    struct Barber {
        bool registered;
        uint256 stake;          // LSK staked (security deposit)
        uint64 registeredAt;    // when they joined
        uint64 lastActiveAt;    // last attestation timestamp
        uint256 verifiedCutCount; // total cuts attested onchain
        uint256 slashedCount;   // number of times slashed
        string shop;            // shop name
        string city;            // city
        string state;           // state/region
        bytes32[] specialtyKeys; // keccak256(styleId) of specialties
        uint64 unstakeRequestAt; // 0 = no pending unstake, else timestamp
    }

    mapping(address => Barber) public barbers;
    address[] public barberList;

    // Barber specialties (separate mapping for gas-efficient lookups)
    mapping(address => mapping(bytes32 => bool)) public barberSpecialties;

    // ═══════════════════════════════════════════════════════════════════
    // ─── Staking + Slashing Parameters ──────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    IERC20 public constant LSK_TOKEN =
        IERC20(0xac485391EB2d7D88253a7F1eF18C37f4242D1A24);

    uint256 public constant MIN_STAKE = 10e18;     // 10 LSK to register
    uint256 public constant MAX_SLASH = 5e18;      // max slash per dispute (5 LSK)
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;
    uint256 public credentialFee = 1e18;           // 1 LSK per credential mint

    // ═══════════════════════════════════════════════════════════════════
    // ─── Admin ──────────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    address public owner;
    bool public paused;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Protocol is paused");
        _;
    }

    modifier onlyRegisteredBarber() {
        require(barbers[msg.sender].registered, "Not a registered barber");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Events ─────────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    // Style registry
    event StyleRegistered(string styleId, string styleName, uint16 maintenanceDays);
    event StyleUpdated(string styleId, uint16 maintenanceDays);

    // Credentials
    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed client,
        address indexed barber,
        string styleId,
        uint64 timestamp,
        bool barberAttested
    );

    // Barber registry
    event BarberRegistered(address indexed barber, string shop, string city, uint256 stake);
    event BarberDeregistered(address indexed barber);
    event BarberSpecialtyUpdated(address indexed barber, string styleId, bool added);
    event StakeSlashed(address indexed barber, uint256 amount, string reason);
    event UnstakeRequested(address indexed barber, uint64 cooldownEndsAt);
    event StakeWithdrawn(address indexed barber, uint256 amount);

    // Admin
    event FeeUpdated(uint256 newFee);
    event PausedToggled(bool newState);
    event Withdrawn(address recipient, uint256 amount);

    // ERC-721
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    // ═══════════════════════════════════════════════════════════════════
    // ─── Constructor ────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    constructor() {
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Style Registry ─────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // The owner registers styles with their maintenance windows.
    // This data is the onchain source of truth for growth tracking.

    function registerStyle(
        string calldata styleId,
        string calldata styleName,
        uint16 maintenanceDays
    ) external onlyOwner {
        bytes32 key = keccak256(bytes(styleId));
        require(!_styles[key].exists, "Style already registered");
        require(maintenanceDays > 0, "Maintenance days must be > 0");

        _styles[key] = StyleInfo({
            styleId: styleId,
            styleName: styleName,
            maintenanceDays: maintenanceDays,
            exists: true
        });
        _styleKeys.push(key);

        emit StyleRegistered(styleId, styleName, maintenanceDays);
    }

    function updateStyleMaintenance(
        string calldata styleId,
        uint16 maintenanceDays
    ) external onlyOwner {
        bytes32 key = keccak256(bytes(styleId));
        require(_styles[key].exists, "Style not found");
        _styles[key].maintenanceDays = maintenanceDays;
        emit StyleUpdated(styleId, maintenanceDays);
    }

    function getStyle(string calldata styleId)
        external
        view
        returns (string memory styleName, uint16 maintenanceDays, bool exists)
    {
        bytes32 key = keccak256(bytes(styleId));
        StyleInfo memory s = _styles[key];
        return (s.styleName, s.maintenanceDays, s.exists);
    }

    function styleExists(string calldata styleId) public view returns (bool) {
        return _styles[keccak256(bytes(styleId))].exists;
    }

    function styleCount() external view returns (uint256) {
        return _styleKeys.length;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Hair Type Encoding ─────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Hair types encoded as uint16 for gas-efficient onchain storage.
    // 1=1A, 2=1B, 3=1C, 4=2A, 5=2B, 6=2C,
    // 7=3A, 8=3B, 9=3C, 10=4A, 11=4B, 12=4C

    function encodeHairType(string calldata hairType) public pure returns (uint16) {
        bytes memory h = bytes(hairType);
        require(h.length >= 2, "Invalid hair type");
        uint8 first = uint8(h[0]) - 48; // '0' = 48
        uint8 second = uint8(h[1]) - 65; // 'A' = 65
        require(first >= 1 && first <= 4, "Invalid hair type number");
        require(second <= 2, "Invalid hair type letter");
        return uint16((first - 1) * 3 + second + 1);
    }

    function decodeHairType(uint16 code) public pure returns (string memory) {
        require(code >= 1 && code <= 12, "Invalid code");
        uint8 first = (code - 1) / 3 + 1;
        uint8 second = (code - 1) % 3;
        bytes memory result = new bytes(2);
        result[0] = bytes1(uint8(first + 48));
        result[1] = bytes1(uint8(second + 65));
        return string(result);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Barber Registry ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Barbers stake LSK to register. This is skin in the game —
    // slashed stakes go to wronged clients. The stake creates trust
    // that fake reviews can't replicate.

    function registerBarber(
        string calldata shop,
        string calldata city,
        string calldata state,
        string[] calldata specialties, // styleIds
        uint256 stakeAmount
    ) external whenNotPaused {
        require(!barbers[msg.sender].registered, "Already registered");
        require(stakeAmount >= MIN_STAKE, "Stake below minimum");

        // Transfer LSK stake
        require(
            LSK_TOKEN.transferFrom(msg.sender, address(this), stakeAmount),
            "Stake transfer failed — check approval and balance"
        );

        Barber storage b = barbers[msg.sender];
        b.registered = true;
        b.stake = stakeAmount;
        b.registeredAt = uint64(block.timestamp);
        b.lastActiveAt = uint64(block.timestamp);
        b.shop = shop;
        b.city = city;
        b.state = state;

        // Register specialties
        for (uint256 i = 0; i < specialties.length; i++) {
            bytes32 key = keccak256(bytes(specialties[i]));
            require(_styles[key].exists, "Specialty style not found");
            b.specialtyKeys.push(key);
            barberSpecialties[msg.sender][key] = true;
            emit BarberSpecialtyUpdated(msg.sender, specialties[i], true);
        }

        barberList.push(msg.sender);

        emit BarberRegistered(msg.sender, shop, city, stakeAmount);
    }

    function addSpecialty(string calldata styleId) external onlyRegisteredBarber {
        bytes32 key = keccak256(bytes(styleId));
        require(_styles[key].exists, "Style not found");
        require(!barberSpecialties[msg.sender][key], "Already a specialty");
        barbers[msg.sender].specialtyKeys.push(key);
        barberSpecialties[msg.sender][key] = true;
        emit BarberSpecialtyUpdated(msg.sender, styleId, true);
    }

    function removeSpecialty(string calldata styleId) external onlyRegisteredBarber {
        bytes32 key = keccak256(bytes(styleId));
        require(barberSpecialties[msg.sender][key], "Not a specialty");
        barberSpecialties[msg.sender][key] = false;
        // Note: we don't compact the array (gas cost), just mark as removed
        emit BarberSpecialtyUpdated(msg.sender, styleId, false);
    }

    function hasSpecialty(address barber, string calldata styleId)
        external
        view
        returns (bool)
    {
        return barberSpecialties[barber][keccak256(bytes(styleId))];
    }

    // ─── Unstake + Withdraw ─────────────────────────────────────────────
    // Barbers can leave, but must wait through a cooldown to prevent
    // slashing evasion.

    function requestUnstake() external onlyRegisteredBarber {
        Barber storage b = barbers[msg.sender];
        require(b.unstakeRequestAt == 0, "Unstake already requested");
        b.unstakeRequestAt = uint64(block.timestamp);
        emit UnstakeRequested(msg.sender, uint64(block.timestamp) + uint64(UNSTAKE_COOLDOWN));
    }

    function withdrawStake() external onlyRegisteredBarber {
        Barber storage b = barbers[msg.sender];
        require(b.unstakeRequestAt > 0, "No unstake requested");
        require(
            block.timestamp >= b.unstakeRequestAt + UNSTAKE_COOLDOWN,
            "Cooldown not elapsed"
        );

        uint256 amount = b.stake;
        b.stake = 0;
        b.registered = false;
        b.unstakeRequestAt = 0;

        // Remove from barberList (mark as deregistered, don't compact)
        // In production, an offchain indexer would filter by registered==true

        require(LSK_TOKEN.transfer(msg.sender, amount), "Withdrawal failed");
        emit StakeWithdrawn(msg.sender, amount);
        emit BarberDeregistered(msg.sender);
    }

    function cancelUnstake() external onlyRegisteredBarber {
        Barber storage b = barbers[msg.sender];
        require(b.unstakeRequestAt > 0, "No unstake requested");
        b.unstakeRequestAt = 0;
    }

    // ─── Slashing ───────────────────────────────────────────────────────
    // Owner slashes barber stake for verified disputes. Slashed funds
    // go to the wronged client. This is the economic security layer.

    function slashBarber(
        address barber,
        uint256 amount,
        address client,
        string calldata reason
    ) external onlyOwner {
        Barber storage b = barbers[barber];
        require(b.registered, "Barber not registered");
        require(amount <= MAX_SLASH, "Slash exceeds maximum");
        require(amount <= b.stake, "Slash exceeds stake");

        b.stake -= amount;
        b.slashedCount += 1;

        // Send slashed funds to the client
        if (client != address(0)) {
            require(LSK_TOKEN.transfer(client, amount), "Client transfer failed");
        }

        emit StakeSlashed(barber, amount, reason);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Cut Attestation + Credential Minting ───────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // Two flows:
    // 1. Barber attests a cut for a client → two-sided trust (barber-attested)
    // 2. Client self-attests their own cut → one-sided (self-attested)
    //
    // Barber-attested credentials carry more trust weight because
    // a verified barber is putting their stake behind the attestation.

    /// @notice Barber attests a cut for a client — mints SBT to client
    /// @param client    The client's wallet address (receives the credential)
    /// @param styleId   Style identifier from the style registry
    /// @param hairType  Client's hair type (e.g. "4C")
    /// @param photoHash SHA-256 hash of the source photo
    /// @param tokenURI_ URI for offchain metadata
    function attestCut(
        address client,
        string calldata styleId,
        string calldata hairType,
        bytes32 photoHash,
        string calldata tokenURI_
    ) external onlyRegisteredBarber whenNotPaused {
        bytes32 styleKey = keccak256(bytes(styleId));
        require(_styles[styleKey].exists, "Style not registered");

        // Barber pays the credential fee
        require(
            LSK_TOKEN.transferFrom(msg.sender, address(this), credentialFee),
            "Fee payment failed — check approval and balance"
        );

        uint256 tokenId = _mintCredential(
            client,
            styleKey,
            msg.sender, // barber
            hairType,
            photoHash,
            tokenURI_,
            true // barberAttested
        );

        // Update barber's trust data
        Barber storage b = barbers[msg.sender];
        b.verifiedCutCount += 1;
        b.lastActiveAt = uint64(block.timestamp);
    }

    /// @notice Client self-attests their own cut — mints SBT to self
    /// @param styleId   Style identifier from the style registry
    /// @param hairType  Client's hair type
    /// @param photoHash SHA-256 hash of the source photo
    /// @param tokenURI_ URI for offchain metadata
    function selfAttest(
        string calldata styleId,
        string calldata hairType,
        bytes32 photoHash,
        string calldata tokenURI_
    ) external whenNotPaused {
        bytes32 styleKey = keccak256(bytes(styleId));
        require(_styles[styleKey].exists, "Style not registered");

        // Client pays the credential fee
        require(
            LSK_TOKEN.transferFrom(msg.sender, address(this), credentialFee),
            "Fee payment failed — check approval and balance"
        );

        _mintCredential(
            msg.sender,
            styleKey,
            address(0), // no barber
            hairType,
            photoHash,
            tokenURI_,
            false // not barber-attested
        );
    }

    function _mintCredential(
        address to,
        bytes32 styleKey,
        address barber,
        string calldata hairType,
        bytes32 photoHash,
        string calldata tokenURI_,
        bool barberAttested
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        credentials[tokenId] = Credential({
            styleKey: styleKey,
            barber: barber,
            client: to,
            timestamp: uint64(block.timestamp),
            hairTypeCode: encodeHairType(hairType),
            photoHash: photoHash,
            barberAttested: barberAttested
        });

        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = tokenURI_;

        emit Transfer(address(0), to, tokenId);

        // Emit with styleId for indexing
        emit CredentialMinted(
            tokenId,
            to,
            barber,
            _styles[styleKey].styleId,
            uint64(block.timestamp),
            barberAttested
        );

        return tokenId;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Growth Tracking (the agent reads this) ─────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // The contract knows when a style expires. The agent reads isOverdue()
    // instead of computing growth offchain. This makes the agent's logic
    // verifiable and deterministic.

    /// @notice Check if a credential's style has grown past its maintenance window
    /// @param tokenId The credential to check
    /// @return overdue True if the style is past its maintenance window
    function isOverdue(uint256 tokenId) public view returns (bool) {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        Credential memory c = credentials[tokenId];
        StyleInfo memory s = _styles[c.styleKey];
        return block.timestamp >= c.timestamp + uint256(s.maintenanceDays) * 1 days;
    }

    /// @notice Days until the style grows out (0 if already overdue)
    function daysUntilOverdue(uint256 tokenId) external view returns (int256) {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        Credential memory c = credentials[tokenId];
        StyleInfo memory s = _styles[c.styleKey];
        uint256 overdueAt = c.timestamp + uint256(s.maintenanceDays) * 1 days;
        if (block.timestamp >= overdueAt) {
            return -int256((block.timestamp - overdueAt) / 1 days);
        }
        return int256((overdueAt - block.timestamp) / 1 days);
    }

    /// @notice Days since the cut was attested
    function daysSinceCut(uint256 tokenId) external view returns (uint256) {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        Credential memory c = credentials[tokenId];
        return (block.timestamp - c.timestamp) / 1 days;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Trust Score (computed onchain) ─────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // The trust score is computed from onchain attestation events.
    // Anyone can verify it. No offchain JSON needed.
    //
    // Four factors (matching the offchain barber-trust.ts engine):
    // 1. Verified cuts (35%) — total cuts attested onchain
    // 2. Specialty coverage (25%) — unique styles executed
    // 3. Recency (20%) — recent activity weighted higher
    // 4. Stake + slashing (20%) — economic security

    function computeTrustScore(address barberAddr) public view returns (uint256) {
        Barber memory b = barbers[barberAddr];
        if (!b.registered) return 0;

        // Factor 1: Verified cuts (35%)
        // 100 cuts = max score. Linear up to 100.
        uint256 cutsScore = b.verifiedCutCount >= 100 ? 100 : b.verifiedCutCount;

        // Factor 2: Specialty coverage (25%)
        // 5+ specialties = max score
        uint256 specialtyCount = b.specialtyKeys.length;
        uint256 specialtyScore = specialtyCount >= 5 ? 100 : specialtyCount * 20;

        // Factor 3: Recency (20%)
        // Active in last 7 days = 100, decays to 10 at 30+ days
        uint256 daysSinceActive = (block.timestamp - b.lastActiveAt) / 1 days;
        uint256 recencyScore;
        if (daysSinceActive <= 7) {
            recencyScore = 100;
        } else if (daysSinceActive <= 30) {
            recencyScore = 100 - (daysSinceActive - 7) * 90 / 23;
        } else {
            recencyScore = 10;
        }

        // Factor 4: Stake + slashing record (20%)
        // Higher stake = more trust. Slashing reduces trust.
        uint256 stakeScore = b.stake * 100 / MIN_STAKE;
        if (stakeScore > 100) stakeScore = 100;
        // Each slash reduces score by 20
        uint256 slashPenalty = b.slashedCount * 20;
        if (slashPenalty > stakeScore) slashPenalty = stakeScore;
        stakeScore -= slashPenalty;

        return (
            cutsScore * 35 +
            specialtyScore * 25 +
            recencyScore * 20 +
            stakeScore * 20
        ) / 100;
    }

    /// @notice Get full barber profile with trust score
    function getBarberProfile(address barberAddr)
        external
        view
        returns (
            bool registered,
            string memory shop,
            string memory city,
            string memory state,
            uint256 stake,
            uint256 verifiedCutCount,
            uint256 slashedCount,
            uint64 registeredAt,
            uint64 lastActiveAt,
            uint256 trustScore
        )
    {
        Barber memory b = barbers[barberAddr];
        return (
            b.registered,
            b.shop,
            b.city,
            b.state,
            b.stake,
            b.verifiedCutCount,
            b.slashedCount,
            b.registeredAt,
            b.lastActiveAt,
            computeTrustScore(barberAddr)
        );
    }

    /// @notice Get all registered barbers sorted by trust score
    /// @dev    This is gas-heavy for large barber lists. Offchain indexers
    ///         should use events instead. Provided for small lists / testing.
    function getAllBarbers()
        external
        view
        returns (
            address[] memory addresses,
            uint256[] memory trustScores
        )
    {
        uint256 count = barberList.length;
        addresses = new address[](count);
        trustScores = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            addresses[i] = barberList[i];
            trustScores[i] = computeTrustScore(barberList[i]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Credential Reads (for the growth agent) ────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Get all credentials owned by a user
    /// @dev    For large histories, use Transfer events in an indexer.
    ///         This is for onchain reads in small-to-medium histories.
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

    /// @notice Get full credential data
    function getCredential(uint256 tokenId)
        external
        view
        returns (
            string memory styleId,
            string memory styleName,
            address barber,
            address client,
            uint64 timestamp,
            string memory hairType,
            bytes32 photoHash,
            bool barberAttested,
            bool overdue
        )
    {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        Credential memory c = credentials[tokenId];
        StyleInfo memory s = _styles[c.styleKey];
        bool isOver = block.timestamp >= c.timestamp + uint256(s.maintenanceDays) * 1 days;
        return (
            s.styleId,
            s.styleName,
            c.barber,
            c.client,
            c.timestamp,
            decodeHairType(c.hairTypeCode),
            c.photoHash,
            c.barberAttested,
            isOver
        );
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "Credential does not exist");
        return _tokenURIs[tokenId];
    }

    /// @notice Get the user's latest credential (most recent cut)
    /// @dev    Iterates all tokens — for large histories use an indexer
    function getLatestCredential(address user)
        external
        view
        returns (uint256 tokenId, uint64 timestamp, string memory styleId)
    {
        uint256 latestId = 0;
        uint64 latestTime = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_owners[i] == user && credentials[i].timestamp > latestTime) {
                latestId = i;
                latestTime = credentials[i].timestamp;
            }
        }
        if (latestId == 0) return (0, 0, "");
        return (latestId, latestTime, _styles[credentials[latestId].styleKey].styleId);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Soulbound Enforcement ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    // All transfers disabled. Credentials are non-transferable.
    // Your hair history is personal — it can't be sold or transferred.

    function transferFrom(address, address, uint256) public pure {
        revert("Style Credentials are soulbound");
    }

    function safeTransferFrom(address, address, uint256) public pure {
        revert("Style Credentials are soulbound");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) public pure {
        revert("Style Credentials are soulbound");
    }

    function approve(address, uint256) public pure {
        revert("Soulbound — no approvals");
    }

    function setApprovalForAll(address, bool) public pure {
        revert("Soulbound — no approvals");
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── ERC-721 Views ──────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    function balanceOf(address user) public view returns (uint256) {
        require(user != address(0), "Zero address");
        return _balances[user];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Credential does not exist");
        return tokenOwner;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    function barberCount() external view returns (uint256) {
        return barberList.length;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd;   // ERC-721
    }

    // ═══════════════════════════════════════════════════════════════════
    // ─── Admin ──────────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    function setCredentialFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be > 0");
        credentialFee = newFee;
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

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── Interface ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}
