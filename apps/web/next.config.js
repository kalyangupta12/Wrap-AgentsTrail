/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@wrap/db", "@wrap/config"],
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
    serverComponentsExternalPackages: ["@prisma/client", "prisma"]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
