// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {NairaRollsMultisigFactory} from "../src/NairaRollsMultisigFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        NairaRollsMultisigFactory nairaRollsMultisigFactory = new NairaRollsMultisigFactory();

        console.log("NairaRolls Multisig Factory deployed at:", address(nairaRollsMultisigFactory));

        vm.stopBroadcast();
    }
}

// forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify -vvvv

// jq --version
// brew install jq ===> if not installed

// # Create directory first
// mkdir -p extractedABIs

// # Extract the ABI
// jq '.abi' out/NairaRollsMultisig.sol/NairaRollsMultisig.json > extractedABIs/NairaRollsMultisig.json

// # Also extract factory ABI
// jq '.abi' out/NairaRollsMultisigFactory.sol/NairaRollsMultisigFactory.json > extractedABIs/NairaRollsMultisigFactory.json
