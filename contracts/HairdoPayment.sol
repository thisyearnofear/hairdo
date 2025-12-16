// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HairdoPayment {
    address public owner;
    uint256 public constant SERVICE_FEE = 0.001 ether; // Very cheap service fee
    mapping(address => uint256) public userPayments;
    mapping(bytes32 => bool) public usedTokens;
    
    event PaymentReceived(address indexed user, uint256 amount, bytes32 tokenId);
    event ServiceUsed(address indexed user, bytes32 tokenId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Pay for the service
    function payForService(bytes32 tokenId) public payable {
        require(msg.value >= SERVICE_FEE, "Insufficient payment");
        require(!usedTokens[tokenId], "Token already used");
        
        userPayments[msg.sender] += msg.value;
        usedTokens[tokenId] = true;
        
        emit PaymentReceived(msg.sender, msg.value, tokenId);
    }
    
    // Withdraw funds (only owner)
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Get user payment balance
    function getUserBalance(address user) public view returns (uint256) {
        return userPayments[user];
    }
    
    // Check if a token has been used
    function isTokenUsed(bytes32 tokenId) public view returns (bool) {
        return usedTokens[tokenId];
    }
}