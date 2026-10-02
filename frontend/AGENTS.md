<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Project-specific rules (NOT managed by `next dev`; safe to keep/commit) -->
# Deployment guard rails (Cloudflare Workers + vinext) — READ BEFORE TOUCHING BUILD/DEPLOY FILES

Production runs on Cloudflare Workers via **vinext** (`vite build` + `cf deploy`). This setup already broke once
(Cloudflare error 10021 `No such module "__vinext_action_owner_manifest.js"`, then a `react-server` condition error).
Root cause and proof: `../DEPLOY_FIX_REPORT.md`.

**Hard rules**

1. In `vite.config.ts` the Cloudflare plugin MUST be exactly
   `cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })`.
   NEVER replace it with a bare `cloudflare()` and never remove `viteEnvironment`.
2. NEVER hand-edit or copy files into `.cloudflare/output/**` or `dist/**` — they are build output.
3. NEVER "fix" deploy problems by adding `wrangler.jsonc`, OpenNext, or switching adapters.
4. NEVER delete or bypass `scripts/verify-worker-bundle.mjs`. If it fails, fix the cause it prints.
5. `NEXT_PUBLIC_API_URL` is baked in at build time; set it in the shell before `npm run build:vinext`.

**Required check after any change that touches build, config, or dependencies**

```
npm run build:vinext     # must end with: [verify-worker-bundle] OK (config + bundle)
```

Deploy with `npm run deploy:vinext` (its `predeploy:vinext` re-checks the config automatically).


# Storefront data guard rails — READ BEFORE TOUCHING products / product page / home modal

Root cause + proof: `PRODUCT_MODAL_FIX_REPORT.md` (in the project root).

1. Display pages (home, shop, product) MUST load products with `fetchProductsSafe()` from `lib/products.js`.
   NEVER use `fetchProducts().catch(() => ({ bySlug: {} }))` — an empty catalog crashed `/product/[slug]`
   (`reading 'title'`) and silently disabled the home-page product modal.
2. Never assume `PRODUCTS[key]`, `product.benefits` or `product.emoji` exist in `_bodyScript.js` files.
3. Home page: clicking a product image opens the info modal (title, benefits, price, add-to-cart); only the small arrow dot
   goes to `/product/[slug]`. Do not change this.
4. Images live in `public/images/**` (downloaded once on purpose). Do not delete them or switch to hotlinks.
