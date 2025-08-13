import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from '@/components/ui/toaster'
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NairaRolls - Web3 Payroll Management',
  description: 'Enterprise payroll management with cNGN and multisig approvals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThirdwebProvider>
          <SonnerToaster />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
