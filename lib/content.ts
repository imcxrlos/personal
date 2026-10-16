// Single source of truth for site content.
// Technical claims are checked against each project's source and docs.
// Protected Pay and StudiSpace were re-verified against their repositories in
// October 2026; the other three keep only details verified earlier.
// No audits, published research, or security guarantees are claimed.

export const site = {
  name: "Carlos",
  handle: "cxrlos",
  domain: "cxrlos.com",
  role: "Software engineer",
  tagline:
    "Independent software engineer. I build AI products, payment infrastructure, and the security around them.",
  intro:
    "I build AI products, financial infrastructure, and security-focused software.",
  email: "carlosroj212@gmail.com",
  links: {
    github: "https://github.com/imcxrlos",
    email: "mailto:carlosroj212@gmail.com",
  },
} as const;

// My current mood, shown in the footer. Change this one value to switch it.
export type Mood = "Harmless" | "Dangerous";
export const mood: Mood = "Harmless";

export type Stat = { label: string; value: string };

export type Project = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  // Short label next to the kind on the homepage; omitted when there's
  // nothing worth saying beyond the kind.
  status?: string;
  summary: string;
  stack: string[];
  // Public product site, when there is one.
  url?: string;
  // Public source repository, when there is one.
  repo?: string;
};

export const projects: Project[] = [
  {
    slug: "protected-pay",
    name: "Protected Pay",
    kind: "Payment infrastructure",
    year: "2026",
    summary:
      "Protected payment infrastructure for businesses. A business creates a payment through the API, the buyer pays on a hosted checkout, and the money is held in an on-chain escrow on Solana until it's released or a dispute is decided. It comes with a dashboard, signed webhooks and an arbiter console.",
    stack: ["TypeScript", "Next.js", "Rust", "Anchor", "Solana", "Cloudflare Workers"],
    url: "https://indeficient.com/business",
  },
  {
    slug: "studispace",
    name: "StudiSpace",
    kind: "AI study platform",
    year: "2026",
    status: "In production",
    summary:
      "A study app for students on web and iOS. Upload a PDF, notes, a web page or a YouTube video and it builds flashcards, quizzes and practice tests from it. Then you study with spaced repetition, an AI tutor, and progress tracking.",
    stack: ["React", "Firebase", "Swift / SwiftUI", "OpenAI · Gemini", "Stripe"],
    url: "https://studispace.com",
  },
  {
    slug: "find-my-savings",
    name: "Find My Savings",
    kind: "Consumer fintech",
    year: "2026",
    summary:
      "Connects to your bank through Plaid and looks through your transactions for money you might be owed: open class-action settlements, product recalls and wage claims tied to companies you've paid or worked for. It only shows results it can back with an official source.",
    stack: ["TypeScript", "React", "Plaid", "Web Crypto"],
    repo: "https://github.com/imcxrlos/fintech",
  },
];

export const areas: { title: string; body: string }[] = [
  {
    title: "Artificial Intelligence",
    body: "Building with AI, experimenting with autonomous agents, and exploring what models can do beyond generating text. Especially interested in AI-powered tools, security research, and systems that can reason and act independently.",
  },
  {
    title: "Cybersecurity",
    body: "Offensive security, vulnerability research, and reverse engineering. I like understanding how applications work behind the scenes, finding where they break, and figuring out why.",
  },
  {
    title: "Blockchain & Financial Systems",
    body: "Smart contracts, payment infrastructure, cryptography, and decentralized systems. Interested in building financial tools that give people more control over how money moves.",
  },
  {
    title: "Automation & Systems",
    body: "Building bots, data pipelines, and tools that eliminate repetitive work. From market intelligence to APIs and infrastructure, I enjoy making complex processes run on their own.",
  },
];

