"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

export const useIsBatchSigner = (batchName: string, signerAddress: string) => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [isSigner, setIsSigner] = useState<boolean>(false);

  const checkSigner = useCallback(async () => {
    if (!batchName || !signerAddress) return;

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
          "function isBatchSigner(string calldata batchName, address signer) view returns (bool)",
        params: [batchName, signerAddress],
      });

      setIsSigner(result as boolean);
    } catch (err) {
      console.error("Error checking signer status:", err);
      setError("Failed to check signer status");
    } finally {
      stopLoading();
    }
  }, [batchName, signerAddress]);

  useEffect(() => {
    checkSigner();
  }, [batchName, signerAddress, isConnected]);

  return { isSigner, isLoading, error, refetch: checkSigner };
};