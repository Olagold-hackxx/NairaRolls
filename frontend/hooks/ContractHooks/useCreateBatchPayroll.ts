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

interface CreateBatchParams {
  batchName: string;
  signers: string[];
  quorum: number;
  recipients: string[];
  amounts: string[]; // Using string to handle large numbers
}

const useCreateBatchPayroll = () => {
  const chainId = useChainId();
  const account = useActiveAccount();
  const { isConnected } = useAccount();
  const { ensureCorrectChain } = useChainSwitch();

  return useCallback(
    async (params: CreateBatchParams) => {
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

      const { batchName, signers, quorum, recipients, amounts } = params;

      // Validation
      if (!batchName.trim()) {
        toast.error("Batch name is required.");
        return false;
      }

      if (signers.length === 0 || quorum === 0 || quorum > signers.length) {
        toast.error("Invalid signers or quorum configuration.");
        return false;
      }

      if (recipients.length !== amounts.length || recipients.length === 0) {
        toast.error(
          "Recipients and amounts arrays must match and not be empty."
        );
        return false;
      }

      if (recipients.length > 100) {
        toast.error("Maximum batch size is 100 recipients.");
        return false;
      }

      try {
        const contract = getContract({
          client: thirdwebClient,
          chain: baseSepolia,
          address: process.env.BATCH_PAYROLL_ADDRESS as string,
        });

        // Convert amounts to BigInt
        const amountsBigInt = amounts.map((amount) => BigInt(amount));

        const transaction = prepareContractCall({
          contract,
          method:
            "function createBatchPayroll(string calldata batchName, address[] calldata signers, uint256 quorum, address[] calldata recipients, uint256[] calldata amounts)",
          params: [
            batchName,
            signers,
            BigInt(quorum),
            recipients,
            amountsBigInt,
          ],
        });

        toast.info("Creating batch payroll...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("Batch payroll created successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while creating batch payroll.";

        if (err.reason === "BatchAlreadyExists") {
          errorMessage = "A batch with this name already exists.";
        } else if (err.reason === "InvalidBatchName") {
          errorMessage = "Invalid batch name provided.";
        } else if (err.reason === "InvalidSigners") {
          errorMessage = "Invalid signers configuration.";
        } else if (err.reason === "InvalidQuorum") {
          errorMessage = "Invalid quorum value.";
        } else if (err.reason === "DuplicateSigner") {
          errorMessage = "Duplicate signers detected.";
        } else if (err.reason === "CreatorNotInSigners") {
          errorMessage = "Creator must be included in signers list.";
        } else if (err.reason === "ArrayMismatch") {
          errorMessage = "Recipients and amounts arrays don't match.";
        } else if (err.reason === "InvalidBatchSize") {
          errorMessage = "Invalid batch size or zero amounts detected.";
        } else if (err.reason === "InsufficientBalance") {
          errorMessage =
            "Contract has insufficient cNGN balance for this batch.";
        }

        toast.error(errorMessage);
        console.error("Create batch payroll error:", error);
        return false;
      }
    },
    [chainId, isConnected, account, ensureCorrectChain]
  );
};

export default useCreateBatchPayroll;
