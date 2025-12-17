# Payment System Testing Guide

## Prerequisites

1. Ensure you have the correct contract address in `lib/contract-config.ts`
2. Have a wallet with some Lisk ETH for testing
3. Local development server running

## Testing Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Connect your wallet using the ConnectKit button

4. Upload an image using the upload area

5. Select a hairstyle, shade, and color

6. Click "Create hairstyle" - you should now see the payment modal

7. First, approve the contract to spend your LSK tokens when prompted
   - This requires one transaction to approve the spending

8. Then confirm the payment transaction in your wallet (costs 1 LSK)
   - This is the second transaction that completes the payment

9. After transaction confirmation, the hairstyle generation should proceed automatically

## Contract Admin Functions (Owner Only)

If you're the contract owner, you can test these additional functions:

1. **Update Service Fee**:
   - Call `setServiceFee(uint256 newFee)` with a new fee value (in wei)
   - Example: `setServiceFee(1000000000000000000)` for 1 LISK (1 ether)

2. **Pause/Unpause Contract**:
   - Call `togglePause()` to pause or unpause the contract
   - When paused, no new payments can be processed

3. **Withdraw Funds**:
   - Call `withdraw()` to transfer all contract funds to the owner's address

## Troubleshooting

- If the payment modal doesn't appear, check that your wallet is connected
- If the transaction fails, ensure you have enough Lisk ETH in your wallet
- If the contract interaction fails, verify the contract address in `lib/contract-config.ts`
- Check the browser console for any error messages
- Verify that the contract is not paused (check the `paused` public variable)

## Contract Verification

The contract is verified on both:
- [Blockscout Lisk Explorer](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- [Sourcify](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)