// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../contracts/HairdoProtocol.sol";

/// @notice Registers all 34 styles from data/styles.json onchain
/// @dev    Run AFTER Deploy.s.sol, with the deployed protocol address:
///
///         forge script script/RegisterStyles.s.sol:RegisterStyles \
///           --rpc-url lisk \
///           --private-key $DEPLOYER_PRIVATE_KEY \
///           --broadcast \
///           --sig "run(address)" \
///           -- <PROTOCOL_ADDRESS>
///
///         Or set PROTOCOL_ADDRESS env var and run without args.
contract RegisterStyles is Script {
    function run(address protocolAddress) external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        HairdoProtocol protocol = HairdoProtocol(protocolAddress);
        require(protocol.owner() == vm.addr(deployerPrivateKey), "Not the owner");

        console.log("Registering 34 styles on HairdoProtocol...");
        console.log("Protocol:", protocolAddress);
        console.log("Current style count:", protocol.styleCount());

        vm.startBroadcast(deployerPrivateKey);

        // ─── 34 styles from data/styles.json ────────────────────────────
        // Fades
        protocol.registerStyle("skin-fade", "Skin Fade", 7);
        protocol.registerStyle("low-fade", "Low Fade", 14);
        protocol.registerStyle("mid-fade", "Mid Fade", 14);
        protocol.registerStyle("high-fade", "High Fade", 7);
        protocol.registerStyle("burst-fade", "Burst Fade", 14);
        protocol.registerStyle("taper-fade", "Taper Fade", 14);
        protocol.registerStyle("temp-fade", "Temp Fade / Temple Fade", 14);
        protocol.registerStyle("shadow-fade", "Shadow Fade", 14);

        // Short styles
        protocol.registerStyle("afro", "Afro", 30);
        protocol.registerStyle("short-afro", "Short Afro / TWA", 30);
        protocol.registerStyle("buzz-cut", "Buzz Cut", 30);
        protocol.registerStyle("crew-cut", "Crew Cut", 30);
        protocol.registerStyle("caesar-cut", "Caesar Cut", 30);
        protocol.registerStyle("line-up", "Line Up / Shape Up", 7);
        protocol.registerStyle("bald", "Clean Shave / Bald", 7);
        protocol.registerStyle("waves", "360 Waves", 14);

        // Braids & twists
        protocol.registerStyle("cornrows", "Cornrows", 21);
        protocol.registerStyle("box-braids", "Box Braids", 42);
        protocol.registerStyle("twists", "Two-Strand Twists", 14);
        protocol.registerStyle("sponge-twists", "Sponge Twists / Nubian Twists", 30);
        protocol.registerStyle("twist-out", "Twist Out", 30);

        // Locs
        protocol.registerStyle("dreadlocks", "Dreadlocks / Locs", 30);
        protocol.registerStyle("short-locs", "Short Locs / Starter Locs", 30);
        protocol.registerStyle("freeform-locs", "Freeform Locs", 90);

        // Fade + curl combos
        protocol.registerStyle("fade-with-curls", "Fade with Curly Top", 14);
        protocol.registerStyle("high-top-fade", "High-Top Fade", 14);
        protocol.registerStyle("curly-fade", "Curly Fade with Volume", 14);

        // Textured / modern
        protocol.registerStyle("textured-crop", "Textured Crop", 21);
        protocol.registerStyle("mohawk-fade", "Mohawk Fade", 14);
        protocol.registerStyle("fauxhawk", "Faux Hawk", 21);
        protocol.registerStyle("slick-back", "Slick Back with Fade", 21);
        protocol.registerStyle("undercut", "Undercut", 21);
        protocol.registerStyle("low-taper-textured-top", "Low Taper with Textured Top", 21);
        protocol.registerStyle("jheri-curl", "Jheri Curl (Modern)", 30);

        vm.stopBroadcast();

        console.log("=== Registration complete ===");
        console.log("Total styles registered:", protocol.styleCount());
        require(protocol.styleCount() == 34, "Expected 34 styles");

        // Verify a few
        (string memory name, uint16 maintDays, bool exists) = protocol.getStyle("skin-fade");
        console.log("Verify skin-fade:", name, maintDays, exists);
        (name, maintDays, exists) = protocol.getStyle("freeform-locs");
        console.log("Verify freeform-locs:", name, maintDays, exists);
    }

    /// @notice Alternative entry point that reads PROTOCOL_ADDRESS from env
    function run() external {
        address protocolAddress = vm.envAddress("PROTOCOL_ADDRESS");
        this.run(protocolAddress);
    }
}