// ---- Detailed project breakdowns (/projects) --------------------------
export type DetailSection = { heading: string; body: string[] };
export type ProjectDetail = {
  slug: string;
  overview: string;
  // Labelled facts shown in a spec table.
  facts: Stat[];
  sections: DetailSection[];
  note?: string;
};

export const projectDetails: Record<string, ProjectDetail> = {
  "protected-pay": {
    slug: "protected-pay",
    overview:
      "Protected Pay lets a business take stablecoin payments with buyer protection built in. The business creates a payment through an API, sends the buyer to a hosted checkout, and gets webhooks as the payment moves along. The buyer's money doesn't go straight to the business. It's held in an on-chain escrow for that one payment until it's released, or until a dispute is decided. Around that there's a business dashboard, a dispute flow with evidence, and an arbiter console. It's deployed on Solana devnet.",
    facts: [
      { label: "Domain", value: "Payment infrastructure" },
      { label: "API", value: "REST · signed webhooks" },
      { label: "Web", value: "Next.js · Cloudflare Workers" },
      { label: "Storage", value: "D1 · R2" },
      { label: "On-chain", value: "Rust · Anchor 1.2" },
      { label: "SDK", value: "TypeScript · @solana/kit · Codama" },
      { label: "Network", value: "Solana devnet" },
    ],
    sections: [
      {
        heading: "The business API",
        body: [
          "A business integrates server to server. It creates a payment intent with who gets paid, the amount, the token, how long the protection lasts (one hour up to 30 days), its own order reference, and some metadata. From there it can list and look up intents, payments and disputes, cancel an intent that hasn't been paid, and read an event log. Retried requests with the same idempotency key return the original result instead of creating a second intent.",
          "API keys are only shown once. The server stores an HMAC of each key under a rotating server secret, compares in constant time, and rate limits each key to 120 requests a minute. Keys can be revoked or rolled with a grace period, every change is logged, and test keys can't be used against a live environment. Requests that look like they came from a browser are refused, so a key can't quietly end up in frontend code.",
          "Webhooks are signed with HMAC-SHA256 and a timestamp, and the signing secrets are encrypted at rest. A failed delivery is retried nine times over about three days, and an endpoint that keeps failing gets switched off. Before every attempt the destination is resolved again and refused if it points at a private address, and redirects aren't followed.",
        ],
      },
      {
        heading: "The checkout",
        body: [
          "The buyer opens a link to the hosted checkout and sees who they're paying, the amount, the protection period and when the link expires. They connect a wallet, review the total, including a 1.5% buyer protection fee that's spelled out before they sign, and send. The page walks through preparing, approving in the wallet and confirming, then shows the payment as paid and protected.",
          "The terms come from the intent, so the buyer can't edit them. The wallet being paid can't pay itself; the checkout blocks it and so does the program. A canceled or expired link says plainly that nothing was charged.",
          "The server never takes the client's word that a payment happened. It derives the payment's address itself, reads the account from the chain, and checks the recipient, token, amount and period field by field before linking it to the intent. If the confirmation from the browser never arrives, a scheduled job finds the payment on chain instead. A second payment for the same intent, or one that lands after the link expired, is recorded and flagged rather than dropped.",
        ],
      },
      {
        heading: "The dashboard",
        body: [
          "Businesses sign in with their Solana wallet. The dashboard has a setup checklist, payments with search, disputes, API keys, webhooks with a delivery log, the event log, and a quickstart. One wallet can run more than one business. Onboarding is by invite: I approve a request and send a one-time claim link, and the wallet that redeems it becomes the owner.",
          "Payment and dispute pages only open for the buyer, the seller, or the arbiter. To anyone else, a real payment and a missing one return the same not-found, so the pages can't be used to check whether a payment exists.",
        ],
      },
      {
        heading: "Disputes and arbitration",
        body: [
          "Before the deadline the buyer can open a dispute: pick a reason, explain what happened, and attach evidence (up to eight images or PDFs, with the type checked from the file itself, stored privately). The seller can respond with their own. Either side can end it early in the other's favor: the buyer can withdraw, or the seller can concede and refund.",
          "Otherwise it goes to the arbiter, which is a 2-of-3 multisig, not a single key. In the arbiter console one member proposes a release or refund, a second approves, and then it's executed. The app only accepts a proposal whose instruction matches a valid resolution byte for byte, and it reads multisig membership from the chain on every request. That flow is tested end to end against the real multisig program in a local validator.",
        ],
      },
      {
        heading: "Fees",
        body: [
          "The buyer pays a 1.5% protection fee when they pay. The business pays 2.7%, taken only when the money settles to it, whether by release, expiry or a dispute decided in its favor. Refunds carry no fee. The fee terms are stored on each payment when it's created and can't change afterward.",
        ],
      },
      {
        heading: "Under it: one escrow per payment",
        body: [
          "Every payment gets its own vault, owned by an address derived from that payment. There's no shared pool, so one payment can never touch another's funds. Where the money can go is fixed when the payment is created: the buyer's or the seller's token account. Callers never pick a destination.",
          "The on-chain program is the only part that can move money, and the only part I treat as trusted. The API, dashboard and checkout describe payments; they can't hold or redirect funds. The web app builds no transactions of its own. It goes through the SDK, which owns preparing, describing and sending them.",
        ],
      },
      {
        heading: "Four states, six transitions",
        body: [
          "A payment is always Protected, Disputed, Released or Refunded. The state is stored as an explicit value, never worked out from balances. Each transition is a method on that state, so an action that isn't allowed fails before any tokens move. Released and Refunded are final.",
          "A few rules fall out of that. A disputed payment never settles by expiry; it waits for the arbiter or for one side to give in. The buyer can't get money back alone. A refund only happens through the arbiter or the seller conceding. And the dispute deadline is checked as \"now before the deadline\" while expiry is \"now at or after it\", so no moment satisfies both.",
        ],
      },
      {
        heading: "Who can move money",
        body: [
          "The buyer, seller, arbiter, token, amount, deadline and fee terms are written once and never change. There are no admin instructions and no fee switch. Escrowed money can only go to the stored buyer, the stored seller, or, as the stored fee on a payment that settles to the seller, the stored treasury. The arbiter decides disputes but can't receive funds or pick another destination.",
        ],
      },
      {
        heading: "Testing",
        body: [
          "There are about 930 automated tests, all run in CI. Roughly 100 are Rust tests of the program in LiteSVM: every instruction is tried with the wrong signer, the wrong state, swapped accounts and edge values, and the tests check token balances before and after instead of just checking that a call succeeded. The SDK has about 80, including the multisig flow, and the web app about 750, covering the API, keys, webhooks, intent matching, payment privacy, sign-in, disputes and the checkout. A test also keeps the public docs in line with the code.",
          "Every state transition, plus the rejections around them, has also been checked live on devnet. That's functional testing, not a security audit.",
        ],
      },
    ],
    note:
      "The architecture is documented in the repo. Program source, deployment keys and the staging environment are private.",
  },
  studispace: {
    slug: "studispace",
    overview:
      "StudiSpace is a study app for students. You give it your material (a PDF, a Word doc, photos of your notes, a web page, a YouTube video or pasted text) and it turns it into a study set: flashcards, a multiple-choice quiz, fill-in-the-blank and written questions. Then you study it in different modes, ask an AI tutor about it, and track what you've actually learned. It runs on the web and as a native iOS app, with real users and paid plans.",
    facts: [
      { label: "Domain", value: "AI education" },
      { label: "Web", value: "React · Vite" },
      { label: "iOS", value: "Swift · SwiftUI" },
      { label: "Backend", value: "Firebase · Cloud Functions" },
      { label: "AI", value: "OpenAI · Gemini · xAI" },
      { label: "Billing", value: "Stripe · RevenueCat" },
      { label: "Status", value: "In production" },
    ],
    sections: [
      {
        heading: "From your material to a study set",
        body: [
          "Uploads are checked by their actual bytes, not the file extension. Word documents are parsed on the server. PDFs and images go to the model directly as files, so there's no separate OCR step. Web pages come in through a fetcher that refuses private and cloud-metadata addresses and caps the download size, and YouTube videos are handled by Gemini. The size of the set scales with the source: under 1,000 words you get about 10 flashcards and 8 quiz questions, and long material goes up to 22 and 17.",
          "The iOS app does more work on the device first. It reads photos with Apple's Vision framework, PDFs with PDFKit, and also imports spreadsheets. Before calling the model it splits the text into sentences, drops near-duplicates, and keeps the most relevant ones to fit a budget. If too few cards come back it retries with the full text, and if the AI call fails it generates the set on the device instead.",
        ],
      },
      {
        heading: "Study modes",
        body: [
          "Flashcards you rate as easy, medium or hard. A multiple-choice quiz. Fill-in-the-blank, where the iOS version is forgiving the way a teacher would be: it ignores case and accents and accepts listed alternatives. Written answers, where the AI gives feedback and you rate yourself. And a practice test that mixes all three question types, shuffles them, optionally runs a timer, and has the AI score written answers from 1 to 10.",
          "There's also a mind map of the material, an audio summary you can listen to (voiced with ElevenLabs), notes, and a tutor-led lesson.",
        ],
      },
      {
        heading: "Spaced repetition",
        body: [
          "StudiSpace schedules reviews with its own rating-based intervals rather than a published algorithm like SM-2 or FSRS. On the web, rating a flashcard sets when it comes back: hard means tomorrow, while medium and easy push it out further each time you review it, up to two weeks and a month. Cards that are due come first.",
          "The iOS app has its own scheduler. Each easy rating spaces the next review three days further out than the last, medium one day, and hard brings the card back in 12 hours. A card counts as mastered after three easy ratings in a row. Each set also gets a readiness score that weighs how much you've reviewed, how many times, and how much is mastered.",
        ],
      },
      {
        heading: "Progress and motivation",
        body: [
          "Every set shows how much of it you've mastered. On top of that there's XP for each kind of study action, levels, streaks, and badges, all computed on the server. Streaks have freezes: you earn one every seven days, can bank two, and each one covers a missed day. Exam mode turns a test date up to a week out into daily missions.",
          "On iOS there are widgets, a Pomodoro timer as a Live Activity, and local notifications for exam countdowns, streaks at risk, and cards that are due.",
        ],
      },
      {
        heading: "AI tutor and writing tools",
        body: [
          "The tutor streams its answers and gets part of the set's source material as context. Long conversations are summarized as they go so they stay within the model's limits. There's also Solve, where you photograph a problem and get walked through it.",
          "The rewriting tool doesn't trust the model's output. A set of plain code checks runs on every rewrite: the length has to stay within bounds, numbers, citations, quotes and names have to survive, nothing new can be added, and a meaning check catches flipped negations or changed certainty. If a rewrite fails, it retries once. If it fails again, you get your original text back with a warning instead of a broken rewrite.",
        ],
      },
      {
        heading: "One path to the models",
        body: [
          "Both apps call the AI through one Firebase function, authenticated with the user's Firebase token. The model API keys exist only as server secrets, so neither the web nor the iOS app ever has them. That same function meters usage. Free-plan limits are enforced there, not in the app, along with hourly and daily rate limits. If OpenAI fails it falls back to Gemini, then xAI.",
        ],
      },
      {
        heading: "Web and iOS",
        body: [
          "The web app is React and Vite. The iOS app is native SwiftUI. Both read and write the same Firestore study sets, and a shared schema reader handles the places where the two clients name fields differently. Web billing is Stripe Checkout and iOS uses RevenueCat. Both are in English and Spanish. The web codebase has about 1,400 tests across 91 files, covering the AI service and fallbacks, usage limits, file extraction, billing, gamification and the rewrite checks.",
        ],
      },
    ],
    note: "Application source is private.",
  },
  "find-my-savings": {
    slug: "find-my-savings",
    overview:
      "Find My Savings connects to your bank through Plaid and looks through your transactions for money you might be owed: open class-action settlements, product recalls and wage claims tied to the companies you've paid or worked for. It only shows things it can back with an official source. Since it holds a live connection to someone's bank, most of the interesting engineering is in protecting that connection.",
    facts: [
      { label: "Domain", value: "Consumer fintech" },
      { label: "Bank data", value: "Plaid (transactions)" },
      { label: "Crypto", value: "Web Crypto (RS256 / JWKS)" },
      { label: "Client", value: "React" },
      { label: "Source", value: "Frontend on GitHub" },
    ],
    sections: [
      {
        heading: "Verifying Plaid's webhooks",
        body: [
          "Plaid sends transaction updates to a public webhook, which means anyone can post to it. So every request has to prove it came from Plaid. Each one carries a signed token in a header; the handler fetches Plaid's public keys, picks the right one, and checks the RS256 signature with Web Crypto before reading anything.",
          "It also checks who issued the token and who it's for, rejects expired tokens, and when Plaid includes a hash of the request body it recomputes that hash and compares. That stops someone from reusing a valid signature with a different payload. Anything that fails is logged and dropped.",
        ],
      },
      {
        heading: "Keeping bank tokens on the server",
        body: [
          "The Plaid credentials live in a server-side secret store and never reach the browser. The short-lived token the browser gets during bank linking is swapped on the server for a long-lived access token, which is stored server-side and never sent back to the client. The Plaid environment is limited to an explicit list (sandbox, development, production).",
        ],
      },
      {
        heading: "No made-up results",
        body: [
          "Finding money owed uses a model with web access, but with a narrow brief: only currently open opportunities with an official source (a court site, the CPSC, the FTC or the NLRB), skip anything it can't verify, and never invent one. The point is that nobody gets told about a settlement that doesn't exist.",
        ],
      },
      {
        heading: "Access",
        body: [
          "The bank features sit behind sign-in and protected routes, and linked Plaid items belong to the user who created them.",
        ],
      },
    ],
    note:
      "Checked against the application source. The frontend is on GitHub; the server functions described here, including the webhook verification and token exchange, aren't in the public repo. No audit or guarantee is claimed.",
  },
};

