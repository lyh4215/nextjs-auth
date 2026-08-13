import type { NextConfig } from "next";

const configuredServerActionOrigins =
  process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const developmentServerActionOrigins =
  process.env.NODE_ENV === "development"
    ? [`localhost:${process.env.PORT ?? "3000"}`, `127.0.0.1:${process.env.PORT ?? "3000"}`]
    : [];

const allowedOrigins = [
  ...developmentServerActionOrigins,
  ...configuredServerActionOrigins,
];

const nextConfig: NextConfig = {
  ...(allowedOrigins.length > 0 && {
    experimental: {
      // Codespaces and similar reverse proxies may forward an app.github.dev
      // host while the browser-facing development Origin remains localhost.
      serverActions: { allowedOrigins },
    },
  }),
};

export default nextConfig;
