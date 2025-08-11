import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Organization, Employee, PaymentBatch, Notification, NotificationPreferences } from "./types"

interface AppState {
  // Auth
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean

  // Data
  employees: Employee[]
  paymentBatches: PaymentBatch[]

  notifications: Notification[]
  notificationPreferences: NotificationPreferences

  // UI State
  sidebarOpen: boolean

  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setEmployees: (employees: Employee[]) => void
  setPaymentBatches: (batches: PaymentBatch[]) => void
  setSidebarOpen: (open: boolean) => void

  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  removeNotification: (id: string) => void
  setNotificationPreferences: (preferences: NotificationPreferences) => void
  addEmployee: (employee: Employee) => void

  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      organization: null,
      isAuthenticated: false,
      employees: [
        {
          id: "1",
          name: "John Doe",
          walletAddress: "0x1234567890123456789012345678901234567890",
          role: "Software Engineer",
          salary: "500000",
          status: "active",
          joinedAt: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          name: "Jane Smith",
          walletAddress: "0x0987654321098765432109876543210987654321",
          role: "Product Manager",
          salary: "750000",
          status: "active",
          joinedAt: "2024-02-01T00:00:00Z",
        },
        {
          id: "3",
          name: "Mike Johnson",
          walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          role: "Designer",
          salary: "450000",
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

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }))
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
        }))
      },

      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
        }))
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id),
        }))
      },

      setNotificationPreferences: (preferences) => {
        set({ notificationPreferences: preferences })
      },

      addEmployee: (employee) => {
        set((state) => ({
          employees: [...state.employees, employee],
        }))
      },

      logout: () =>
        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          employees: [],
          paymentBatches: [],
          notifications: [],
        }),
    }),
    {
      name: "nairarolls-storage",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
        notificationPreferences: state.notificationPreferences,
      }),
    },
  ),
)
