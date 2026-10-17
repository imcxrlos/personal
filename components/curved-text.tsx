"use client";

/**
 * Repeated text gliding along a gentle curve, looped with a GSAP tween —
 * adapted from the text-along-path reference. Each copy's startOffset moves
 * one STEP per cycle, so the last frame matches the first. STEP is one copy's
 * measured length as a share of the path, so the copies sit end to end; the
 * curve and the text are drawn at 1:1 against the measured width, so the type
 * stays the same size at every breakpoint.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const TEXT = "CXRLOS · INDEPENDENT ENGINEER · ";
const HEIGHT = 84;
const SPEED = 34; // px per second along the curve

const textStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: "0.12em",
  whiteSpace: "pre",
};

// The reference's shape — flat, up to a crest at the middle, back down — but
// much flatter: a rise of 20–34px across the full width.
function curve(w: number) {
  const base = HEIGHT - 16;
  const crest = base - Math.min(34, Math.max(20, w * 0.025));
  return `M0,${base} C${w * 0.25},${base} ${w * 0.25},${crest} ${w * 0.5},${crest} S${w * 0.75},${base} ${w},${base}`;
}

export function CurvedText() {
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const pathsRef = useRef<(SVGTextPathElement | null)[]>([]);
  const [width, setWidth] = useState(0);
  const [loop, setLoop] = useState<{ step: number; copies: number; duration: number } | null>(
    null,
  );

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Measure once the mono face has loaded, and again on every resize.
  useLayoutEffect(() => {
    if (!width) return;
    let live = true;
    const measure = () => {
      const path = pathRef.current;
      const text = measureRef.current;
      if (!live || !path || !text) return;
      const copy = text.getComputedTextLength();
      const step = (copy / path.getTotalLength()) * 100;
      // One copy waiting before the start, plus enough to reach past the end.
      setLoop({ step, copies: Math.ceil(100 / step) + 2, duration: copy / SPEED });
    };
    measure();
    document.fonts.ready.then(measure);
    return () => {
      live = false;
    };
  }, [width]);

  useEffect(() => {
    if (!loop) return;
    const { step, duration } = loop;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
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

      // Only run while the footer is on screen.
      const io = new IntersectionObserver(([entry]) =>
        entry.isIntersecting ? tween.play() : tween.pause(),
      );
      if (boxRef.current) io.observe(boxRef.current);
      return () => io.disconnect();
    });

    return () => mm.revert();
  }, [loop]);

  return (
    <div ref={boxRef} aria-hidden className="w-full overflow-hidden" style={{ height: HEIGHT }}>
      {width ? (
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block text-[var(--color-muted)]"
        >
          {/* Invisible guide: only defines the curve the text rides on. */}
          <path ref={pathRef} id="footer-curve" fill="none" stroke="none" d={curve(width)} />
          <text ref={measureRef} style={textStyle} visibility="hidden">
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
