// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../contracts/HairdoProtocol.sol";

/// @notice Deploys HairdoProtocol.sol to Lisk mainnet or Lisk Sepolia testnet
/// @dev    Run with:
///         forge script script/Deploy.s.sol:Deploy \
///           --rpc-url lisk_sepolia \
///           --private-key $DEPLOYER_PRIVATE_KEY \
///           --broadcast \
///           --verify
///
///         The deployer becomes the contract owner. After deployment:
///         1. Run RegisterStyles.s.sol to register all 34 styles
///         2. Update PROTOCOL_CONTRACT_ADDRESS in lib/contract-config.ts
contract Deploy is Script {
    // LSK ERC-20 token address — mainnet and testnet differ
    // Mainnet:  0xac485391EB2d7D88253a7F1eF18C37f4242D1A24
    // Testnet:  0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D
    address constant LSK_TOKEN_SEPOLIA = 0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D;
    address constant LSK_TOKEN_MAINNET = 0xac485391EB2d7D88253a7F1eF18C37f4242D1A24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Use the appropriate LSK token address based on the chain.
        // Lisk Sepolia = chain ID 4202, Lisk mainnet = chain ID 1135
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
