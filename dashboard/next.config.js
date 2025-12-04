/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable if CCG server runs on different port
  async rewrites() {
    return [
      {
        source: '/api/ccg/:path*',
        destination: 'http://localhost:3334/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
