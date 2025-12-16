# Hairdo Payment Smart Contract

This directory contains the smart contract for processing payments on the Lisk blockchain for the Hairdo service.

## Contract Deployment

1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create a new file named `HairdoPayment.sol`
3. Copy the contents of `contracts/HairdoPayment.sol` into the new file
4. Compile the contract using Solidity compiler version 0.8.0 or higher
5. Deploy the contract to the Lisk network using the "Deploy & Run Transactions" tab
6. After deployment, copy the contract address
7. Update the `CONTRACT_ADDRESS` in `lib/contract-config.ts` with the deployed address

## Contract Functions

- `payForService(bytes32 tokenId)`: Pay the service fee (0.001 ETH) to generate a hairstyle
- `isTokenUsed(bytes32 tokenId)`: Check if a token has been used
- `getUserBalance(address user)`: Get the total amount paid by a user
- `withdraw()`: Owner-only function to withdraw funds from the contract

## Integration with Frontend

The frontend uses wagmi hooks to interact with the smart contract:
- `useWriteContract`: To initiate payment transactions
- `useWaitForTransactionReceipt`: To wait for transaction confirmation

## Security Notes

- Each tokenId can only be used once
- Only the contract owner can withdraw funds
- The service fee is hardcoded to 0.001 ETH (very cheap)