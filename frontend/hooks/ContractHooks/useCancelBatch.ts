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

export const useCancelBatch = () => {
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
          method: "function cancelBatch(string calldata batchName)",
          params: [batchName],
        });

        toast.info("Cancelling batch...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("Batch cancelled successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while cancelling batch.";

        if (err.reason === "BatchNotFound") {
          errorMessage = "Batch not found.";
        } else if (err.reason === "AlreadyExecuted") {
          errorMessage = "Cannot cancel an executed batch.";
        } else if (err.reason === "AlreadyCancelled") {
          errorMessage = "This batch is already cancelled.";
        } else if (err.reason === "NotApproved") {
          errorMessage = "You must have approved this batch to cancel it.";
        }

        toast.error(errorMessage);
        console.error("Cancel batch error:", error);
        return false;
      }
    },
    [chainId, isConnected, account, ensureCorrectChain]
  );
};