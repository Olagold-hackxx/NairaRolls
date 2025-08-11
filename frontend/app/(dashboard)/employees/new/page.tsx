"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Wallet, Briefcase, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  walletAddress: z
    .string()
    .min(1, "Wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address"),
  role: z.string().min(1, "Role is required"),
  salary: z
    .string()
    .min(1, "Salary is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Salary must be a positive number",
    }),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

const predefinedRoles = [
  "Software Engineer",
  "Senior Software Engineer",
  "Product Manager",
  "Designer",
  "Marketing Manager",
  "Sales Representative",
  "HR Manager",
  "Finance Manager",
  "Operations Manager",
  "CEO",
  "CTO",
  "CFO",
  "Intern",
  "Contractor",
  "Consultant",
]

export default function NewEmployeePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addEmployee } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      walletAddress: "",
      role: "",
      salary: "",
    },
  })

  const watchedRole = watch("role")

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add employee to store
      const newEmployee = {
        id: Date.now().toString(),
        name: data.name,
        walletAddress: data.walletAddress,
        role: data.role,
        salary: data.salary,
        status: "active" as const,
        joinedAt: new Date().toISOString(),
      }

      addEmployee(newEmployee)

      toast({
        title: "Employee added successfully!",
        description: `${data.name} has been added to your organization`,
      })

      router.push("/employees")
    } catch (error) {
      toast({
        title: "Error adding employee",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground">Add a new employee to your organization's payroll system</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., John Doe"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Wallet Address Field */}
            <div className="space-y-2">
              <Label htmlFor="walletAddress" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet Address *
              </Label>
              <Input
                id="walletAddress"
                {...register("walletAddress")}
                placeholder="0x..."
                className={`font-mono ${errors.walletAddress ? "border-destructive" : ""}`}
              />
              {errors.walletAddress && <p className="text-sm text-destructive">{errors.walletAddress.message}</p>}
              <p className="text-xs text-muted-foreground">
                The Ethereum wallet address where this employee will receive payments
              </p>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Role *
              </Label>
              <Select value={watchedRole} onValueChange={(value) => setValue("role", value)}>
                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a role or type custom" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Custom role input */}
              {!predefinedRoles.includes(watchedRole) && (
                <Input
                  {...register("role")}
                  placeholder="Enter custom role"
                  className={errors.role ? "border-destructive" : ""}
                />
              )}
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            {/* Salary Field */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Salary (₦) *
              </Label>
              <Input
                id="salary"
                type="number"
                {...register("salary")}
                placeholder="e.g., 500000"
                min="0"
                step="0.01"
                className={errors.salary ? "border-destructive" : ""}
              />
              {errors.salary && <p className="text-sm text-destructive">{errors.salary.message}</p>}
              <p className="text-xs text-muted-foreground">Monthly salary amount in Nigerian Naira</p>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Important Security Notice</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ensure the wallet address is correct and belongs to the employee. All payments will be sent to this
                  address and cannot be reversed.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[140px]">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Add Employee
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
