// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../contracts/HairdoProtocol.sol";

/// @notice Deploys HairdoProtocol.sol to the active track (see foundry.toml:
///         base_sepolia, celo_sepolia, arbitrum_sepolia, or a mainnet endpoint)
/// @dev    Run with:
///         forge script script/Deploy.s.sol:Deploy \
///           --rpc-url base_sepolia \
///           --private-key $DEPLOYER_PRIVATE_KEY \
///           --broadcast \
///           --verify
///
///         The deployer becomes the contract owner. After deployment:
///         1. Run RegisterStyles.s.sol to register all 34 styles
///         2. Set NEXT_PUBLIC_CHAIN + NEXT_PUBLIC_PROTOCOL_ADDRESS(_<chainId>)
///            in the app env (see .env.example)
contract Deploy is Script {
    // Fee-token address — set at redeploy time (retired LSK values kept
    // as placeholders until the track's fee token is chosen)
    // Placeholder mainnet:  0xac485391EB2d7D88253a7F1eF18C37f4242D1A24
    // Placeholder testnet:  0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D
    address constant LSK_TOKEN_SEPOLIA = 0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D;
    address constant LSK_TOKEN_MAINNET = 0xac485391EB2d7D88253a7F1eF18C37f4242D1A24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Use the appropriate fee-token address based on the chain.
        uint256 chainId = block.chainid;
        address lskToken = chainId == 4202
            ? LSK_TOKEN_SEPOLIA
            : LSK_TOKEN_MAINNET;

        console.log("Deploying HairdoProtocol...");
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("LSK token address:", lskToken);

        vm.startBroadcast(deployerPrivateKey);

        HairdoProtocol protocol = new HairdoProtocol(lskToken);

        vm.stopBroadcast();

        console.log("HairdoProtocol deployed at:", address(protocol));
        console.log("Owner:", protocol.owner());
        console.log("Credential fee:", protocol.credentialFee());
        console.log("Min stake:", protocol.MIN_STAKE());

        // Output the address for easy copy-paste
        console.log("=== UPDATE lib/contract-config.ts ===");
        console.log("PROTOCOL_CONTRACT_ADDRESS =", address(protocol));
    }
}