// ---- Additional projects (/ and /projects) ----------------------------
// Verified against source. Reddit Lead Radar's frontend and Ticket Arbitrage's
// full source are public; no credentials or vendor keys are exposed here.
export const additionalProjects: Project[] = [
  {
    slug: "reddit-lead-radar",
    name: "Reddit Lead Radar",
    kind: "Lead generation",
    repo: "https://github.com/imcxrlos/reddit-radar",
    year: "2026",
    summary:
      "Finds people on Reddit asking for help a client's business can provide. A cheap keyword filter narrows the posts first, then a model checks each one for fit, intent and location and drafts a reply.",
    stack: ["React", "Vite", "Deno"],
  },
  {
    slug: "ticket-arbitrage",
    name: "Ticket Arbitrage Intelligence",
    kind: "Price tracking",
    repo: "https://github.com/imcxrlos/ticket-arbitrage-intelligence",
    year: "2026",
    summary:
      "Compares prices for the same events across four ticket marketplaces and flags when the same seats are cheaper on one than another, with price history and alerts.",
    stack: ["React", "Vite", "Deno"],
  },
];

export const additionalProjectDetails: Record<string, ProjectDetail> = {
  "reddit-lead-radar": {
    slug: "reddit-lead-radar",
    overview:
      "Reddit Lead Radar watches Reddit for people describing a problem a client's business can solve, and turns each one into a lead with a drafted reply for a person to review. Most of Reddit is noise, so the system does cheap filtering first and only spends a model call on posts that might be real leads.",
    facts: [
      { label: "Domain", value: "B2B lead generation" },
      { label: "Frontend", value: "React · Vite" },
      { label: "Backend", value: "Deno functions" },
      { label: "Scheduling", value: "Interval + cron workflows" },
      { label: "Source", value: "Frontend on GitHub" },
    ],
    sections: [
      {
        heading: "Collecting posts",
        body: [
          "Collection sits behind a provider interface, so the source can change without touching storage or matching. Right now it goes through a scraping proxy and parses old.reddit.com, because Reddit blocks its JSON endpoints from datacenter traffic. Posts already stored are skipped.",
          "It runs on a schedule that checks more often during the day and less overnight.",
        ],
      },
      {
        heading: "Two-step matching",
        body: [
          "The first step uses no AI. Each client's keywords are split into specific phrases and generic ones. A post only becomes a candidate if it contains at least one specific phrase; generic-only matches are thrown out. That keeps both the cost and the false positives down.",
          "The second step asks a model to check each candidate against a fixed JSON format: does it actually match what the client offers, is the poster describing their own situation (not news or commentary), and are they in the client's area. It returns a score, a category with a confidence and a review flag, a reason when it rejects, and a draft reply. The prompt tells it not to invent leads or guess a location that wasn't stated.",
        ],
      },
      {
        heading: "Feedback",
        body: [
          "Every lead can be marked a good or bad match with a reason, and edits to the draft are saved. That gets stored with the decision so matching can be reviewed and tuned over time.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Provider keys stay in server-side config and never reach the browser. The app sits behind sign-in, and writes run on the backend. The keyword filter also limits how much scraped text ever reaches a model.",
        ],
      },
    ],
    note:
      "The frontend is on GitHub. Collection and matching run in server functions that aren't in the public repo, and credentials stay out of it.",
  },
  "ticket-arbitrage": {
    slug: "ticket-arbitrage",
    overview:
      "Ticket Arbitrage Intelligence answers one question for a set of events: where is the same seat category cheapest right now, and is the gap between marketplaces real or just one site's price? Each marketplace describes the same event differently, so most of the work is turning four formats into one comparison.",
    facts: [
      { label: "Domain", value: "Price tracking" },
      { label: "Frontend", value: "React · Vite" },
      { label: "Backend", value: "Deno functions" },
      { label: "Markets", value: "Four marketplaces, one aggregator" },
      { label: "Source", value: "GitHub" },
    ],
    sections: [
      {
        heading: "Pulling prices",
        body: [
          "A scheduled function pulls prices for a chosen set of matches through a ticket-data aggregator that covers several marketplaces. Each marketplace returns a different shape, with different field names and different ways of showing price and availability, so the function converts them all into one record before comparing anything.",
          "The number of upstream calls per run is capped so it stays inside the API quota.",
        ],
      },
      {
        heading: "Comparing",
        body: [
          "For each match it works out the cheapest price, the average, and the highest across platforms, and how far the cheapest is below each. It only calls something an arbitrage when at least two platforms priced the same thing; with one platform it's just a price check. A score combines the size of the gap, how many platforms were compared, and the stage of the event, within a fixed range.",
          "Every scan also saves a price snapshot, so each opportunity has a history and not just a current number.",
        ],
      },
      {
        heading: "Live match info",
        body: [
          "A server-side proxy takes a third-party live-match feed (status, clock, scorers) and turns it into a small, clean payload. The browser never talks to that feed directly.",
        ],
      },
      {
        heading: "Security",
        body: [
          "API keys stay in server-side config and the browser only gets the normalized results. The app sits behind sign-in.",
        ],
      },
    ],
    note:
      "Source is on GitHub, including the sync and live-feed functions. Credentials come from the environment and aren't in the repo.",
  },
};
