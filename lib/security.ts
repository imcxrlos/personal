// Security portfolio content.
// Every claim here is checked against local source, tests, and project docs.
// Code excerpts are copied from real files and carry no keys, wallet
// addresses, or private URLs. Nothing here claims an external audit, a
// confirmed third-party vulnerability, or testing without authorization.

export type CodeBlock = { lang: string; caption?: string; code: string };
export type SecuritySection = {
  heading: string;
  body: string[];
  code?: CodeBlock;
};
export type SecurityArticle = {
  slug: string;
  title: string;
  kind: string;
  // One line for the index card.
  blurb: string;
  // Lead paragraph on the article page.
  intro: string;
  sections: SecuritySection[];
  // Honest closing note: scope and limits.
  limits: string;
};

export const securityIntro = {
  heading: "Security work.",
  lead: "Most of what I build either holds money or holds people's data, so a lot of my engineering is really security engineering: deciding what a system should refuse, and proving it refuses it. This is a set of write-ups on that work — adversarial tests against an on-chain escrow, the security boundaries in two payment apps, a test I wrote for a lead endpoint, and some reverse engineering. Each one is about what I actually did, with real code where it helps.",
  note: "Everything here is my own code or my own analysis. I don't claim an external audit, a found vulnerability in anyone else's system, or any testing I wasn't authorized to do.",
};

