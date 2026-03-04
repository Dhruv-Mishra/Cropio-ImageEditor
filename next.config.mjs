/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/crop-suggest',
        destination: 'http://127.0.0.1:8000/api/crop-suggest',
      },
      {
        source: '/api/health',
        destination: 'http://127.0.0.1:8000/api/health',
      },
    ];
  },
};

export default nextConfig;
