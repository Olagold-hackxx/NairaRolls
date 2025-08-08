'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Building2, Wallet, Mail, Lock, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWeb3 } from '@/components/providers/web3-provider'


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'wallet' | 'email'>('wallet')
  const { connect, isConnected, account } = useWeb3()
  const { setUser, setOrganization } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const handleWalletLogin = async () => {
    setIsLoading(true)
    try {
      if (!isConnected) {
        await connect()
      }
      
      // Simulate API call to verify wallet and get user data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockUser = {
        id: '1',
        walletAddress: account || '',
        email: 'admin@democorp.com',
        organizationId: 'org-1',
        role: 'admin' as const
      }

      const mockOrganization = {
        id: 'org-1',
        name: 'Demo Corporation',
        walletAddress: account || '',
        multisigThreshold: 2,
        signers: [account || ''],
        cNGNBalance: '2500000'
      }

      setUser(mockUser)
      setOrganization(mockOrganization)

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to your NairaRolls account',
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: 'Unable to connect wallet. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate email login
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast({
      title: 'Feature coming soon',
      description: 'Email authentication will be available in the next release',
    })
    
    setIsLoading(false)
  }

  const securityFeatures = [
    'MPC wallet technology',
    'Multi-signature approvals',
    'End-to-end encryption',
    'SOC 2 compliance'
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Security */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">NairaRolls</h1>
              <Badge variant="secondary" className="mt-1">Enterprise</Badge>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Secure Enterprise Payroll Management
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Join 500+ organizations using MPC wallet technology and cNGN for 
              transparent, compliant payroll operations.
            </p>
            
            <div className="space-y-3">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/60">
          <p>Trusted by finance teams across Nigeria</p>
          <p className="mt-1">₦2.5B+ processed • 99.9% uptime</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
            <h1 className="text-2xl font-bold dark:text-white">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your NairaRolls account
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex gap-2">
                <Button
                  variant={loginMethod === 'wallet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('wallet')}
                  className="flex-1"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
                <Button
                  variant={loginMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLoginMethod('email')}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {loginMethod === 'wallet' ? (
                <div className="space-y-4">
                  <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Connect Your Wallet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use your organization's MPC wallet to sign in securely
                    </p>
                    <Button
                      onClick={handleWalletLogin}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isLoading ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  </div>
                  
                  <div className="text-center text-xs text-muted-foreground">
                    <p>Supports MetaMask, WalletConnect, and other Web3 wallets</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  
                  <div className="text-center">
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              )}
              
              <Separator />
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Don't have an organization account?</p>
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Register your company →
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>By signing in, you agree to our</p>
            <div className="flex justify-center gap-4 mt-1">
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
