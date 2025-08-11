"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWeb3 } from "@/components/providers/web3-provider"
import { useRouter } from "next/navigation"
import {
  Building2,
  Shield,
  Users,
  Coins,
  Zap,
  CheckCircle,
  ArrowRight,
  Globe,
  Lock,
  TrendingUp,
  Star,
  Wallet,
  UserPlus,
  Network,
  Play,
  Eye,
  Clock,
  FileText,
  Award,
} from "lucide-react"

function OrganizationRegistrationForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    organizationName: "",
    industry: "",
    size: "",
    description: "",
    adminName: "",
    adminEmail: "",
    adminRole: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save organization data to backend
    console.log("Organization registration:", formData)
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="size">Organization Size</Label>
          <Select value={formData.size} onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-1000">201-1000 employees</SelectItem>
              <SelectItem value="1000+">1000+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="adminRole">Your Role</Label>
          <Input
            id="adminRole"
            placeholder="e.g., CEO, HR Manager"
            value={formData.adminRole}
            onChange={(e) => setFormData((prev) => ({ ...prev, adminRole: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Organization Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of your organization"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="adminName">Your Full Name</Label>
          <Input
            id="adminName"
            value={formData.adminName}
            onChange={(e) => setFormData((prev) => ({ ...prev, adminName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="adminEmail">Your Email</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Complete Registration
      </Button>
    </form>
  )
}

export default function LandingPage() {
  const { isConnected, account, connect } = useWeb3()
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    if (account) {
      // TODO: Check backend if this wallet address is registered
      // For now, using localStorage as mock
      const registered = localStorage.getItem(`registered_${account}`)
      setIsRegistered(!!registered)
    }
  }, [account])

  const handleMainCTA = async () => {
    if (!isConnected) {
      try {
        await connect()
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      }
    } else if (isRegistered) {
      router.push("/dashboard")
    } else {
      setShowRegistration(true)
    }
  }

  const handleRegistrationComplete = () => {
    if (account) {
      localStorage.setItem(`registered_${account}`, "true")
      setIsRegistered(true)
      setShowRegistration(false)
      router.push("/dashboard")
    }
  }

  const getCTAText = () => {
    if (!isConnected) return "Connect Wallet"
    if (!isRegistered) return "Complete Setup"
    return "Go to Dashboard"
  }

  const getCTAIcon = () => {
    if (!isConnected) return <Wallet className="w-4 h-4" />
    if (!isRegistered) return <UserPlus className="w-4 h-4" />
    return <ArrowRight className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/90 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-white">NairaRolls</span>
              <Badge className="ml-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
                Enterprise
              </Badge>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="#solutions"
                className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
              >
                Solutions
              </Link>
              <Link
                href="#security"
                className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
              >
                Security
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {isConnected && (
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
              )}
              <Button onClick={handleMainCTA} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {getCTAIcon()}
                {getCTAText()}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Organization Setup</DialogTitle>
            <DialogDescription>
              Please provide your organization details to get started. Make sure to use your organization wallet for all
              transactions.
            </DialogDescription>
          </DialogHeader>
          <OrganizationRegistrationForm onComplete={handleRegistrationComplete} />
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Important:</strong> Please ensure you're using your organization's designated wallet address. This
              wallet will be used for all payroll transactions and multisig operations.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Floating Geometric Shapes */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-teal-200/20 rounded-full blur-xl animate-pulse delay-1000" />
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-green-200/20 rounded-full blur-xl animate-pulse delay-500" />
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-emerald-300/20 rounded-full blur-xl animate-pulse delay-700" />

          {/* Hexagonal Pattern */}
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border-2 border-emerald-200/30 transform rotate-45 rounded-lg" />
          </div>
          <div className="absolute top-3/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
            <div className="w-24 h-24 border-2 border-teal-200/30 transform rotate-12 rounded-lg" />
          </div>

          {/* Blockchain Network Visualization */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
            <div className="relative w-96 h-96">
              {/* Central Node */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-400 rounded-full" />

              {/* Surrounding Nodes */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-300 rounded-full" />
              <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-emerald-300 rounded-full" />
              <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-emerald-300 rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-emerald-300 rounded-full" />
              <div className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-200 rounded-full" />
              <div className="absolute top-1/2 right-0 w-2 h-2 bg-emerald-200 rounded-full" />
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-200 rounded-full" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-emerald-200 rounded-full" />

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 384">
                <line x1="192" y1="192" x2="96" y2="96" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="288" y2="96" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="96" y2="288" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="288" y2="288" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="0" y2="192" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="384" y2="192" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="192" y2="0" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
                <line x1="192" y1="192" x2="192" y2="384" stroke="rgb(16 185 129 / 0.2)" strokeWidth="1" />
              </svg>
            </div>
          </div>

          {/* Floating Icons */}
          <div className="absolute top-32 right-32 opacity-10 animate-bounce">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="absolute bottom-32 left-32 opacity-10 animate-bounce delay-300">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="absolute top-1/2 right-16 opacity-10 animate-bounce delay-700">
            <Network className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="absolute bottom-1/4 right-1/3 opacity-10 animate-bounce delay-1000">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white border-0">
              🚀 Now supporting cNGN on Base, Polygon & BNB Chain
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
              Enterprise Payroll
              <span className="text-primary block">Powered by Web3</span>
            </h1>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Secure, compliant, and transparent payroll management using MPC wallet technology and cNGN stablecoin.
              Process bulk payments with multi-signer approvals in seconds, not days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-slate-700 hover:bg-slate-600 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-sm"
                >
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
            >
              Core Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Built for Enterprise Security & Compliance
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Every feature designed with security, compliance, and user experience in mind
            </p>
          </div>

          {/* Asymmetrical Feature Layout */}
          <div className="space-y-16">
            {/* First Row - 2 features */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {features.slice(0, 2).map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6">
                        <feature.icon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <Badge variant="secondary" className="mb-4 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {feature.highlight}
                      </Badge>
                      <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Second Row - 1 feature centered */}
            <div className="max-w-2xl mx-auto">
              <div className="group">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full group-hover:scale-125 transition-transform duration-500" />
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      {React.createElement(features[2].icon, { className: "h-8 w-8 text-emerald-600" })}
                    </div>
                    <Badge
                      variant="secondary"
                      className="mb-4 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {features[2].highlight}
                    </Badge>
                    <h3 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{features[2].title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {features[2].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Row - 3 features */}
            <div className="grid md:grid-cols-3 gap-6">
              {features.slice(3).map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700 h-full">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="mb-3 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {feature.highlight}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/20 dark:bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Why Choose NairaRolls?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Measurable benefits that transform your payroll operations
            </p>
          </div>

          {/* Grid Layout for Better Mobile Experience */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">{benefit.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{benefit.description}</p>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                      {benefit.metric}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="solutions" className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
            >
              Solutions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Trusted by Organizations Across Nigeria
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From startups to government agencies, see how different organizations use NairaRolls
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="p-8 hover:shadow-lg transition-shadow border-slate-200  dark:bg-gradient-to-br dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-4 mb-6">
                  <useCase.icon className="h-12 w-12 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{useCase.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{useCase.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {useCase.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
              >
                Security First
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Enterprise-Grade Security Architecture
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Built with MPC technology and multi-layer security protocols
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">MPC Wallet Technology</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No single private key exists. Funds secured through distributed key shares.
                </p>
              </Card>
              <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Multi-Signer Approvals</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customizable approval thresholds prevent unauthorized transactions.
                </p>
              </Card>
              <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
                <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Complete Transparency</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Every transaction recorded on-chain with full audit trails.
                </p>
              </Card>
            </div>

            <Card className="p-8 bg-primary text-primary-foreground">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Zero Security Incidents Since Launch</h3>
                <p className="text-primary-foreground/80 mb-6">
                  Our MPC architecture ensures your funds are always secure, with no single point of failure.
                </p>
                <Button variant="secondary">Learn About Our Security</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Trusted by Finance Leaders
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              See what our customers say about transforming their payroll operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-slate-200 dark:border-slate-700">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Payroll?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations already using NairaRolls for secure, compliant, and efficient payroll
            management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="text-sm text-primary-foreground/60 mt-6">No setup fees • 30-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-white">NairaRolls</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Enterprise payroll management powered by Web3 technology and cNGN stablecoin.
              </p>
              <div className="flex gap-4">
                <Badge variant="outline" className="border-gray-600 text-gray-400">
                  SOC 2 Compliant
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-gray-400">
                  ISO 27001
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#security" className="hover:text-primary transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-primary transition-colors">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-primary transition-colors">
                    System Status
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2024 NairaRolls. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-400">Powered by</span>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                cNGN
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                Base
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                Polygon
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Shield,
    title: "MPC Wallet Security",
    description:
      "Multi-Party Computation ensures no single point of failure. Your funds are secured with distributed key shares across multiple signers.",
    highlight: "Enterprise-Grade Security",
  },
  {
    icon: Users,
    title: "Multi-Signer Approvals",
    description:
      "Define custom approval workflows with role-based access. Set thresholds like 2-of-3 or 3-of-5 for maximum security.",
    highlight: "Customizable Workflows",
  },
  {
    icon: Zap,
    title: "Bulk Payments",
    description:
      "Process hundreds of payments in a single transaction. Save time and reduce costs with batch processing capabilities.",
    highlight: "Efficient Processing",
  },
  {
    icon: Eye,
    title: "Complete Transparency",
    description:
      "Every transaction is recorded on-chain with full audit trails. Export compliance reports with one click.",
    highlight: "Audit Ready",
  },
  {
    icon: Network,
    title: "Multi-Chain Support",
    description: "Deploy across multiple blockchain networks where cNGN operates, ensuring flexibility and redundancy.",
    highlight: "Cross-Chain Compatible",
  },
  {
      icon: Coins,
      title: 'cNGN Integration',
      description: 'Fully integrated with regulated cNGN stablecoin for compliant, instant settlements on Polygon, BNB Chain, and Base networks.',
      highlight: 'Regulatory Compliant'
    }
]

const benefits = [
  {
    icon: Clock,
    title: "Instant Settlements",
    description: "Process payroll in seconds, not days",
    metric: "99.9% Uptime",
  },
  {
    icon: Lock,
    title: "Zero Fraud Risk",
    description: "MPC technology eliminates single points of failure",
    metric: "100% Secure",
  },
  {
    icon: TrendingUp,
    title: "Cost Efficient",
    description: "Reduce transaction fees by up to 90%",
    metric: "Save $1000s",
  },
  {
    icon: FileText,
    title: "Compliance Ready",
    description: "Built-in audit trails and reporting",
    metric: "Audit Compliant",
  },
]

const useCases = [
  {
    title: "Small & Medium Enterprises",
    description: "Streamline payroll for growing teams with secure, automated payments",
    icon: Building2,
    features: ["Employee salary management", "Contractor payments", "Multi-department approvals"],
  },
  {
    title: "NGOs & Non-Profits",
    description: "Distribute funds transparently to multiple beneficiaries with full accountability",
    icon: Users,
    features: ["Beneficiary payments", "Grant distributions", "Transparent reporting"],
  },
  {
    title: "Freelancer Platforms",
    description: "Enable instant, secure payments to freelancers across Nigeria and beyond",
    icon: Globe,
    features: ["Instant payouts", "Multi-currency support", "Automated settlements"],
  },
  {
    title: "Government Agencies",
    description: "Pilot digital payroll systems with full compliance and audit capabilities",
    icon: Award,
    features: ["Regulatory compliance", "Audit trails", "Secure multi-sig approvals"],
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CFO, TechCorp Nigeria",
    content:
      "NairaRolls transformed our payroll process. What used to take 3 days now happens in minutes, with complete security and transparency.",
    rating: 5,
  },
  {
    name: "Michael Adebayo",
    role: "Operations Director, Hope Foundation",
    content:
      "The multi-signer approval system gives us the security we need for our beneficiary payments. The audit trail is invaluable.",
    rating: 5,
  },
  {
    name: "Fatima Al-Hassan",
    role: "HR Manager, Digital Solutions Ltd",
    content:
      "Finally, a payroll system that understands the Nigerian market. cNGN integration makes compliance seamless.",
    rating: 5,
  },
]

const stats = [
  { value: "₦2.5B+", label: "Processed in Payments" },
  { value: "500+", label: "Organizations Trust Us" },
  { value: "50,000+", label: "Employees Paid" },
  { value: "99.9%", label: "Uptime Guarantee" },
]
