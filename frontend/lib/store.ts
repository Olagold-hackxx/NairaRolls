import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Organization,
  Employee,
  PaymentBatch,
  Notification,
  NotificationPreferences,
  RegistrationData,
} from "./types";

// New interface for tracking batch transactions
interface BatchTransaction {
  batchName: string;
  transactionHash: string;
  gasUsed?: string;
  blockNumber?: number;
  executedAt: Date;
  status: "successful" | "failed";
  gasPrice?: string;
  totalGasCost?: string;
}

interface AppState {
  // Auth
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;

  registrationData: RegistrationData | null;

  // Data
  employees: Employee[];
  paymentBatches: PaymentBatch[];
  batchTransactions: BatchTransaction[]; // New: Track executed batches

  notifications: Notification[];
  notificationPreferences: NotificationPreferences;

  // UI State
  sidebarOpen: boolean;

  // Payment Form State
  paymentForm: {
    currentStep: number;
    batchName: string;
    signerAddresses: string[];
    signatoryPercentage: number;
    selectedEmployees: string[];
    payments: Record<string, string>;
  };

  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setEmployees: (employees: Employee[]) => void;
  setPaymentBatches: (batches: PaymentBatch[]) => void;
  setSidebarOpen: (open: boolean) => void;

  // New: Batch Transaction Actions
  addBatchTransaction: (
    transaction: Omit<BatchTransaction, "executedAt">
  ) => void;
  updateBatchTransaction: (
    batchName: string,
    updates: Partial<BatchTransaction>
  ) => void;
  getBatchTransaction: (batchName: string) => BatchTransaction | null;

  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  setNotificationPreferences: (preferences: NotificationPreferences) => void;
  addEmployee: (employee: Employee) => void;
  // Payment Form Actions
  setPaymentFormStep: (step: number) => void;
  setPaymentFormData: (data: Partial<AppState["paymentForm"]>) => void;
  addSignerAddress: (address: string) => void;
  removeSignerAddress: (index: number) => void;
  updateSignerAddress: (index: number, address: string) => void;
  resetPaymentForm: () => void;

  setRegistrationData: (data: RegistrationData) => void;
  clearRegistrationData: () => void;

  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      organization: null,
      isAuthenticated: false,
      registrationData: null,
      employees: [
        {
          id: "1",
          name: "John Doe",
          walletAddress: "0x1234567890123456789012345678901234567890",
          role: "Software Engineer",
          salary: "500000000000",
          status: "active",
          joinedAt: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          name: "Jane Smith",
          walletAddress: "0x0987654321098765432109876543210987654321",
          role: "Product Manager",
          salary: "750000000000",
          status: "active",
          joinedAt: "2024-02-01T00:00:00Z",
        },
        {
          id: "3",
          name: "Mike Johnson",
          walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          role: "Designer",
          salary: "450000000000",
          status: "active",
          joinedAt: "2024-01-20T00:00:00Z",
        },
      ],
      paymentBatches: [
        {
          id: "batch-1",
          name: "December 2024 Salary",
          description: "Monthly salary payment for all active employees",
          status: "pending",
          totalAmount: "1700000",
          employeeCount: 3,
          requiredApprovals: 2,
          approvals: [],
          createdAt: "2024-12-01T10:00:00Z",
          createdBy: "0x1234567890123456789012345678901234567890",
        },
      ],
      batchTransactions: [], // New: Initialize empty array
      // Initial payment form state
      paymentForm: {
        currentStep: 1,
        batchName: "",
        signerAddresses: ["", "", ""], // Start with 3 empty addresses
        signatoryPercentage: 60,
        selectedEmployees: [],
        payments: {},
      },

      notifications: [
        {
          id: "notif-1",
          type: "approval",
          title: "New Payment Batch Requires Approval",
          message: "December 2024 Salary batch is waiting for your approval",
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: "/approvals",
          metadata: {
            batchId: "batch-1",
            amount: "1700000",
            employeeCount: 3,
          },
        },
      ],
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        paymentAlerts: true,
        approvalReminders: true,
        securityAlerts: true,
      },

      sidebarOpen: true,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOrganization: (organization) => set({ organization }),
      setEmployees: (employees) => set({ employees }),
      setPaymentBatches: (paymentBatches) => set({ paymentBatches }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      // New: Batch Transaction Actions
      addBatchTransaction: (transaction) => {
        const newTransaction: BatchTransaction = {
          ...transaction,
          executedAt: new Date(),
        };
        set((state) => ({
          batchTransactions: [...state.batchTransactions, newTransaction],
        }));
      },

      updateBatchTransaction: (batchName, updates) => {
        set((state) => ({
          batchTransactions: state.batchTransactions.map((transaction) =>
            transaction.batchName === batchName
              ? { ...transaction, ...updates }
              : transaction
          ),
        }));
      },

      getBatchTransaction: (batchName) => {
        const state = get();
        return (
          state.batchTransactions.find(
            (transaction) => transaction.batchName === batchName
          ) || null
        );
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        }));
      },

      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            read: true,
          })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id),
        }));
      },

      setNotificationPreferences: (preferences) => {
        set({ notificationPreferences: preferences });
      },

      addEmployee: (employee) => {
        set((state) => ({
          employees: [...state.employees, employee],
        }));
      },

      setRegistrationData: (registrationData) => set({ registrationData }),
      clearRegistrationData: () => set({ registrationData: null }),

      // Payment Form Actions
      setPaymentFormStep: (step) => {
        set((state) => ({
          paymentForm: { ...state.paymentForm, currentStep: step },
        }));
      },

      setPaymentFormData: (data) => {
        set((state) => ({
          paymentForm: { ...state.paymentForm, ...data },
        }));
      },

      addSignerAddress: (address) => {
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            signerAddresses: [...state.paymentForm.signerAddresses, address],
          },
        }));
      },

      removeSignerAddress: (index) => {
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            signerAddresses: state.paymentForm.signerAddresses.filter(
              (_, i) => i !== index
            ),
          },
        }));
      },

      updateSignerAddress: (index, address) => {
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            signerAddresses: state.paymentForm.signerAddresses.map((addr, i) =>
              i === index ? address : addr
            ),
          },
        }));
      },

      resetPaymentForm: () => {
        set((state) => ({
          paymentForm: {
            currentStep: 1,
            batchName: "",
            signerAddresses: ["", "", ""],
            signatoryPercentage: 60,
            selectedEmployees: [],
            payments: {},
          },
        }));
      },

      logout: () =>
        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          employees: [],
          paymentBatches: [],
          batchTransactions: [], // Clear transaction history on logout
          notifications: [],
          paymentForm: {
            currentStep: 1,
            batchName: "",
            signerAddresses: ["", "", ""],
            signatoryPercentage: 60,
            selectedEmployees: [],
            payments: {},
          },
          registrationData: null, // Clear registration data on logout
        }),
    }),
    {
      name: "nairarolls-storage",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
        notificationPreferences: state.notificationPreferences,
        registrationData: state.registrationData,
        batchTransactions: state.batchTransactions, // Persist transaction history
      }),
    }
  )
);