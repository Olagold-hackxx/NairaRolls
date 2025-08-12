"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

export const useGetBatchCount = () => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState<number>(0);

  const fetchBatchCount = useCallback(async () => {
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
        method: "function getBatchCount() view returns (uint256)",
        params: [],
      });

      setBatchCount(Number(result as bigint));
    } catch (err) {
      console.error("Error fetching batch count:", err);
      setError("Failed to fetch batch count");
    } finally {
      stopLoading();
    }
  }, []);

  useEffect(() => {
    fetchBatchCount();
  }, [isConnected]);

  return { batchCount, isLoading, error, refetch: fetchBatchCount };
};
