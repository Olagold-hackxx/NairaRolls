'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Users, DollarSign, AlertCircle, CheckCircle, Info, Wallet, Shield, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useWeb3 } from '@/components/providers/web3-provider'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const paymentSchema = z.object({
  selectedEmployees: z.array(z.string()).min(1, 'Select at least one employee'),
  customAmounts: z.record(z.string(), z.string().min(1, 'Amount is required'))
})

type PaymentFormData = z.infer<typeof paymentSchema>

export default function NewPaymentPage() {
  const [step, setStep] = useState(1)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { employees, organization } = useAppStore()
  const { isConnected } = useWeb3()
  const { toast } = useToast()

  const {
    handleSubmit,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema)
  })

  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId])
      const employee = employees.find(e => e.id === employeeId)
      if (employee) {
        setCustomAmounts(prev => ({
          ...prev,
          [employeeId]: employee.salary
        }))
      }
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId))
      setCustomAmounts(prev => {
        const { [employeeId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleAmountChange = (employeeId: string, amount: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [employeeId]: amount
    }))
  }

  const totalAmount = selectedEmployees.reduce((sum, employeeId) => {
    return sum + parseFloat(customAmounts[employeeId] || '0')
  }, 0)

  const progress = (step / 3) * 100

  const onSubmit = async (data: PaymentFormData) => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a payment batch',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Payment batch created successfully!',
        description: 'Your payment batch has been submitted for approval',
      })
      
      // Redirect to approvals page
      window.location.href = '/approvals'
    } catch (error) {
      toast({
        title: 'Error creating batch',
        description: 'Failed to create payment batch. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = selectedEmployees.length > 0
  const canProceedToStep3 = totalAmount > 0 && selectedEmployees.every(id => 
    customAmounts[id] && parseFloat(customAmounts[id]) > 0
  )

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Select Employees</h2>
              <p className="text-muted-foreground">
                Choose which employees to include in this payment batch
              </p>
            </div>

            <div className="grid gap-3">
              {employees.filter(e => e.status === 'active').map((employee) => (
                <div 
                  key={employee.id} 
                  className={`
                    flex items-center space-x-4 p-4 border-2 rounded-xl transition-all cursor-pointer hover:bg-muted/50
                    ${selectedEmployees.includes(employee.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => handleEmployeeSelect(employee.id, !selectedEmployees.includes(employee.id))}
                >
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) => 
                      handleEmployeeSelect(employee.id, checked as boolean)
                    }
                    className="pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{employee.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-medium">
                          ₦{parseFloat(employee.salary).toLocaleString()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Default salary</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedEmployees.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Set Payment Amounts</h2>
              <p className="text-muted-foreground">
                Review and adjust payment amounts for selected employees
              </p>
            </div>

            <div className="space-y-4">
              {selectedEmployees.map((employeeId) => {
                const employee = employees.find(e => e.id === employeeId)
                if (!employee) return null

                return (
                  <div key={employeeId} className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Default: ₦{parseFloat(employee.salary).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Label htmlFor={`amount-${employeeId}`} className="text-sm font-medium min-w-0">
                        Amount (₦)
                      </Label>
                      <div className="flex-1">
                        <Input
                          id={`amount-${employeeId}`}
                          type="number"
                          value={customAmounts[employeeId] || ''}
                          onChange={(e) => handleAmountChange(employeeId, e.target.value)}
                          placeholder="0"
                          className="text-right font-medium"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Separator />
            
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-xl font-semibold">{selectedEmployees.length}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
              <p className="text-muted-foreground">
                Review your payment batch before submission
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedEmployees.length}</p>
                  <p className="text-sm text-muted-foreground">Employees</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{organization?.multisigThreshold || 2}</p>
                  <p className="text-sm text-muted-foreground">Required Approvals</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedEmployees.map((employeeId) => {
                    const employee = employees.find(e => e.id === employeeId)
                    if (!employee) return null

                    return (
                      <div key={employeeId} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {employee.walletAddress.slice(0, 10)}...{employee.walletAddress.slice(-6)}
                          </p>
                        </div>
                        <p className="font-semibold">₦{parseFloat(customAmounts[employeeId] || '0').toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Wallet Connection Status */}
            {!isConnected && (
              <div className="flex items-start gap-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Wallet Not Connected</p>
                  <p className="text-sm text-destructive/80">
                    Please connect your wallet to submit the payment batch
                  </p>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary">Multi-Signature Security</p>
                <p className="text-sm text-primary/80">
                  This payment batch will require {organization?.multisigThreshold || 2} approvals 
                  from authorized signers before execution. All transactions are recorded on-chain for full transparency.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create Payment Batch</h1>
          <p className="text-muted-foreground">
            Step {step} of 3: {
              step === 1 ? 'Select Employees' :
              step === 2 ? 'Set Payment Amounts' : 'Review & Confirm'
            }
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-8">
        {[
          { number: 1, title: 'Select', icon: Users },
          { number: 2, title: 'Amounts', icon: DollarSign },
          { number: 3, title: 'Review', icon: CheckCircle }
        ].map((stepItem) => (
          <div key={stepItem.number} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${step >= stepItem.number 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {step > stepItem.number ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <stepItem.icon className="h-5 w-5" />
              )}
            </div>
            <div className="ml-2 hidden sm:block">
              <p className={`text-sm font-medium ${
                step >= stepItem.number ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {stepItem.title}
              </p>
            </div>
            {stepItem.number < 3 && (
              <div className={`
                w-16 h-0.5 mx-4 transition-all
                ${step > stepItem.number ? 'bg-primary' : 'bg-muted'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between pt-8 mt-8 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !canProceedToStep2) ||
                    (step === 2 && !canProceedToStep3)
                  }
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isConnected}
                  className="gap-2 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Create Batch
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
