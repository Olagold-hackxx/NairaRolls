'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Clock, TrendingUp, Plus, Upload, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useWeb3 } from '@/components/providers/web3-provider'
import Link from 'next/link'

export default function DashboardPage() {
  const { organization, employees, paymentBatches } = useAppStore()
  const { isConnected } = useWeb3()

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length.toString(),
      description: 'Active employees',
      icon: Users,
      trend: '+2 this month'
    },
    {
      title: 'cNGN Balance',
      value: organization?.cNGNBalance || '0',
      description: 'Available balance',
      icon: DollarSign,
      trend: 'Last updated 2m ago'
    },
    {
      title: 'Pending Approvals',
      value: paymentBatches.filter(b => b.status === 'pending').length.toString(),
      description: 'Awaiting signatures',
      icon: Clock,
      trend: '2 urgent'
    },
    {
      title: 'This Month',
      value: '₦2,450,000',
      description: 'Total payroll sent',
      icon: TrendingUp,
      trend: '+12% from last month'
    }
  ]

  const quickActions = [
    {
      title: 'Create Payment Batch',
      description: 'Process payroll for employees',
      icon: Plus,
      href: '/payments/new',
      variant: 'default' as const
    },
    {
      title: 'Upload Employees',
      description: 'Import from CSV or Excel',
      icon: Upload,
      href: '/employees/upload',
      variant: 'outline' as const
    },
    {
      title: 'View Approvals',
      description: 'Review pending batches',
      icon: CheckCircle,
      href: '/approvals',
      variant: 'outline' as const
    }
  ]

  const recentBatches = paymentBatches.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to your payroll management system
          </p>
        </div>
        {!isConnected && (
          <Badge variant="destructive">Wallet Not Connected</Badge>
        )}
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
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your payroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Button 
                  variant={action.variant} 
                  className="h-auto p-4 flex flex-col items-start space-y-2 w-full"
                >
                  <action.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payment Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Batches</CardTitle>
          <CardDescription>
            Latest payroll batches and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length > 0 ? (
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Batch #{batch.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {batch.employeeCount} employees • ₦{batch.totalAmount}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        batch.status === 'executed' ? 'default' :
                        batch.status === 'approved' ? 'secondary' :
                        batch.status === 'pending' ? 'outline' : 'destructive'
                      }
                    >
                      {batch.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {batch.approvals.length}/{batch.requiredApprovals}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment batches yet</p>
              <Link href="/payments/new">
                <Button className="mt-2">Create Your First Batch</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
