/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BATCH_PAYROLL_ADDRESS: process.env.BATCH_PAYROLL_ADDRESS,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
  },
};

export default nextConfig;
