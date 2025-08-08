import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organization, Employee, PaymentBatch } from './types'

interface AppState {
  // Auth
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  
  // Data
  employees: Employee[]
  paymentBatches: PaymentBatch[]
  
  // UI State
  sidebarOpen: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setEmployees: (employees: Employee[]) => void
  setPaymentBatches: (batches: PaymentBatch[]) => void
  setSidebarOpen: (open: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      organization: null,
      isAuthenticated: false,
      employees: [],
      paymentBatches: [],
      sidebarOpen: true,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOrganization: (organization) => set({ organization }),
      setEmployees: (employees) => set({ employees }),
      setPaymentBatches: (paymentBatches) => set({ paymentBatches }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      logout: () => set({ 
        user: null, 
        organization: null, 
        isAuthenticated: false,
        employees: [],
        paymentBatches: []
      }),
    }),
    {
      name: 'nairarolls-storage',
      partialize: (state) => ({ 
        user: state.user, 
        organization: state.organization,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
