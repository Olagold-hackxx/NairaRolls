"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useChainId, useAccount } from "../../lib/thirdweb-hooks";
import { useChainSwitch } from "../useChainSwitch";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { useAppStore } from "@/lib/store";

type ErrorWithReason = {
  reason?: string;
  message?: string;
};

export const useExecuteBatchPayroll = () => {
  const chainId = useChainId();
  const account = useActiveAccount();
  const { isConnected } = useAccount();
  const { ensureCorrectChain } = useChainSwitch();
  const { addBatchTransaction, updateBatchTransaction } = useAppStore();

  return useCallback(
    async (batchName: string) => {
      if (!account) {
        toast.warning("Please connect your wallet first.");
        return false;
      }

      if (!isConnected) {
        toast.warning("Please connect your wallet first.");
        return false;
      }

      const isCorrectChain = await ensureCorrectChain();
      if (!isCorrectChain) {
        return false;
      }

      if (!batchName.trim()) {
        toast.error("Batch name is required.");
        return false;
      }

      try {
        const contract = getContract({
          client: thirdwebClient,
          chain: baseSepolia,
          address: process.env.BATCH_PAYROLL_ADDRESS as string,
        });

        const transaction = prepareContractCall({
          contract,
          method: "function executeBatchPayroll(string calldata batchName)",
          params: [batchName],
        });

        toast.info("Executing batch payroll...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        // Initially record the transaction with basic info
        addBatchTransaction({
          batchName,
          transactionHash: result.transactionHash,
          status: "successful",
        });

        toast.loading("Waiting for transaction confirmation...", {
          id: `tx-${result.transactionHash}`,
        });

        try {
          // Wait for the transaction receipt to get gas information
          const receipt = await waitForReceipt({
            client: thirdwebClient,
            chain: baseSepolia,
            transactionHash: result.transactionHash,
          });

          // Update the transaction with detailed information
          updateBatchTransaction(batchName, {
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: Number(receipt.blockNumber),
            gasPrice: receipt.effectiveGasPrice?.toString(),
            totalGasCost:
              receipt.gasUsed && receipt.effectiveGasPrice
                ? (receipt.gasUsed * receipt.effectiveGasPrice).toString()
                : undefined,
          });

          toast.success("Batch payroll executed successfully!", {
            id: `tx-${result.transactionHash}`,
          });

          return {
            success: true,
            transactionHash: result.transactionHash,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: Number(receipt.blockNumber),
            totalGasCost:
              receipt.gasUsed && receipt.effectiveGasPrice
                ? (receipt.gasUsed * receipt.effectiveGasPrice).toString()
                : undefined,
          };
        } catch (receiptError) {
          // Even if we can't get the receipt, the transaction was sent
          console.warn("Could not get transaction receipt:", receiptError);

          toast.success("Batch payroll executed successfully!", {
            id: `tx-${result.transactionHash}`,
          });

          return {
            success: true,
            transactionHash: result.transactionHash,
          };
        }
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while executing batch payroll.";

        // Record failed transaction
        addBatchTransaction({
          batchName,
          transactionHash: "",
          status: "failed",
        });

        if (err.reason === "BatchNotFound") {
          errorMessage = "Batch not found.";
        } else if (err.reason === "AlreadyExecuted") {
          errorMessage = "This batch has already been executed.";
        } else if (err.reason === "AlreadyCancelled") {
          errorMessage = "This batch has been cancelled.";
        } else if (err.reason === "BatchExpired") {
          errorMessage = "This batch has expired.";
        } else if (err.reason === "InsufficientApprovals") {
          errorMessage = "Insufficient approvals to execute this batch.";
        }

        toast.error(errorMessage);
        console.error("Execute batch payroll error:", error);
        return false;
      }
    },
    [
      chainId,
      isConnected,
      account,
      ensureCorrectChain,
      addBatchTransaction,
      updateBatchTransaction,
    ]
  );
};