"use client";

/**
 * The photograph rendered as a dense field of fine particles. Move the cursor
 * to shove them aside; a damped spring snaps them back.
 *
 * Adapted from the reference effect rather than copied: the reference uses a
 * fixed 140x80 grid with large points, which on a full-width hero reads as
 * coarse blocks instead of a photograph. Here the grid is derived from the
 * container at a fine pitch (particles far smaller than the reference's) and
 * is rebuilt on resize, so the hero reads as the original picture.
 *
 * Density that fine is only affordable because the simulation is sparse: at
 * rest nothing moves, so no integration and no buffer upload happen at all;
 * while the cursor is in the frame, only the particles inside the disturbed
 * region are integrated and only those rows are uploaded to the GPU.
 *
 * Spring physics and shaders are unchanged from the reference.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX_SHADER = /* glsl */ `
  precision highp float;
  attribute vec2 aUv;
  uniform vec2 uResolution;
  uniform float uCols;
  uniform float uPointScale;
  varying vec2 vUv;
  void main() {
    vUv = aUv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = (uResolution.x / uCols) * uPointScale;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  varying vec2 vUv;
  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uImageResolution.x / uImageResolution.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }
  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    if (length(pc) > 0.5) discard;
    vec3 col = texture2D(uTexture, coverUV(vUv)).rgb;
    // Tighter edge than the reference's 0.4: a soft falloff lets the white page
    // bleed between particles, which washes the photograph out.
    float alpha = smoothstep(0.5, 0.44, length(pc));
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Spacing between particles, in CSS px. Small = reads as the photograph. */
const TARGET_PITCH = 3;
/** Upper bound on particle count. */
const MAX_PARTICLES = 220000;
/** Settled thresholds, in clip-space units. */
const EPS_POS = 1e-4;
const EPS_VEL = 1e-3;
/**
 * Cursor influence, in CSS px rather than the reference's clip-space constants
 * (radius 0.3 / force 32). Clip space is relative to the frame, so on a
 * full-width hero those become a ~170px radius and ~260px of displacement —
 * far more violent than the same numbers in a small demo box. Anchoring them
 * to pixels keeps the nudge small and identical at any hero size.
 */
const RADIUS_PX = 90;
const PUSH_PX = 45;

type Props = {
  image: string;
  className?: string;
  dpr?: number;
  pointScale?: number;
  onReady?: () => void;
};

const InertiaParticles = ({
  image,
  className,
  dpr = 2,
  // >1 so neighbouring particles overlap and cover the page between them,
  // keeping the tone of the photograph instead of a lightened haze.
  pointScale = 1.45,
  onReady,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();

    // --- grid state (rebuilt on resize) ---
    let COLS = 0;
    let ROWS = 0;
    let count = 0;
    let positions = new Float32Array(0);
    let homeX = new Float32Array(0);
    let homeY = new Float32Array(0);
    let velX = new Float32Array(0);
    let velY = new Float32Array(0);
    let positionAttr: THREE.BufferAttribute | null = null;

    // Region of the grid that currently holds displaced particles.
    let aI0 = 0;
    let aI1 = -1;
    let aJ0 = 0;
    let aJ1 = -1;
    const hasActive = () => aI1 >= aI0 && aJ1 >= aJ0;
    const clearActive = () => {
      aI0 = 0;
      aI1 = -1;
      aJ0 = 0;
      aJ1 = -1;
    };
    const unionActive = (i0: number, i1: number, j0: number, j1: number) => {
      if (!hasActive()) {
        aI0 = i0;
        aI1 = i1;
        aJ0 = j0;
        aJ1 = j1;
        return;
      }
      if (i0 < aI0) aI0 = i0;
      if (i1 > aI1) aI1 = i1;
      if (j0 < aJ0) aJ0 = j0;
      if (j1 > aJ1) aJ1 = j1;
    };

    let needsRender = true;

    const idealGrid = (w: number, h: number) => {
      const aspect = w / h;
      let c = Math.max(80, Math.round(w / TARGET_PITCH));
      let r = Math.max(24, Math.round(c / aspect));
      if (c * r > MAX_PARTICLES) {
        const k = Math.sqrt(MAX_PARTICLES / (c * r));
        c = Math.max(80, Math.round(c * k));
        r = Math.max(24, Math.round(r * k));
      }
      return { c, r };
    };

    const buildGrid = (c: number, r: number) => {
      COLS = c;
      ROWS = r;
      count = c * r;
      positions = new Float32Array(count * 3);
      const uvs = new Float32Array(count * 2);
      homeX = new Float32Array(count);
      homeY = new Float32Array(count);
      velX = new Float32Array(count);
      velY = new Float32Array(count);
      let p = 0;
      for (let j = 0; j < ROWS; j++) {
        const v = (j + 0.5) / ROWS;
        const y = v * 2 - 1;
        for (let i = 0; i < COLS; i++) {
          const u = (i + 0.5) / COLS;
          const x = u * 2 - 1;
          homeX[p] = x;
          homeY[p] = y;
          positions[p * 3] = x;
          positions[p * 3 + 1] = y;
          positions[p * 3 + 2] = 0;
          uvs[p * 2] = u;
          uvs[p * 2 + 1] = v;
          p++;
        }
      }
      positionAttr = new THREE.BufferAttribute(positions, 3);
      positionAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("position", positionAttr);
      geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
      geometry.setDrawRange(0, count);
      uniforms.uCols.value = COLS;
      clearActive();
      needsRender = true;
    };

    const animated = createAnimatedTexture(image);

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uCols: { value: 140 },
      uPointScale: { value: pointScale },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      geometry.dispose();
      material.dispose();
      animated.dispose();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      needsRender = true;
      last = performance.now();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const sim = { stiffness: 70, damping: 0.88 };
    // Frame height in CSS px, used to convert the pixel-based cursor
    // influence into clip-space units. Updated on resize.
    let frameH = 0;

    const mouse = new THREE.Vector2(1000, 1000);
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.set(x * 2 - 1, (1 - y) * 2 - 1);
    };
    const onPointerLeave = () => mouse.set(1000, 1000);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const step = (dt: number, aspect: number) => {
      if (!count || !positionAttr) return;
      const { stiffness } = sim;
      // Clip space spans 2 units over the frame height, so half the frame is 1.
      const halfH = Math.max(1, frameH * 0.5);
      const radius = Math.min(0.6, RADIUS_PX / halfH);
      // Steady displacement is force/stiffness, so solve for PUSH_PX of travel.
      const force = (PUSH_PX / halfH) * stiffness;
      const damp = Math.pow(sim.damping, dt * 60);
      const hasMouse = mouse.x < 100;
      const mx = mouse.x;
      const my = mouse.y;
      const r2 = radius * radius;

      // Mark the region the cursor can reach as active.
      if (hasMouse) {
        const halfX = radius / aspect;
        const i0 = Math.max(0, Math.floor(((mx - halfX + 1) / 2) * COLS) - 2);
        const i1 = Math.min(COLS - 1, Math.ceil(((mx + halfX + 1) / 2) * COLS) + 2);
        const j0 = Math.max(0, Math.floor(((my - radius + 1) / 2) * ROWS) - 2);
        const j1 = Math.min(ROWS - 1, Math.ceil(((my + radius + 1) / 2) * ROWS) + 2);
        if (i1 >= i0 && j1 >= j0) unionActive(i0, i1, j0, j1);
      }

      // Nothing displaced and nothing being pushed: no work, no upload.
      if (!hasActive()) return;

      let moving = false;
      for (let j = aJ0; j <= aJ1; j++) {
        const rowBase = j * COLS;
        for (let i = aI0; i <= aI1; i++) {
          const idx = rowBase + i;
          const o = idx * 3;
          const px = positions[o];
          const py = positions[o + 1];

          let ax = (homeX[idx] - px) * stiffness;
          let ay = (homeY[idx] - py) * stiffness;

          if (hasMouse) {
            const ex = px - mx;
            const ey = py - my;
            const exa = ex * aspect;
            const d2 = exa * exa + ey * ey;
            if (d2 < r2) {
              const dist = Math.sqrt(d2) + 1e-4;
              const f = 1 - dist / radius;
              const push = (f * f * force) / dist;
              ax += ex * push;
              ay += ey * push;
            }
          }

          const vx = (velX[idx] + ax * dt) * damp;
          const vy = (velY[idx] + ay * dt) * damp;
          velX[idx] = vx;
          velY[idx] = vy;
          const nx = px + vx * dt;
          const ny = py + vy * dt;
          positions[o] = nx;
          positions[o + 1] = ny;

          if (
            !moving &&
            (Math.abs(nx - homeX[idx]) > EPS_POS ||
              Math.abs(ny - homeY[idx]) > EPS_POS ||
              Math.abs(vx) > EPS_VEL ||
              Math.abs(vy) > EPS_VEL)
          ) {
            moving = true;
          }
        }
      }

      // Upload only the rows that changed.
      const start = aJ0 * COLS * 3;
      const len = (aJ1 - aJ0 + 1) * COLS * 3;
      positionAttr.clearUpdateRanges();
      positionAttr.addUpdateRange(start, len);
      positionAttr.needsUpdate = true;
      needsRender = true;

      // Everything settled and the cursor is gone: snap home and go idle.
      if (!moving && !hasMouse) {
        for (let j = aJ0; j <= aJ1; j++) {
          const rowBase = j * COLS;
          for (let i = aI0; i <= aI1; i++) {
            const idx = rowBase + i;
            const o = idx * 3;
            positions[o] = homeX[idx];
            positions[o + 1] = homeY[idx];
            velX[idx] = 0;
            velY[idx] = 0;
          }
        }
        clearActive();
      }
    };

    let readyFired = false;
    const render = () => {
      if (contextLost || !count) return;
      const img = animated.texture.image as {
        width: number;
        height: number;
        naturalWidth?: number;
        naturalHeight?: number;
      };
      const iw = img?.naturalWidth || img?.width || 1;
      const ih = img?.naturalHeight || img?.height || 1;
      const haveImage = iw > 1 && ih > 1;
      if (haveImage) uniforms.uImageResolution.value.set(iw, ih);
      renderer.render(scene, camera);
      if (haveImage && !readyFired) {
        readyFired = true;
        onReadyRef.current?.();
      }
    };

    let last = performance.now();
    const tick = () => {
      if (contextLost) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const res = uniforms.uResolution.value;
      step(dt, res.y > 0 ? res.x / res.y : 1);
      // Keep drawing until the texture has landed, then only on change.
      if (!readyFired) needsRender = true;
      if (needsRender || hasActive()) {
        render();
        needsRender = false;
      }
    };

    let rebuildTimer = 0;
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      frameH = h;
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      needsRender = true;
      const { c, r } = idealGrid(w, h);
      if (c !== COLS || r !== ROWS) {
        // Debounced: building a few hundred thousand particles mid-drag would jank.
        window.clearTimeout(rebuildTimer);
        if (!count) {
          buildGrid(c, r);
        } else {
          rebuildTimer = window.setTimeout(() => {
            const w2 = container.clientWidth;
            const h2 = container.clientHeight;
            if (!w2 || !h2) return;
            const next = idealGrid(w2, h2);
            if (next.c !== COLS || next.r !== ROWS) buildGrid(next.c, next.r);
          }, 180);
        }
      }
      render();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let onScreen = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let tabVisible = !document.hidden;
    const onVisibility = () => {
      tabVisible = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!onScreen || !tabVisible || contextLost) return;
      tick();
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(rebuildTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, dpr, pointScale]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  );
};

export default InertiaParticles;
