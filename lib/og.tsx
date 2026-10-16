import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

// Share cards (Open Graph / Twitter), rendered at build time by the
// opengraph-image files. Satori can't use the site's next/font files, so
// assets/og holds static Latin subsets of the same three families (see
// assets/og/README.md).

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// The @theme tokens in app/globals.css. The card ground is the panel tone,
// a step warmer than the page white, so the card reads as a surface in feeds.
const c = {
  ground: "#f7f7f5",
  ink: "#16171a",
  muted: "#6b6d72",
  faint: "#9a9ca1",
  line: "#e6e6e2",
  lineStrong: "#d6d6d1",
  accent: "#26406e",
};

const serif = "Newsreader";
const sans = "Inter";
const mono = "JetBrains Mono";

const fromRoot = (...p: string[]) => readFile(join(process.cwd(), ...p));

async function fonts() {
  const [regular, italic, inter, interMedium, jbMono] = await Promise.all([
    fromRoot("assets/og/Newsreader-Display-Regular.ttf"),
    fromRoot("assets/og/Newsreader-Display-Italic.ttf"),
    fromRoot("assets/og/Inter-Regular.ttf"),
    fromRoot("assets/og/Inter-Medium.ttf"),
    fromRoot("assets/og/JetBrainsMono-Medium.ttf"),
  ]);
  return [
    { name: serif, data: regular, weight: 400 as const, style: "normal" as const },
    { name: serif, data: italic, weight: 400 as const, style: "italic" as const },
    { name: sans, data: inter, weight: 400 as const, style: "normal" as const },
    { name: sans, data: interMedium, weight: 500 as const, style: "normal" as const },
    { name: mono, data: jbMono, weight: 500 as const, style: "normal" as const },
  ];
}

// Content strings use straight apostrophes; the cards get typographic ones.
const curly = (t: string) => t.replace(/'/g, "\u2019");

async function render(node: React.ReactElement) {
  return new ImageResponse(node, { ...ogSize, fonts: await fonts() });
}

// The site's .eyebrow: small mono caps, wide tracking.
function Eyebrow({
  children,
  color = c.faint,
  size = 17,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: mono,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </div>
  );
}

// Frame for the inner pages: the nav's wordmark and active section on top,
// the page path under a hairline at the bottom.
function Frame({
  section,
  path,
  children,
}: {
  section: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: c.ground,
        color: c.ink,
        fontFamily: sans,
        padding: "60px 80px 56px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 24, letterSpacing: "-0.01em" }}>
          {site.handle}
        </div>
        <div style={{ display: "flex", gap: 30, fontFamily: mono, fontSize: 18 }}>
          {["Index", "Projects", "Security"].map((item) =>
            item === section ? (
              <div key={item} style={{ display: "flex", color: c.ink }}>
                {item}
                <span style={{ marginLeft: 8, color: c.accent }}>·</span>
              </div>
            ) : (
              <div key={item} style={{ display: "flex", color: c.faint }}>
                {item}
              </div>
            ),
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderTop: `1px solid ${c.lineStrong}`,
          paddingTop: 22,
          fontSize: 19,
          color: c.muted,
        }}
      >
        <div style={{ display: "flex" }}>
          {site.name} · Independent software engineer
        </div>
        <div style={{ display: "flex", fontFamily: mono, fontSize: 17, color: c.faint }}>
          {site.domain}
          {path}
        </div>
      </div>
    </div>
  );
}

// ---- Home ---------------------------------------------------------------

export async function homeImage() {
  // A band of public/hero-cove.jpg: scaled to 1200 wide, rows 290–670, with
  // the white sky multiplied onto the card ground (Satori ignores
  // mix-blend-mode, so it's baked in; see assets/og/README.md). Placed so the
  // headlands frame the type and the bay runs along the bottom, as in the hero.
  const cove = `data:image/png;base64,${(await fromRoot("assets/og/cove.png")).toString("base64")}`;

  return render(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: c.ground,
        color: c.ink,
        fontFamily: sans,
      }}
    >
      {/* Satori renders plain <img>; next/image doesn't apply here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cove}
        alt=""
        width={1200}
        height={380}
        style={{ position: "absolute", left: 0, top: 250 }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 64,
        }}
      >
        <Eyebrow color={c.muted} size={19}>
          Independent software engineer
        </Eyebrow>
        <div
          style={{
            display: "flex",
            fontFamily: serif,
            fontSize: 112,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginTop: 22,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            textAlign: "center",
            maxWidth: 600,
            marginTop: 22,
            fontSize: 27,
            lineHeight: 1.4,
            color: c.muted,
            textWrap: "balance",
          }}
        >
          I build AI products, payment infrastructure, and the security around them.
        </div>
      </div>
    </div>,
  );
}

// ---- Projects -----------------------------------------------------------

export async function projectsImage(count: number) {
  const marks = Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0"));

  return render(
    <Frame section="Projects" path="/projects">
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div
          style={{
            display: "flex",
            fontFamily: serif,
            fontSize: 80,
            lineHeight: 1.06,
            letterSpacing: "-0.015em",
            maxWidth: 760,
          }}
        >
          What I’ve built and how it works.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            maxWidth: 760,
            fontSize: 26,
            lineHeight: 1.45,
            color: c.muted,
            textWrap: "balance",
          }}
        >
          Payments, AI and data products, with notes on how each one is built.
        </div>
      </div>
      {/* A quiet index of the work: one numbered column per project. */}
      <div style={{ display: "flex", marginBottom: 40, gap: 16 }}>
        {marks.map((m) => (
          <div
            key={m}
            style={{
              display: "flex",
              flex: 1,
              borderTop: `1px solid ${c.ink}`,
              paddingTop: 12,
              fontFamily: mono,
              fontSize: 17,
              color: c.faint,
            }}
          >
            {m}
          </div>
        ))}
      </div>
    </Frame>,
  );
}

