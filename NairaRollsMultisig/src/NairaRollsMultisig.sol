// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NairaRolls Multisig Wallet for Payroll on Base Sepolia
 * @dev A multisignature wallet optimized for payroll operations using cNGN tokens
 * @author NairaRolls Team
 */
contract NairaRollsMultisig is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant TRANSACTION_EXPIRY = 30 days;

    event TransactionSubmitted(uint256 indexed txId, address indexed submitter, address target, uint256 value, bytes data, uint256 expiresAt);
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
        address target;              // Target contract address
        uint256 value;              // ETH value (usually 0 for ERC20)
        bytes data;                 // Encoded function call
        bool executed;              // Successfully executed
        bool cancelled;             // Cancelled or expired
        uint256 approvalCount;      // Current approval count
        uint256 submittedAt;        // Block timestamp when submitted
        uint256 expiresAt;          // Expiration timestamp
        mapping(address => bool) approvals; // Signer => approval status
    }

    // State Variables
    IERC20 public constant cNGN = IERC20(0xa1F8BD1892C85746AE71B97C31B1965C4641f1F0); // cNGN on Base Sepolia
    
    address[] public signers;
    mapping(address => bool) public isSigner;
    mapping(address => uint256) public signerIndex; // Signer position in array
    
    uint256 public threshold;                    // Minimum approvals required
    uint256 public nonce;                       // Transaction counter
    mapping(uint256 => Transaction) internal transactions; // Transaction storage (internal due to mapping in struct)
    
    bool public paused;                         // Emergency pause state
    uint256 public pauseVotes;                  // Current pause votes
    mapping(address => bool) public pauseVoters; // Who voted to pause

    // Modifiers
    modifier onlySigner() {
        require(isSigner[msg.sender], "NRM: Not authorized signer");
        _;
    }

    modifier notPaused() {
        require(!paused, "NRM: Contract paused");
        _;
    }

    modifier validTransaction(uint256 txId) {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        require(!transactions[txId].executed && !transactions[txId].cancelled, "NRM: Transaction finalized");
        require(block.timestamp <= transactions[txId].expiresAt, "NRM: Transaction expired");
        _;
    }

    // Constructor
    constructor(address[] memory _signers, uint256 _threshold) {
        require(_signers.length > 0, "NRM: At least one signer required");
        require(_threshold > 0 && _threshold <= _signers.length, "NRM: Invalid threshold");

        // Add signers with duplicate check
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "NRM: Invalid signer address");
            require(!isSigner[_signers[i]], "NRM: Duplicate signer");
            
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

    /**
     * @dev Deposit cNGN tokens to the contract
     * @param amount Amount of cNGN to deposit
     */
    function deposit(uint256 amount) external nonReentrant notPaused {
        require(amount > 0, "NRM: Invalid deposit amount");
        cNGN.safeTransferFrom(msg.sender, address(this), amount);
        emit TokenDeposit(msg.sender, amount, address(cNGN));
    }

    // =============================================================================
    // TRANSACTION SUBMISSION FUNCTIONS
    // =============================================================================

    /**
     * @dev Submit a generic transaction for multisig approval
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Encoded function call data
     * @return txId The transaction ID
     */
    function submitTransaction(address target, uint256 value, bytes memory data)
        public
        onlySigner
        notPaused
        returns (uint256 txId)
    {
        require(target != address(0), "NRM: Invalid target address");
        require(data.length > 0 || value > 0, "NRM: Empty transaction");
        
        txId = _createTransaction(target, value, data);
        emit TransactionSubmitted(txId, msg.sender, target, value, data, transactions[txId].expiresAt);
        
        // Auto-approve by submitter
        _approveTransaction(txId);
        
        return txId;
    }

    /**
     * @dev Submit a batch payment transaction (payroll-specific)
     * @param recipients Array of recipient addresses
     * @param amounts Array of corresponding amounts
     * @return txId The transaction ID
     */
    function submitBatchPayment(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlySigner
        notPaused
        returns (uint256 txId)
    {
        require(recipients.length == amounts.length, "NRM: Array length mismatch");
        require(recipients.length > 0 && recipients.length <= MAX_BATCH_SIZE, "NRM: Invalid batch size");
        
        // Validate recipients and amounts
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "NRM: Invalid recipient");
            require(amounts[i] > 0, "NRM: Invalid amount");
            totalAmount += amounts[i];
        }
        
        // Check contract has sufficient balance
        require(cNGN.balanceOf(address(this)) >= totalAmount, "NRM: Insufficient balance");
        
        // Create internal batch call data
        bytes memory data = _encodeBatchTransfer(recipients, amounts);
        txId = _createTransaction(address(this), 0, data);
        
        emit BatchPaymentSubmitted(txId, recipients, amounts);
        emit TransactionSubmitted(txId, msg.sender, address(this), 0, data, transactions[txId].expiresAt);
        
        // Auto-approve by submitter
        _approveTransaction(txId);
        
        return txId;
    }

    // =============================================================================
    // TRANSACTION APPROVAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Approve a pending transaction
     * @param txId Transaction ID to approve
     */
    function approveTransaction(uint256 txId) 
        external 
        onlySigner 
        notPaused 
        validTransaction(txId) 
    {
        _approveTransaction(txId);
    }

    /**
     * @dev Revoke approval for a transaction
     * @param txId Transaction ID to revoke approval from
     */
    function revokeApproval(uint256 txId) 
        external 
        onlySigner 
        notPaused 
        validTransaction(txId) 
    {
        Transaction storage txn = transactions[txId];
        require(txn.approvals[msg.sender], "NRM: Not previously approved");
        
        txn.approvals[msg.sender] = false;
        txn.approvalCount--;
        
        emit TransactionRevoked(txId, msg.sender);
    }

    /**
     * @dev Cancel a transaction (only by submitter or if expired)
     * @param txId Transaction ID to cancel
     */
    function cancelTransaction(uint256 txId) 
        external 
        onlySigner 
        notPaused 
    {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        Transaction storage txn = transactions[txId];
        require(!txn.executed && !txn.cancelled, "NRM: Transaction finalized");
        
        // Only submitter can cancel before expiry, anyone can cancel after expiry
        if (block.timestamp <= txn.expiresAt) {
            // Check if msg.sender was the original submitter by checking if they have approval
            require(txn.approvals[msg.sender] && txn.approvalCount > 0, "NRM: Only submitter can cancel");
        }
        
        txn.cancelled = true;
        emit TransactionExpired(txId); // Reusing event for now
    }

    /**
     * @dev Execute a fully approved transaction
     * @param txId Transaction ID to execute
     */
    function executeTransaction(uint256 txId) 
        external 
        nonReentrant 
        notPaused 
        validTransaction(txId) 
    {
        Transaction storage txn = transactions[txId];
        require(txn.approvalCount >= threshold, "NRM: Insufficient approvals");
        
        txn.executed = true;
        
        (bool success, bytes memory returnData) = txn.target.call{value: txn.value}(txn.data);
        
        emit TransactionExecuted(txId, msg.sender, success);
        
        if (!success) {
            // Revert with the original error message if possible
            if (returnData.length > 0) {
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert("NRM: Transaction execution failed");
            }
        }
    }

    // =============================================================================
    // BATCH TRANSFER EXECUTION (INTERNAL)
    // =============================================================================

    /**
     * @dev Execute batch token transfers - called via multisig execution
     * @param recipients Array of recipient addresses
     * @param amounts Array of corresponding amounts
     */
    function executeBatchTransfer(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        nonReentrant 
    {
        // Only callable by the contract itself (via multisig execution)
        require(msg.sender == address(this), "NRM: Only via multisig execution");
        require(recipients.length == amounts.length, "NRM: Array length mismatch");
        require(recipients.length > 0, "NRM: No recipients provided");
        
        // Execute individual transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "NRM: Invalid recipient");
            require(amounts[i] > 0, "NRM: Invalid amount");
            cNGN.safeTransfer(recipients[i], amounts[i]);
        }
    }

    // =============================================================================
    // SIGNER MANAGEMENT FUNCTIONS
    // =============================================================================

    /**
     * @dev Submit transaction to add a new signer
     * @param newSigner Address of the new signer
     * @return txId Transaction ID
     */
    function submitAddSigner(address newSigner) 
        external 
        onlySigner 
        notPaused 
        returns (uint256 txId) 
    {
        require(newSigner != address(0), "NRM: Invalid signer address");
        require(!isSigner[newSigner], "NRM: Already a signer");
        
        bytes memory data = abi.encodeWithSelector(this.addSigner.selector, newSigner);
        return submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Submit transaction to remove a signer
     * @param signerToRemove Address of signer to remove
     * @return txId Transaction ID
     */
    function submitRemoveSigner(address signerToRemove) 
        external 
        onlySigner 
        notPaused 
        returns (uint256 txId) 
    {
        require(isSigner[signerToRemove], "NRM: Not a signer");
        require(signers.length > 1, "NRM: Cannot remove last signer");
        // Additional check: ensure threshold remains valid after removal
        require(signers.length - 1 >= threshold, "NRM: Would invalidate threshold");
        
        bytes memory data = abi.encodeWithSelector(this.removeSigner.selector, signerToRemove);
        return submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Submit transaction to change approval threshold
     * @param newThreshold New approval threshold
     * @return txId Transaction ID
     */
    function submitChangeThreshold(uint256 newThreshold) 
        external 
        onlySigner 
        notPaused 
        returns (uint256 txId) 
    {
        require(newThreshold > 0 && newThreshold <= signers.length, "NRM: Invalid threshold");
        require(newThreshold != threshold, "NRM: Same threshold");
        
        bytes memory data = abi.encodeWithSelector(this.changeThreshold.selector, newThreshold);
        return submitTransaction(address(this), 0, data);
    }

    // =============================================================================
    // INTERNAL SIGNER MANAGEMENT (Called via executeTransaction)
    // =============================================================================

    /**
     * @dev Add a new signer - called via multisig execution
     * @param newSigner Address to add as signer
     */
    function addSigner(address newSigner) external {
        require(msg.sender == address(this), "NRM: Only via multisig");
        require(newSigner != address(0), "NRM: Invalid signer address");
        require(!isSigner[newSigner], "NRM: Already a signer");
        
        signers.push(newSigner);
        isSigner[newSigner] = true;
        signerIndex[newSigner] = signers.length - 1;
        
        emit SignerAdded(newSigner);
    }

    /**
     * @dev Remove a signer - called via multisig execution
     * @param signerToRemove Address to remove from signers
     */
    function removeSigner(address signerToRemove) external {
        require(msg.sender == address(this), "NRM: Only via multisig");
        require(isSigner[signerToRemove], "NRM: Not a signer");
        require(signers.length > 1, "NRM: Cannot remove last signer");
        
        uint256 index = signerIndex[signerToRemove];
        uint256 lastIndex = signers.length - 1;
        
        // Move last signer to the removed signer's position
        if (index != lastIndex) {
            address lastSigner = signers[lastIndex];
            signers[index] = lastSigner;
            signerIndex[lastSigner] = index;
        }
        
        // Remove last element
        signers.pop();
        delete isSigner[signerToRemove];
        delete signerIndex[signerToRemove];
        
        // Clean up pause voting state
        if (pauseVoters[signerToRemove]) {
            pauseVoters[signerToRemove] = false;
            pauseVotes--;
        }
        delete pauseVoters[signerToRemove];
        
        emit SignerRemoved(signerToRemove);
    }

    /**
     * @dev Change approval threshold - called via multisig execution
     * @param newThreshold New threshold value
     */
    function changeThreshold(uint256 newThreshold) external {
        require(msg.sender == address(this), "NRM: Only via multisig");
        require(newThreshold > 0 && newThreshold <= signers.length, "NRM: Invalid threshold");
        
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    // =============================================================================
    // WITHDRAWAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Submit transaction to withdraw cNGN tokens
     * @param recipient Address to receive tokens
     * @param amount Amount to withdraw
     * @return txId Transaction ID
     */
    function submitWithdraw(address recipient, uint256 amount) 
        external 
        onlySigner 
        notPaused 
        returns (uint256 txId) 
    {
        require(recipient != address(0), "NRM: Invalid recipient");
        require(amount > 0, "NRM: Invalid amount");
        require(cNGN.balanceOf(address(this)) >= amount, "NRM: Insufficient balance");
        
        // Create internal withdrawal call
        bytes memory data = abi.encodeWithSelector(this.executeWithdraw.selector, recipient, amount);
        return submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Execute withdrawal - called via multisig execution
     * @param recipient Address to receive tokens
     * @param amount Amount to withdraw
     */
    function executeWithdraw(address recipient, uint256 amount) external {
        require(msg.sender == address(this), "NRM: Only via multisig execution");
        require(recipient != address(0), "NRM: Invalid recipient");
        require(amount > 0, "NRM: Invalid amount");
        cNGN.safeTransfer(recipient, amount);
        emit TokenWithdrawal(recipient, amount, address(cNGN));
    }

    // =============================================================================
    // EMERGENCY FUNCTIONS
    // =============================================================================

    /**
     * @dev Vote to pause the contract (requires majority)
     */
    function votePause() external onlySigner {
        require(!paused, "NRM: Already paused");
        require(!pauseVoters[msg.sender], "NRM: Already voted to pause");
        
        pauseVoters[msg.sender] = true;
        pauseVotes++;
        
        // Check if majority reached
        uint256 requiredVotes = (signers.length / 2) + 1;
        if (pauseVotes >= requiredVotes) {
            paused = true;
            emit EmergencyStop(true, msg.sender);
        }
    }

    /**
     * @dev Vote to unpause the contract (requires majority)
     */
    function voteUnpause() external onlySigner {
        require(paused, "NRM: Not paused");
        require(pauseVoters[msg.sender], "NRM: Must have voted to pause first");
        
        pauseVoters[msg.sender] = false;
        pauseVotes--;
        
        // Check if majority no longer wants pause
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

    /**
     * @dev Mark expired transactions as cancelled
     * @param txId Transaction ID to expire
     */
    function expireTransaction(uint256 txId) external {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        require(!transactions[txId].executed && !transactions[txId].cancelled, "NRM: Transaction finalized");
        require(block.timestamp > transactions[txId].expiresAt, "NRM: Not yet expired");
        
        // Mark as cancelled to prevent future execution
        transactions[txId].cancelled = true;
        emit TransactionExpired(txId);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Get all signers
     * @return Array of signer addresses
     */
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    /**
     * @dev Get current threshold
     * @return Current approval threshold
     */
    function getThreshold() external view returns (uint256) {
        return threshold;
    }

    /**
     * @dev Get contract's cNGN balance
     * @return Current cNGN balance
     */
    function getBalance() external view returns (uint256) {
        return cNGN.balanceOf(address(this));
    }

    /**
     * @dev Get transaction details
     * @param txId Transaction ID
     * @return target Target address
     * @return value ETH value
     * @return data Call data
     * @return executed Execution status
     * @return cancelled Cancellation status
     * @return approvalCount Current approvals
     * @return expiresAt Expiration timestamp
     */
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
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        Transaction storage txn = transactions[txId];
        return (
            txn.target,
            txn.value,
            txn.data,
            txn.executed,
            txn.cancelled,
            txn.approvalCount,
            txn.expiresAt
        );
    }

    /**
     * @dev Check if signer has approved transaction
     * @param txId Transaction ID
     * @param signer Signer address
     * @return Whether signer has approved
     */
    function hasApproved(uint256 txId, address signer) external view returns (bool) {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        return transactions[txId].approvals[signer];
    }

    /**
     * @dev Get current approval count for transaction
     * @param txId Transaction ID
     * @return Current approval count
     */
    function getApprovalCount(uint256 txId) external view returns (uint256) {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        return transactions[txId].approvalCount;
    }

    /**
     * @dev Check if transaction is expired
     * @param txId Transaction ID
     * @return Whether transaction is expired
     */
    function isTransactionExpired(uint256 txId) external view returns (bool) {
        require(_transactionExists(txId), "NRM: Transaction does not exist");
        return block.timestamp > transactions[txId].expiresAt;
    }

    /**
     * @dev Check if transaction exists
     * @param txId Transaction ID
     * @return Whether transaction exists
     */
    function transactionExists(uint256 txId) external view returns (bool) {
        return _transactionExists(txId);
    }

    /**
     * @dev Check if transaction is ready for execution (has enough approvals and not expired)
     * @param txId Transaction ID
     * @return Whether transaction can be executed
     */
    function canExecuteTransaction(uint256 txId) external view returns (bool) {
        if (!_transactionExists(txId)) return false;
        Transaction storage txn = transactions[txId];
        return (
            !txn.executed &&
            !txn.cancelled &&
            txn.approvalCount >= threshold &&
            block.timestamp <= txn.expiresAt &&
            !paused
        );
    }

    // =============================================================================
    // INTERNAL HELPER FUNCTIONS
    // =============================================================================

    /**
     * @dev Internal function to create a new transaction
     * @param target Target address
     * @param value ETH value
     * @param data Call data
     * @return txId New transaction ID
     */
    function _createTransaction(address target, uint256 value, bytes memory data) 
        internal 
        returns (uint256 txId) 
    {
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

    /**
     * @dev Internal function to approve a transaction
     * @param txId Transaction ID to approve
     */
    function _approveTransaction(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        require(!txn.approvals[msg.sender], "NRM: Already approved");
        
        txn.approvals[msg.sender] = true;
        txn.approvalCount++;
        
        emit TransactionApproved(txId, msg.sender);
        
        // Note: Removed auto-execution to prevent reentrancy issues
        // Users must explicitly call executeTransaction()
    }

    /**
     * @dev Internal function to encode batch transfer call
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @return Encoded function call data
     */
    function _encodeBatchTransfer(address[] memory recipients, uint256[] memory amounts) 
        internal 
        pure 
        returns (bytes memory) 
    {
        return abi.encodeWithSelector(
            this.executeBatchTransfer.selector,
            recipients,
            amounts
        );
    }

    /**
     * @dev Internal function to check if transaction exists
     * @param txId Transaction ID
     * @return Whether transaction exists
     */
    function _transactionExists(uint256 txId) internal view returns (bool) {
        return txId < nonce;
    }

    /**
     * @dev Internal function to reset pause votes
     */
    function _resetPauseVotes() internal {
        for (uint256 i = 0; i < signers.length; i++) {
            pauseVoters[signers[i]] = false;
        }
        pauseVotes = 0;
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================

    /**
     * @dev Receive ETH deposits
     */
    receive() external payable {
        emit EthDeposit(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function for unknown calls
     */
    fallback() external payable {
        revert("NRM: Function not found");
    }
}