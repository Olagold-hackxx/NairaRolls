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
} from "thirdweb";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

type ErrorWithReason = {
  reason?: string;
  message?: string;
};

const CNGN_TOKEN_ADDRESS = "0xa1F8BD1892C85746AE71B97C31B1965C4641f1F0";

export const useApproveCNGN = () => {
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
          address: CNGN_TOKEN_ADDRESS,
        });

        const transaction = prepareContractCall({
          contract,
          method:
            "function approve(address spender, uint256 amount) returns (bool)",
          params: [process.env.BATCH_PAYROLL_ADDRESS as string, BigInt(amount)],
        });

        toast.info("Approving cNGN tokens...");

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("cNGN tokens approved successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } catch (error) {
        const err = error as ErrorWithReason;
        let errorMessage = "An error occurred while approving tokens.";

        toast.error(errorMessage);
        console.error("Approve cNGN error:", error);
        return false;
      }
    },
    [chainId, isConnected, account, ensureCorrectChain]
  );
};