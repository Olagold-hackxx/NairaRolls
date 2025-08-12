/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NAIRA_ROLLS_MULTISIG_FACTORY: process.env.NAIRA_ROLLS_MULTISIG_FACTORY,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
  },
};

export default nextConfig;
