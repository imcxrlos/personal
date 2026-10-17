"use client";

/**
 * Repeated text gliding along a curve, looped with a GSAP tween —
 * adapted from the text-along-path reference. Each copy's startOffset moves
 * one STEP per cycle, so the last frame matches the first. STEP is one copy's
 * measured length as a share of the path, so the copies sit end to end; the
 * curve is drawn at 1:1 in the band's measured box (its height is set in CSS,
 * so nothing shifts on load), so the type stays the same size everywhere.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const TEXT = "CXRLOS · INDEPENDENT ENGINEER · ";
const SPEED = 24; // px per second along the curve

const FONT_SIZE = 11;
const TRACKING = 0.14; // em

const textStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: FONT_SIZE,
  fontWeight: 500,
  letterSpacing: `${TRACKING}em`,
  whiteSpace: "pre",
};

// WebKit leaves letter-spacing out of getComputedTextLength (but still draws
// it), so measure without it and add it back: the same length in every engine.
const measureStyle: React.CSSProperties = { ...textStyle, letterSpacing: 0 };

// The reference path (m0,88.5 c61.37,0 61.5,-68 126.5,-68 58,0 51,68 123,68
// in a 250-wide box), stretched to the band: flat, up to a crest just past
// the middle, back down. The rise fills the band less room for the type.
function curve(w: number, h: number) {
  const x = (v: number) => (v / 249.5) * w;
  const base = h - 14;
  const crest = 22;
  return `M0,${base} C${x(61.37)},${base} ${x(61.5)},${crest} ${x(126.5)},${crest} C${x(184.5)},${crest} ${x(177.5)},${base} ${w},${base}`;
}

export function CurvedText() {
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const pathsRef = useRef<(SVGTextPathElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [loop, setLoop] = useState<{ step: number; copies: number; duration: number } | null>(
    null,
  );

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Measure once the mono face has loaded, and again on every resize.
  useLayoutEffect(() => {
    if (!size.w) return;
    let live = true;
    const measure = () => {
      const path = pathRef.current;
      const text = measureRef.current;
      if (!live || !path || !text) return;
      const copy = text.getComputedTextLength() + TEXT.length * TRACKING * FONT_SIZE;
      const step = (copy / path.getTotalLength()) * 100;
      // One copy waiting before the start, plus enough to reach past the end.
      setLoop({ step, copies: Math.ceil(100 / step) + 2, duration: copy / SPEED });
    };
    measure();
    document.fonts.ready.then(measure);
    return () => {
      live = false;
    };
  }, [size]);

  useEffect(() => {
    if (!loop) return;
    const { step, duration } = loop;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1,
        duration,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          pathsRef.current.forEach((path, i) => {
            path?.setAttribute("startOffset", `${-step + i * step + proxy.p * step}%`);
          });
        },
      });
    });

    return () => mm.revert();
  }, [loop]);

  return (
    <div ref={boxRef} aria-hidden className="h-[104px] w-full overflow-hidden md:h-[152px]">
      {size.w ? (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="block text-[var(--color-faint)]"
        >
          {/* Invisible guide: only defines the curve the text rides on. */}
          <path ref={pathRef} id="footer-curve" fill="none" stroke="none" d={curve(size.w, size.h)} />
          <text ref={measureRef} style={measureStyle} visibility="hidden">
            {TEXT}
          </text>
          {loop ? (
            <text fill="currentColor" style={textStyle}>
              {Array.from({ length: loop.copies }).map((_, i) => (
                <textPath
                  key={i}
                  ref={(el) => {
                    pathsRef.current[i] = el;
                  }}
                  href="#footer-curve"
                  startOffset={`${-loop.step + i * loop.step}%`}
                >
                  {TEXT}
                </textPath>
              ))}
            </text>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
