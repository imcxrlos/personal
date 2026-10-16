"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Three.js + the effect load only on the client, on demand, as a separate chunk.
const FlowField = dynamic(() => import("./flow-field"), {
  ssr: false,
});

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

/**
 * The hero photograph, cover-fit with the crop weighted toward the top (the
 * empty sky): 88% off the top, 12% off the bottom, matched in the shader. On
 * motion-tolerant desktops with a fine pointer, a curl-noise flow field
 * gently warps the photo (same image, same crop, full resolution); the canvas
 * stays transparent until it has drawn the real image, so the frame is never
 * shown at a placeholder fit. Otherwise the still is the whole visual.
 */
export function HeroShader({ src }: { src: string }) {
  const [enhanced, setEnhanced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    if (reduceMotion || coarse || narrow || !webglAvailable()) return;
    setEnhanced(true);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--color-paper)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="A quiet coastal cove — turquoise water framed by limestone cliffs and a pale shoreline."
        className="absolute inset-0 h-full w-full object-cover object-[50%_88%]"
        draggable={false}
      />
      {enhanced ? (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <FlowField
            image={src}
            className="absolute inset-0"
            anchorY={0.12}
            onReady={() => setReady(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
