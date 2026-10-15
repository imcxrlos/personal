"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Three.js + the effect load only on the client, on demand, as a separate chunk.
const FlowField = dynamic(() => import("./flow-field"), { ssr: false });

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

type Props = {
  /** Single image source, shared by the static layer and the particle sampler
   *  so the shader's texture is served from cache with no second fetch. */
  src: string;
};

/**
 * Renders the cropped cove photograph inside a restrained landscape frame.
 * On capable, motion-tolerant desktops it enriches the still with an
 * interactive particle flow; otherwise the static image is the whole visual.
 * The frame reserves its aspect ratio, so nothing shifts as the effect loads.
 */
export function HeroShader({ src }: Props) {
  const [enhanced, setEnhanced] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fadeStatic, setFadeStatic] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad, so the
  // event never fires. Check completeness on mount as well.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setImgLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    const lowCores =
      typeof navigator !== "undefined" &&
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4;

    // Static on: reduced motion, touch/coarse pointers, small or constrained
    // devices, or no WebGL. Interactive only where it stays smooth.
    if (reduceMotion || coarse || narrow || lowCores) return;
    if (!webglAvailable()) return;
    setEnhanced(true);
  }, []);

  // The static photo fades out only once the shader reports it has rendered the
  // real image (correct dimensions) — never on a blind timer, so the shader can
  // never be revealed while still showing a placeholder/cropped frame.

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden bg-[var(--color-paper)]">
      {/* Static photograph — fallback, and the base layer during load. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt="A quiet coastal cove — turquoise water framed by limestone cliffs and a pale shoreline."
        onLoad={() => setImgLoaded(true)}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        style={{ opacity: fadeStatic ? 0 : 1 }}
        draggable={false}
      />
      {enhanced && imgLoaded ? (
        <FlowField
          image={src}
          cols={210}
          dpr={2}
          className=""
          onReady={() => setFadeStatic(true)}
        />
      ) : null}
      {enhanced ? (
        <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink)]/45">
          Move your pointer across the water
        </span>
      ) : null}
    </div>
  );
}
