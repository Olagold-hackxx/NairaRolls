'use client'

import { Building2, CreditCard, DollarSign, History, Home, Settings, Users, CheckCircle, Wallet } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAppStore } from '@/lib/store'
import { useWeb3 } from '@/components/providers/web3-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Employees', url: '/employees', icon: Users },
  { title: 'Payments', url: '/payments', icon: DollarSign },
  { title: 'Approvals', url: '/approvals', icon: CheckCircle },
  { title: 'Transactions', url: '/transactions', icon: History },
  { title: 'Settings', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { organization, user } = useAppStore()
  const { account, isConnected, connect, disconnect } = useWeb3()

  return (
    <Sidebar>
      <SidebarHeader className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-white">NairaRolls</h2>
            <p className="text-sm text-slate-400">
              {organization?.name || 'No Organization'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="space-y-2">
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Wallet className="h-4 w-4" />
                <span className="truncate">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnect}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="w-full bg-primary hover:bg-primary/90">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
