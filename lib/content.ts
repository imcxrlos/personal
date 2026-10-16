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

export type Stat = { label: string; value: string };

export type Project = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  status: string;
  summary: string;
  stack: string[];
  // Public product site, when there is one.
  url?: string;
};

export const projects: Project[] = [
  {
    slug: "protected-pay",
    name: "Protected Pay",
    kind: "Payment infrastructure",
    year: "2026",
    status: "V0 on devnet",
    summary:
      "Buyer protection for stablecoin payments on Solana. The money sits in an on-chain escrow for that one payment until it's released to the seller, refunded after a dispute, or the protection period runs out. Businesses can take payments through a hosted checkout.",
    stack: ["Rust", "Anchor", "Solana", "TypeScript", "Next.js"],
    url: "https://indeficient.com/business",
  },
  {
    slug: "studispace",
    name: "StudiSpace",
    kind: "AI study platform",
    year: "2026",
    status: "In production",
    summary:
      "A study app for students on web and iOS. Upload a PDF, notes, a web page or a YouTube video and it builds flashcards, quizzes and practice tests from it. Then you study with spaced review, an AI tutor, and progress tracking.",
    stack: ["React", "Firebase", "Swift / SwiftUI", "OpenAI · Gemini", "Stripe"],
    url: "https://studispace.com",
  },
  {
    slug: "find-my-savings",
    name: "Find My Savings",
    kind: "Consumer fintech",
    year: "2026",
    status: "Private",
    summary:
      "Connects to your bank through Plaid and looks through your transactions for money you might be owed: open class-action settlements, product recalls and wage claims tied to companies you've paid or worked for. It only shows results it can back with an official source.",
    stack: ["TypeScript", "React", "Plaid", "Web Crypto"],
  },
];

