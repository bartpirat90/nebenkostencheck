import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(process.env.NODE_ENV !== "production") }];
  },
};

// Plugin findet die Request-Konfig automatisch unter ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
