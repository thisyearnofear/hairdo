# Web3 Integration

## Stack

✅ **Wagmi v3** - React hooks for Ethereum
✅ **Viem** - TypeScript Ethereum library
✅ **Custom ConnectButton** - Wallet connection UI (replaces ConnectKit)
✅ **Lisk Mainnet** - Configured as primary chain

## Configuration

### Lisk Mainnet Details
- **Chain ID**: 1135
- **RPC**: https://rpc.api.lisk.com
- **Explorer**: https://blockscout.lisk.com
- **Currency**: ETH

### Files
- `lib/chains.ts` - Lisk chain configuration
- `lib/wagmi-config.ts` - Wagmi v3 config (chains, connectors, transports)
- `components/Web3Provider.tsx` - Wagmi + React Query provider
- `components/ConnectButton.tsx` - Custom wallet connect/disconnect button
- `components/Header.tsx` - Renders ConnectButton in header

## Usage

Users can:
1. Click "Connect Wallet" in the header
2. Connect via injected wallet (MetaMask) or WalletConnect
3. Automatically switch to Lisk mainnet
4. Use the app onchain

## Wagmi v3 Hooks

The app uses the wagmi v3 hook API:
- `useConnection()` - connected address, chain, status (replaces deprecated `useAccount()`)
- `useChains()` - configured chains (replaces `useConfig().chains`)
- `useSwitchChain()` - switch network (use `mutate` / `mutateAsync`)
- `useWriteContract()` - write to smart contracts
- `useReadContract()` - read from smart contracts
- `useWaitForTransactionReceipt()` - wait for tx confirmation
