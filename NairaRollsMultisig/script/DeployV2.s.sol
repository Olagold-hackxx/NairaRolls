// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BatchPayrollMultisig} from "../src/v2/BatchPayrollMultisig.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        BatchPayrollMultisig batchPayrollMultisig = new BatchPayrollMultisig();

        console.log("Batch Payroll Multisig Contract deployed at:", address(batchPayrollMultisig));

        vm.stopBroadcast();
    }
}

// forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify -vvvv

// jq --version
// brew install jq ===> if not installed

// # Create directory first
// mkdir -p extractedABIs

// # Extract the ABI
// jq '.abi' out/BatchPayrollMultisig.sol/BatchPayrollMultisig.json > extractedABIs/BatchPayrollMultisig.json
