# Instructions for AI coding agents

- Frontend (Next.js App Router on Cloudflare Workers via vinext) lives in `frontend/`.
  **Before changing anything related to build, deploy, `vite.config.ts` or dependencies, read
  `frontend/AGENTS.md` ("Deployment guard rails") and `DEPLOY_FIX_REPORT.md`.**
- After such changes run, from `frontend/`: `npm run build:vinext` — it must end with
  `[verify-worker-bundle] OK (config + bundle)`.
- Backend is Django in `backend/`.


# Storefront data guard rails — READ BEFORE TOUCHING products / product page / home modal

Root cause + proof: `PRODUCT_MODAL_FIX_REPORT.md` (in the project root).

1. Display pages (home, shop, product) MUST load products with `fetchProductsSafe()` from `lib/products.js`.
   NEVER use `fetchProducts().catch(() => ({ bySlug: {} }))` — an empty catalog crashed `/product/[slug]`
   (`reading 'title'`) and silently disabled the home-page product modal.
2. Never assume `PRODUCTS[key]`, `product.benefits` or `product.emoji` exist in `_bodyScript.js` files.
3. Home page: clicking a product image opens the info modal (title, benefits, price, add-to-cart); only the small arrow dot
   goes to `/product/[slug]`. Do not change this.
4. Images live in `public/images/**` (downloaded once on purpose). Do not delete them or switch to hotlinks.
