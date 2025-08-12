"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

export const useGetAllBatchNames = () => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [batchNames, setBatchNames] = useState<string[]>([]);

  const fetchBatchNames = useCallback(async () => {
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
        method: "function getAllBatchNames() view returns (string[] memory)",
        params: [],
      });

      setBatchNames(result as string[]);
    } catch (err) {
      console.error("Error fetching batch names:", err);
      setError("Failed to fetch batch names");
      toast.error("Error fetching batch names");
    } finally {
      stopLoading();
    }
  }, []);

  useEffect(() => {
    fetchBatchNames();
  }, [isConnected]);

  return { batchNames, isLoading, error, refetch: fetchBatchNames };
};