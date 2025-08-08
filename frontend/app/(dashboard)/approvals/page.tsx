'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Users, DollarSign, Eye } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useWeb3 } from '@/components/providers/web3-provider'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ApprovalsPage() {
  const { paymentBatches, user } = useAppStore()
  const { isConnected, account } = useWeb3()
  const { toast } = useToast()

  const pendingBatches = paymentBatches.filter(batch => batch.status === 'pending')
  const approvedBatches = paymentBatches.filter(batch => batch.status === 'approved')

  const handleApprove = async (batchId: string) => {
    if (!isConnected || !account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to approve batches',
        variant: 'destructive'
      })
      return
    }

    try {
      // Here you would call your smart contract to approve the batch
      toast({
        title: 'Batch approved',
        description: 'Your approval has been recorded on-chain',
      })
    } catch (error) {
      toast({
        title: 'Approval failed',
        description: 'Failed to approve batch. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleReject = async (batchId: string) => {
    if (!isConnected || !account) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to reject batches',
        variant: 'destructive'
      })
      return
    }

    try {
      // Here you would call your smart contract to reject the batch
      toast({
        title: 'Batch rejected',
        description: 'The payment batch has been rejected',
      })
    } catch (error) {
      toast({
        title: 'Rejection failed',
        description: 'Failed to reject batch. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const canUserApprove = (batch: any) => {
    return account && !batch.approvals.includes(account)
  }

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting signatures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Execute</CardTitle>
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
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? 'Connected' : 'Disconnected'}
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
                <div key={batch.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        Batch #{batch.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {batch.approvals.length}/{batch.requiredApprovals} approvals
                    </Badge>
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
                        ₦{parseFloat(batch.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link href={`/approvals/${batch.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>

                    {canUserApprove(batch) ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(batch.id)}
                          disabled={!isConnected}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(batch.id)}
                          disabled={!isConnected}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary">
                        {batch.approvals.includes(account || '') ? 'Already Approved' : 'Cannot Approve'}
                      </Badge>
                    )}
                  </div>
                </div>
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

      {/* Ready to Execute */}
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
                <div key={batch.id} className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Batch #{batch.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {batch.employeeCount} employees • ₦{parseFloat(batch.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        Fully Approved
                      </Badge>
                      <Button size="sm">
                        Execute Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
