/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://weather-backend-env.eba-7sc9xmff.us-east-1.elasticbeanstalk.com/:path*',
      },
    ];
  },
};

export default nextConfig;