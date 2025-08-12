// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import {Script} from "forge-std/Script.sol";
// import {console} from "forge-std/console.sol";
// import {NairaRollsMultisig} from "../src/NairaRollsMultisig.sol";

// contract DeployScript is Script {
//     function run() external {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         vm.startBroadcast(deployerPrivateKey);

//         Registry registry = new NairaRollsMultisig();

//         console.log("Registry deployed at:", address(registry));

//         vm.stopBroadcast();
//     }
// }
