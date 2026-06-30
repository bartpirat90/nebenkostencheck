import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Plugin findet die Request-Konfig automatisch unter ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