// ---- Security -----------------------------------------------------------

export async function securityImage(areas: string[]) {
  return render(
    <Frame section="Security" path="/security">
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
          <div
            style={{
              display: "flex",
              fontFamily: serif,
              fontSize: 84,
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
            }}
          >
            Security work.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 26,
              lineHeight: 1.45,
              color: c.muted,
              textWrap: "balance",
            }}
          >
            What my software should refuse to do, and whether it actually does.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {areas.map((a, i) => (
            <div
              key={a}
              style={{
                display: "flex",
                alignItems: "baseline",
                borderTop: `1px solid ${c.lineStrong}`,
                borderBottom: i === areas.length - 1 ? `1px solid ${c.lineStrong}` : "none",
                padding: "18px 0",
                fontFamily: mono,
                fontSize: 16,
              }}
            >
              <div style={{ display: "flex", width: 46, color: c.faint }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", color: c.ink }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </Frame>,
  );
}

// ---- Security case study ------------------------------------------------

export async function securityArticleImage({
  index,
  total,
  kind,
  title,
  blurb,
  slug,
}: {
  index: number;
  total: number;
  kind: string;
  title: string;
  blurb: string;
  slug: string;
}) {
  const n = (i: number) => String(i).padStart(2, "0");

  return render(
    <Frame section="Security" path={`/security/${slug}`}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Eyebrow color={c.muted}>
            {`${n(index + 1)} / ${n(total)}`}
          </Eyebrow>
          <div style={{ display: "flex", width: 28, borderTop: `1px solid ${c.lineStrong}` }} />
          <Eyebrow>{kind}</Eyebrow>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontFamily: serif,
            fontSize: 72,
            lineHeight: 1.06,
            letterSpacing: "-0.015em",
            maxWidth: 960,
            textWrap: "balance",
          }}
        >
          {curly(title)}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            maxWidth: 880,
            fontSize: 25,
            lineHeight: 1.45,
            color: c.muted,
            textWrap: "balance",
          }}
        >
          {curly(blurb)}
        </div>
      </div>
    </Frame>,
  );
}
