/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce dev memory usage by disabling filesystem cache
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;

