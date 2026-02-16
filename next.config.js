/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Enable SWC minification
//   swcMinify: true,
  // Disable telemetry
  
};

module.exports = nextConfig;