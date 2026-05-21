import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdfkit', 'swissqrbill'],
};

export default nextConfig;
