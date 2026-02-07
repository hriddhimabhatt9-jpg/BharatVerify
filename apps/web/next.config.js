/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable experimental features for better performance
    experimental: {
        // Enable server actions for form handling
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Environment variables that should be available on the client
    env: {
        NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS,
        NEXT_PUBLIC_POLYGON_AMOY_RPC: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC,
    },
};

module.exports = nextConfig;
