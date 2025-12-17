// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract HairdoPayment {
    address public owner;
    IERC20 public constant LSK_TOKEN = IERC20(0xac485391EB2d7D88253a7F1eF18C37f4242D1A24);
    uint256 public serviceFee = 1e18; // 1 LSK token (18 decimals)
    bool public paused;

    mapping(address => uint256) public userPayments;
    mapping(bytes32 => bool) public usedTokens;

    event PaymentReceived(address indexed user, uint256 amount, bytes32 tokenId);
    event ServiceUsed(address indexed user, bytes32 tokenId);
    event FeeUpdated(uint256 newFee);
    event Withdrawn(address indexed recipient, uint256 amount);
    event PausedToggled(bool newState);
    event LSKWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function payForService(bytes32 tokenId) public whenNotPaused {
        require(LSK_TOKEN.transferFrom(msg.sender, address(this), serviceFee), "Insufficient payment or approval");
        require(!usedTokens[tokenId], "Token already used");

        userPayments[msg.sender] += serviceFee;
        usedTokens[tokenId] = true;

        emit PaymentReceived(msg.sender, serviceFee, tokenId);
    }

    function withdraw() public onlyOwner {
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = payable(owner).call{value: ethBalance}("");
            require(success, "ETH Withdrawal failed");
            emit Withdrawn(owner, ethBalance);
        }
    }

    function withdrawLSK() public onlyOwner {
        uint256 lskBalance = LSK_TOKEN.balanceOf(address(this));
        require(lskBalance > 0, "No LSK funds to withdraw");
        require(LSK_TOKEN.transfer(owner, lskBalance), "LSK Withdrawal failed");
        emit LSKWithdrawn(owner, lskBalance);
    }

    function setServiceFee(uint256 newFee) public onlyOwner {
        require(newFee > 0, "Fee must be greater than 0");
        serviceFee = newFee;
        emit FeeUpdated(newFee);
    }

    function togglePause() public onlyOwner {
        paused = !paused;
        emit PausedToggled(paused);
    }

    function getUserBalance(address user) public view returns (uint256) {
        return userPayments[user];
    }

    function isTokenUsed(bytes32 tokenId) public view returns (bool) {
        return usedTokens[tokenId];
    }

    function getLSKBalance() public view returns (uint256) {
        return LSK_TOKEN.balanceOf(address(this));
    }

    function getETHBalance() public view returns (uint256) {
        return address(this).balance;
    }
}