export interface User {
  id: string
  walletAddress: string
  email?: string
  organizationId: string
  role: 'admin' | 'signer' | 'viewer'
}

export interface Organization {
  id: string
  name: string
  walletAddress: string
  multisigThreshold: number
  signers: string[]
  cNGNBalance: string
}

export interface Employee {
  id: string
  name: string
  walletAddress: string
  salary: string
  status: 'active' | 'inactive'
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentBatch {
  id: string
  organizationId: string
  createdBy: string
  totalAmount: string
  employeeCount: number
  status: 'pending' | 'approved' | 'executed' | 'rejected'
  approvals: string[]
  requiredApprovals: number
  payments: Payment[]
  createdAt: Date
  executedAt?: Date
  transactionHash?: string
}

export interface Payment {
  id: string
  batchId: string
  employeeId: string
  employeeName: string
  walletAddress: string
  amount: string
}

export interface Transaction {
  id: string
  hash: string
  batchId: string
  organizationId: string
  totalAmount: string
  status: 'success' | 'failed' | 'pending'
  gasUsed?: string
  createdAt: Date
}
