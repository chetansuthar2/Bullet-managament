// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  // ❌ Remove or comment this line
  webpack: (config, { isServer }) => {
    // Fix for MongoDB in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
