// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {NairaRollsMultisig} from "../src/MockNairaRollsMultisig.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract NairaRollsMultisigTest is Test {
    NairaRollsMultisig public multisig;
    MockERC20 public cNGN;

    address[] public signers;
    address public signer1 = makeAddr("signer1");
    address public signer2 = makeAddr("signer2");
    address public signer3 = makeAddr("signer3");
    address public nonSigner = makeAddr("nonSigner");
    address public recipient1 = makeAddr("recipient1");
    address public recipient2 = makeAddr("recipient2");

    uint256 public constant THRESHOLD = 2;
    uint256 public constant INITIAL_BALANCE = 1000000 * 1e6; // 1M cNGN (assuming 6 decimals)

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
    event BatchPaymentSubmitted(uint256 indexed txId, address[] recipients, uint256[] amounts);
    event EmergencyStop(bool paused, address indexed initiator);

    function setUp() public {
        // Deploy mock cNGN token
        cNGN = new MockERC20("Celo Nigerian Naira", "cNGN", 6);

        // Set up signers
        signers.push(signer1);
        signers.push(signer2);
        signers.push(signer3);

        // Deploy multisig with mock cNGN address
        multisig = new NairaRollsMultisig(signers, THRESHOLD, address(cNGN));

        // Mint tokens to test addresses
        cNGN.mint(address(this), INITIAL_BALANCE);
        cNGN.mint(signer1, INITIAL_BALANCE);
        cNGN.mint(address(multisig), INITIAL_BALANCE);

        // Approve multisig to spend tokens
        cNGN.approve(address(multisig), INITIAL_BALANCE);
        vm.prank(signer1);
        cNGN.approve(address(multisig), INITIAL_BALANCE);
    }

    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================

    function test_Constructor_Success() public {
        address[] memory testSigners = new address[](2);
        testSigners[0] = signer1;
        testSigners[1] = signer2;

        NairaRollsMultisig testMultisig = new NairaRollsMultisig(testSigners, 2, address(cNGN));

        assertEq(testMultisig.getThreshold(), 2);
        address[] memory returnedSigners = testMultisig.getSigners();
        assertEq(returnedSigners.length, 2);
        assertEq(returnedSigners[0], signer1);
        assertEq(returnedSigners[1], signer2);
        assertTrue(testMultisig.isSigner(signer1));
        assertTrue(testMultisig.isSigner(signer2));
        assertEq(address(testMultisig.cNGN()), address(cNGN));
    }

    function test_Constructor_RevertInvalidThreshold() public {
        address[] memory testSigners = new address[](2);
        testSigners[0] = signer1;
        testSigners[1] = signer2;

        vm.expectRevert(NairaRollsMultisig.InvalidThreshold.selector);
        new NairaRollsMultisig(testSigners, 0, address(cNGN));

        vm.expectRevert(NairaRollsMultisig.InvalidThreshold.selector);
        new NairaRollsMultisig(testSigners, 3, address(cNGN));
    }

    function test_Constructor_RevertInvalidSigner() public {
        address[] memory testSigners = new address[](2);
        testSigners[0] = address(0);
        testSigners[1] = signer2;

        vm.expectRevert(NairaRollsMultisig.InvalidSigner.selector);
        new NairaRollsMultisig(testSigners, 2, address(cNGN));
    }

    function test_Constructor_RevertInvalidToken() public {
        address[] memory testSigners = new address[](2);
        testSigners[0] = signer1;
        testSigners[1] = signer2;

        vm.expectRevert(NairaRollsMultisig.InvalidSigner.selector);
        new NairaRollsMultisig(testSigners, 2, address(0));
    }

    function test_Constructor_RevertDuplicateSigner() public {
        address[] memory testSigners = new address[](2);
        testSigners[0] = signer1;
        testSigners[1] = signer1;

        vm.expectRevert(NairaRollsMultisig.DuplicateSigner.selector);
        new NairaRollsMultisig(testSigners, 2, address(cNGN));
    }

    // ============================================================================
    // DEPOSIT TESTS
    // ============================================================================

    function test_Deposit_Success() public {
        uint256 depositAmount = 1000 * 1e6;
        uint256 initialBalance = multisig.getBalance();

        vm.expectEmit(true, true, false, true);
        emit TokenDeposit(address(this), depositAmount, address(cNGN));

        multisig.deposit(depositAmount);

        assertEq(multisig.getBalance(), initialBalance + depositAmount);
    }

    function test_Deposit_RevertInvalidAmount() public {
        vm.expectRevert(NairaRollsMultisig.InvalidAmount.selector);
        multisig.deposit(0);
    }

    function test_Deposit_RevertWhenPaused() public {
        // Pause the contract
        vm.prank(signer1);
        multisig.votePause();
        vm.prank(signer2);
        multisig.votePause();

        vm.expectRevert(NairaRollsMultisig.ContractPaused.selector);
        multisig.deposit(1000 * 1e6);
    }

    // ============================================================================
    // TRANSACTION SUBMISSION TESTS
    // ============================================================================

    function test_SubmitTransaction_Success() public {
        address target = recipient1;
        uint256 value = 0;
        bytes memory data = abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6);

        vm.prank(signer1);
        vm.expectEmit(false, true, false, false);
        emit TransactionSubmitted(0, signer1, target, value, data, 0);

        uint256 txId = multisig.submitTransaction(target, value, data);

        assertEq(txId, 0);
        assertEq(multisig.getApprovalCount(txId), 1);
        assertTrue(multisig.hasApproved(txId, signer1));
    }

    function test_SubmitTransaction_RevertNotSigner() public {
        vm.prank(nonSigner);
        vm.expectRevert(NairaRollsMultisig.NotSigner.selector);
        multisig.submitTransaction(recipient1, 0, "0x");
    }

    function test_SubmitTransaction_RevertInvalidAmount() public {
        vm.prank(signer1);
        vm.expectRevert(NairaRollsMultisig.InvalidAmount.selector);
        multisig.submitTransaction(recipient1, 0, "");
    }

    // ============================================================================
    // BATCH PAYMENT TESTS
    // ============================================================================

    function test_SubmitBatchPayment_Success() public {
        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 1e6;
        amounts[1] = 2000 * 1e6;

        vm.prank(signer1);
        vm.expectEmit(false, false, false, true);
        emit BatchPaymentSubmitted(0, recipients, amounts);

        uint256 txId = multisig.submitBatchPayment(recipients, amounts);

        assertEq(txId, 0);
        assertEq(multisig.getApprovalCount(txId), 1);
    }

    function test_SubmitBatchPayment_RevertArrayMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 1e6;

        vm.prank(signer1);
        vm.expectRevert(NairaRollsMultisig.ArrayMismatch.selector);
        multisig.submitBatchPayment(recipients, amounts);
    }

    function test_SubmitBatchPayment_RevertInsufficientBalance() public {
        address[] memory recipients = new address[](1);
        recipients[0] = recipient1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = INITIAL_BALANCE * 2; // More than contract balance

        vm.prank(signer1);
        vm.expectRevert(NairaRollsMultisig.InsufficientBalance.selector);
        multisig.submitBatchPayment(recipients, amounts);
    }

    // ============================================================================
    // TRANSACTION APPROVAL TESTS
    // ============================================================================

    function test_ApproveTransaction_Success() public {
        // Submit transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        // Approve by second signer
        vm.prank(signer2);
        vm.expectEmit(true, true, false, false);
        emit TransactionApproved(txId, signer2);

        multisig.approveTransaction(txId);

        assertEq(multisig.getApprovalCount(txId), 2);
        assertTrue(multisig.hasApproved(txId, signer2));
    }

    function test_ApproveTransaction_RevertAlreadyApproved() public {
        // Submit transaction (automatically approved by submitter)
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        // Try to approve again by same signer
        vm.prank(signer1);
        vm.expectRevert(NairaRollsMultisig.AlreadyApproved.selector);
        multisig.approveTransaction(txId);
    }

    function test_RevokeApproval_Success() public {
        // Submit and approve transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        // Revoke approval
        vm.prank(signer1);
        vm.expectEmit(true, true, false, false);
        emit TransactionRevoked(txId, signer1);

        multisig.revokeApproval(txId);

        assertEq(multisig.getApprovalCount(txId), 0);
        assertFalse(multisig.hasApproved(txId, signer1));
    }

    // ============================================================================
    // TRANSACTION EXECUTION TESTS
    // ============================================================================

    function test_ExecuteTransaction_Success() public {
        uint256 withdrawAmount = 1000 * 1e6;
        uint256 initialRecipientBalance = cNGN.balanceOf(recipient1);

        // Submit withdrawal transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, withdrawAmount)
        );

        // Get second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        // Execute transaction
        vm.expectEmit(true, true, false, true);
        emit TransactionExecuted(txId, address(this), true);

        multisig.executeTransaction(txId);

        // Check transaction status
        (,,, bool executed,,,) = multisig.getTransactionDetails(txId);
        assertTrue(executed);

        // Check token transfer
        assertEq(cNGN.balanceOf(recipient1), initialRecipientBalance + withdrawAmount);
    }

    function test_ExecuteTransaction_RevertInsufficientApprovals() public {
        // Submit transaction (only has 1 approval, needs 2)
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        vm.expectRevert(NairaRollsMultisig.InsufficientApprovals.selector);
        multisig.executeTransaction(txId);
    }

    // ============================================================================
    // BATCH EXECUTION TESTS
    // ============================================================================

    function test_ExecuteBatchTransfer_Success() public {
        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 1e6;
        amounts[1] = 2000 * 1e6;

        uint256 initialBalance1 = cNGN.balanceOf(recipient1);
        uint256 initialBalance2 = cNGN.balanceOf(recipient2);
        uint256 initialMultisigBalance = multisig.getBalance();

        // Submit batch payment
        vm.prank(signer1);
        uint256 txId = multisig.submitBatchPayment(recipients, amounts);

        // Get second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        // Verify transaction can be executed
        assertTrue(multisig.canExecuteTransaction(txId));

        // Execute transaction
        multisig.executeTransaction(txId);

        // Verify transaction was executed
        (,,, bool executed, bool cancelled,,) = multisig.getTransactionDetails(txId);
        assertTrue(executed);
        assertFalse(cancelled);

        // Check balances - recipients should receive tokens
        assertEq(cNGN.balanceOf(recipient1), initialBalance1 + amounts[0]);
        assertEq(cNGN.balanceOf(recipient2), initialBalance2 + amounts[1]);

        // Check multisig balance decreased
        uint256 totalSent = amounts[0] + amounts[1];
        assertEq(multisig.getBalance(), initialMultisigBalance - totalSent);
    }

    function test_ExecuteBatchTransfer_RevertOnlyMultisig() public {
        address[] memory recipients = new address[](1);
        recipients[0] = recipient1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 1e6;

        // Try to call executeBatchTransfer directly (not from multisig)
        vm.expectRevert(NairaRollsMultisig.OnlyMultisig.selector);
        multisig.executeBatchTransfer(recipients, amounts);
    }

    // ============================================================================
    // SIGNER MANAGEMENT TESTS
    // ============================================================================

    function test_AddSigner_Success() public {
        address newSigner = makeAddr("newSigner");

        // Submit add signer transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitAddSigner(newSigner);

        // Get second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        // Execute transaction
        vm.expectEmit(true, false, false, false);
        emit SignerAdded(newSigner);

        multisig.executeTransaction(txId);

        // Check new signer was added
        assertTrue(multisig.isSigner(newSigner));
        address[] memory newSigners = multisig.getSigners();
        assertEq(newSigners.length, 4);
    }

    function test_RemoveSigner_Success() public {
        // Submit remove signer transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitRemoveSigner(signer3);

        // Get second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        // Execute transaction
        vm.expectEmit(true, false, false, false);
        emit SignerRemoved(signer3);

        multisig.executeTransaction(txId);

        // Check signer was removed
        assertFalse(multisig.isSigner(signer3));
        address[] memory newSigners = multisig.getSigners();
        assertEq(newSigners.length, 2);
    }

    function test_ChangeThreshold_Success() public {
        uint256 newThreshold = 3;

        // Submit change threshold transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitChangeThreshold(newThreshold);

        // Get second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        // Execute transaction
        vm.expectEmit(false, false, false, true);
        emit ThresholdChanged(newThreshold);

        multisig.executeTransaction(txId);

        // Check threshold was changed
        assertEq(multisig.getThreshold(), newThreshold);
    }

    // ============================================================================
    // EMERGENCY PAUSE TESTS
    // ============================================================================

    function test_VotePause_Success() public {
        // First vote
        vm.prank(signer1);
        multisig.votePause();
        assertFalse(multisig.paused());

        // Second vote should trigger pause
        vm.prank(signer2);
        vm.expectEmit(false, false, false, true);
        emit EmergencyStop(true, signer2);

        multisig.votePause();
        assertTrue(multisig.paused());
    }

    function test_VoteUnpause_Success() public {
        // Pause first
        vm.prank(signer1);
        multisig.votePause();
        vm.prank(signer2);
        multisig.votePause();
        assertTrue(multisig.paused());

        // Unpause
        vm.prank(signer1);
        vm.expectEmit(false, false, false, true);
        emit EmergencyStop(false, signer1);

        multisig.voteUnpause();
        assertFalse(multisig.paused());
    }

    // ============================================================================
    // TRANSACTION EXPIRY TESTS
    // ============================================================================

    function test_TransactionExpiry() public {
        // Submit transaction
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        // Fast forward past expiry
        vm.warp(block.timestamp + 31 days);

        // Should be expired
        assertTrue(multisig.isTransactionExpired(txId));
        assertFalse(multisig.canExecuteTransaction(txId));

        // Expire the transaction
        vm.expectEmit(true, false, false, false);
        emit TransactionExpired(txId);

        multisig.expireTransaction(txId);

        // Check transaction is cancelled
        (,,,, bool cancelled,,) = multisig.getTransactionDetails(txId);
        assertTrue(cancelled);
    }

    // ============================================================================
    // VIEW FUNCTION TESTS
    // ============================================================================

    function test_ViewFunctions() public {
        // Test getters
        assertEq(multisig.getThreshold(), THRESHOLD);
        assertEq(multisig.getBalance(), INITIAL_BALANCE);

        address[] memory returnedSigners = multisig.getSigners();
        assertEq(returnedSigners.length, 3);

        // Submit a transaction to test transaction view functions
        vm.prank(signer1);
        uint256 txId = multisig.submitTransaction(
            address(multisig), 0, abi.encodeWithSelector(multisig.executeWithdraw.selector, recipient1, 1000 * 1e6)
        );

        assertTrue(multisig.transactionExists(txId));
        assertEq(multisig.getApprovalCount(txId), 1);
        assertTrue(multisig.hasApproved(txId, signer1));
        assertFalse(multisig.hasApproved(txId, signer2));
        assertFalse(multisig.isTransactionExpired(txId));
        assertFalse(multisig.canExecuteTransaction(txId)); // Needs more approvals

        // Add second approval
        vm.prank(signer2);
        multisig.approveTransaction(txId);

        assertTrue(multisig.canExecuteTransaction(txId)); // Now has enough approvals
    }

    // ============================================================================
    // RECEIVE/FALLBACK TESTS
    // ============================================================================

    function test_ReceiveEther() public {
        uint256 amount = 1 ether;

        // vm.expectEmit(true, false, false, true);
        // emit EthDeposit(address(this), amount);

        (bool success,) = address(multisig).call{value: amount}("");
        assertTrue(success);
        assertEq(address(multisig).balance, amount);
    }

    // function test_Fallback_RevertsFunctionNotFound() public {
    //     // Use vm.expectRevert to catch the revert message
    //     vm.expectRevert("Function not found");

    //     // This should trigger the fallback function and revert
    //     address(multisig).call(abi.encodeWithSignature("nonExistentFunction()"));
    // }
}
