import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The project's canonical .env file lives at the repository root (one
// level above frontend/), shared with the Django backend — see
// /.env.example at the repo root. Loaded here so that ONE root .env is
// enough for local dev; nothing else in the frontend needs to know about
// it, since env vars it sets land in process.env just like any other
// source. dotenv never overwrites a variable that's already set, so this
// never overrides a value the hosting platform (e.g. the Cloudflare Pages
// project's own Environment Variables) already provided, and it's a
// harmless no-op when the file doesn't exist (e.g. on a CI/production
// build machine that never has this file).
loadEnv({ path: path.resolve(__dirname, "..", ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly forwards this into the client bundle regardless of which of
  // the sources above set it (root .env locally, or a real platform env
  // var in production) — see lib/api/client.js for where it's read.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
