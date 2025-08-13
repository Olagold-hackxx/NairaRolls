"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

interface BatchDetails {
  name: string;
  creator: string;
  signers: string[];
  quorum: number;
  recipients: string[];
  amounts: string[];
  executed: boolean;
  cancelled: boolean;
  approvalCount: number;
  submittedAt: number;
  expiresAt: number;
}

export const useGetPendingApprovals = () => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [pendingBatches, setPendingBatches] = useState<BatchDetails[]>([]);

  const fetchPendingApprovals = useCallback(async () => {
    if (!isConnected) {
      setError("Please connect your wallet first.");
      toast.warning("Please connect your wallet first.");
      return;
    }

    startLoading();
    setError(null);

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain: baseSepolia,
        address: process.env.BATCH_PAYROLL_ADDRESS as string,
      });

      // Fetch all batch names
      const batchNames = (await readContract({
        contract,
        method: "function getAllBatchNames() view returns (string[] memory)",
        params: [],
      })) as string[];

      // Fetch details for each batch and filter pending ones
      const pending: BatchDetails[] = [];
      for (const batchName of batchNames) {
        try {
          const result = await readContract({
            contract,
            method:
              "function getBatchDetails(string calldata batchName) view returns (string memory name, address creator, address[] memory signers, uint256 quorum, address[] memory recipients, uint256[] memory amounts, bool executed, bool cancelled, uint256 approvalCount, uint256 submittedAt, uint256 expiresAt)",
            params: [batchName],
          });

          const [name, creator, signers, quorum, recipients, amounts, executed, cancelled, approvalCount, submittedAt, expiresAt,] = result as [
            string,
            string,
            string[],
            bigint,
            string[],
            bigint[],
            boolean,
            boolean,
            bigint,
            bigint,
            bigint
          ];

          // Only include batches that are neither executed nor cancelled
          if (!executed && !cancelled) {
            pending.push({
              name,
              creator,
              signers,
              quorum: Number(quorum),
              recipients,
              amounts: amounts.map((amt) => amt.toString()),
              executed,
              cancelled,
              approvalCount: Number(approvalCount),
              submittedAt: Number(submittedAt),
              expiresAt: Number(expiresAt),
            });
          }
        } catch (err) {
          console.error(`Error fetching details for batch ${batchName}:`, err);
          // Continue to the next batch instead of failing the entire operation
        }
      }

      setPendingBatches(pending);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      setError("Failed to fetch pending approvals");
      toast.error("Error fetching pending approvals");
    } finally {
      stopLoading();
    }
  }, [isConnected]);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  return { pendingBatches, isLoading, error, refetch: fetchPendingApprovals };
};