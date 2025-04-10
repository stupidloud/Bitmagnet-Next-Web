const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n');

const mode = process.env.BUILD_MODE ?? 'standalone';
console.log("[Next] build mode:", mode);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: mode,
  experimental: {
    serverComponentsExternalPackages: [
      '@node-rs/jieba'
    ]
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in the app.
        source: '/:path((?!api/).*)', // Match all paths except those starting with /api/
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=50',
          },
        ],
      },
    ]
  }
}

module.exports = withNextIntl(nextConfig);
