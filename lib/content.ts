// Single source of truth for site content.
// Every claim here is grounded in reviewed project documentation and source.
// Implemented controls are kept distinct from exploratory work. No audits,
// published research, or security guarantees are claimed.

export const site = {
  name: "Carlos",
  handle: "cxrlos",
  domain: "cxrlos.com",
  role: "Software engineer",
  tagline:
    "Independent software engineer building AI systems, financial infrastructure, and security-conscious applications.",
  intro:
    "I design systems where the hard part is the invariant, not the feature — payment rails that custody nothing, backends that treat the client as untrusted, and AI that is held to a measurable bar. Most of my work lives behind private repositories; this is a technical account of how it is built.",
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
  // Short list for the home page.
  highlights: string[];
};

export const projects: Project[] = [
  {
    slug: "protected-pay",
    name: "Protected Pay",
    kind: "Payment infrastructure",
    year: "2026",
    status: "V0 on devnet",
    summary:
      "A self-custodial protected-payment protocol. Funds route through a per-payment on-chain escrow with an explicit state machine; the program is the security boundary and the frontend is treated as untrusted.",
    stack: ["Rust", "Anchor", "Solana", "SPL Token", "TypeScript", "@solana/kit", "Next.js"],
    highlights: [
      "Per-payment escrow vault owned by a Payment PDA — never a shared pool",
      "Explicit state machine with only the transitions the protocol permits",
      "Authorization, state, account-substitution and boundary tests per instruction",
    ],
  },
  {
    slug: "studispace",
    name: "StudiSpace",
    kind: "AI education platform",
    year: "2026",
    status: "In production",
    summary:
      "An AI-powered study platform spanning web and native iOS. Model calls run through a server-side gateway; a deterministic check layer and an evaluation harness keep AI output to a measurable quality bar.",
    stack: ["React", "Vite", "Firebase", "Cloud Functions", "Stripe", "Swift / iOS", "Vitest"],
    highlights: [
      "Server-side AI gateway — the client never holds model credentials",
      "Deterministic output checks plus an evaluation harness for AI quality",
      "Auth, billing, tiered entitlements and localization in production",
    ],
  },
  {
    slug: "find-my-savings",
    name: "Find My Savings",
    kind: "Consumer fintech",
    year: "2026",
    status: "Private",
    summary:
      "Connects a user's bank through Plaid and scans transactions for money owed back to them — open settlements, recalls and wage actions — surfaced only from verifiable official sources. The security work is in the bank-data boundary.",
    stack: ["TypeScript", "Base44", "Plaid", "Web Crypto", "React"],
    highlights: [
      "Plaid webhooks verified by JWT over JWKS, with request-body checksum",
      "Bank access tokens exchanged and stored server-side, never sent to the client",
      "Research findings constrained to verifiable, currently-open official sources",
    ],
  },
];

