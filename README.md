# cxrlos.com

Personal engineering portfolio — [cxrlos.com](https://cxrlos.com).

Independent software engineer building AI systems, financial infrastructure,
and security-conscious applications. This is a technical account of the work,
not a resume; most source is private.

## Stack

- **Next.js 15** (App Router, React 19) — statically prerendered
- **TypeScript** (strict)
- **Tailwind CSS v4**
- `next/font` — Newsreader (display serif), Inter (body), JetBrains Mono (labels)

## Pages

| Route        | Contents                                                             |
|--------------|---------------------------------------------------------------------|
| `/`          | Introduction, featured projects, technical interests, contact       |
| `/projects`  | Technical breakdowns of Protected Pay, StudiSpace, Find My Savings   |
| `/security`  | Threat models, attack surfaces, testing methodology, reproducibility |

All site content lives in [`lib/content.ts`](lib/content.ts) as a single typed
source of truth. Every claim is grounded in reviewed project documentation and
source; implemented controls are kept distinct from exploratory work, and no
audits, published research, or security guarantees are asserted.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (next)
npm run build      # production build
```

## Deploy

Zero-config on [Vercel](https://vercel.com) — framework preset *Next.js*. No
environment variables required.
