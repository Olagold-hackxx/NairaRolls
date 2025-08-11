"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Download, Users, Trash2, Eye } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface EmployeeRow {
  name: string
  walletAddress: string
  role: string
  salary: string
  isValid: boolean
  errors: string[]
}

export default function UploadEmployeesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { addEmployee } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const validateEmployee = (employee: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!employee.name || employee.name.trim().length === 0) {
      errors.push("Name is required")
    }

    if (!employee.walletAddress || employee.walletAddress.trim().length === 0) {
      errors.push("Wallet address is required")
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(employee.walletAddress.trim())) {
      errors.push("Invalid Ethereum wallet address")
    }

    if (!employee.role || employee.role.trim().length === 0) {
      errors.push("Role is required")
    }

    if (!employee.salary || employee.salary.trim().length === 0) {
      errors.push("Salary is required")
    } else if (isNaN(Number(employee.salary)) || Number(employee.salary) <= 0) {
      errors.push("Salary must be a positive number")
    }

    return { isValid: errors.length === 0, errors }
  }

  const parseCSV = useCallback(
    (csvText: string): EmployeeRow[] => {
      const lines = csvText.split("\n").filter((line) => line.trim())
      if (lines.length < 2) return []

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const expectedHeaders = ["name", "walletaddress", "role", "salary"]

      // Check if all required headers are present
      const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header))
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV format",
          description: `Missing required columns: ${missingHeaders.join(", ")}`,
          variant: "destructive",
        })
        return []
      }

      const employees: EmployeeRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length < 4) continue

        const employee = {
          name: values[headers.indexOf("name")] || "",
          walletAddress: values[headers.indexOf("walletaddress")] || "",
          role: values[headers.indexOf("role")] || "",
          salary: values[headers.indexOf("salary")] || "",
        }

        const validation = validateEmployee(employee)
        employees.push({
          ...employee,
          isValid: validation.isValid,
          errors: validation.errors,
        })
      }

      return employees
    },
    [toast],
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setEmployees([])
    setShowPreview(false)
  }

  const processFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const text = await file.text()
      const parsedEmployees = parseCSV(text)
      setEmployees(parsedEmployees)
      setShowPreview(true)

      toast({
        title: "File processed successfully",
        description: `Found ${parsedEmployees.length} employees in the CSV file`,
      })
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "Failed to read the CSV file. Please check the format.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const uploadEmployees = async () => {
    const validEmployees = employees.filter((emp) => emp.isValid)
    if (validEmployees.length === 0) {
      toast({
        title: "No valid employees",
        description: "Please fix the errors before uploading",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      for (let i = 0; i <= validEmployees.length; i++) {
        setUploadProgress((i / validEmployees.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (i < validEmployees.length) {
          const employee = validEmployees[i]
          const newEmployee = {
            id: Date.now().toString() + i,
            name: employee.name,
            walletAddress: employee.walletAddress,
            role: employee.role,
            salary: employee.salary,
            status: "active" as const,
            joinedAt: new Date().toISOString(),
          }
          addEmployee(newEmployee)
        }
      }

      toast({
        title: "Employees uploaded successfully!",
        description: `${validEmployees.length} employees have been added to your organization`,
      })

      router.push("/employees")
    } catch (error) {
      toast({
        title: "Error uploading employees",
        description: "Failed to upload employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "name,walletaddress,role,salary\nJohn Doe,0x1234567890123456789012345678901234567890,Software Engineer,500000\nJane Smith,0x0987654321098765432109876543210987654321,Product Manager,750000"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "employee_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const removeEmployee = (index: number) => {
    setEmployees((prev) => prev.filter((_, i) => i !== index))
  }

  const validCount = employees.filter((emp) => emp.isValid).length
  const invalidCount = employees.length - validCount

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Upload Employees</h1>
          <p className="text-muted-foreground">Bulk import employees using a CSV file</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
              <p className="text-xs text-muted-foreground">
                Upload a CSV file with employee information. Maximum file size: 5MB
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={processFile} disabled={!file || isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • <strong>name</strong> - Employee full name
                </li>
                <li>
                  • <strong>walletaddress</strong> - Ethereum wallet address (0x...)
                </li>
                <li>
                  • <strong>role</strong> - Job title or role
                </li>
                <li>
                  • <strong>salary</strong> - Monthly salary amount
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Example:</h4>
              <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                name,walletaddress,role,salary
                <br />
                John Doe,0x123...,Engineer,500000
                <br />
                Jane Smith,0x456...,Manager,750000
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Important:</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Verify all wallet addresses are correct. Payments cannot be reversed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {showPreview && employees.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Preview ({employees.length} total)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} Invalid</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading employees...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Employee Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee, index) => (
                      <TableRow key={index} className={!employee.isValid ? "bg-destructive/5" : ""}>
                        <TableCell>
                          {employee.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                        </TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>₦{Number(employee.salary || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmployee(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Error Summary */}
              {invalidCount > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Validation Errors:</h4>
                  <div className="space-y-1">
                    {employees
                      .filter((emp) => !emp.isValid)
                      .map((employee, index) => (
                        <div key={index} className="text-sm text-destructive">
                          <strong>{employee.name || `Row ${index + 1}`}:</strong> {employee.errors.join(", ")}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={uploadEmployees}
                  disabled={validCount === 0 || isUploading}
                  className="gap-2 min-w-[160px]"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {validCount} Employees
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
