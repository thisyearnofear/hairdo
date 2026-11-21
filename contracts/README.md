# Hairdo Smart Contracts

- `HairdoProtocol.sol` — the onchain trust graph: style registry, soulbound
  Style Credentials, barber registry, cut attestation, trust score,
  staking/slashing, growth tracking.
- `HairdoPayment.sol` — retired proof-of-concept (kept for reference only;
  its frontend flow was removed).

## Deployment

Deploy with Foundry to the active track (endpoints in `foundry.toml`:
`base_sepolia`, `celo_sepolia`, `arbitrum_sepolia`, or a mainnet endpoint):

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

Then register the 34 styles and wire the app env:

```bash
forge script script/RegisterStyles.s.sol:RegisterStyles \
  --rpc-url base_sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --sig "run(address)" \
  -- <PROTOCOL_ADDRESS>
```

```bash
NEXT_PUBLIC_CHAIN=base-sepolia
NEXT_PUBLIC_PROTOCOL_ADDRESS_84532=<PROTOCOL_ADDRESS>
```

(Lisk was the original deployment target; it shut down with no users and
no history, so all Lisk references were removed.)
