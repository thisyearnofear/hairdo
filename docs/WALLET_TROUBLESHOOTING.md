# Wallet Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. WalletConnect Project ID Missing
**Symptoms**: Wallet connection fails immediately, console shows "projectId not found" errors
**Solution**: 
- Get a WalletConnect project ID from https://cloud.walletconnect.com
- Add it to your `.env.local` file:
  ```
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
  ```
- Restart your development server

### 2. Origin Mismatch Errors
**Symptoms**: Console shows "origins don't match" errors
**Solution**:
- These are usually harmless warnings from browser extensions
- They don't prevent wallet connections from working
- If they cause issues, try disabling browser extensions temporarily

### 3. Ethereum Provider Conflicts
**Symptoms**: "Cannot set property ethereum" errors
**Solution**:
- This happens when multiple wallet extensions try to inject their providers
- Disable all but one wallet extension in your browser
- Try using MetaMask as it's widely supported

### 4. Network Issues
**Symptoms**: Transactions fail or hang indefinitely
**Solution**:
- Ensure your wallet is on the active track (`NEXT_PUBLIC_CHAIN`)
- The app targets the active chain automatically — check the mint UI
  for the expected network name
- Make sure you have sufficient native tokens for gas fees

## Debugging Steps

1. **Check Browser Console**: Look for specific error messages
2. **Verify Environment Variables**: Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
3. **Test with Different Wallets**: Try MetaMask, Coinbase Wallet, etc.
4. **Clear Browser Data**: Clear cache and localStorage for the site
5. **Try Incognito Mode**: Eliminate extension conflicts

## Supported Wallets

- MetaMask (recommended)
- Coinbase Wallet
- Trust Wallet
- Other WalletConnect-compatible wallets

## Network Configuration

No manual setup needed — the app targets the env-selected track
(`NEXT_PUBLIC_CHAIN`) automatically. If your wallet prompts for a network
switch, approve it.

## Still Having Issues?

1. Check the browser console for specific error messages
2. Verify all environment variables are correctly set
3. Ensure the smart contract is deployed and accessible
4. Contact support with detailed error messages and steps to reproduce