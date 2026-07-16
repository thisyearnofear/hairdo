// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../contracts/HairdoProtocol.sol";

/// @notice Deploys HairdoProtocol.sol to Lisk mainnet (or testnet)
/// @dev    Run with:
///         forge script script/Deploy.s.sol:Deploy \
///           --rpc-url lisk \
///           --private-key $DEPLOYER_PRIVATE_KEY \
///           --broadcast \
///           --verify
///
///         The deployer becomes the contract owner. After deployment:
///         1. Run RegisterStyles.s.sol to register all 34 styles
///         2. Update PROTOCOL_CONTRACT_ADDRESS in lib/contract-config.ts
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying HairdoProtocol...");
        console.log("Deployer:", deployer);
        console.log("Deployer LSK balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        HairdoProtocol protocol = new HairdoProtocol();

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