export const interests: { title: string; body: string }[] = [
  {
    title: "Authorization boundaries",
    body: "Deciding exactly who may move value or data, encoding it where it cannot be bypassed, and proving the negative cases with tests rather than prose.",
  },
  {
    title: "State machines over inference",
    body: "Modelling systems as explicit states with enumerated transitions, so correctness is a property you can read, not a condition you infer from balances or flags.",
  },
  {
    title: "Untrusted-client architecture",
    body: "Treating every frontend, webhook and third-party callback as adversarial input, and putting the real checks on the server and on chain.",
  },
  {
    title: "Measurable AI systems",
    body: "Wrapping model calls in deterministic checks and evaluation harnesses so a change to a prompt or model produces a number that moves, not a vibe.",
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
      "Protected Pay is a self-custodial protected-payment protocol. A sender routes one specific payment through an on-chain program that holds the funds in a per-payment escrow until the payment settles to the recipient, is refunded to the sender, or expires. Users trust the protocol's rules, never an operator who custodies their money. The first implementation targets Solana with classic SPL Token stablecoins.",
    facts: [
      { label: "Domain", value: "Payment infrastructure" },
      { label: "On-chain", value: "Rust / Anchor 1.2" },
      { label: "Token", value: "Classic SPL Token" },
      { label: "Client", value: "TypeScript SDK · @solana/kit · Codama" },
      { label: "Web", value: "Next.js" },
      { label: "Status", value: "V0 deployed to devnet" },
    ],
    sections: [
      {
        heading: "Escrow architecture",
        body: [
          "Every payment creates its own escrow vault whose authority is that payment's PDA — there is never a shared pool, so one payment can never reach another's funds. Destinations are derived associated token accounts of the identities stored at creation; callers never choose where money goes.",
          "The on-chain program is the security boundary. The web app composes no instructions of its own: it goes through an SDK that owns the prepare / describe / send path, and the UI imports only SDK types. The frontend is assumed to be fully untrusted.",
        ],
      },
      {
        heading: "State as an explicit machine",
        body: [
          "A payment is always in one of four explicit states — Protected, Disputed, Released, or Refunded. State is never inferred from token balances or boolean combinations. Terminal states admit no further transitions.",
          "Only the transitions the protocol permits exist in code: Protected→Disputed, Protected→Released, Disputed→Released, Disputed→Refunded. Expiry can only release to the recipient. Every state-changing instruction validates signer, state, timing, and account identity against the stored Payment before any transfer.",
        ],
      },
      {
        heading: "Authorization boundaries",
        body: [
          "The sender, recipient, arbiter, mint, amount, deadline, and fee terms are immutable after creation. Settlement reads fee rates and destinations only from those stored values. Escrowed principal can move only to the stored recipient, the stored sender, or — strictly as the stored settlement fee on a recipient-bound settlement — the stored treasury. No admin, upgrade-time, or arbiter path can withdraw escrow to any other party; there are no admin instructions.",
          "Resolution authority is always compared against the payment's own stored arbiter, never a global constant. Dispute concessions are designed so each is signable only by the party it works against: a sender can withdraw their dispute (full release to the recipient); a recipient can concede (full refund to the sender).",
        ],
      },
      {
        heading: "Arithmetic and time",
        body: [
          "The Clock sysvar is the sole source of time — opening a dispute requires now before the deadline, and claiming an expired payment requires now at or after it. Arithmetic is checked everywhere; zero amounts and unsupported durations fail on chain. On a network with no configured treasury, settlement fails closed rather than guessing a destination.",
        ],
      },
      {
        heading: "Adversarial testing",
        body: [
          "The program is tested with LiteSVM in Rust. Every instruction ships with authorization, state, account-substitution, and boundary tests, and tests assert token balances before and after — not merely that a call succeeded. Separate suites cover isolation between payments and golden-image checks on the serialized program interface.",
          "V0 is deployed to devnet and has passed live functional validation of every state transition and the rejection paths around them. That validation is functional, not a security audit, and is not authorization for mainnet.",
        ],
      },
    ],
    note:
      "Scope and invariants are documented in the repository's architecture notes. The program source and deployment keys are private.",
  },
  studispace: {
    slug: "studispace",
    overview:
      "StudiSpace is an AI-powered study platform spanning a web application and a native iOS app. It turns a student's material into study tools — flashcards, tutoring, and assisted writing — with the AI mediated by a server-side gateway and held to a measurable quality bar rather than shipped on trust.",
    facts: [
      { label: "Domain", value: "AI education" },
      { label: "Web", value: "React · Vite" },
      { label: "Backend", value: "Firebase · Cloud Functions" },
      { label: "iOS", value: "Native (Xcode)" },
      { label: "Billing", value: "Stripe" },
      { label: "Tests", value: "Vitest" },
    ],
    sections: [
      {
        heading: "AI integration",
        body: [
          "Model calls run through a single server-side function that acts as the gateway — the client never holds model credentials or talks to a provider directly. Features like assisted writing, tutoring, and problem-solving call through that one path, which keeps credentials, model selection, and task routing on the server.",
          "The assisted-writing feature wraps the model call in a deterministic, no-model check layer: it measures length bounds, content-word overlap, preserved citations and numbers, and register, and falls back to the author's original text with a warning when a rewrite fails those checks. The goal is that output quality is a property the system enforces, not something a user has to notice.",
        ],
      },
      {
        heading: "Evaluation harness",
        body: [
          "Because a prompt or model change is otherwise judged by one person reading one sample, AI changes are measured with an evaluation harness so a change produces a number that moves. The deterministic checks above double as the harness's fidelity and register signals, and the logic is covered by unit tests under Vitest.",
        ],
      },
      {
        heading: "Application architecture",
        body: [
          "The web app is a React/Vite single-page application with a component system built on Radix primitives and Tailwind, React Query for data, and a route structure that separates public, authenticated, and billing surfaces. The native iOS app shares the product but is built natively, with its own onboarding, localization, and paywall flows.",
        ],
      },
      {
        heading: "Authentication, billing, and entitlements",
        body: [
          "Authentication and the backend run on Firebase, with Cloud Functions for server logic. Stripe handles payments, and tiered entitlements gate features — for example, limiting free users to a bounded number of study sets, tutoring messages, and scans before prompting an upgrade. Those limits are enforced as product rules, with localization (including Spanish) across onboarding and paywall copy.",
        ],
      },
      {
        heading: "Production engineering",
        body: [
          "The platform runs in production across web and iOS: real auth, real payments, real users, and the operational surface that comes with them — localization, entitlement edge cases, and the gap between a model that works in a demo and one that holds up on arbitrary student input.",
        ],
      },
    ],
    note: "Application source is private. This describes architecture and engineering approach, not implementation detail.",
  },
  "find-my-savings": {
    slug: "find-my-savings",
    overview:
      "Find My Savings connects a user's bank account through Plaid and scans their transactions for money owed back to them — currently-open class-action settlements, product recalls, and wage actions tied to the merchants and employers in their history. Everything it surfaces is constrained to verifiable, official sources. Because it handles a live bank-data connection, the engineering that matters is the security of that boundary.",
    facts: [
      { label: "Domain", value: "Consumer fintech" },
      { label: "Platform", value: "Base44" },
      { label: "Bank data", value: "Plaid (transactions)" },
      { label: "Crypto", value: "Web Crypto (RS256 / JWKS)" },
      { label: "Client", value: "React" },
      { label: "Status", value: "Private" },
    ],
    sections: [
      {
        heading: "Webhook verification",
        body: [
          "Plaid delivers transaction updates by webhook, so the webhook is an attacker-reachable endpoint. Each incoming webhook carries a signed JWT in its verification header; the handler parses it, fetches Plaid's JSON Web Key Set, selects the key by key id, and verifies the RS256 signature with Web Crypto before trusting any field.",
          "Beyond the signature, it checks the token's issuer and audience, rejects expired tokens, and — when Plaid includes a request-body checksum — recomputes a SHA-256 of the raw body and compares, so a valid signature can't be replayed over a swapped payload. Verification failures are logged and never processed. This is an implemented control, verified in source; it is not the product of an external audit.",
        ],
      },
      {
        heading: "Token and secret handling",
        body: [
          "Plaid client credentials live in a runtime secret store and are read only on the server; they never reach the browser. The short-lived public token the client obtains is exchanged for a long-lived access token server-side, and that access token is stored server-side under a service role — it is never returned to the client. The Plaid environment is constrained to an explicit allowlist (sandbox / development / production).",
        ],
      },
      {
        heading: "Constrained research",
        body: [
          "The feature that identifies money owed uses a model with web access, but the instruction is deliberately narrow: return only currently-open, verifiable opportunities backed by an official source (a court site, CPSC, FTC, or NLRB), skip anything it can't verify, and do not fabricate. The intent is that a user is never shown a settlement or recall that doesn't actually exist.",
        ],
      },
      {
        heading: "Access control",
        body: [
          "The application sits behind authentication with protected routes and an OAuth consent flow, so the bank-data features are reachable only to an authenticated user. Stored Plaid items are associated with the authenticated user that created them.",
        ],
      },
    ],
    note:
      "Implemented controls above were verified against the application source. No vulnerabilities, audit results, or security guarantees are claimed; source is private.",
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
      "The on-chain program is the only trusted component. The frontend, the SDK caller, and every account passed into an instruction are treated as adversarial. Safety means that no sequence of instructions can move escrowed principal anywhere but the two stored parties (or the stored treasury, as the stored fee).",
    surfaces: [
      {
        surface: "Account substitution",
        risk: "A caller passes a token account or identity that isn't the one stored on the payment, to redirect funds.",
        control:
          "Destinations are derived ATAs of stored identities; every instruction validates account identity against the stored Payment before any transfer. Covered by per-instruction substitution tests.",
      },
      {
        surface: "Unauthorized signer",
        risk: "A party tries to take an action reserved for a different role — e.g. resolving a dispute, or releasing funds they don't control.",
        control:
          "Signer is validated against the payment's stored roles; resolution authority is compared to the payment's own arbiter, and each dispute concession is signable only by the party it works against.",
      },
      {
        surface: "Illegal state transition",
        risk: "Moving a payment into a state the protocol forbids, or acting on a terminal payment.",
        control:
          "State is an explicit enum with an enumerated transition set; terminal states admit no transitions. State is validated before any effect and never inferred from balances.",
      },
      {
        surface: "Timing / boundary",
        risk: "Disputing after a deadline, or claiming expiry early, by manipulating perceived time or edge amounts.",
        control:
          "The Clock sysvar is the sole time source with strict comparisons; arithmetic is checked; zero and unsupported values fail on chain. Boundary tests assert the exact edges.",
      },
    ],
  },
  {
    project: "Find My Savings",
    slug: "find-my-savings",
    posture:
      "The service holds a live connection to a user's bank through Plaid. The threat model centres on the two places an attacker can reach — the public webhook endpoint and anything that could leak an access token — and on never showing a user a fabricated financial opportunity.",
    surfaces: [
      {
        surface: "Forged webhook",
        risk: "An attacker posts a crafted payload to the public webhook endpoint to trigger processing or inject false transaction state.",
        control:
          "Every webhook's signed JWT is verified against Plaid's JWKS (RS256), with issuer, audience, and expiry checks and a SHA-256 request-body checksum. Unverified payloads are never processed.",
      },
      {
        surface: "Access-token exposure",
        risk: "A long-lived bank access token leaks to the client or a log and is reused to pull the user's financial data.",
        control:
          "Public-to-access token exchange happens server-side; the access token is stored server-side under a service role and never returned to the client. Provider credentials stay in a runtime secret store.",
      },
      {
        surface: "Fabricated findings",
        risk: "A model with web access invents a settlement or recall, so a user acts on an opportunity that doesn't exist.",
        control:
          "Research is constrained to currently-open, verifiable opportunities from named official sources, with explicit instructions to skip the unverifiable and never fabricate.",
      },
    ],
  },
];

export const methodology: string[] = [
  "Write the invariant before the feature — state, in plain language, what must never happen, then encode it where it can't be bypassed (an account constraint, a signer check, a signature verification) rather than in UI or convention.",
  "Test the negative cases. For each authorization boundary there is a test that the disallowed caller, state, account, or timing is rejected — assertions on effects (token balances, processing), not just on success.",
  "Treat every boundary as adversarial input: the frontend, the SDK caller, third-party webhooks, and OAuth callbacks are all untrusted until verified server-side or on chain.",
  "Keep exploratory work labelled as exploratory. Implemented, tested controls are described as such; anything researched but not shipped is not presented as a guarantee.",
];
