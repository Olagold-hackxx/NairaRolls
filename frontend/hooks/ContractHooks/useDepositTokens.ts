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

export const useDepositTokens = () => {
  const chainId = useChainId();
  const account = useActiveAccount();
  const { isConnected } = useAccount();
  const { ensureCorrectChain } = useChainSwitch();

  return useCallback(
    async (amount: string) => {
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

      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount.");
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
          method: "function deposit(uint256 amount)",
          params: [BigInt(amount)],
        });

        toast.info("Depositing tokens...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("Tokens deposited successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while depositing tokens.";

        // Add specific error handling if needed

        toast.error(errorMessage);
        console.error("Deposit tokens error:", error);
        return false;
      }
    },
    [chainId, isConnected, account, ensureCorrectChain]
  );
};
