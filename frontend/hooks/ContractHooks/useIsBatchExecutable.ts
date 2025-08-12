"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

export const useIsBatchExecutable = (batchName: string) => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [isExecutable, setIsExecutable] = useState<boolean>(false);

  const checkExecutable = useCallback(async () => {
    if (!batchName) return;

    startLoading();
    setError(null);

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain: baseSepolia,
        address: process.env.BATCH_PAYROLL_ADDRESS as string,
      });

      const result = await readContract({
        contract: contract,
        method:
          "function isBatchExecutable(string calldata batchName) view returns (bool)",
        params: [batchName],
      });

      setIsExecutable(result as boolean);
    } catch (err) {
      console.error("Error checking executable status:", err);
      setError("Failed to check executable status");
    } finally {
      stopLoading();
    }
  }, [batchName]);

  useEffect(() => {
    checkExecutable();
  }, [batchName, isConnected]);

  return { isExecutable, isLoading, error, refetch: checkExecutable };
};