// Deploy guard for Cloudflare Workers (vinext). Fails the build/deploy EARLY, with a
// clear message, instead of letting Cloudflare reject it with a cryptic error.
//
//   node scripts/verify-worker-bundle.mjs               config check + built bundle check
//   node scripts/verify-worker-bundle.mjs --config-only config check only (no build needed)
//
// Wired into package.json:  build:vinext (full)  and  predeploy:vinext (config only).
//
// What it protects against (see ../DEPLOY_FIX_REPORT.md):
//   1. vite.config.ts calling a bare `cloudflare()`. vinext (App Router) needs
//      cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } }).
//      Otherwise the Worker is built in the wrong Vite environment and you get
//        - Cloudflare error 10021: No such module "__vinext_action_owner_manifest.js"
//        - Uncaught Error: The "react" package ... "react-server" condition must be enabled
//   2. A built Worker bundle whose relative imports point to files that are missing.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configOnly = process.argv.includes("--config-only");
const problems = [];

// ---- 1. vite.config.ts -------------------------------------------------------
const viteConfigPath = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"]
  .map((f) => path.join(root, f))
  .find((f) => fs.existsSync(f));

if (!viteConfigPath) {
  problems.push("vite.config.* not found in frontend/.");
} else {
  const code = fs
    .readFileSync(viteConfigPath, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip block comments
    .replace(/(^|[^:])\/\/.*$/gm, "$1"); // strip line comments (keeps https://)
  const hasCorrectCloudflareCall =
    /cloudflare\s*\(\s*\{[\s\S]*?viteEnvironment\s*:\s*\{[\s\S]*?name\s*:\s*["']rsc["'][\s\S]*?childEnvironments\s*:\s*\[[^\]]*["']ssr["']/.test(
      code,
    );
  if (!hasCorrectCloudflareCall) {
    problems.push(
      `${path.basename(viteConfigPath)}: the cloudflare() plugin must be called as\n` +
        `         cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })\n` +
        `       A bare cloudflare() builds the Worker in the wrong environment (error 10021 / "react-server" error).`,
    );
  }
}

// ---- 2. built Worker bundle --------------------------------------------------
const STATIC_IMPORT_RE = /(?:\bimport|\bfrom)\s*(["'])(\.{1,2}\/[^"'\n]+?\.(?:m?js|cjs))\1/g;
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*(["'`])(\.{1,2}\/[^"'`\n]+?\.(?:m?js|cjs))\1\s*\)/g;

function scriptFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return scriptFiles(full);
    return /\.(m?js|cjs)$/.test(e.name) ? [full] : [];
  });
}

if (!configOnly) {
  const workersDir = path.join(root, ".cloudflare", "output", "v0", "workers");
  const bundles = fs.existsSync(workersDir)
    ? fs
        .readdirSync(workersDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(workersDir, d.name, "bundle"))
        .filter((d) => fs.existsSync(d))
    : [];

  if (bundles.length === 0) {
    problems.push("No Worker bundle found in .cloudflare/output/v0/workers/*/bundle - did `vite build` run?");
  }

  for (const bundle of bundles) {
    if (!fs.existsSync(path.join(bundle, "index.js"))) {
      problems.push(`${path.relative(root, bundle)}: index.js (Worker entry) is missing.`);
    }
    for (const file of scriptFiles(bundle)) {
      const code = fs.readFileSync(file, "utf8");
      const specs = new Set();
      for (const re of [STATIC_IMPORT_RE, DYNAMIC_IMPORT_RE]) {
        re.lastIndex = 0;
        for (let m; (m = re.exec(code)) !== null; ) specs.add(m[2]);
      }
      for (const spec of specs) {
        if (!fs.existsSync(path.resolve(path.dirname(file), spec))) {
          problems.push(
            `${path.relative(bundle, file)} imports "${spec}" but that file is not in the Worker bundle ` +
              `(Cloudflare would reject the upload with error 10021).`,
          );
        }
      }
    }
  }
}

// ---- result ------------------------------------------------------------------
if (problems.length) {
  console.error("\n[verify-worker-bundle] FAILED - fix this BEFORE deploying:\n");
  for (const p of problems) console.error(`  x ${p}`);
  console.error("\n  Read ../DEPLOY_FIX_REPORT.md for the full explanation.\n");
  process.exit(1);
}
console.log(`[verify-worker-bundle] OK (${configOnly ? "config" : "config + bundle"})`);
