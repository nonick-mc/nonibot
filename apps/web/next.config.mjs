import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedEnv: true,
  },
  images: {
    remotePatterns: [new URL('https://cdn.nonick.net/**')],
  },
  typedRoutes: true,
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
