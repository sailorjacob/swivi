/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent warnings from failing deployment
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'twejikjgxkzmphocbvpt.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'xaxleljcctobmnwiwxvx.supabase.co',
      },
    ],
  },
  // Optimize for Vercel builds
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Better error handling during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Ensure environment variables are available during build
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 