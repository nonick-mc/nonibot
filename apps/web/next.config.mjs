import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedEnv: true,
  },
  typedRoutes: true,
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
