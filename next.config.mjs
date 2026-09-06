import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Noto-Sans-TTFs (fuer PDF-Briefe/Bericht) muessen ins Serverless-Bundle,
  // sonst fehlen sie bei Vercel und @react-pdf faellt auf Helvetica zurueck.
  outputFileTracingIncludes: {
    "/api/generate-letter": ["./src/lib/pdf/fonts/*"],
    "/api/generate-report": ["./src/lib/pdf/fonts/*"],
    "/api/send-pdf": ["./src/lib/pdf/fonts/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(process.env.NODE_ENV !== "production") }];
  },
};

// Plugin findet die Request-Konfig automatisch unter ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
