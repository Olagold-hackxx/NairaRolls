// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title BatchPayrollMultisig
/// @notice Per-batch multisig payrolls identified by a unique batch name (string).
contract BatchPayrollMultisig {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant TRANSACTION_EXPIRY = 30 days;

    // token used for payroll (cNGN)
    IERC20 public constant cNGN = IERC20(0xa1F8BD1892C85746AE71B97C31B1965C4641f1F0);

    // --- Events ---
    event BatchCreated(string indexed batchName, address indexed creator, uint256 expiresAt);
    event BatchPaymentSubmitted(string indexed batchName, address[] recipients, uint256[] amounts);
    event BatchSignerAdded(string indexed batchName, address signer);
    event BatchApproved(string indexed batchName, address indexed approver);
    event BatchRevoked(string indexed batchName, address indexed revoker);
    event BatchExecuted(string indexed batchName, address executor);
    event BatchCancelled(string indexed batchName, address indexed initiator);
    event TokenDeposit(address indexed sender, uint256 amount, address indexed token);
    event EthDeposit(address indexed sender, uint256 amount);

    // --- Errors (gas efficient) ---
    error BatchAlreadyExists();
    error BatchNotFound();
    error InvalidBatchName();
    error InvalidSigners();
    error InvalidQuorum();
    error DuplicateSigner();
    error CreatorNotInSigners();
    error ArrayMismatch();
    error InvalidBatchSize();
    error InsufficientBalance();
    error NotBatchSigner();
    error AlreadyApproved();
    error NotApproved();
    error InsufficientApprovals();
    error BatchFinalized();
    error BatchExpired();
    error AlreadyExecuted();
    error AlreadyCancelled();

    // --- Batch structure ---
    struct Batch {
        string name;
        address creator;
        address[] signers;
        uint256 quorum;
        address[] recipients;
        uint256[] amounts;
        mapping(address => bool) isSigner;
        mapping(address => bool) approvals;
        bool executed;
        bool cancelled;
        uint256 approvalCount;
        uint256 submittedAt;
        uint256 expiresAt;
        bool exists;
    }

    // mapping by batchName (string)
    mapping(string => Batch) internal batches;
    // list of batch names for enumeration (frontend-friendly)
    string[] public batchNames;

    // --- Constructor: empty on purpose ---
    constructor() {}

    // --- Deposits ---
    function deposit(uint256 amount) external {
        if (amount == 0) revert();
        cNGN.safeTransferFrom(msg.sender, address(this), amount);
        emit TokenDeposit(msg.sender, amount, address(cNGN));
    }

    receive() external payable {
        emit EthDeposit(msg.sender, msg.value);
    }

    // --- Create Batch Payroll ---
    /// @notice Create a new named batch payroll with its own signers & quorum.
    /// @dev Creator MUST be one of the signers. Batch name must be unique.
    function createBatchPayroll(
        string calldata batchName,
        address[] calldata signers,
        uint256 quorum,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        if (bytes(batchName).length == 0) revert InvalidBatchName();
        if (batches[batchName].exists) revert BatchAlreadyExists();
        if (signers.length == 0) revert InvalidSigners();
        if (quorum == 0 || quorum > signers.length) revert InvalidQuorum();
        if (recipients.length != amounts.length) revert ArrayMismatch();
        if (recipients.length == 0 || recipients.length > MAX_BATCH_SIZE) revert InvalidBatchSize();

        // Prevent duplicate signers and build signer mapping
        // Also ensure creator is one of the signers
        bool creatorIncluded = false;
        // Use a temporary memory mapping to detect duplicates (cheap loop + check)
        // Since solidity doesn't support memory mapping, detect duplicates via nested loop (acceptable for reasonable signer counts)
        for (uint256 i = 0; i < signers.length; i++) {
            address s = signers[i];
            if (s == address(0)) revert InvalidSigners();
            // duplicate detection
            for (uint256 j = i + 1; j < signers.length; j++) {
                if (s == signers[j]) revert DuplicateSigner();
            }
            if (s == msg.sender) creatorIncluded = true;
        }
        if (!creatorIncluded) revert CreatorNotInSigners();

        // Validate recipients & amounts and compute total required
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            address r = recipients[i];
            if (r == address(0)) revert InvalidBatchName(); // reuse error for invalid address
            uint256 a = amounts[i];
            if (a == 0) revert InvalidBatchSize(); // reuse for invalid amount
            totalRequired += a;
        }

        // Ensure contract has enough token balance to satisfy batch
        if (cNGN.balanceOf(address(this)) < totalRequired) revert InsufficientBalance();

        // Create batch in storage
        Batch storage b = batches[batchName];
        b.name = batchName;
        b.creator = msg.sender;
        b.quorum = quorum;
        b.submittedAt = block.timestamp;
        b.expiresAt = block.timestamp + TRANSACTION_EXPIRY;
        b.executed = false;
        b.cancelled = false;
        b.approvalCount = 0;
        b.exists = true;

        // store signers and populate isSigner mapping
        for (uint256 i = 0; i < signers.length; i++) {
            address s = signers[i];
            b.signers.push(s);
            b.isSigner[s] = true;
            emit BatchSignerAdded(batchName, s);
        }

        // store recipients & amounts
        for (uint256 i = 0; i < recipients.length; i++) {
            b.recipients.push(recipients[i]);
            b.amounts.push(amounts[i]);
        }

        // add to batchNames for enumeration
        batchNames.push(batchName);

        emit BatchPaymentSubmitted(batchName, recipients, amounts);
        emit BatchCreated(batchName, msg.sender, b.expiresAt);

        // auto-approve by creator
        _approveBatchInternal(batchName, msg.sender);
    }

    // --- Internal approve helper ---
    function _approveBatchInternal(string calldata batchName, address approver) internal {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        if (b.executed || b.cancelled) revert BatchFinalized();
        if (block.timestamp > b.expiresAt) revert BatchExpired();
        if (!b.isSigner[approver]) revert NotBatchSigner();
        if (b.approvals[approver]) revert AlreadyApproved();

        b.approvals[approver] = true;
        b.approvalCount += 1;
        emit BatchApproved(batchName, approver);
    }

    // --- Approve / Revoke ---
    function approveBatch(string calldata batchName) external {
        if (!batches[batchName].exists) revert BatchNotFound();
        _approveBatchInternal(batchName, msg.sender);
    }

    function revokeBatchApproval(string calldata batchName) external {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        if (b.executed || b.cancelled) revert BatchFinalized();
        if (block.timestamp > b.expiresAt) revert BatchExpired();
        if (!b.isSigner[msg.sender]) revert NotBatchSigner();
        if (!b.approvals[msg.sender]) revert NotApproved();

        b.approvals[msg.sender] = false;
        b.approvalCount -= 1;
        emit BatchRevoked(batchName, msg.sender);
    }

    // --- Execute batch payroll ---
    function executeBatchPayroll(string calldata batchName) external {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        if (b.executed) revert AlreadyExecuted();
        if (b.cancelled) revert AlreadyCancelled();
        if (block.timestamp > b.expiresAt) revert BatchExpired();
        if (b.approvalCount < b.quorum) revert InsufficientApprovals();

        // mark executed first to prevent reentrancy / double spends
        b.executed = true;

        // perform transfers
        for (uint256 i = 0; i < b.recipients.length; i++) {
            address to = b.recipients[i];
            uint256 amt = b.amounts[i];
            cNGN.safeTransfer(to, amt);
        }

        emit BatchExecuted(batchName, msg.sender);
    }

    // --- Cancel batch ---
    /// @notice Cancel a batch. If within expiresAt, require caller to have approved to avoid arbitrary cancels.
    function cancelBatch(string calldata batchName) external {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        if (b.executed) revert AlreadyExecuted();
        if (b.cancelled) revert AlreadyCancelled();

        if (block.timestamp <= b.expiresAt) {
            // require caller to be an approver to cancel early
            if (!b.approvals[msg.sender] || b.approvalCount == 0) revert NotApproved();
        }

        b.cancelled = true;
        emit BatchCancelled(batchName, msg.sender);
    }

    // --- View / Query Helpers ---

    /// @notice Return total number of batches created
    function getBatchCount() external view returns (uint256) {
        return batchNames.length;
    }

    /// @notice Return all batch names (careful: can be large). Useful if frontend doesn't track IDs.
    function getAllBatchNames() external view returns (string[] memory) {
        return batchNames;
    }

    /// @notice Get batch details by name (including recipients & amounts)
    function getBatchDetails(string calldata batchName)
        external
        view
        returns (
            string memory name,
            address creator,
            address[] memory signers,
            uint256 quorum,
            address[] memory recipients,
            uint256[] memory amounts,
            bool executed,
            bool cancelled,
            uint256 approvalCount,
            uint256 submittedAt,
            uint256 expiresAt
        )
    {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();

        return (
            b.name,
            b.creator,
            b.signers,
            b.quorum,
            b.recipients,
            b.amounts,
            b.executed,
            b.cancelled,
            b.approvalCount,
            b.submittedAt,
            b.expiresAt
        );
    }

    /// @notice Get signers for a batch
    function getBatchSigners(string calldata batchName) external view returns (address[] memory) {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        return b.signers;
    }

    /// @notice Get approval count for batch
    function getBatchApprovalCount(string calldata batchName) external view returns (uint256) {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        return b.approvalCount;
    }

    /// @notice Has this signer approved the named batch?
    function hasApprovedBatch(string calldata batchName, address signer) external view returns (bool) {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        return b.approvals[signer];
    }

    /// @notice Check if a given address is a signer for the batch
    function isBatchSigner(string calldata batchName, address signer) external view returns (bool) {
        Batch storage b = batches[batchName];
        if (!b.exists) revert BatchNotFound();
        return b.isSigner[signer];
    }

    /// @notice Is the batch currently executable (quorum reached, not expired/cancelled/executed)?
    function isBatchExecutable(string calldata batchName) external view returns (bool) {
        Batch storage b = batches[batchName];
        if (!b.exists) return false;
        return (!b.executed && !b.cancelled && b.approvalCount >= b.quorum && block.timestamp <= b.expiresAt);
    }
}
