"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  Eye,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Hash,
  Send,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAccount } from "@/lib/thirdweb-hooks";
import { toast } from "sonner";
import { useGetPendingApprovals } from "@/hooks/ContractHooks/useGetPendingApprovals";
import { useIsBatchSigner } from "@/hooks/ContractHooks/useIsBatchSigner";
import { useHasApprovedBatch } from "@/hooks/ContractHooks/useHasApprovedBatch";
import { useApproveBatch } from "@/hooks/ContractHooks/useApproveBatch";
import { useIsBatchExecutable } from "@/hooks/ContractHooks/useIsBatchExecutable";
import { useGetBatchDetails } from "@/hooks/ContractHooks/useGetBatchDetails";
import { is } from "zod/v4/locales";
import { useExecuteBatchPayroll } from "@/hooks/ContractHooks/useExecuteBatchPayroll";

interface RejectionDialogProps {
  batchId: string;
  onReject: (batchId: string, reason: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function RejectionDialog({
  batchId,
  onReject,
  isOpen,
  onOpenChange,
}: RejectionDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    "Incorrect payment amounts",
    "Missing employee verification",
    "Budget constraints",
    "Timing issues",
    "Compliance concerns",
    "Duplicate payment batch",
    "Insufficient documentation",
  ];

  const handleReject = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(batchId, reason);
      setReason("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Payment Batch
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this payment batch. This will
            be recorded and visible to all signers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Predefined Reasons */}
          <div className="space-y-2">
            <Label>Common Reasons</Label>
            <div className="grid grid-cols-1 gap-2">
              {predefinedReasons.map((predefinedReason) => (
                <Button
                  key={predefinedReason}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 bg-transparent"
                  onClick={() => setReason(predefinedReason)}
                >
                  {predefinedReason}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Explain why you're rejecting this payment batch..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be shared with all signers and the batch creator.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Important</p>
              <p className="text-destructive/80">
                Rejecting this batch will prevent it from being executed and
                notify all signers.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!reason.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject Batch
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ViewDetailsDialogProps {
  batch: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ViewDetailsDialog({
  batch,
  isOpen,
  onOpenChange,
}: ViewDetailsDialogProps) {
  if (!batch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Payment Batch Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this payment batch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Batch Name
                </Label>
                <p className="text-sm font-medium">
                  {batch.name || `Batch #${batch.id?.slice(0, 8) || "N/A"}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      batch.status === "pending"
                        ? "outline"
                        : batch.status === "approved"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {batch.status?.charAt(0).toUpperCase() +
                      batch.status?.slice(1) || "Unknown"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </Label>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {batch.submittedAt
                    ? new Date(batch.submittedAt * 1000).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Batch ID
                </Label>
                <p className="text-sm flex items-center gap-2 font-mono">
                  <Hash className="h-4 w-4" />
                  {batch.name || "N/A"}
                </p>
              </div>
            </div>
            {batch.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                  {batch.description}
                </p>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </p>
                <p className="text-xl font-bold">
                  ₦
                  {batch.amounts
                    ?.reduce((sum: number, amount: number) => sum + Number(amount), 0)
                    .toLocaleString() || "0"}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-muted-foreground">
                  Employees
                </p>
                <p className="text-xl font-bold">
                  {batch.recipients?.length || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Payment
                </p>
                <p className="text-xl font-bold">
                  ₦
                  {batch.amounts && batch.recipients?.length
                    ? (
                        batch.amounts.reduce(
                          (sum: number, amount: number) => sum + Number(amount),
                          0
                        ) / batch.recipients.length
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })
                    : "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Approval Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Approval Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Required Approvals
                </Label>
                <p className="text-sm font-medium">
                  {batch.quorum || 0} signers
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Current Approvals
                </Label>
                <p className="text-sm font-medium">
                  {batch.approvalCount || 0} / {batch.quorum || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Signatory Threshold
                </Label>
                <p className="text-sm font-medium">60% per transaction</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Progress
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          batch.quorum
                            ? Math.min(
                                100,
                                (batch.approvalCount / batch.quorum) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {batch.quorum
                      ? Math.round((batch.approvalCount / batch.quorum) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          {batch.recipients && batch.recipients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employee Payments</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <div className="space-y-1">
                  {batch.recipients.map((recipient: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Employee #{index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {recipient.slice(0, 6)}...{recipient.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₦
                          {Number(batch.amounts?.[index] || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Individual batch component to handle hook calls
interface BatchItemProps {
  batch: any;
  account: any;
  isConnected: boolean;
  onApprove: (batchId: string) => void;
  onReject: (batchId: string) => void;
  onViewDetails: (batch: any) => void;
  onExecute: (batchId: string) => void;
  isApproving?: boolean;
}

function BatchItem({
  batch,
  account,
  isConnected,
  onApprove,
  onReject,
  onViewDetails,
  onExecute,
  isApproving = false,
}: BatchItemProps) {
  const { isSigner } = useIsBatchSigner(
    batch.name || "",
    account?.address || ""
  );

  const { hasApproved } = useHasApprovedBatch(
    batch.name || "",
    account?.address || ""
  );

  const { isExecutable } = useIsBatchExecutable(batch.name || "");
  const { batchDetails } = useGetBatchDetails(batch.name || "");

  const showExecuteButton =
    isExecutable && batchDetails?.creator === account?.address;

  const canUserApprove = isSigner && !hasApproved && !showExecuteButton;
  const hasAlreadyApproved = hasApproved;

  return (
    <div key={batch.name} className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{batch.name}</h3>
          <p className="text-sm text-muted-foreground">
            Expires {new Date(batch.expiresAt * 1000).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline">
          {batch.approvalCount}/{batch.quorum} approvals
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {batch.recipients?.length || 0} employees
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            ₦
            {batch.amounts
              ?.reduce((sum: number, amount: number) => sum + Number(amount), 0)
            }
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(batch)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>

        {showExecuteButton ? (
          <Button
            size="sm"
            onClick={() => onExecute(batch.name)}
            disabled={!isConnected}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Release Funds
          </Button>
        ) : canUserApprove ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(batch.name)}
              disabled={!isConnected || isApproving}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(batch.name)}
              disabled={!isConnected || isApproving}
              className="gap-2"
            >
              {isApproving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </div>
        ) : (
          <Badge variant="secondary">
            {hasAlreadyApproved ? "Already Approved" : "Cannot Approve"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { paymentBatches } = useAppStore();
  const { isConnected, account } = useAccount();
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [approvingBatchId, setApprovingBatchId] = useState<string>("");
  const approveBatch = useApproveBatch();
  const executeBatchPayroll = useExecuteBatchPayroll();

  const approvedBatches = paymentBatches.filter(
    (batch) => batch.status === "approved"
  );
  const rejectedBatches = paymentBatches.filter(
    (batch) => batch.status === "rejected"
  );

  const { pendingBatches } = useGetPendingApprovals();

  const handleApprove = async (batchName: string) => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    setApprovingBatchId(batchName);
    try {
      const success = await approveBatch(batchName);
      if (success) {
        toast.success("Batch approved successfully!");
      } else {
        toast.error("Failed to approve batch. Please try again.");
      }
    } finally {
      setApprovingBatchId("");
    }
  };

  const handleExecute = async (batchName: string) => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    const success = await executeBatchPayroll(batchName);
    if (!success) {
      toast.error("Failed to release funds. Please try again.");
      return;
    }
    toast.success("Funds released successfully!");
  };

  const handleReject = async (batchId: string, reason: string) => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    // Add your rejection logic here
    toast.success("Batch rejected successfully!");
  };

  const openRejectionDialog = (batchId: string) => {
    setSelectedBatchId(batchId);
    setRejectionDialogOpen(true);
  };

  const openViewDetailsDialog = (batch: any) => {
    setSelectedBatch(batch);
    setViewDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve payment batches requiring multisig authorization
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBatches.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ready to Execute
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Fully approved batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedBatches.length}</div>
            <p className="text-xs text-muted-foreground">Rejected batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-xs text-muted-foreground">
              Wallet connection status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Payment batches waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingBatches.length > 0 ? (
            <div className="space-y-4">
              {pendingBatches.map((batch) => (
                <BatchItem
                  key={batch.name}
                  batch={batch}
                  account={account}
                  isConnected={isConnected}
                  onApprove={() => handleApprove(batch.name)}
                  onReject={openRejectionDialog}
                  onViewDetails={openViewDetailsDialog}
                  onExecute={handleExecute}
                  isApproving={approvingBatchId === batch.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending approvals</p>
              <p className="text-sm text-muted-foreground">
                All payment batches are either approved or executed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Batches */}
      {rejectedBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejected Batches</CardTitle>
            <CardDescription>
              Payment batches that have been rejected with reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 bg-destructive/5 border-destructive/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {batch.name || `Batch #${batch.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Rejected{" "}
                        {new Date(
                          batch.rejectedAt || batch.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Rejected</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {batch.employeeCount} employees
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        ₦{Number.parseFloat(batch.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {batch.rejectionReason && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                      <MessageSquare className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-destructive/80">
                          {batch.rejectionReason}
                        </p>
                        {batch.rejectedBy && (
                          <p className="text-xs text-destructive/60 mt-1">
                            Rejected by: {batch.rejectedBy.slice(0, 6)}...
                            {batch.rejectedBy.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDetailsDialog(batch)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Batches */}
      {approvedBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Execute</CardTitle>
            <CardDescription>
              Fully approved batches ready for execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 bg-green-50 dark:bg-green-950"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {batch.name || `Batch #${batch.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {batch.employeeCount} employees • ₦
                        {Number.parseFloat(batch.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDetailsDialog(batch)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Badge variant="default">Fully Approved</Badge>
                      <Button size="sm">Execute Payment</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Details Dialog */}
      <ViewDetailsDialog
        batch={selectedBatch}
        isOpen={viewDetailsDialogOpen}
        onOpenChange={setViewDetailsDialogOpen}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        batchId={selectedBatchId}
        onReject={handleReject}
        isOpen={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
      />
    </div>
  );
}