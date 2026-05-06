import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.10.10.11', '192.168.0.49', 'localhost'],
  serverExternalPackages: ['adm-zip'],
};

export default nextConfig;
