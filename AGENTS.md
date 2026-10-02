# Instructions for AI coding agents

- Frontend (Next.js App Router on Cloudflare Workers via vinext) lives in `frontend/`.
  **Before changing anything related to build, deploy, `vite.config.ts` or dependencies, read
  `frontend/AGENTS.md` ("Deployment guard rails") and `DEPLOY_FIX_REPORT.md`.**
- After such changes run, from `frontend/`: `npm run build:vinext` — it must end with
  `[verify-worker-bundle] OK (config + bundle)`.
- Backend is Django in `backend/`.
