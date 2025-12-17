// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract HairdoPayment {
    address public owner;
    uint256 public serviceFee = 0.001 ether;
    bool public paused;
    
    mapping(address => uint256) public userPayments;
    mapping(bytes32 => bool) public usedTokens;
    
    event PaymentReceived(address indexed user, uint256 amount, bytes32 tokenId);
    event ServiceUsed(address indexed user, bytes32 tokenId);
    event FeeUpdated(uint256 newFee);
    event Withdrawn(address indexed recipient, uint256 amount);
    event PausedToggled(bool newState);
    
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
    
    function payForService(bytes32 tokenId) public payable whenNotPaused {
        require(msg.value >= serviceFee, "Insufficient payment");
        require(!usedTokens[tokenId], "Token already used");
        
        userPayments[msg.sender] += msg.value;
        usedTokens[tokenId] = true;
        
        emit PaymentReceived(msg.sender, msg.value, tokenId);
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawn(owner, balance);
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
}