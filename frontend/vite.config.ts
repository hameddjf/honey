import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    // !!! DO NOT SIMPLIFY THIS TO a bare `cloudflare()` !!!
    // vinext (App Router) needs the Worker to be built in the "rsc" Vite environment,
    // with "ssr" as its child. With a bare cloudflare() the Worker is built in the "ssr"
    // environment instead, which causes BOTH of these production-only failures:
    //   - Cloudflare error 10021: No such module "__vinext_action_owner_manifest.js"
    //   - Uncaught Error: The "react" package ... "react-server" condition must be enabled
    // (details: ../DEPLOY_FIX_REPORT.md). `npm run build:vinext` verifies this automatically.
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
