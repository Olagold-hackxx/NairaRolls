'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Building2, Users, Shield, Bell, Wallet, Key, Trash2, Plus, Copy, Check, AlertTriangle, SettingsIcon, Mail, Smartphone, Globe } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useWeb3 } from '@/components/providers/web3-provider'
import { useToast } from '@/hooks/use-toast'

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional(),
})

const multisigSchema = z.object({
  threshold: z.number().min(1).max(10),
  signers: z.array(z.string()).min(1, 'At least one signer is required')
})

type OrganizationFormData = z.infer<typeof organizationSchema>
type MultisigFormData = z.infer<typeof multisigSchema>

export default function SettingsPage() {
  const { organization, user, setOrganization } = useAppStore()
  const { account, isConnected } = useWeb3()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [newSignerAddress, setNewSignerAddress] = useState('')
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    paymentAlerts: true,
    approvalReminders: true,
    securityAlerts: true
  })

  const organizationForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      description: '',
      website: '',
      contactEmail: user?.email || '',
      contactPhone: '',
    }
  })

  const multisigForm = useForm<MultisigFormData>({
    resolver: zodResolver(multisigSchema),
    defaultValues: {
      threshold: organization?.multisigThreshold || 2,
      signers: organization?.signers || []
    }
  })

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
      toast({
        title: 'Copied to clipboard',
        description: `${type} address copied successfully`,
      })
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const onOrganizationSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (organization) {
        setOrganization({
          ...organization,
          name: data.name
        })
      }
      
      toast({
        title: 'Settings updated',
        description: 'Organization settings have been saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update organization settings',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSigner = () => {
    if (!newSignerAddress) return
    
    const currentSigners = multisigForm.getValues('signers')
    if (currentSigners.includes(newSignerAddress)) {
      toast({
        title: 'Signer already exists',
        description: 'This address is already a signer',
        variant: 'destructive'
      })
      return
    }
    
    multisigForm.setValue('signers', [...currentSigners, newSignerAddress])
    setNewSignerAddress('')
    
    toast({
      title: 'Signer added',
      description: 'New signer has been added to the multisig wallet',
    })
  }

  const removeSigner = (address: string) => {
    const currentSigners = multisigForm.getValues('signers')
    const updatedSigners = currentSigners.filter(signer => signer !== address)
    multisigForm.setValue('signers', updatedSigners)
    
    toast({
      title: 'Signer removed',
      description: 'Signer has been removed from the multisig wallet',
    })
  }

  const updateMultisig = async (data: MultisigFormData) => {
    setIsLoading(true)
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (organization) {
        setOrganization({
          ...organization,
          multisigThreshold: data.threshold,
          signers: data.signers
        })
      }
      
      toast({
        title: 'Multisig updated',
        description: 'Multisig configuration has been updated on-chain',
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update multisig configuration',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and security configuration
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="multisig" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Update your organization's basic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      {...organizationForm.register('name')}
                      placeholder="Your Organization Name"
                    />
                    {organizationForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {organizationForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...organizationForm.register('website')}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...organizationForm.register('description')}
                    placeholder="Brief description of your organization..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...organizationForm.register('contactEmail')}
                      placeholder="contact@yourcompany.com"
                    />
                    {organizationForm.formState.errors.contactEmail && (
                      <p className="text-sm text-destructive">
                        {organizationForm.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      {...organizationForm.register('contactPhone')}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Wallet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Information
              </CardTitle>
              <CardDescription>
                Your organization's wallet addresses and connection status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Organization Wallet</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {organization?.walletAddress || 'Not connected'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  {organization?.walletAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(organization.walletAddress, 'Organization wallet')}
                    >
                      {copiedAddress === 'Organization wallet' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Connected Account</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {account || 'No wallet connected'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={account ? 'default' : 'secondary'}>
                    {account ? 'Active' : 'Inactive'}
                  </Badge>
                  {account && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(account, 'Connected account')}
                    >
                      {copiedAddress === 'Connected account' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="multisig" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Signature Configuration
              </CardTitle>
              <CardDescription>
                Configure your organization's multi-signature wallet settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={multisigForm.handleSubmit(updateMultisig)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Approval Threshold</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="threshold"
                      type="number"
                      min="1"
                      max="10"
                      {...multisigForm.register('threshold', { valueAsNumber: true })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      out of {multisigForm.watch('signers')?.length || 0} signers required
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Number of signatures required to approve transactions
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Authorized Signers</Label>
                    <Badge variant="outline">
                      {multisigForm.watch('signers')?.length || 0} signers
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {multisigForm.watch('signers')?.map((signer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {signer.slice(0, 6)}...{signer.slice(-4)}
                          </span>
                          {signer === account && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(signer, `Signer ${index + 1}`)}
                          >
                            {copiedAddress === `Signer ${index + 1}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Signer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this signer? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeSigner(signer)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter wallet address (0x...)"
                      value={newSignerAddress}
                      onChange={(e) => setNewSignerAddress(e.target.value)}
                      className="font-mono"
                    />
                    <Button type="button" onClick={addSigner} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Signer
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-800  flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 ">
                      Important Security Notice
                    </p>
                    <p className="text-yellow-700  mt-1">
                      Changes to multisig configuration require blockchain transactions and may take several minutes to complete.
                      Ensure you have sufficient gas fees before proceeding.
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading || !isConnected}>
                  {isLoading ? 'Updating...' : 'Update Multisig Configuration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you want to receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label>Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label>SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, smsNotifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when payments are processed
                    </p>
                  </div>
                  <Switch
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, paymentAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Approval Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for pending approvals
                    </p>
                  </div>
                  <Switch
                    checked={notifications.approvalReminders}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, approvalReminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important security notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, securityAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <Button>Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options and danger zone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">API Access</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate API keys for programmatic access to your organization's data
                  </p>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Data Export</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export your organization's data for backup or migration purposes
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Export Employees
                    </Button>
                    <Button variant="outline">
                      Export Transactions
                    </Button>
                    <Button variant="outline">
                      Export All Data
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="space-y-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Organization
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            organization and remove all associated data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Organization
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
