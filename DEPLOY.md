# Deployment Guide — Prosperity Payroll Calculator

1. Push repo to GitHub as "prosperity-payroll"
2. Cloudflare Dashboard → Workers & Pages → KV → Create namespace: PAYROLL_DATA
3. Copy the KV Namespace ID, paste into wrangler.toml replacing REPLACE_WITH_YOUR_KV_NAMESPACE_ID
4. Deploy the worker: npx wrangler deploy
5. Note your worker URL: https://prosperity-payroll-api.YOUR_SUBDOMAIN.workers.dev
6. Cloudflare Dashboard → Pages → Create project → Connect GitHub → prosperity-payroll
   - Build command: npm run build
   - Output directory: dist
7. Pages project → Settings → Environment Variables → Add:
   VITE_API_BASE_URL = https://prosperity-payroll-api.YOUR_SUBDOMAIN.workers.dev
8. Pages project → Settings → Functions → KV Namespace Bindings → Add:
   Variable name: PAYROLL_DATA → your KV namespace
9. Redeploy Pages after adding env var
10. Done — visit your Pages URL to use the app
