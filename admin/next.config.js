/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'utsav-media.s3.ap-south-1.amazonaws.com'],
  },
};

module.exports = nextConfig;