export const securityArticles: SecurityArticle[] = [
  {
    slug: "smart-contracts",
    title: "Adversarial testing of a Solana escrow",
    kind: "Smart-contract security",
    blurb:
      "How I test Protected Pay's on-chain program: ~100 tests that try to break it, plus live validation on devnet.",
    intro:
      "Protected Pay is an escrow program on Solana: it holds a payment until it's released to the seller, refunded, or claimed after a deadline. The program is the only thing standing between escrowed money and whoever wants to redirect it, so I test it the way an attacker would poke at it — wrong signer, swapped accounts, illegal state changes, timing games — and assert on balances, not just on whether a call succeeded. There are about 100 of these tests across the instructions, run in LiteSVM, plus a round of live validation on devnet.",
    sections: [
      {
        heading: "State is an enum, not a pile of booleans",
        body: [
          "A payment is always in exactly one state. I model that as an enum with the transitions written as methods, so an impossible combination like \"released and refunded\" can't even be represented, and an illegal transition fails before any token moves. Released and Refunded are terminal.",
          "This is also where one of the core guarantees lives. A disputed payment can only leave through resolve, withdraw, or concede — never through the expiry claim — so a deadline can never settle a dispute, and a sender can never claw back escrow on their own.",
        ],
        code: {
          lang: "rust",
          caption: "programs/protected-pay/src/state.rs",
          code: `/// Explicit lifecycle state. Modelled as an enum (not booleans) so that
/// impossible combinations such as "released and refunded" cannot be encoded.
pub enum PaymentState {
    Protected,  // escrowed; sender may release or dispute; anyone may claim after the deadline
    Disputed,   // locked pending the arbiter; the deadline no longer matters
    Released,   // terminal: principal went to the recipient
    Refunded,   // terminal: principal went back to the sender
}

impl PaymentState {
    /// Protected -> Disputed. Every other origin is rejected.
    pub fn dispute(self) -> Result<Self> {
        match self {
            PaymentState::Protected => Ok(PaymentState::Disputed),
            _ => err!(ProtectedPayError::InvalidStateTransition),
        }
    }
}`,
        },
      },
      {
        heading: "The arbiter can decide, but it can't redirect",
        body: [
          "The arbiter resolves a dispute by choosing release or refund. What it must not be able to do is point the money at itself, or at a stranger, or cross-wire release to the wrong party. So the test takes a disputed payment and tries every one of those destinations in a loop, and asserts each attempt fails with InvalidSettlementDestination — then checks the vault balance is untouched and the state is still Disputed. Deciding a dispute is authority over the outcome, not custody of the funds.",
        ],
        code: {
          lang: "rust",
          caption: "programs/protected-pay/tests/resolve_dispute.rs",
          code: `for (resolution, dest) in [
    (Resolution::Release, arbiter_ata),
    (Resolution::Refund,  arbiter_ata),
    (Resolution::Release, stranger_ata),
    (Resolution::Refund,  stranger_ata),
    // Cross-wired: release to the sender's ATA, refund to the recipient's ATA.
    (Resolution::Release, p.sender_ata),
    (Resolution::Refund,  p.recipient_ata),
] {
    let mut ix = ResolveIx::new(&live, resolution);
    ix.destination_token_account = dest;
    let res = env.send(&[ix.ix()], &arbiter, &[&arbiter]);
    assert_error(&res, custom_code(ProtectedPayError::InvalidSettlementDestination));
}
assert_eq!(env.balance(&live.vault), ONE_USDC); // nothing moved
assert_eq!(env.payment(&live.payment).state, PaymentState::Disputed);`,
        },
      },
      {
        heading: "Timing boundaries, on purpose",
        body: [
          "Opening a dispute needs the current time strictly before the deadline. Claiming an expired payment needs it at or after the deadline. I picked those comparisons so no instant satisfies both — there's no overlap where a payment could be disputed and claimed at the same moment. The tests set the clock to exactly deadline minus one and exactly the deadline, for every protection period, and check the claim is rejected a second early and accepted on the dot.",
        ],
        code: {
          lang: "rust",
          caption: "open_dispute.rs and claim_expired.rs — the two checks that can't both hold",
          code: `// open_dispute: strictly before the deadline
require!(now < payment.protection_deadline, ProtectedPayError::ProtectionNotYetExpired);

// claim_expired: inclusive, at or after the deadline
require!(now >= payment.protection_deadline, ProtectedPayError::ProtectionNotExpired);`,
        },
      },
      {
        heading: "What the tests cover",
        body: [
          "About 100 integration tests across the instructions: roughly 24 on creating a payment, 12 on resolving disputes, 12 on fee math, 10 on release, 9 each on withdraw and concede, 9 on opening a dispute, 8 on the expiry claim, 6 on vault isolation, and a golden-fixture test that fails if the program's interface drifts from what the SDK expects. They group into wrong-signer, account substitution, illegal state transitions, timing boundaries, isolation between payments, and fee arithmetic at the edges of a u64.",
          "The rule I hold to is that every settlement test asserts token balances before and after and checks the vault actually closes, rather than trusting that a successful transaction did the right thing. A test that only checks a call returned Ok would miss a program that moved the wrong amount to the right place.",
        ],
      },
      {
        heading: "Then I ran it live",
        body: [
          "LiteSVM is fast but it's still a simulated runtime. So I also ran a driver against the deployed devnet program with fresh participants, and verified each outcome by reading balances, state, and account existence back from the chain. That covered the happy paths (create, release, dispute to refund, dispute to release, permissionless expiry claim) and the rejections: unauthorized release and dispute, destination substitution to the arbiter's own account or the counterparty's or the vault itself, a disputed payment blocking expiry, and double-settlement on a terminal payment. The expiry claim waited out the real one-hour window instead of fast-forwarding it.",
          "A useful thing fell out of that run: some attacks are stopped by Anchor's own account checks before my program's check even runs. Substituting a foreign token account fails with ConstraintTokenOwner; passing the vault as the destination fails with ConstraintDuplicateMutableAccount. Same result, different error, and worth knowing if you're building a client that has to tell users why something was rejected.",
        ],
      },
    ],
    limits:
      "This is testing of my own program — defensive work to show it rejects what it should. It is not a security audit or a formal verification, and I don't present it as one. The program runs on devnet; the upgrade authority there is a single key, and that's documented in the repo's threat model.",
  },
  {
    slug: "payments",
    title: "Security boundaries in two payment apps",
    kind: "Payment & financial application security",
    blurb:
      "API keys, webhook SSRF, bank-token handling, and a payment-existence leak I caught and fixed.",
    intro:
      "Two of my projects handle money off-chain: Protected Pay's business API and dashboard, and Find My Savings, which connects to a user's bank through Plaid. Both have a handful of places where a mistake would be expensive, and this is how those are built and tested. The most interesting part is a bug my own tests caught, so I'll start there.",
    sections: [
      {
        heading: "A 503 that leaked whether a payment existed",
        body: [
          "Payment and dispute pages in Protected Pay only load for the people in the payment. Everyone else gets a 404 that looks identical whether the payment is real or made up — that's deliberate, so the page can't be used as an oracle to check if a given payment exists.",
          "At one point it quietly broke. When the on-chain membership read failed, a real payment returned a 503 while a missing one still returned 404. That difference was enough to confirm a payment existed. I fixed it so a non-party always gets the same not-found answer, even when the chain read fails, and added tests that force the read to fail and assert the two responses are byte-for-byte identical.",
        ],
        code: {
          lang: "ts",
          caption: "web/test/payment-privacy.test.ts",
          code: `it('an unrelated signed-in wallet gets exactly what a missing payment gets', async () => {
  const token = await s.tokenFor(s.stranger);
  const unrelated = await s.access(token);
  expect(unrelated).toEqual({ kind: 'unavailable', wallet: s.stranger.address });
  expect(await s.access(token, s.missing)).toEqual(unrelated);
});

it('with the chain unreachable, a non-party and a missing payment still look the same', async () => {
  s.world.state.down = true;                       // force the membership read to fail
  expect(await s.access(token)).toEqual(await s.access(token, s.missing));
});`,
        },
      },
      {
        heading: "Webhooks that can't be pointed at your own network",
        body: [
          "A business can register a URL for Protected Pay to POST events to. That's a classic SSRF foothold: set the URL to an internal address and the server makes requests on your behalf. So before every delivery the destination hostname is resolved again, and the request is refused if it resolves to anything private — loopback, link-local, the cloud metadata address, unique-local IPv6, or an IPv4-mapped IPv6 form of any of those. Re-resolving on every send is what catches DNS rebinding, where a name is public at registration and flips to private later. Redirects aren't followed, there's a timeout, and the test runs a whole table of private answers and asserts nothing goes out.",
        ],
        code: {
          lang: "ts",
          caption: "web/test/business-webhooks.test.ts",
          code: `// The name now points somewhere private (rebinding): the next delivery is refused.
for (const answer of [
  ['127.0.0.1'], ['169.254.169.254'], ['::1'], ['fd00::1'],
  ['::ffff:192.168.0.1'], null, [],
]) {
  s.dns.set('hooks.shop-one.com', answer);
  const before = s.sent.length;
  await s.event(b.business, 'payment.created');
  await s.run();
  expect(s.sent.length).toBe(before);   // nothing sent
}`,
        },
      },
      {
        heading: "API keys you can't walk back",
        body: [
          "A business key is shown once. The server stores only an HMAC of it under a rotating pepper, compares in constant time, and rate-limits per key. Keys can be revoked, or rolled with a grace period so a rotation doesn't cause an outage, and a test key is refused against a live environment. Requests that look like they came from a browser — they carry an Origin, a Sec-Fetch-Site, or cookies — are refused outright, because a server-to-server key has no business being called from frontend code, and that's usually how one leaks.",
        ],
      },
      {
        heading: "Find My Savings: verifying Plaid before trusting it",
        body: [
          "Find My Savings holds a live bank connection through Plaid, so the two things worth protecting are the public webhook and the bank access token. Plaid signs each webhook with a JWT; the handler fetches Plaid's JWKS, selects the key by id, and verifies the RS256 signature with Web Crypto before reading a single field. It also checks issuer, audience, and expiry, and when Plaid includes a body checksum it recomputes a SHA-256 of the raw body and compares — so a valid signature can't be replayed over a swapped payload.",
          "The access token never touches the browser. The short-lived public token the client gets is exchanged server-side for the long-lived access token, which is stored server-side under a service role and never returned to the client. Provider credentials stay in a server secret store.",
        ],
      },
    ],
    limits:
      "These are implemented, tested controls in my own apps, verified against source. The existence-leak was a real bug in my own code that I found and fixed; nothing here is a finding in anyone else's system. No external audit, and no guarantee.",
  },
  {
    slug: "web",
    title: "Testing a lead endpoint, and tooling for it",
    kind: "Web application security",
    blurb:
      "A harness that gets past a bot wall to probe an unauthenticated endpoint, the fix that followed, and a recon toolkit.",
    intro:
      "This is the web side: a test I wrote to check whether an unauthenticated lead-capture endpoint was injectable, the hardening that came out of it, and a recon toolkit I built for checking landing pages. The target was a funnel I was authorized to test, and every row the probe submitted was the literal string xxxxx so it was trivial to find and delete afterward.",
    sections: [
      {
        heading: "Getting a probe past the bot wall",
        body: [
          "The endpoint sat behind a host-level anti-bot JavaScript challenge, which a plain curl or requests script can't clear — so a naive scanner would just bounce off the wall and report nothing. The harness drives a real Chromium, lets the challenge solve itself, then fires the probes with fetch() from inside the page so they carry the same cookie and user-agent the browser earned. It sends a clean baseline first, then error-based and time-based probes on the fields that reach the database.",
          "The time-based probe is the clean signal: if a payload that appends a SLEEP makes the response come back about five seconds slower than the baseline, that points at the input reaching a query unescaped. The harness measures the baseline latency, runs each probe, and stops at the first clear result to keep the number of submitted rows down.",
        ],
        code: {
          lang: "python",
          caption: "run_test.py — the probe set (values redacted to the test marker)",
          code: `SLEEP_SECS = 5
def payloads(base):
    return [
        ("error-quote", base + "'"),                          # 500 / SQL error vs 200 baseline
        ("time-AND",    base + "' AND SLEEP(%d)-- -" % SLEEP_SECS),
        ("time-OR",     base + "' OR SLEEP(%d)-- -"  % SLEEP_SECS),
        ("time-concat", base + "'||(SELECT SLEEP(%d))||'" % SLEEP_SECS),
    ]
# A ~5s delay over baseline on a SLEEP probe is the time-based signal;
# a 500 / SQL error where the baseline was 200 is the error-based one.`,
        },
      },
      {
        heading: "The part that actually matters: the fix",
        body: [
          "Finding out an input might reach a query is only useful if it leads to a fix, so the write-up that went with the harness is a remediation plan: parameterized queries so input can't change the shape of a statement, a least-privilege database user so a single endpoint can't read every table, server-side validation and anti-automation on the form instead of relying on the client challenge, and rotating any credentials that were exposed. The probe is throwaway; the hardening is the deliverable.",
        ],
      },
      {
        heading: "reconkit: recon and QA for landing pages",
        body: [
          "The other piece is reconkit, a toolkit I built for checking marketing funnels. It has two halves. The outside-in half runs on any domain and is passive — it grades DNS and email auth (SPF, DMARC, DKIM, CAA), grades HTTP security headers, fingerprints the stack, and in a deeper pass looks for exposed source maps and JS secrets. The inside-out half is for my own pages: it drives a real headless browser to see what actually happens at runtime, like which tracking pixels fire before and after consent and whether the conversion events are the ones you expect.",
          "The active scanning piece wraps nuclei in detection-only mode — misconfiguration, exposure, and CVE templates, with the fuzzing, denial-of-service, brute-force, and intrusive templates excluded, rate-limited, and behind a prompt that makes you confirm you're authorized. The README draws the line explicitly: passive recon on anything, active scanning on your own assets only.",
        ],
      },
    ],
    limits:
      "The endpoint test was run against a funnel I was authorized to test, with marker-only data. I'm describing the harness I built and the hardening I'd apply, not publishing a confirmed data breach — I didn't exfiltrate anyone's data. reconkit's active mode is deliberately gated to assets you own or are authorized to scan.",
  },
  {
    slug: "reverse-engineering",
    title: "Reverse engineering web and on-chain systems",
    kind: "Reverse engineering & API analysis",
    blurb:
      "Mapping a live tracking container, pivoting on recon signals, and decoding router calldata on-chain.",
    intro:
      "Some of the most useful work is just figuring out how a system behaves from the outside: what it loads, what it calls, how its pieces fit. Three examples — reconstructing a marketing tracking setup from its live container, the pivots I built into reconkit to cluster related sites, and decoding on-chain router calldata for a trading engine.",
    sections: [
      {
        heading: "Reconstructing a tracking container",
        body: [
          "Google Tag Manager publishes a container as a single JavaScript file at a known URL. It's minified and not meant to be read, but it's all there. I pulled the published container and worked through it to produce a full tracking plan: every tag, what triggers it, and which vendor it reports to. The container I mapped turned out to be wiring up a major social-ad pixel and its server-side conversions API, a search-ad and analytics stack, a couple of short-video and social pixels, and a session-analytics vendor, across roughly a hundred conversion-related references and custom variables.",
          "The point of doing it this way is that the container is the ground truth. Marketing docs tell you what's supposed to fire; the container tells you what actually does, including the tags nobody remembered adding.",
        ],
      },
      {
        heading: "Pivots: is this one site, or a network?",
        body: [
          "reconkit's intel pass is about linking sites that are trying to look unrelated. It pivots on signals a site leaks without meaning to: the analytics and ad IDs embedded in the page, the hash of the favicon, and the certificate history. Two \"different\" funnels that share a tracking ID or serve a byte-identical favicon are usually run by the same operator, and clustering on those signals surfaces that. It's all passive — the same requests a browser makes loading the page — and it reads like normal web traffic because it is.",
        ],
        code: {
          lang: "python",
          caption: "reconkit/tools/recon.py — the pivot surface",
          code: `def favicon_hash(...):     ...  # mmh3 hash of the favicon; matches reuse across sites
def tracking_id_pivot(...): ...  # reverse-lookup analytics / ad IDs to co-hosted domains
def sourcemap_exposure(...):...  # exposed .map files that leak original source
def grade_headers(...):    ...  # security-header posture, graded`,
        },
      },
      {
        heading: "Decoding what a contract call is really doing",
        body: [
          "On the on-chain side, I built a trading engine on Base that has to understand transactions it didn't create. That meant real reverse engineering: pulling verified ABIs and struct layouts from Sourcify, deriving liquidity-pool addresses deterministically with CREATE2 instead of trusting a lookup, and decoding the packed calldata of a Universal Router swap — which encodes a sequence of commands and their inputs in one blob — into the actual sequence of operations so the engine can simulate it before acting. It's the same skill as reading a minified container: take an opaque artifact and recover what it means.",
        ],
      },
    ],
    limits:
      "The tracking-container work used a publicly served file and my own or my employer's container. The pivots in reconkit are passive and browser-equivalent. The on-chain decoding is of public contract bytecode and calldata. Nothing here involved unauthorized access.",
  },
];
