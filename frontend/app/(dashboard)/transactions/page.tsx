'use client'

import { useState } from 'react'
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
import { Search, Filter, Download, ExternalLink, Calendar, TrendingUp, TrendingDown, Activity, DollarSign, Hash, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useGetAllBatchesWithStatus } from '@/hooks/ContractHooks/useGetAllBatchesWithStatus'

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    batchId: 'batch-001',
    organizationId: 'org-1',
    totalAmount: '2500000',
    employeeCount: 25,
    status: 'success' as const,
    gasUsed: '0.0045',
    createdAt: new Date('2024-01-15T10:30:00'),
    blockNumber: 18945672,
    network: 'Base'
  },
  {
    id: '2',
    hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    batchId: 'batch-002',
    organizationId: 'org-1',
    totalAmount: '1800000',
    employeeCount: 18,
    status: 'success' as const,
    gasUsed: '0.0032',
    createdAt: new Date('2024-01-10T14:20:00'),
    blockNumber: 18932145,
    network: 'Polygon'
  },
  {
    id: '3',
    hash: '0x9876543210fedcba9876543210fedcba98765432',
    batchId: 'batch-003',
    organizationId: 'org-1',
    totalAmount: '3200000',
    employeeCount: 32,
    status: 'failed' as const,
    gasUsed: '0.0021',
    createdAt: new Date('2024-01-08T09:15:00'),
    blockNumber: 18925678,
    network: 'Base',
    failureReason: 'Insufficient gas limit'
  },
  {
    id: '4',
    hash: '0xfedcba9876543210fedcba9876543210fedcba98',
    batchId: 'batch-004',
    organizationId: 'org-1',
    totalAmount: '4100000',
    employeeCount: 41,
    status: 'pending' as const,
    gasUsed: null,
    createdAt: new Date('2024-01-16T16:45:00'),
    blockNumber: null,
    network: 'Base'
  }
]

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  const {
    batches,
    isLoading,
    getPendingBatches,
    getSuccessfulBatches,
    getBatchWithTransaction,
    getExecutedBatches,
    getTotalGasSpent,
    refetch,
  } = useGetAllBatchesWithStatus();
  console.log('Batches:', batches);
  console.log('Pending Batches:', getPendingBatches());
  console.log('Successful Batches:', getSuccessfulBatches());
  console.log('Executed Batches:', getExecutedBatches());
  console.log('Total Gas Spent:', getTotalGasSpent());
  console.log('Batch with Transaction:', getBatchWithTransaction('batch-001'));

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = 
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.batchId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    const matchesNetwork = networkFilter === 'all' || tx.network === networkFilter
    return matchesSearch && matchesStatus && matchesNetwork
  })

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
      case 'success':
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

  const totalVolume = mockTransactions
    .filter(tx => tx.status === 'success')
    .reduce((sum, tx) => sum + parseFloat(tx.totalAmount), 0)

  const successfulTxs = mockTransactions.filter(tx => tx.status === 'success').length
  const failedTxs = mockTransactions.filter(tx => tx.status === 'failed').length
  const pendingTxs = mockTransactions.filter(tx => tx.status === 'pending').length

  const totalGasUsed = mockTransactions
    .filter(tx => tx.gasUsed)
    .reduce((sum, tx) => sum + parseFloat(tx.gasUsed || '0'), 0)

  const stats = [
    {
      title: 'Total Volume',
      value: `₦${totalVolume.toLocaleString()}`,
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'positive' as const
    },
    {
      title: 'Successful Transactions',
      value: successfulTxs.toString(),
      icon: CheckCircle,
      change: '+8.2%',
      changeType: 'positive' as const
    },
    {
      title: 'Failed Transactions',
      value: failedTxs.toString(),
      icon: XCircle,
      change: '-2.1%',
      changeType: 'negative' as const
    },
    {
      title: 'Total Gas Used',
      value: `${totalGasUsed.toFixed(4)} ETH`,
      icon: Activity,
      change: '+5.7%',
      changeType: 'positive' as const
    }
  ]

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
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
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
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All blockchain transactions for your organization
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

          {filteredTransactions.length > 0 ? (
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
                  {filteredTransactions.map((transaction) => (
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
                          {transaction.gasUsed ? `${transaction.gasUsed} ETH` : '-'}
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
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
