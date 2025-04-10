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
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120'
          }
        ]
      }
    ];
  }
}

module.exports = withNextIntl(nextConfig);
