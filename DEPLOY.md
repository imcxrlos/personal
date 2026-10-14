# Deploying cxrlos.com

The repo is on GitHub at `imcxrlos/personal` (branch `main`). It is a standard
Next.js 15 app and deploys to Vercel with zero configuration — no environment
variables, no build settings to change.

Pick **one** of the two paths below.

---

## Path A — Vercel dashboard (recommended, no CLI)

1. Go to <https://vercel.com/new> and **Import** the `imcxrlos/personal` repo.
2. Framework preset auto-detects as **Next.js**. Leave build/output defaults.
   Click **Deploy**. You get a `*.vercel.app` URL in ~1 minute.
3. Project → **Settings → Domains**:
   - Add `cxrlos.com`. Vercel marks it the **primary** domain.
   - Add `www.cxrlos.com`. In its row choose **Redirect to `cxrlos.com`**
     (308). Vercel configures the www → apex redirect automatically.
4. Point DNS at the registrar for `cxrlos.com`:
   - Apex `cxrlos.com` → **A** record `76.76.21.21`
     (or an ALIAS/ANAME to `cname.vercel-dns.com` if the registrar supports it).
   - `www` → **CNAME** `cname.vercel-dns.com`.
   Vercel's domain panel shows the exact records for your registrar and issues
   the TLS certificate once they resolve (usually minutes).

---

## Path B — Vercel CLI (needs a token)

```bash
npm i -g vercel                      # or: npx vercel@latest

export VERCEL_TOKEN=xxxxxxxx          # from vercel.com/account/tokens

vercel link --yes --project personal  # link this dir to the project
vercel --prod --yes                   # build + deploy to production

# Domains
vercel domains add cxrlos.com
vercel domains add www.cxrlos.com
vercel alias set <deployment-url> cxrlos.com
# In Settings → Domains, set cxrlos.com primary and www → redirect (308),
# or: vercel redirect / config via the dashboard (CLI has no primary toggle).
```

Then add the DNS records from **Path A, step 4**.

---

## Post-deploy smoke test

```bash
for p in / /projects /security; do
  echo "GET $p -> $(curl -s -o /dev/null -w '%{http_code}' https://cxrlos.com$p)"
done
curl -sI https://www.cxrlos.com | grep -i -E 'location|HTTP'   # expect 308 -> https://cxrlos.com
curl -sI https://cxrlos.com | grep -i -E 'HTTP|strict-transport'  # expect 200 + HSTS once live
```

Mobile responsiveness is verified in the layout (collapsing grids at `md`/`820px`,
no horizontal overflow at 390px); re-check on a real device or DevTools once live.

## Rollback

Every push to `main` triggers a new production deployment. Use the Vercel
dashboard → **Deployments** to promote a previous build if needed.
