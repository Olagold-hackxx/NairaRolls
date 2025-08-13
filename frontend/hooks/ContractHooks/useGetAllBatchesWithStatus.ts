"use client";

import { getContract, readContract } from "thirdweb";
import { useAccount } from "@/lib/thirdweb-hooks";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLoading } from "../useLoading";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { useAppStore } from "@/lib/store";

interface BatchWithStatus {
  hash: string | null;
  batchId: string;
  organizationId: string;
  totalAmount: string;
  employeeCount: number;
  status: "pending" | "successful" | "unsuccessful";
  gasUsed: string | null;
  createdAt: Date;
  blockNumber: number | null;
  network: string;
  // Additional batch details
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

export const useGetAllBatchesWithStatus = () => {
  const { isConnected } = useAccount();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const { getBatchTransaction } = useAppStore(); // Access store transaction data
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchWithStatus[]>([]);

  const fetchAllBatchesWithStatus = useCallback(async () => {
    if (!isConnected) {
      setError("Please connect your wallet first.");
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

      // First, get all batch names
      const batchNames = (await readContract({
        contract,
        method: "function getAllBatchNames() view returns (string[] memory)",
        params: [],
      })) as string[];

      // Then, fetch details for each batch
      const batchesWithStatus: BatchWithStatus[] = [];

      for (const batchName of batchNames) {
        try {
          const result = await readContract({
            contract,
            method:
              "function getBatchDetails(string calldata batchName) view returns (string memory name, address creator, address[] memory signers, uint256 quorum, address[] memory recipients, uint256[] memory amounts, bool executed, bool cancelled, uint256 approvalCount, uint256 submittedAt, uint256 expiresAt)",
            params: [batchName],
          });

          const [name, creator, signers, quorum, recipients, amounts, executed, cancelled, approvalCount, submittedAt, expiresAt] = result as [
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

          // Determine status based on batch state
          let status: "pending" | "successful" | "unsuccessful";
          if (cancelled) {
            status = "unsuccessful";
          } else if (executed) {
            status = "successful";
          } else {
            status = "pending";
          }

          // Calculate total amount
          const totalAmount = amounts
            .reduce((sum, amount) => sum + Number(amount), 0)
            .toString();

          // Get transaction data from store if available
          const transactionData = getBatchTransaction(name);

          const batchWithStatus: BatchWithStatus = {
            hash: transactionData?.transactionHash || null,
            batchId: name,
            organizationId: creator, // Using creator address as organization ID
            totalAmount,
            employeeCount: recipients.length,
            status,
            gasUsed: transactionData?.gasUsed || null,
            createdAt: new Date(Number(submittedAt) * 1000), // Convert from timestamp
            blockNumber: transactionData?.blockNumber || null,
            network: "Base Sepolia",
            // Additional batch details
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
          };

          batchesWithStatus.push(batchWithStatus);
        } catch (err) {
          console.error(`Error fetching details for batch ${batchName}:`, err);
          // Continue processing other batches instead of failing completely
        }
      }

      // Sort batches by creation date (newest first)
      batchesWithStatus.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      setBatches(batchesWithStatus);
    } catch (err) {
      console.error("Error fetching batches with status:", err);
      setError("Failed to fetch batches");
      toast.error("Error fetching batches");
    } finally {
      stopLoading();
    }
  }, [isConnected]);

  useEffect(() => {
    fetchAllBatchesWithStatus();
  }, [fetchAllBatchesWithStatus]);

  // Helper functions to filter batches by status
  const getPendingBatches = useCallback(() => {
    return batches.filter((batch) => batch.status === "pending");
  }, [batches]);

  const getSuccessfulBatches = useCallback(() => {
    return batches.filter((batch) => batch.status === "successful");
  }, [batches]);

  const getUnsuccessfulBatches = useCallback(() => {
    return batches.filter((batch) => batch.status === "unsuccessful");
  }, [batches]);

  return {
    batches,
    isLoading,
    error,
    refetch: fetchAllBatchesWithStatus,
    // Helper functions
    getPendingBatches,
    getSuccessfulBatches,
    getUnsuccessfulBatches,
    // New helper functions for transaction data
    getBatchWithTransaction: useCallback(
      (batchName: string) => {
        return batches.find((batch) => batch.batchId === batchName);
      },
      [batches]
    ),
    getExecutedBatches: useCallback(() => {
      return batches.filter((batch) => batch.hash !== null);
    }, [batches]),
    getTotalGasSpent: useCallback(() => {
      return batches
        .filter((batch) => batch.gasUsed)
        .reduce((total, batch) => {
          const transactionData = getBatchTransaction(batch.batchId);
          return total + Number(transactionData?.totalGasCost || 0);
        }, 0);
    }, [batches, getBatchTransaction]),
  };
};