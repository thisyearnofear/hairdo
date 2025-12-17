# Hairdo Payment Smart Contract

This directory contains the smart contract for processing payments on the Lisk blockchain for the Hairdo service.

## Contract Details

- **Address**: [0x7Cc87B3717973D2fF477515C790859180F5139f0](https://blockscout.lisk.com/address/0x7Cc87B3717973D2fF477515C790859180F5139f0)
- **Network**: Lisk (Chain ID: 1135)
- **Solidity Version**: ^0.8.27
- **Verified on Sourcify**: [View on Sourcify](https://repo.sourcify.dev/1135/0x7Cc87B3717973D2fF477515C790859180F5139f0/)

## Contract Features

- **Mutable serviceFee**: Owner can adjust the service fee using `setServiceFee()` function
- **Pause mechanism**: Owner can pause/unpause the contract using `togglePause()`
- **Safer withdrawal**: Uses `.call{}()` instead of `.transfer()` for withdrawals
- **Events**: Emits events for fee changes, withdrawals, and pause toggles
- **Security**: Each tokenId can only be used once

## Contract Functions

- `payForService(bytes32 tokenId)`: Pay the service fee to generate a hairstyle
- `isTokenUsed(bytes32 tokenId)`: Check if a token has been used
- `getUserBalance(address user)`: Get the total amount paid by a user
- `setServiceFee(uint256 newFee)`: Owner-only function to update the service fee
- `togglePause()`: Owner-only function to pause/unpause the contract
- `withdraw()`: Owner-only function to withdraw funds from the contract

## Integration with Frontend

The frontend uses wagmi hooks to interact with the smart contract:
- `useWriteContract`: To initiate payment transactions
- `useWaitForTransactionReceipt`: To wait for transaction confirmation

## Security Notes

- Each tokenId can only be used once
- Only the contract owner can withdraw funds, update fees, or pause the contract
- The default service fee is 0.001 ETH (very cheap)
- The contract can be paused by the owner in case of emergencies