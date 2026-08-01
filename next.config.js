const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n');

const mode = process.env.BUILD_MODE;
console.log("[Next] build mode:", mode);

/** @type {import('next').NextConfig} */
const nextConfig = {};

if (mode) {
  nextConfig.output = mode;
}

module.exports = withNextIntl(nextConfig);
