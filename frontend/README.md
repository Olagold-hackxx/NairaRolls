# NairaRolls - Enterprise Web3 Payroll Management

<div align="center">
  <img src="/placeholder.svg?height=120&width=120" alt="NairaRolls Logo" width="120" height="120">
  
  **Secure, compliant, and transparent payroll management using MPC wallet technology and cNGN stablecoin.**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
  [![Web3](https://img.shields.io/badge/Web3-Enabled-orange)](https://web3js.org/)
  [![cNGN](https://img.shields.io/badge/cNGN-Integrated-green)](https://cngn.io/)

</div>

## 🚀 Overview

NairaRolls is an enterprise-grade payroll management platform that leverages Web3 technology to provide secure, transparent, and efficient payroll processing. Built with Multi-Party Computation (MPC) wallet technology and integrated with cNGN stablecoin, it offers unparalleled security and compliance for organizations across Nigeria and beyond.

### Key Benefits

- **🔒 Zero Security Risk**: MPC technology eliminates single points of failure
- **⚡ Instant Settlements**: Process payroll in seconds, not days
- **💰 Cost Efficient**: Reduce transaction fees by up to 90%
- **📊 Audit Compliant**: Built-in audit trails and compliance reporting
- **🌐 Multi-Chain Support**: Deploy across Base, Polygon, and BNB Chain

## ✨ Features

### Core Functionality
- **MPC Wallet Security**: Multi-Party Computation ensures no single private key exists
- **Multi-Signer Approvals**: Customizable approval workflows (2-of-3, 3-of-5, etc.)
- **Bulk Payment Processing**: Process hundreds of payments in a single transaction
- **Complete Transparency**: On-chain transaction recording with full audit trails
- **Employee Management**: Comprehensive employee database with role-based access
- **Real-time Notifications**: Instant alerts for approval requests and status updates

### Advanced Features
- **CSV Bulk Upload**: Import employee data and payment information via CSV
- **Custom Approval Workflows**: Define organization-specific approval processes
- **Transaction History**: Complete blockchain transaction tracking
- **Compliance Reporting**: Export audit reports with one click
- **Multi-Network Support**: Cross-chain compatibility for maximum flexibility

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui
- **State Management**: Zustand with persistence
- **Icons**: Lucide React

### Web3 Integration
- **Wallet Technology**: MPC (Multi-Party Computation)
- **Blockchain Networks**: Base, Polygon, BNB Chain
- **Stablecoin**: cNGN (Central Bank Digital Currency)
- **Smart Contracts**: Multi-signature wallet contracts

### Development Tools
- **Package Manager**: npm/yarn
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## 📦 Installation

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Git

### Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-org/nairarolls-frontend.git
   cd nairarolls-frontend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Configure the following variables:
   \`\`\`env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
   NEXT_PUBLIC_CHAIN_ID=8453  # Base mainnet
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

\`\`\`
nairarolls-frontend/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard layout group
│   │   ├── dashboard/           # Main dashboard
│   │   ├── employees/           # Employee management
│   │   ├── payments/            # Payment processing
│   │   ├── approvals/           # Approval workflows
│   │   ├── transactions/        # Transaction history
│   │   └── settings/            # Organization settings
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── providers/               # Context providers
│   ├── ui/                      # shadcn/ui components
│   └── notifications/           # Notification system
├── lib/                         # Utility libraries
│   ├── store.ts                 # Zustand store
│   ├── types.ts                 # TypeScript definitions
│   └── utils.ts                 # Helper functions
├── hooks/                       # Custom React hooks
└── public/                      # Static assets
\`\`\`

## 🎯 Usage Guide

### Getting Started

1. **Connect Your Wallet**
   - Click "Connect Wallet" on the landing page
   - Approve the connection in your wallet

2. **Complete Organization Setup**
   - Fill in your organization details
   - Set up your admin profile
   - Configure initial settings

3. **Add Employees**
   - Navigate to Employees section
   - Add individual employees or bulk upload via CSV
   - Include wallet addresses, names, and roles

4. **Create Payment Batches**
   - Go to Payments → New Payment
   - Configure batch details and signers
   - Select employees and set amounts
   - Submit for approval

5. **Approve Payments**
   - Signers receive notifications
   - Review payment details
   - Approve or reject with reasons
   - Payments execute automatically when threshold is met

### Key Workflows

#### Employee Management
\`\`\`typescript
// Add new employee
const employee = {
  walletAddress: "0x...",
  name: "John Doe",
  role: "Software Engineer",
  department: "Engineering"
}
\`\`\`

#### Payment Processing
\`\`\`typescript
// Create payment batch
const paymentBatch = {
  name: "Monthly Salary - December 2024",
  totalAmount: "1000000", // in cNGN wei
  signerAddresses: ["0x...", "0x...", "0x..."],
  signatureThreshold: 60, // 60% approval required
  employees: [
    { address: "0x...", amount: "500000" },
    { address: "0x...", amount: "500000" }
  ]
}
\`\`\`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_CHAIN_ID` | Default blockchain network ID | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

### Supported Networks

| Network | Chain ID | cNGN Contract |
|---------|----------|---------------|
| Base Mainnet | 8453 | `0x...` |
| Polygon | 137 | `0x...` |
| BNB Chain | 56 | `0x...` |

## 🧪 Testing

### Run Tests
\`\`\`bash
npm run test
# or
yarn test
\`\`\`

### Run E2E Tests
\`\`\`bash
npm run test:e2e
# or
yarn test:e2e
\`\`\`

### Type Checking
\`\`\`bash
npm run type-check
# or
yarn type-check
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Manual Deployment
\`\`\`bash
npm run build
npm run start
\`\`\`

### Docker
\`\`\`bash
docker build -t nairarolls-frontend .
docker run -p 3000:3000 nairarolls-frontend
\`\`\`

## 🔐 Security

### MPC Wallet Architecture
- No single private key exists
- Key shares distributed across multiple parties
- Threshold signatures prevent unauthorized access
- Hardware security module (HSM) integration

### Best Practices
- Always use HTTPS in production
- Implement proper CORS policies
- Regular security audits
- Multi-factor authentication for admin accounts

## 📊 Monitoring & Analytics

### Performance Monitoring
- Real-time transaction tracking
- Payment success rates
- System uptime monitoring
- User engagement metrics

### Compliance Reporting
- Automated audit trail generation
- Regulatory compliance checks
- Transaction history exports
- Financial reporting integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- Follow TypeScript strict mode
- Use Prettier for formatting
- Write meaningful commit messages
- Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](https://docs.nairarolls.com)
- [User Guide](https://help.nairarolls.com)
- [Developer Resources](https://dev.nairarolls.com)

### Community
- [Discord Community](https://discord.gg/nairarolls)
- [GitHub Discussions](https://github.com/nairarolls/frontend/discussions)
- [Twitter](https://twitter.com/nairarolls)

### Enterprise Support
For enterprise support and custom implementations:
- Email: enterprise@nairarolls.com
- Schedule a demo: [calendly.com/nairarolls](https://calendly.com/nairarolls)

## 🗺 Roadmap

### Q1 2024
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] API rate limiting and quotas
- [ ] Multi-language support

### Q2 2024
- [ ] Integration with traditional banking
- [ ] Advanced compliance features
- [ ] White-label solutions
- [ ] Enhanced security features

### Q3 2024
- [ ] AI-powered fraud detection
- [ ] Cross-border payment support
- [ ] Advanced reporting tools
- [ ] Enterprise SSO integration

---

<div align="center">
  <p>Built with ❤️ by the NairaRolls team</p>
  <p>
    <a href="https://nairarolls.com">Website</a> •
    <a href="https://docs.nairarolls.com">Documentation</a> •
    <a href="https://twitter.com/nairarolls">Twitter</a> •
    <a href="https://discord.gg/nairarolls">Discord</a>
  </p>
</div>
