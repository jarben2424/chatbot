/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatar.vercel.sh'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent browser-side bundling of server-only packages
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
        snowflake: false,
        'snowflake-sdk': false,
        'gcp-metadata': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
