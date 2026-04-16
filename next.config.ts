import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Needed so jsPDF/html2canvas load only client-side
  },
  // Allow World Bank API calls during SSR
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
