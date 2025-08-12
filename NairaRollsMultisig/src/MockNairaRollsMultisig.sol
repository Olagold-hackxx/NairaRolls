// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title NairaRolls Multisig Wallet for Payroll on Base Sepolia
 * @dev A multisignature wallet optimized for payroll operations using cNGN tokens
 * @author NairaRolls Team
 */
contract NairaRollsMultisig {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant TRANSACTION_EXPIRY = 30 days;

    event TransactionSubmitted(
        uint256 indexed txId, address indexed submitter, address target, uint256 value, bytes data, uint256 expiresAt
    );
    event TransactionApproved(uint256 indexed txId, address indexed approver);
    event TransactionRevoked(uint256 indexed txId, address indexed revoker);
    event TransactionExecuted(uint256 indexed txId, address indexed executor, bool success);
    event TransactionExpired(uint256 indexed txId);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdChanged(uint256 newThreshold);
    event TokenDeposit(address indexed sender, uint256 amount, address indexed token);
    event EthDeposit(address indexed sender, uint256 amount);
    event TokenWithdrawal(address indexed recipient, uint256 amount, address indexed token);
    event BatchPaymentSubmitted(uint256 indexed txId, address[] recipients, uint256[] amounts);
    event EmergencyStop(bool paused, address indexed initiator);

    struct Transaction {
        address target;
        uint256 value;
        bytes data;
        bool executed;
        bool cancelled;
        uint256 approvalCount;
        uint256 submittedAt;
        uint256 expiresAt;
        mapping(address => bool) approvals;
    }

    // State Variables
    IERC20 public immutable cNGN; // Changed to immutable, set in constructor

    address[] public signers;
    mapping(address => bool) public isSigner;
    mapping(address => uint256) public signerIndex;

    uint256 public threshold;
    uint256 public nonce;
    mapping(uint256 => Transaction) internal transactions;

    bool public paused;
    uint256 public pauseVotes;
    mapping(address => bool) public pauseVoters;

    // Custom errors
    error NotSigner();
    error ContractPaused();
    error TransactionNotFound();
    error TransactionFinalized();
    error TransactionHasExpired();
    error InvalidSigner();
    error DuplicateSigner();
    error InvalidThreshold();
    error InvalidAmount();
    error InsufficientBalance();
    error ArrayMismatch();
    error InvalidBatchSize();
    error AlreadyApproved();
    error NotApproved();
    error InsufficientApprovals();
    error OnlyMultisig();
    error AlreadyPaused();
    error NotPaused();
    error AlreadyVoted();
    error MustVotePauseFirst();

    // Modifiers
    modifier onlySigner() {
        if (!isSigner[msg.sender]) revert NotSigner();
        _;
    }

    modifier notPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier validTransaction(uint256 txId) {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        Transaction storage txn = transactions[txId];
        if (txn.executed || txn.cancelled) revert TransactionFinalized();
        if (block.timestamp > txn.expiresAt) revert TransactionHasExpired();
        _;
    }

    // Constructor
    constructor(address[] memory _signers, uint256 _threshold, address _cNGN) {
        if (_signers.length == 0) revert InvalidSigner();
        if (_threshold == 0 || _threshold > _signers.length) revert InvalidThreshold();
        if (_cNGN == address(0)) revert InvalidSigner();

        cNGN = IERC20(_cNGN); // Set cNGN address

        for (uint256 i = 0; i < _signers.length; i++) {
            if (_signers[i] == address(0)) revert InvalidSigner();
            if (isSigner[_signers[i]]) revert DuplicateSigner();

            signers.push(_signers[i]);
            isSigner[_signers[i]] = true;
            signerIndex[_signers[i]] = i;

            emit SignerAdded(_signers[i]);
        }

        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    // =============================================================================
    // DEPOSIT FUNCTIONS
    // =============================================================================

    function deposit(uint256 amount) external notPaused {
        if (amount == 0) revert InvalidAmount();
        cNGN.safeTransferFrom(msg.sender, address(this), amount);
        emit TokenDeposit(msg.sender, amount, address(cNGN));
    }

    // =============================================================================
    // TRANSACTION SUBMISSION FUNCTIONS
    // =============================================================================

    function submitTransaction(address target, uint256 value, bytes memory data)
        public
        onlySigner
        notPaused
        returns (uint256 txId)
    {
        if (target == address(0)) revert InvalidSigner();
        if (data.length == 0 && value == 0) revert InvalidAmount();

        txId = _createTransaction(target, value, data);
        emit TransactionSubmitted(txId, msg.sender, target, value, data, transactions[txId].expiresAt);

        _approveTransaction(txId);
        return txId;
    }

    function submitBatchPayment(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlySigner
        notPaused
        returns (uint256 txId)
    {
        if (recipients.length != amounts.length) revert ArrayMismatch();
        if (recipients.length == 0 || recipients.length > MAX_BATCH_SIZE) revert InvalidBatchSize();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidSigner();
            if (amounts[i] == 0) revert InvalidAmount();
            totalAmount += amounts[i];
        }

        if (cNGN.balanceOf(address(this)) < totalAmount) revert InsufficientBalance();

        bytes memory data = _encodeBatchTransfer(recipients, amounts);
        txId = _createTransaction(address(this), 0, data);

        emit BatchPaymentSubmitted(txId, recipients, amounts);
        emit TransactionSubmitted(txId, msg.sender, address(this), 0, data, transactions[txId].expiresAt);

        _approveTransaction(txId);
        return txId;
    }

    // =============================================================================
    // TRANSACTION APPROVAL FUNCTIONS
    // =============================================================================

    function approveTransaction(uint256 txId) external onlySigner notPaused validTransaction(txId) {
        _approveTransaction(txId);
    }

    function revokeApproval(uint256 txId) external onlySigner notPaused validTransaction(txId) {
        Transaction storage txn = transactions[txId];
        if (!txn.approvals[msg.sender]) revert NotApproved();

        txn.approvals[msg.sender] = false;
        txn.approvalCount--;

        emit TransactionRevoked(txId, msg.sender);
    }

    function cancelTransaction(uint256 txId) external onlySigner notPaused {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        Transaction storage txn = transactions[txId];
        if (txn.executed || txn.cancelled) revert TransactionFinalized();

        if (block.timestamp <= txn.expiresAt) {
            if (!txn.approvals[msg.sender] || txn.approvalCount == 0) revert NotApproved();
        }

        txn.cancelled = true;
        emit TransactionExpired(txId);
    }

    function executeTransaction(uint256 txId) external notPaused validTransaction(txId) {
        Transaction storage txn = transactions[txId];
        if (txn.approvalCount < threshold) revert InsufficientApprovals();

        txn.executed = true;

        (bool success, bytes memory returnData) = txn.target.call{value: txn.value}(txn.data);

        emit TransactionExecuted(txId, msg.sender, success);

        if (!success) {
            if (returnData.length > 0) {
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert("Execution failed");
            }
        }
    }

    // =============================================================================
    // BATCH TRANSFER EXECUTION (INTERNAL)
    // =============================================================================

    function executeBatchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
        if (msg.sender != address(this)) revert OnlyMultisig();
        if (recipients.length != amounts.length) revert ArrayMismatch();
        if (recipients.length == 0) revert InvalidBatchSize();

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidSigner();
            if (amounts[i] == 0) revert InvalidAmount();
            cNGN.safeTransfer(recipients[i], amounts[i]);
        }
    }

    // =============================================================================
    // SIGNER MANAGEMENT FUNCTIONS
    // =============================================================================

    function submitAddSigner(address newSigner) external onlySigner notPaused returns (uint256 txId) {
        if (newSigner == address(0)) revert InvalidSigner();
        if (isSigner[newSigner]) revert DuplicateSigner();

        bytes memory data = abi.encodeWithSelector(this.addSigner.selector, newSigner);
        return submitTransaction(address(this), 0, data);
    }

    function submitRemoveSigner(address signerToRemove) external onlySigner notPaused returns (uint256 txId) {
        if (!isSigner[signerToRemove]) revert InvalidSigner();
        if (signers.length <= 1) revert InvalidSigner();
        if (signers.length - 1 < threshold) revert InvalidThreshold();

        bytes memory data = abi.encodeWithSelector(this.removeSigner.selector, signerToRemove);
        return submitTransaction(address(this), 0, data);
    }

    function submitChangeThreshold(uint256 newThreshold) external onlySigner notPaused returns (uint256 txId) {
        if (newThreshold == 0 || newThreshold > signers.length) revert InvalidThreshold();
        if (newThreshold == threshold) revert InvalidThreshold();

        bytes memory data = abi.encodeWithSelector(this.changeThreshold.selector, newThreshold);
        return submitTransaction(address(this), 0, data);
    }

    // =============================================================================
    // INTERNAL SIGNER MANAGEMENT (Called via executeTransaction)
    // =============================================================================

    function addSigner(address newSigner) external {
        if (msg.sender != address(this)) revert OnlyMultisig();
        if (newSigner == address(0)) revert InvalidSigner();
        if (isSigner[newSigner]) revert DuplicateSigner();

        signers.push(newSigner);
        isSigner[newSigner] = true;
        signerIndex[newSigner] = signers.length - 1;

        emit SignerAdded(newSigner);
    }

    function removeSigner(address signerToRemove) external {
        if (msg.sender != address(this)) revert OnlyMultisig();
        if (!isSigner[signerToRemove]) revert InvalidSigner();
        if (signers.length <= 1) revert InvalidSigner();

        uint256 index = signerIndex[signerToRemove];
        uint256 lastIndex = signers.length - 1;

        if (index != lastIndex) {
            address lastSigner = signers[lastIndex];
            signers[index] = lastSigner;
            signerIndex[lastSigner] = index;
        }

        signers.pop();
        delete isSigner[signerToRemove];
        delete signerIndex[signerToRemove];

        if (pauseVoters[signerToRemove]) {
            pauseVoters[signerToRemove] = false;
            pauseVotes--;
        }
        delete pauseVoters[signerToRemove];

        emit SignerRemoved(signerToRemove);
    }

    function changeThreshold(uint256 newThreshold) external {
        if (msg.sender != address(this)) revert OnlyMultisig();
        if (newThreshold == 0 || newThreshold > signers.length) revert InvalidThreshold();

        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    // =============================================================================
    // WITHDRAWAL FUNCTIONS
    // =============================================================================

    function submitWithdraw(address recipient, uint256 amount) external onlySigner notPaused returns (uint256 txId) {
        if (recipient == address(0)) revert InvalidSigner();
        if (amount == 0) revert InvalidAmount();
        if (cNGN.balanceOf(address(this)) < amount) revert InsufficientBalance();

        bytes memory data = abi.encodeWithSelector(this.executeWithdraw.selector, recipient, amount);
        return submitTransaction(address(this), 0, data);
    }

    function executeWithdraw(address recipient, uint256 amount) external {
        if (msg.sender != address(this)) revert OnlyMultisig();
        if (recipient == address(0)) revert InvalidSigner();
        if (amount == 0) revert InvalidAmount();
        cNGN.safeTransfer(recipient, amount);
        emit TokenWithdrawal(recipient, amount, address(cNGN));
    }

    // =============================================================================
    // EMERGENCY FUNCTIONS
    // =============================================================================

    function votePause() external onlySigner {
        if (paused) revert AlreadyPaused();
        if (pauseVoters[msg.sender]) revert AlreadyVoted();

        pauseVoters[msg.sender] = true;
        pauseVotes++;

        uint256 requiredVotes = (signers.length / 2) + 1;
        if (pauseVotes >= requiredVotes) {
            paused = true;
            emit EmergencyStop(true, msg.sender);
        }
    }

    function voteUnpause() external onlySigner {
        if (!paused) revert NotPaused();
        if (!pauseVoters[msg.sender]) revert MustVotePauseFirst();

        pauseVoters[msg.sender] = false;
        pauseVotes--;

        uint256 requiredVotes = (signers.length / 2) + 1;
        if (pauseVotes < requiredVotes) {
            paused = false;
            _resetPauseVotes();
            emit EmergencyStop(false, msg.sender);
        }
    }

    // =============================================================================
    // TRANSACTION EXPIRY FUNCTIONS
    // =============================================================================

    function expireTransaction(uint256 txId) external {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        Transaction storage txn = transactions[txId];
        if (txn.executed || txn.cancelled) revert TransactionFinalized();
        if (block.timestamp <= txn.expiresAt) revert TransactionNotFound();

        txn.cancelled = true;
        emit TransactionExpired(txId);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getThreshold() external view returns (uint256) {
        return threshold;
    }

    function getBalance() external view returns (uint256) {
        return cNGN.balanceOf(address(this));
    }

    function getTransactionDetails(uint256 txId)
        external
        view
        returns (
            address target,
            uint256 value,
            bytes memory data,
            bool executed,
            bool cancelled,
            uint256 approvalCount,
            uint256 expiresAt
        )
    {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        Transaction storage txn = transactions[txId];
        return (txn.target, txn.value, txn.data, txn.executed, txn.cancelled, txn.approvalCount, txn.expiresAt);
    }

    function hasApproved(uint256 txId, address signer) external view returns (bool) {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        return transactions[txId].approvals[signer];
    }

    function getApprovalCount(uint256 txId) external view returns (uint256) {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        return transactions[txId].approvalCount;
    }

    function isTransactionExpired(uint256 txId) external view returns (bool) {
        if (!_transactionExists(txId)) revert TransactionNotFound();
        return block.timestamp > transactions[txId].expiresAt;
    }

    function transactionExists(uint256 txId) external view returns (bool) {
        return _transactionExists(txId);
    }

    function canExecuteTransaction(uint256 txId) external view returns (bool) {
        if (!_transactionExists(txId)) return false;
        Transaction storage txn = transactions[txId];
        return (
            !txn.executed && !txn.cancelled && txn.approvalCount >= threshold && block.timestamp <= txn.expiresAt
                && !paused
        );
    }

    // =============================================================================
    // INTERNAL HELPER FUNCTIONS
    // =============================================================================

    function _createTransaction(address target, uint256 value, bytes memory data) internal returns (uint256 txId) {
        txId = nonce++;
        Transaction storage txn = transactions[txId];
        txn.target = target;
        txn.value = value;
        txn.data = data;
        txn.executed = false;
        txn.approvalCount = 0;
        txn.submittedAt = block.timestamp;
        txn.expiresAt = block.timestamp + TRANSACTION_EXPIRY;

        return txId;
    }

    function _approveTransaction(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        if (txn.approvals[msg.sender]) revert AlreadyApproved();

        txn.approvals[msg.sender] = true;
        txn.approvalCount++;

        emit TransactionApproved(txId, msg.sender);
    }

    function _encodeBatchTransfer(address[] memory recipients, uint256[] memory amounts)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(this.executeBatchTransfer.selector, recipients, amounts);
    }

    function _transactionExists(uint256 txId) internal view returns (bool) {
        return txId < nonce;
    }

    function _resetPauseVotes() internal {
        for (uint256 i = 0; i < signers.length; i++) {
            pauseVoters[signers[i]] = false;
        }
        pauseVotes = 0;
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================

    receive() external payable {
        emit EthDeposit(msg.sender, msg.value);
    }

    fallback() external payable {
        revert("Function not found");
    }
}
