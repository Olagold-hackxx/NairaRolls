export interface User {
  id: string;
  name: string;
  walletAddress: string;
  email?: string;
  organizationId: string;
  role: "admin" | "signer" | "viewer";
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  walletAddress: string;
  multisigThreshold: number;
  signers: string[];
  cNGNBalance: string;
}

export interface RegistrationData {
  organizationType: string;
  expectedVolume: string;
  primaryContactName: string;
  primaryContactPhone: string;
  marketingConsent: boolean;
  registrationDate: string;
  verificationStatus: "pending" | "verified" | "rejected";
}

export interface Employee {
  id: string;
  name: string;
  walletAddress: string;
  role: string;
  salary: string;
  status: "active" | "inactive";
  organizationId?: string;
  joinedAt: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentBatch {
  id: string;
  name?: string;
  description?: string;
  organizationId?: string;
  createdBy: string;
  totalAmount: string;
  employeeCount: number;
  status: "pending" | "approved" | "executed" | "rejected";
  approvals: string[];
  requiredApprovals: number;
  payments?: Payment[];
  createdAt: string;
  executedAt?: Date;
  rejectedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  transactionHash?: string;
}

export interface Payment {
  id: string;
  batchId: string;
  employeeId: string;
  employeeName: string;
  walletAddress: string;
  amount: string;
}

export interface Transaction {
  id: string;
  hash: string;
  batchId: string;
  organizationId: string;
  totalAmount: string;
  status: "success" | "failed" | "pending";
  gasUsed?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: "payment" | "approval" | "security" | "rejection" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    batchId?: string;
    amount?: string;
    employeeCount?: number;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentAlerts: boolean;
  approvalReminders: boolean;
  securityAlerts: boolean;
}
