"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useChainId, useAccount } from "../../lib/thirdweb-hooks";
import { useChainSwitch } from "../useChainSwitch";
import { useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

type ErrorWithReason = {
  reason?: string;
  message?: string;
};

// Hook for approving a batch
export const useApproveBatch = () => {
  const chainId = useChainId();
  const account = useActiveAccount();
  const { isConnected } = useAccount();
  const { ensureCorrectChain } = useChainSwitch();

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
          method: "function approveBatch(string calldata batchName)",
          params: [batchName],
        });

        toast.info("Approving batch...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("Batch approved successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while approving batch.";

        if (err.reason === "BatchNotFound") {
          errorMessage = "Batch not found.";
        } else if (err.reason === "NotBatchSigner") {
          errorMessage = "You are not a signer for this batch.";
        } else if (err.reason === "AlreadyApproved") {
          errorMessage = "You have already approved this batch.";
        } else if (err.reason === "BatchFinalized") {
          errorMessage = "This batch has already been executed or cancelled.";
        } else if (err.reason === "BatchExpired") {
          errorMessage = "This batch has expired.";
        }

        toast.error(errorMessage);
        console.error("Approve batch error:", error);
        return false;
      }
    },
    [chainId, isConnected, account, ensureCorrectChain]
  );
};