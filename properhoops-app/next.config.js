/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  },
  experimental: {
    serverActions: { allowedOrigins: ['properhoops.au', 'www.properhoops.au'] }
  }
}

module.exports = nextConfig
