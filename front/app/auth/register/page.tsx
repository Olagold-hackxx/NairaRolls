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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowLeft, Users, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const registrationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  organizationType: z.string().min(1, 'Please select organization type'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  description: z.string().optional(),
  expectedVolume: z.string().min(1, 'Please select expected volume'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreeToMarketing: z.boolean().optional()
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  })

  const organizationTypes = [
    'Small Business (1-50 employees)',
    'Medium Enterprise (51-500 employees)',
    'Large Enterprise (500+ employees)',
    'NGO/Non-Profit',
    'Government Agency',
    'Freelancer Platform',
    'Other'
  ]

  const volumeOptions = [
    'Less than ₦1M monthly',
    '₦1M - ₦10M monthly',
    '₦10M - ₦100M monthly',
    '₦100M+ monthly'
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'MPC wallet technology with multi-signature approvals'
    },
    {
      icon: Zap,
      title: 'Instant Processing',
      description: 'Process payroll in seconds with cNGN stablecoin'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Role-based access and approval workflows'
    }
  ]

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Registration successful!',
        description: 'Welcome to NairaRolls. Check your email for next steps.',
      })
      
      // Redirect to onboarding or dashboard
      router.push('/onboarding')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                {...register('organizationName')}
                placeholder="Acme Corporation"
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type *</Label>
              <Select onValueChange={(value) => setValue('organizationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {organizationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organizationType && (
                <p className="text-sm text-destructive">{errors.organizationType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedVolume">Expected Monthly Volume *</Label>
              <Select onValueChange={(value) => setValue('expectedVolume', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expected volume" />
                </SelectTrigger>
                <SelectContent>
                  {volumeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expectedVolume && (
                <p className="text-sm text-destructive">{errors.expectedVolume.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brief Description (Optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Tell us about your organization and payroll needs..."
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Primary Contact Name *</Label>
              <Input
                id="contactName"
                {...register('contactName')}
                placeholder="John Doe"
              />
              {errors.contactName && (
                <p className="text-sm text-destructive">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                {...register('contactEmail')}
                placeholder="john@company.com"
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber')}
                placeholder="+234 800 000 0000"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  onCheckedChange={(checked) => setValue('agreeToTerms', checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="agreeToTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the Terms of Service and Privacy Policy *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToMarketing"
                  onCheckedChange={(checked) => setValue('agreeToMarketing', checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="agreeToMarketing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Send me product updates and marketing communications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You can unsubscribe at any time
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll review your application within 24 hours</li>
                <li>• You'll receive setup instructions via email</li>
                <li>• Our team will help you configure your MPC wallet</li>
                <li>• Start processing payroll immediately</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">NairaRolls</h1>
              <Badge variant="secondary" className="mt-1">Enterprise</Badge>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Join 500+ Organizations
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Transform your payroll operations with enterprise-grade security and compliance.
              </p>
            </div>
            
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <benefit.icon className="h-6 w-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-primary-foreground/80">
                      {benefit.description}
                    </p>
                  </div>
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

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
            <h1 className="text-2xl font-bold">Create Organization Account</h1>
            <p className="text-muted-foreground mt-2">
              Step {step} of 3: {
                step === 1 ? 'Organization Details' :
                step === 2 ? 'Contact Information' : 'Terms & Confirmation'
              }
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center space-x-4 mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {step > stepNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${step > stepNumber ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {step === 1 && 'Organization Information'}
                {step === 2 && 'Contact Details'}
                {step === 3 && 'Review & Confirm'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Tell us about your organization'}
                {step === 2 && 'How can we reach you?'}
                {step === 3 && 'Review your information and agree to terms'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                {renderStepContent()}

                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                  >
                    Previous
                  </Button>

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={() => setStep(step + 1)}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Already have an account?</p>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