export const areas: { title: string; body: string }[] = [
  {
    title: "AI",
    body: "Products where the model is one part of the system: generation pipelines, tutoring, and checks that catch bad output before a user sees it.",
  },
  {
    title: "Security",
    body: "Authentication, authorization, and keeping secrets and financial data on the server. I like testing what a system rejects as much as what it does.",
  },
  {
    title: "Blockchain infrastructure",
    body: "On-chain programs that hold real value, mostly on Solana. Escrow, explicit state machines, and keeping the program simple enough to reason about.",
  },
  {
    title: "Automation",
    body: "Pipelines that collect data on a schedule, filter it cheaply, and only spend a model call when it's worth it.",
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
      "Protected Pay adds buyer protection to stablecoin payments. When you pay through it, the money doesn't go straight to the seller. It goes into an escrow that exists only for that payment. If everything's fine, it's released to the seller, either by the buyer or once the protection period ends. If something goes wrong, the buyer can open a dispute before the deadline, and an arbiter decides whether the money goes to the seller or back to the buyer. The program has no instruction that sends it anywhere else. The first version runs on Solana.",
    facts: [
      { label: "Domain", value: "Payment infrastructure" },
      { label: "On-chain", value: "Rust · Anchor 1.2" },
      { label: "Token", value: "Classic SPL Token" },
      { label: "Client", value: "TypeScript SDK · @solana/kit" },
      { label: "Web", value: "Next.js" },
      { label: "Status", value: "V0 on devnet" },
    ],
    sections: [
      {
        heading: "One escrow per payment",
        body: [
          "Every payment gets its own vault, owned by an address derived from that payment. There's no shared pool, so one payment can never touch another's funds. Where the money can go is also fixed: the token accounts of the buyer and seller stored when the payment was created. Callers never pick a destination.",
          "The on-chain program is the only part I treat as trusted. The web app builds no transactions of its own. It goes through an SDK, and I assume the frontend could be compromised.",
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
        heading: "Who can do what",
        body: [
          "The buyer, seller, arbiter, token, amount, deadline and fee terms are written once and never change. There are no admin instructions and no fee switch. Escrowed money can only go to the stored buyer, the stored seller, or, as the stored fee on a payment that settles to the seller, the stored treasury.",
          "The arbiter can decide a dispute but can't receive funds or choose another destination. On devnet the arbiter is a 2-of-3 multisig rather than a single key, and that's required before any real money. Each way of ending a dispute early can only be signed by the side it works against: the buyer can withdraw their dispute, and the seller can concede it.",
        ],
      },
      {
        heading: "Businesses and checkout",
        body: [
          "Businesses get a dashboard and a server-to-server API. They create a payment intent (who gets paid, how much, which token, how long the protection lasts), and the buyer pays through a hosted checkout page. Members sign in with their Solana wallet. All of this is off-chain and can't move or hold funds; it only describes payments the program then enforces.",
          "Payment pages are private to the people in the payment. If you're not one of them, a real payment and a missing one look the same, so a page can't be used to check whether a payment exists.",
        ],
      },
      {
        heading: "Testing",
        body: [
          "The program is tested in Rust with LiteSVM. Every instruction has tests for the wrong signer, the wrong state, swapped accounts, and edge values, and they check token balances before and after instead of just checking that a call succeeded. There are also tests for isolation between payments and snapshot tests on the program's interface.",
          "V0 is on devnet and every transition, plus the rejections around them, has been checked live. That's functional testing, not a security audit, and it isn't a green light for mainnet.",
        ],
      },
    ],
    note:
      "The architecture is documented in the repo. Program source and deployment keys are private.",
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
          "The iOS app does more work on the device first. It reads photos with Apple's Vision framework, PDFs with PDFKit, and also imports spreadsheets. Before calling the model it splits the text into sentences, drops near-duplicates, and keeps the most relevant ones to fit a budget. If too few cards come back it retries with the full text, and if the AI call fails it can still generate a basic set on the device.",
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
        heading: "Review scheduling",
        body: [
          "This is a simple rating-based interval scheduler, not SM-2 or FSRS. On the web, rating a flashcard sets when it comes back: hard means tomorrow, while medium and easy push it out further each time you review it, up to two weeks and a month. Cards that are due come first.",
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
      { label: "Status", value: "Private" },
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
      "Checked against the application source. Source is private; no audit or guarantee is claimed.",
  },
};

// ---- Security page content (/security) --------------------------------
export type ThreatModel = {
  project: string;
  slug: string;
  posture: string;
  surfaces: { surface: string; risk: string; control: string }[];
};

export const threatModels: ThreatModel[] = [
  {
    project: "Protected Pay",
    slug: "protected-pay",
    posture:
      "Only the on-chain program is trusted. The frontend, whoever calls the SDK, and every account passed into an instruction could be malicious. The goal is simple to state: no sequence of instructions can move escrowed money anywhere except the stored buyer or seller, or the stored treasury as the stored fee.",
    surfaces: [
      {
        surface: "Swapped accounts",
        risk: "A caller passes a token account or identity that isn't the one stored on the payment, to redirect the money.",
        control:
          "Destinations are derived from the stored identities, and every instruction checks each account against the stored payment before any transfer. Each instruction has tests that try the swap.",
      },
      {
        surface: "Wrong signer",
        risk: "Someone tries an action that belongs to a different role, like resolving a dispute or releasing funds they don't control.",
        control:
          "Signers are checked against the roles stored on the payment. Dispute decisions are checked against that payment's own arbiter, and each way of ending a dispute early can only be signed by the side it works against.",
      },
      {
        surface: "Illegal state change",
        risk: "Moving a payment into a state the protocol doesn't allow, or acting on one that's already settled.",
        control:
          "State is an explicit value with a fixed set of transitions, and settled payments allow none. It's checked before anything happens and never inferred from balances.",
      },
      {
        surface: "Timing and edge values",
        risk: "Disputing after the deadline, claiming expiry early, or using zero or odd amounts.",
        control:
          "The chain's clock is the only source of time, with strict comparisons. Arithmetic is checked, and zero or unsupported values fail on chain. Tests hit the exact edges.",
      },
      {
        surface: "Payment lookup",
        risk: "Using the web app to find out whether a payment exists, or to read one you're not part of.",
        control:
          "Payment pages and dispute cases only load for the people in the payment. Anyone else gets the same answer for a real payment and a missing one.",
      },
    ],
  },
  {
    project: "Find My Savings",
    slug: "find-my-savings",
    posture:
      "The app holds a live connection to a user's bank through Plaid. The risks I focused on are the two places an attacker can actually reach, the public webhook and anything that could leak an access token, plus the risk of showing someone a financial opportunity that isn't real.",
    surfaces: [
      {
        surface: "Forged webhook",
        risk: "Someone posts a fake payload to the public webhook to trigger processing or inject false transaction data.",
        control:
          "Every webhook's signed token is verified against Plaid's public keys (RS256), with issuer, audience and expiry checks and a SHA-256 hash of the body. Anything unverified is dropped.",
      },
      {
        surface: "Leaked access token",
        risk: "A long-lived bank access token ends up in the browser or a log and gets reused to pull the user's financial data.",
        control:
          "The token exchange happens on the server, and the access token is stored server-side and never returned to the client. Plaid credentials stay in a server-side secret store.",
      },
      {
        surface: "Made-up findings",
        risk: "A model with web access invents a settlement or recall, and a user acts on something that doesn't exist.",
        control:
          "Research is limited to currently open opportunities from named official sources, with instructions to skip anything it can't verify and never invent one.",
      },
    ],
  },
];

export const methodology: string[] = [
  "Write down what must never happen before building the feature, then enforce it somewhere that can't be skipped: an account constraint, a signer check, a signature check. Not the UI.",
  "Test the rejections. Every permission boundary gets a test showing the wrong caller, state, account or timing is refused, and the tests check the effect (balances, whether anything was processed), not just that a call returned.",
  "Treat everything outside the trusted core as untrusted input: the frontend, SDK callers, third-party webhooks, OAuth callbacks. Verify on the server or on chain.",
  "Keep claims honest. Things that are built and tested are described that way. Anything I've only explored isn't presented as a guarantee.",
];

// ---- Additional projects (/ and /projects) ----------------------------
// Verified against private source earlier. No repository links (repos are
// private); no credentials, endpoints, or vendor keys are exposed.
export const additionalProjects: Project[] = [
  {
    slug: "reddit-lead-radar",
    name: "Reddit Lead Radar",
    kind: "Lead generation",
    year: "2026",
    status: "Private",
    summary:
      "Finds people on Reddit asking for help a client's business can provide. A cheap keyword filter narrows the posts first, then a model checks each one for fit, intent and location and drafts a reply.",
    stack: ["React", "Vite", "Deno"],
  },
  {
    slug: "ticket-arbitrage",
    name: "Ticket Arbitrage Intelligence",
    kind: "Price tracking",
    year: "2026",
    status: "Private",
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
      { label: "Status", value: "Private" },
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
      "Source is private. The scraping vendor and credentials are left out on purpose.",
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
      { label: "Status", value: "Private" },
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
      "Source is private. Data vendors and internal endpoints are left out on purpose.",
  },
};
