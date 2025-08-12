"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount } from "../../lib/thirdweb-hooks";
import {
  getContract,
  readContract,
} from "thirdweb";
import { useEffect, useState } from "react";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

const CNGN_TOKEN_ADDRESS = "0xa1F8BD1892C85746AE71B97C31B1965C4641f1F0";

// Hook to get contract cNGN balance
export const useGetContractCNGNBalance = () => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<string>("0");

  const fetchContractBalance = useCallback(async () => {
    startLoading();
    setError(null);

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain: baseSepolia,
        address: CNGN_TOKEN_ADDRESS,
      });

      const result = await readContract({
        contract: contract,
        method: "function balanceOf(address account) view returns (uint256)",
        params: [process.env.BATCH_PAYROLL_ADDRESS as string],
      });

      setContractBalance((result as bigint).toString());
    } catch (err) {
      console.error("Error fetching contract cNGN balance:", err);
      setError("Failed to fetch contract cNGN balance");
      toast.error("Error fetching contract cNGN balance");
    } finally {
      stopLoading();
    }
  }, []);

  useEffect(() => {
    fetchContractBalance();
  }, [isConnected]);

  return { contractBalance, isLoading, error, refetch: fetchContractBalance };
};