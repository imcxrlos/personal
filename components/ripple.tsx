"use client";

/**
 * Concentric water ripples radiate from your cursor and warp the image.
 *
 * Ported from the Indeficient effect; the shader is unchanged except the
 * ripple's reach, trimmed from 0.5 to 0.42.
 */

import ImageShaderCanvas from "./image-shader-canvas";

const FRAGMENT_SHADER = /* glsl */ `
      void main() {
        vec2 uv = uv01();
        float aspect = resolution.x / resolution.y;
        vec2 d = uv - mouse;
        d.x *= aspect;
        float dist = length(d);
        float ripple = sin(dist * 40.0 - time * 4.0)
                     * 0.012 * smoothstep(0.42, 0.0, dist);
        vec2 off = normalize(d + 1e-6) * ripple;
        off.x /= aspect;
        gl_FragColor = texCover(uv + off);
      }
    `;

export default function Ripple({
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
