"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
  Wallet,
  Shield,
  Clock,
  FileText,
  Settings,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useAccount } from "@/lib/thirdweb-hooks"
import Link from "next/link"
import { toast } from "sonner"
import useCreateBatchPayroll from "@/hooks/ContractHooks/useCreateBatchPayroll"

export default function NewPaymentPage() {
  const {
    employees,
    paymentForm,
    setPaymentFormStep,
    setPaymentFormData,
    addSignerAddress,
    removeSignerAddress,
    updateSignerAddress,
    resetPaymentForm,
  } = useAppStore()

  const { isConnected } = useAccount()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createBatch = useCreateBatchPayroll();

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!paymentForm.batchName.trim()) {
          newErrors.batchName = "Batch name is required"
        }
        if (paymentForm.signatoryPercentage < 60) {
          newErrors.signatoryPercentage = "Minimum 60% signatory required"
        }
        break
      case 2:
        const validAddresses = paymentForm.signerAddresses.filter(
          (addr) => addr.trim() !== "" && /^0x[a-fA-F0-9]{40}$/.test(addr),
        )
        if (validAddresses.length < 3) {
          newErrors.signerAddresses = "Minimum 3 valid wallet addresses required"
        }
        break
      case 3:
        if (paymentForm.selectedEmployees.length === 0) {
          newErrors.selectedEmployees = "Select at least one employee"
        }
        break
      case 4:
        const hasInvalidAmounts = paymentForm.selectedEmployees.some(
          (id) => !paymentForm.payments[id] || Number.parseFloat(paymentForm.payments[id]) <= 0,
        )
        if (hasInvalidAmounts) {
          newErrors.payments = "All selected employees must have valid payment amounts"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const totalSigners = paymentForm.signerAddresses.filter((addr) => addr.trim() !== "").length
  const requiredApprovals = Math.ceil((totalSigners * paymentForm.signatoryPercentage) / 100)

  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...paymentForm.selectedEmployees, employeeId]
      setPaymentFormData({ selectedEmployees: newSelected })

      const employee = employees.find((e) => e.id === employeeId)
      if (employee && !paymentForm.payments[employeeId]) {
        setPaymentFormData({
          payments: {
            ...paymentForm.payments,
            [employeeId]: employee.salary,
          },
        })
      }
    } else {
      const newSelected = paymentForm.selectedEmployees.filter((id) => id !== employeeId)
      const { [employeeId]: _, ...restPayments } = paymentForm.payments
      setPaymentFormData({
        selectedEmployees: newSelected,
        payments: restPayments,
      })
    }
  }

  const handleAmountChange = (employeeId: string, amount: string) => {
    setPaymentFormData({
      payments: {
        ...paymentForm.payments,
        [employeeId]: amount,
      },
    })
  }

  const handleSignerAddressChange = (index: number, address: string) => {
    updateSignerAddress(index, address)
  }

  const handleAddSignerAddress = () => {
    if (paymentForm.signerAddresses.length < 20) {
      addSignerAddress("")
    }
  }

  const handleRemoveSignerAddress = (index: number) => {
    if (paymentForm.signerAddresses.length > 3) {
      removeSignerAddress(index)
    }
  }

  const totalAmount = paymentForm.selectedEmployees.reduce((sum, employeeId) => {
    return sum + Number.parseFloat(paymentForm.payments[employeeId] || "0")
  }, 0)

  const progress = (paymentForm.currentStep / 5) * 100

  const handleNext = () => {
    if (validateStep(paymentForm.currentStep)) {
      setPaymentFormStep(paymentForm.currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setPaymentFormStep(paymentForm.currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.warning("Please connect your wallet first.")
      return
    }

    if (!validateStep(5)) {
      return
    }

    try {
      const recipientAddresses = paymentForm.selectedEmployees
        .map((employeeId) => {
          const employee = employees.find((e) => e.id === employeeId);
          return employee?.walletAddress || "";
        })
        .filter((address) => address !== "");

      const result = await createBatch({
        batchName: paymentForm.batchName,
        signers: paymentForm.signerAddresses.filter((addr) => addr.trim() !== ""),
        quorum: requiredApprovals,
        recipients: recipientAddresses,
        amounts: paymentForm.selectedEmployees.map((id) => paymentForm.payments[id]),
      });

      if (result) {
        toast.success("Payment batch created successfully!");
        resetPaymentForm();
        window.location.href = "/approvals";
      }
    } catch (error) {
      toast.error("Failed to create payment batch")
    }
  }

  const renderStepContent = () => {
    switch (paymentForm.currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Batch Details</h2>
              <p className="text-muted-foreground">Set up your payment batch name and approval requirements</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name *</Label>
                <Input
                  id="batchName"
                  value={paymentForm.batchName}
                  onChange={(e) => setPaymentFormData({ batchName: e.target.value })}
                  placeholder="e.g., December 2024 Salary"
                  className={errors.batchName ? "border-destructive" : ""}
                />
                {errors.batchName && <p className="text-sm text-destructive">{errors.batchName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signatoryPercentage">Required Signatory Percentage *</Label>
                <Select
                  value={paymentForm.signatoryPercentage.toString()}
                  onValueChange={(value) => setPaymentFormData({ signatoryPercentage: Number.parseInt(value) })}
                >
                  <SelectTrigger className={errors.signatoryPercentage ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => 60 + i * 5).map((percentage) => (
                      <SelectItem key={percentage} value={percentage.toString()}>
                        {percentage}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.signatoryPercentage && <p className="text-sm text-destructive">{errors.signatoryPercentage}</p>}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Approval Configuration</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Required Percentage</p>
                    <p className="font-semibold text-lg">{paymentForm.signatoryPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approvals Needed</p>
                    <p className="font-semibold text-lg text-primary">{requiredApprovals} (based on signers)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Configure Signers</h2>
              <p className="text-muted-foreground">Add wallet addresses of authorized signers (minimum 3 required)</p>
            </div>

            <div className="space-y-4">
              {paymentForm.signerAddresses.map((address, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`signer-${index}`} className="text-sm font-medium">
                      Signer {index + 1} Wallet Address *
                    </Label>
                    <Input
                      id={`signer-${index}`}
                      value={address}
                      onChange={(e) => handleSignerAddressChange(index, e.target.value)}
                      placeholder="0x..."
                      className={`font-mono ${errors.signerAddresses ? "border-destructive" : ""}`}
                    />
                  </div>
                  {paymentForm.signerAddresses.length > 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveSignerAddress(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {errors.signerAddresses && <p className="text-sm text-destructive">{errors.signerAddresses}</p>}

              {paymentForm.signerAddresses.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSignerAddress}
                  className="w-full gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Signer
                </Button>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Signer Summary</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Signers</p>
                  <p className="font-semibold text-lg">{totalSigners}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Required Percentage</p>
                  <p className="font-semibold text-lg">{paymentForm.signatoryPercentage}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approvals Needed</p>
                  <p className="font-semibold text-lg text-primary">{requiredApprovals}</p>
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
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Select Employees</h2>
              <p className="text-muted-foreground">Choose which employees to include in this payment batch</p>
            </div>

            <div className="grid gap-3">
              {employees
                .filter((e) => e.status === "active")
                .map((employee) => (
                  <div
                    key={employee.id}
                    className={`
                    flex items-center space-x-4 p-4 border-2 rounded-xl transition-all cursor-pointer hover:bg-muted/50
                    ${
                      paymentForm.selectedEmployees.includes(employee.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                    onClick={() =>
                      handleEmployeeSelect(employee.id, !paymentForm.selectedEmployees.includes(employee.id))
                    }
                  >
                    <Checkbox
                      checked={paymentForm.selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
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
                            ₦{Number.parseFloat(employee.salary).toLocaleString()}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Default salary</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {errors.selectedEmployees && <p className="text-sm text-destructive">{errors.selectedEmployees}</p>}

            {paymentForm.selectedEmployees.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {paymentForm.selectedEmployees.length} employee{paymentForm.selectedEmployees.length > 1 ? "s" : ""}{" "}
                    selected
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Set Payment Amounts</h2>
              <p className="text-muted-foreground">Review and adjust payment amounts for selected employees</p>
            </div>

            <div className="space-y-4">
              {paymentForm.selectedEmployees.map((employeeId) => {
                const employee = employees.find((e) => e.id === employeeId)
                if (!employee) return null

                return (
                  <div key={employeeId} className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Default: ₦{Number.parseFloat(employee.salary).toLocaleString()}
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
                          value={paymentForm.payments[employeeId] || ""}
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

            {errors.payments && <p className="text-sm text-destructive">{errors.payments}</p>}

            <Separator />

            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">₦{totalAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-xl font-semibold">{paymentForm.selectedEmployees.length}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
              <p className="text-muted-foreground">Review your payment batch before submission</p>
            </div>

            {/* Batch Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Name</p>
                  <p className="font-semibold">{paymentForm.batchName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Signers</p>
                    <p className="font-semibold">{totalSigners}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Required Percentage</p>
                    <p className="font-semibold">{paymentForm.signatoryPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approvals Needed</p>
                    <p className="font-semibold text-primary">{requiredApprovals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authorized Signers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paymentForm.signerAddresses
                    .filter((addr) => addr.trim() !== "")
                    .map((address, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">Signer {index + 1}</span>
                        <span className="font-mono text-sm">{address}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{paymentForm.selectedEmployees.length}</p>
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
                  <p className="text-2xl font-bold">{requiredApprovals}</p>
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
                  {paymentForm.selectedEmployees.map((employeeId) => {
                    const employee = employees.find((e) => e.id === employeeId)
                    if (!employee) return null

                    return (
                      <div
                        key={employeeId}
                        className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {employee.walletAddress.slice(0, 10)}...{employee.walletAddress.slice(-6)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ₦{Number.parseFloat(paymentForm.payments[employeeId] || "0").toLocaleString()}
                        </p>
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
                  <p className="text-sm text-destructive/80">Please connect your wallet to submit the payment batch</p>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary">Multi-Signature Security</p>
                <p className="text-sm text-primary/80">
                  This payment batch will require {requiredApprovals} approvals from authorized signers before
                  execution. All transactions are recorded on-chain for full transparency.
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
            Step {paymentForm.currentStep} of 5:{" "}
            {paymentForm.currentStep === 1
              ? "Batch Details"
              : paymentForm.currentStep === 2
                ? "Configure Signers"
                : paymentForm.currentStep === 3
                  ? "Select Employees"
                  : paymentForm.currentStep === 4
                    ? "Set Payment Amounts"
                    : "Review & Confirm"}
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

      <div className="flex items-center justify-center space-x-2">
        {[
          { number: 1, title: "Details", icon: FileText },
          { number: 2, title: "Signers", icon: UserCheck },
          { number: 3, title: "Select", icon: Users },
          { number: 4, title: "Amounts", icon: DollarSign },
          { number: 5, title: "Review", icon: CheckCircle },
        ].map((stepItem) => (
          <div key={stepItem.number} className="flex items-center">
            <div
              className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${
                paymentForm.currentStep >= stepItem.number
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }
            `}
            >
              {paymentForm.currentStep > stepItem.number ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <stepItem.icon className="h-5 w-5" />
              )}
            </div>
            <div className="ml-2 hidden sm:block">
              <p
                className={`text-sm font-medium ${
                  paymentForm.currentStep >= stepItem.number ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {stepItem.title}
              </p>
            </div>
            {stepItem.number < 5 && (
              <div
                className={`
                w-8 h-0.5 mx-1 transition-all
                ${paymentForm.currentStep > stepItem.number ? "bg-primary" : "bg-muted"}
              `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          {renderStepContent()}

          <div className="flex justify-between pt-8 mt-8 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={paymentForm.currentStep === 1}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {paymentForm.currentStep < 5 ? (
              <Button type="button" onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isConnected} className="gap-2 min-w-[140px]">
                <Wallet className="h-4 w-4" />
                Create Batch
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
