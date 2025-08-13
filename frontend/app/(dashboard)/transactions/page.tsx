'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, Download, ExternalLink, Calendar, TrendingUp, TrendingDown, Activity, DollarSign, Hash, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useGetAllBatchesWithStatus } from '@/hooks/ContractHooks/useGetAllBatchesWithStatus'
import { formatEther } from 'ethers'

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  
  const {
    batches,
    isLoading,
    getPendingBatches,
    getSuccessfulBatches,
    getExecutedBatches,
    getTotalGasSpent,
    refetch,
  } = useGetAllBatchesWithStatus();

  // Define transaction type
  interface Transaction {
    id: string;
    hash: string;
    batchId: string;
    organizationId: string;
    totalAmount: string;
    employeeCount: number;
    status: 'success' | 'failed' | 'pending';
    gasUsed: string | null;
    createdAt: Date;
    blockNumber: number | null;
    network: string;
    failureReason?: string;
    batch: any;
  }

  // Transform batches data for transactions table
  const transactions = useMemo((): Transaction[] => {
    if (!batches || batches.length === 0) return [];
    
    return batches.map((batch: any, index: number): Transaction => {
      // Determine status based on batch properties
      
      
      // Calculate total amount from batch amounts
      const totalAmount = batch.amounts 
        ? batch.amounts.reduce((sum: number, amount: any) => sum + Number(amount), 0)
        : 0;

      return {
        id: batch.name || `batch-${index}`,
        hash: batch.hash || `0x${'0'.repeat(64)}`, // Use actual tx hash or placeholder
        batchId: batch.name || `batch-${index}`,
        organizationId: 'current-org',
        totalAmount: totalAmount.toString(),
        employeeCount: batch.recipients?.length || 0,
        status: batch.status,
        gasUsed: batch.gasUsed || null,
        createdAt: batch.submittedAt ? new Date(batch.submittedAt * 1000) : new Date(),
        blockNumber: batch.blockNumber || null,
        network: 'Base', // You can make this dynamic based on your network detection
        failureReason: batch.isExpired ? 'Batch expired' : undefined,
        batch: batch // Keep reference to original batch data
      };
    });
  }, [batches]);

  const filteredTransactions = useMemo((): Transaction[] => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch = 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.batchId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
      const matchesNetwork = networkFilter === 'all' || tx.network === networkFilter
      return matchesSearch && matchesStatus && matchesNetwork
    })
  }, [transactions, searchTerm, statusFilter, networkFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'Base':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Polygon':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'BNB Chain':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  // Calculate real-time statistics
  const stats = useMemo(() => {
    const successfulBatches = getSuccessfulBatches();
    const executedBatches = getExecutedBatches();
    const pendingBatches = getPendingBatches();
    
    const totalVolume = successfulBatches.reduce((sum: number, batch: any) => {
      const batchTotal = batch.amounts 
        ? batch.amounts.reduce((batchSum: number, amount: any) => batchSum + Number(amount), 0)
        : 0;
      return sum + batchTotal;
    }, 0);

    const successfulTxs = successfulBatches.length;
    const failedTxs = batches.filter((batch: any) => batch.isExpired && !batch.isExecuted).length;
    const pendingTxs = pendingBatches.length;
    const totalGasUsed = getTotalGasSpent();

    // const formattedGasCost = Number.parseFloat(
    //   formatEther(totalGasUsed)
    // ).toFixed(8);

    return [
      {
        title: "Total Volume",
        value: `₦${totalVolume.toLocaleString()}`,
        icon: DollarSign,
        change: "+12.5%",
        changeType: "positive" as const,
      },
      {
        title: "Successful Transactions",
        value: successfulTxs.toString(),
        icon: CheckCircle,
        change: "+8.2%",
        changeType: "positive" as const,
      },
      {
        title: "Failed Transactions",
        value: failedTxs.toString(),
        icon: XCircle,
        change: "-2.1%",
        changeType: "negative" as const,
      },
      {
        title: "Total Gas Used",
        value: `${Number(totalGasUsed)} WEI`,
        icon: Activity,
        change: "+5.7%",
        changeType: "positive" as const,
      },
    ];
  }, [batches, getSuccessfulBatches, getExecutedBatches, getPendingBatches, getTotalGasSpent]);

  const handleRefresh = () => {
    refetch();
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Transaction Hash', 'Batch ID', 'Network', 'Amount (₦)', 'Employees', 'Status', 'Gas Used', 'Date'],
      ...filteredTransactions.map((tx: Transaction) => [
        tx.hash,
        tx.batchId,
        tx.network,
        tx.totalAmount,
        tx.employeeCount.toString(),
        tx.status,
        tx.gasUsed || 'N/A',
        tx.createdAt.toLocaleDateString()
      ])
    ].map((row: (string | number)[]) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">
            View all blockchain transactions and their details
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                <span className={`inline-flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading transactions...
              </div>
            )}
          </CardTitle>
          <CardDescription>
            All blockchain transactions for your organization ({batches?.length || 0} total batches)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction hash or batch ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('success')}>
                    Success
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Network: {networkFilter === 'all' ? 'All' : networkFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setNetworkFilter('all')}>
                    All Networks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNetworkFilter('Base')}>
                    Base
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNetworkFilter('Polygon')}>
                    Polygon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNetworkFilter('BNB Chain')}>
                    BNB Chain
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isLoading && filteredTransactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gas Used</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {transaction.batchId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getNetworkColor(transaction.network)} border-0`}>
                          {transaction.network}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₦{parseFloat(transaction.totalAmount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          {transaction.employeeCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(transaction.status)} border-0`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.gasUsed ? `${Number.parseFloat(transaction.gasUsed)} WEI` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {transaction.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            const explorerUrl = transaction.network === 'Base' 
                              ? `https://basescan.org/tx/${transaction.hash}`
                              : `https://polygonscan.com/tx/${transaction.hash}`
                            window.open(explorerUrl, '_blank')
                          }}
                          disabled={!transaction.hash || transaction.hash.startsWith('0x000')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !isLoading ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || networkFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Transactions will appear here once you start processing payments'
                }
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Loading transactions...</h3>
              <p className="text-muted-foreground">
                Fetching your transaction history from the blockchain
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}