# Troubleshooting Wallet Connection Issues

## Common Issues and Solutions

### 1. WalletConnect Project ID Not Set
**Problem**: The `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable is missing or empty.
**Solution**: 
- Go to https://cloud.walletconnect.com and create a new project
- Copy your Project ID
- Add it to your `.env.local` file:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```
- Restart your development server

### 2. Wallet Not Connected
**Problem**: The optional onchain mint is unavailable.
**Solution**:
- The core flow (recommendations, try-on, saving) needs no wallet at all
- For minting, connect your wallet using the Connect button in the header
- Use any EVM wallet (MetaMask, Coinbase Wallet, MiniPay via WalletConnect, etc.)

### 3. No Image Selected
**Problem**: The button is disabled or shows an error.
**Solution**:
- Make sure you've either uploaded a photo or taken a selfie
- The button should be enabled when an image is selected

### 4. Wallet Connecting State
**Problem**: The button shows "Connecting Wallet..."
**Solution**:
- Wait for the wallet connection to complete
- Check your wallet extension for connection prompts
- If stuck, refresh the page and try connecting again

## Debug Information

The configuration panel now shows debug information:
- **Image**: Whether an image has been selected
- **Wallet**: Connection status (Connected/Connecting/Not connected)
- **Payment**: Whether payment has been completed

## Error Messages

Common error messages and their meanings:
- "Please select an image first": You need to upload a photo or take a selfie
- "Please connect your wallet first": Click the wallet button in the header to connect
- "Wallet is connecting, please wait...": Wait for the wallet connection to complete
- "Failed to create hairstyle": There was an API error, try again

## Network Requirements

Onchain minting targets the env-selected track (`NEXT_PUBLIC_CHAIN`:
`base-sepolia` by default, plus `base`, `celo-sepolia`, `celo`,
`arbitrum-sepolia`, `arbitrum-one`). The app auto-targets the active
chain — no manual network setup needed.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with wallet support
- Desktop browsers with wallet extensions