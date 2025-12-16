# Payment System Testing Guide

## Prerequisites

1. Ensure you have deployed the smart contract to Lisk testnet or mainnet
2. Updated the contract address in `lib/contract-config.ts`
3. Have a wallet with some Lisk ETH for testing

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

7. Confirm the payment transaction in your wallet

8. After transaction confirmation, the hairstyle generation should proceed automatically

## Troubleshooting

- If the payment modal doesn't appear, check that your wallet is connected
- If the transaction fails, ensure you have enough Lisk ETH in your wallet
- If the contract interaction fails, verify the contract address in `lib/contract-config.ts`