import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@signa-chain/ui', '@signa-chain/vc-sdk', '@signa-chain/types'],
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  async headers() {
    return [
      {
        // Content-Security-Policy is set per-request in middleware.ts (needs a
        // fresh nonce every time for script-src, since Next.js hydration relies
        // on inline scripts that a static nonce-less CSP would otherwise block).
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' }, // CSP supersedes legacy XSS header
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  // Never expose server-side environment variables to the client unless explicitly prefixed NEXT_PUBLIC_
  env: {},
};

export default nextConfig;
