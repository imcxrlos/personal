"use client";

/**
 * Move your cursor to crunch the image into chunky pixel blocks that jitter,
 * distort and RGB-split around the pointer.
 *
 * Ported from the Indeficient effect, with two changes: away from the cursor
 * the original still quantized the whole image to 240-row blocks, so here the
 * effect is blended out with distance and outside the pointer's reach the
 * photograph is the untouched, full-resolution image; and the block size is
 * stepped rather than continuous, so blocks read as blocks (see below).
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float force = 1.0 - smoothstep(0.0, 0.34, length(d)); // 1 at cursor → 0 away

        // pixel blocks: near full-res away, chunky right under the cursor.
        // The block size is snapped to 6 steps: varied continuously per pixel,
        // neighbouring pixels never share a grid and the blocks dissolve into
        // concentric moire rings instead of reading as blocks.
        float cells = mix(240.0, 24.0, floor(force * 6.0 + 0.5) / 6.0);
        vec2 grid = vec2(cells * aspect, cells);
        vec2 cell = floor(uv * grid);
        vec2 puv = (cell + 0.5) / grid;

        // per-block jitter that wobbles over time → the distortion animates
        float r = hash21(cell);
        float r2 = hash21(cell + 7.3);
        vec2 jitter = (vec2(r, r2) - 0.5)
                    * force * 0.07 * (0.5 + 0.5 * sin(time * 6.0 + r * 6.2831));

        // chroma split grows with proximity for a glitchy edge
        float ca = force * 0.012;
        vec2 s = puv + jitter;
        vec3 col = vec3(
          texCover(s + vec2(ca, 0.0)).r,
          texCover(s).g,
          texCover(s - vec2(ca, 0.0)).b
        );

        // Only the pointer's reach is affected: blend back to the untouched
        // full-resolution photo as the force falls off.
        col = mix(texCover(uv).rgb, col, smoothstep(0.0, 0.25, force));
        gl_FragColor = vec4(col, 1.0);
      }
    `;

export default function PixelDistortion({
  image,
  className,
  anchorY,
  onReady,
}: {
  image: string;
  className?: string;
  anchorY?: number;
  onReady?: () => void;
}) {
  return (
    <ImageShaderCanvas
      fragmentShader={FRAGMENT_SHADER}
      image={image}
      className={className}
      anchorY={anchorY}
      onReady={onReady}
    />
  );
}
