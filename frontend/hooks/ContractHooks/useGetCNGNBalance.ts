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

// Hook to get cNGN balance of user
export const useGetCNGNBalance = (userAddress: string) => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");

  const fetchBalance = useCallback(async () => {
    if (!userAddress) return;

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
        params: [userAddress],
      });

      setBalance((result as bigint).toString());
    } catch (err) {
      console.error("Error fetching cNGN balance:", err);
      setError("Failed to fetch cNGN balance");
      toast.error("Error fetching cNGN balance");
    } finally {
      stopLoading();
    }
  }, [userAddress]);

  useEffect(() => {
    fetchBalance();
  }, [userAddress, isConnected]);

  return { balance, isLoading, error, refetch: fetchBalance };
};