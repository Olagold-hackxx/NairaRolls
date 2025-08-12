// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NairaRollsMultisig.sol";

/**
 * @title NairaRolls Multisig Factory
 * @dev Factory contract for deploying NairaRollsMultisig instances with deterministic addresses
 * @author NairaRolls Team
 */
contract NairaRollsMultisigFactory {
    event MultisigDeployed(
        address indexed multisigAddress, address indexed creator, address[] signers, uint256 threshold, bytes32 salt
    );
    event MultisigCreated(
        address indexed multisigAddress,
        address indexed creator,
        string indexed organizationName,
        address[] signers,
        uint256 threshold
    );

    mapping(address => bool) public isMultisigFromFactory;
    mapping(address => MultisigInfo) public multisigInfo;
    mapping(string => address) public organizationToMultisig;

    address[] public deployedMultisigs;
    uint256 public multisigCount;

    struct MultisigInfo {
        address creator;
        string organizationName;
        address[] signers;
        uint256 threshold;
        uint256 deployedAt;
        bool active;
    }

    error InvalidSigners();
    error InvalidThreshold();
    error DuplicateOrganization();
    error EmptyOrganizationName();
    error OrganizationNotFound();
    error NotCreator();
    error MultisigNotActive();

    /**
     * @dev Deploy a new multisig wallet with a deterministic address using CREATE2
     * @param signers Array of signer addresses
     * @param threshold Minimum number of signatures required
     * @param organizationName Unique organization identifier
     * @return multisigAddress Address of the deployed multisig
     */
    function createMultisig(address[] memory signers, uint256 threshold, string memory organizationName)
        external
        returns (address multisigAddress)
    {
        if (bytes(organizationName).length == 0) revert EmptyOrganizationName();
        if (organizationToMultisig[organizationName] != address(0)) revert DuplicateOrganization();
        if (signers.length == 0) revert InvalidSigners();
        if (threshold == 0 || threshold > signers.length) revert InvalidThreshold();

        // Generate salt for CREATE2
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, organizationName, block.timestamp, multisigCount));

        // Deploy the multisig using CREATE2
        multisigAddress = _deployMultisig(signers, threshold, salt);

        multisigInfo[multisigAddress] = MultisigInfo({
            creator: msg.sender,
            organizationName: organizationName,
            signers: signers,
            threshold: threshold,
            deployedAt: block.timestamp,
            active: true
        });

        isMultisigFromFactory[multisigAddress] = true;
        organizationToMultisig[organizationName] = multisigAddress;
        deployedMultisigs.push(multisigAddress);
        multisigCount++;

        emit MultisigCreated(multisigAddress, msg.sender, organizationName, signers, threshold);
        emit MultisigDeployed(multisigAddress, msg.sender, signers, threshold, salt);

        return multisigAddress;
    }

    /**
     * @dev Predict the address of a multisig before deployment
     * @param signers Array of signer addresses
     * @param threshold Minimum number of signatures required
     * @param salt Salt for CREATE2 deployment
     * @return predictedAddress The predicted address
     */
    function predictMultisigAddress(address[] memory signers, uint256 threshold, bytes32 salt)
        external
        view
        returns (address predictedAddress)
    {
        bytes memory bytecode = abi.encodePacked(type(NairaRollsMultisig).creationCode, abi.encode(signers, threshold));

        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));

        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Generate salt for CREATE2 deployment
     * @param creator Address of the creator
     * @param organizationName Organization identifier
     * @param timestamp Deployment timestamp
     * @param nonce Deployment nonce
     * @return salt Generated salt
     */
    function generateSalt(address creator, string memory organizationName, uint256 timestamp, uint256 nonce)
        external
        pure
        returns (bytes32 salt)
    {
        return keccak256(abi.encodePacked(creator, organizationName, timestamp, nonce));
    }

    /**
     * @dev Deactivate a multisig (only by creator)
     * @param multisigAddress Address of the multisig to deactivate
     */
    function deactivateMultisig(address multisigAddress) external {
        if (!isMultisigFromFactory[multisigAddress]) revert OrganizationNotFound();
        if (multisigInfo[multisigAddress].creator != msg.sender) revert NotCreator();
        if (!multisigInfo[multisigAddress].active) revert MultisigNotActive();

        multisigInfo[multisigAddress].active = false;
    }

    /**
     * @dev Reactivate a multisig (only by creator)
     * @param multisigAddress Address of the multisig to reactivate
     */
    function reactivateMultisig(address multisigAddress) external {
        if (!isMultisigFromFactory[multisigAddress]) revert OrganizationNotFound();
        if (multisigInfo[multisigAddress].creator != msg.sender) revert NotCreator();
        if (multisigInfo[multisigAddress].active) revert("Already active");

        multisigInfo[multisigAddress].active = true;
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Get all deployed multisigs
     * @return Array of multisig addresses
     */
    function getAllMultisigs() external view returns (address[] memory) {
        return deployedMultisigs;
    }

    /**
     * @dev Get active multisigs only
     * @return activeMultisigs Array of active multisig addresses
     */
    function getActiveMultisigs() external view returns (address[] memory activeMultisigs) {
        uint256 activeCount = 0;

        // Count active multisigs
        for (uint256 i = 0; i < deployedMultisigs.length; i++) {
            if (multisigInfo[deployedMultisigs[i]].active) {
                activeCount++;
            }
        }

        // Create array of active multisigs
        activeMultisigs = new address[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < deployedMultisigs.length; i++) {
            if (multisigInfo[deployedMultisigs[i]].active) {
                activeMultisigs[currentIndex] = deployedMultisigs[i];
                currentIndex++;
            }
        }

        return activeMultisigs;
    }

    /**
     * @dev Get multisigs created by a specific address
     * @param creator Address of the creator
     * @return creatorMultisigs Array of multisig addresses created by the address
     */
    function getMultisigsByCreator(address creator) external view returns (address[] memory creatorMultisigs) {
        uint256 count = 0;

        // Count multisigs by creator
        for (uint256 i = 0; i < deployedMultisigs.length; i++) {
            if (multisigInfo[deployedMultisigs[i]].creator == creator) {
                count++;
            }
        }

        // Create array of creator's multisigs
        creatorMultisigs = new address[](count);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < deployedMultisigs.length; i++) {
            if (multisigInfo[deployedMultisigs[i]].creator == creator) {
                creatorMultisigs[currentIndex] = deployedMultisigs[i];
                currentIndex++;
            }
        }

        return creatorMultisigs;
    }

    /**
     * @dev Get detailed information about a multisig
     * @param multisigAddress Address of the multisig
     * @return info MultisigInfo struct containing all details
     */
    function getMultisigInfo(address multisigAddress) external view returns (MultisigInfo memory info) {
        if (!isMultisigFromFactory[multisigAddress]) revert OrganizationNotFound();
        return multisigInfo[multisigAddress];
    }

    /**
     * @dev Get multisig address by organization name
     * @param organizationName Name of the organization
     * @return multisigAddress Address of the multisig
     */
    function getMultisigByOrganization(string memory organizationName) external view returns (address) {
        address multisigAddress = organizationToMultisig[organizationName];
        if (multisigAddress == address(0)) revert OrganizationNotFound();
        return multisigAddress;
    }

    /**
     * @dev Check if an address is a multisig deployed by this factory
     * @param multisigAddress Address to check
     * @return bool True if deployed by this factory
     */
    function isFactoryMultisig(address multisigAddress) external view returns (bool) {
        return isMultisigFromFactory[multisigAddress];
    }

    /**
     * @dev Get the total number of deployed multisigs
     * @return uint256 Total count
     */
    function getTotalMultisigs() external view returns (uint256) {
        return multisigCount;
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Internal function to deploy multisig using CREATE2
     * @param signers Array of signer addresses
     * @param threshold Minimum number of signatures required
     * @param salt Salt for CREATE2 deployment
     * @return multisigAddress Address of the deployed multisig
     */
    function _deployMultisig(address[] memory signers, uint256 threshold, bytes32 salt)
        internal
        returns (address multisigAddress)
    {
        bytes memory bytecode = abi.encodePacked(type(NairaRollsMultisig).creationCode, abi.encode(signers, threshold));

        assembly {
            multisigAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(multisigAddress)) { revert(0, 0) }
        }

        return multisigAddress;
    }
}
