import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.10.10.11', '192.168.0.49', 'localhost'],
  serverExternalPackages: ['adm-zip'],
  async redirects() {
    return [
      {
        source: '/portal/costing/bulk',
        destination: '/portal/costing?tab=bulk',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
