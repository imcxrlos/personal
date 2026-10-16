"use client";

/**
 * The photograph drifts along curl-noise currents, stirred by the cursor.
 *
 * Ported from the Indeficient business hero's FlowField. The simulation is the
 * original — a 140x80 grid of points advected by curl noise, sprung home, with
 * cursor turbulence — but it is not drawn as dots: each point's offset from
 * home warps a full-resolution image mesh, so the photo stays sharp and
 * whole and only the flow moves it. `uGain` scales how far the image follows
 * the points (the original's dot size hid ~26px of rest drift that would
 * read as a heavy wobble on a sharp photo).
 *
 * Other differences are fit bookkeeping, so the image is never zoomed: `anchorY` sets
 * where the cover crop is anchored (default centered, as in the original) to
 * match the static hero image; the image resolution uniform is taken from the
 * texture's intrinsic size; the canvas fills its frame exactly; and `onReady`
 * fires after the first frame drawn with the real image, so the host never
 * reveals the 1x1 placeholder (whose 1:1 "aspect" would cover-crop to a square).
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX_SHADER = /* glsl */ `
  precision highp float;
  attribute vec2 aUv;
  attribute vec2 aOffset;
  varying vec2 vUv;
  varying vec2 vOffset;
  void main() {
    vUv = aUv;
    vOffset = aOffset;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uAnchorY;
  uniform float uGain;
  varying vec2 vUv;
  varying vec2 vOffset;
  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uImageResolution.x / uImageResolution.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    vec2 a = vec2(0.5, uAnchorY);
    return (uv - a) * s + a;
  }
  void main() {
    // The image content at this pixel came from where the flow pushed it
    // from: step back along the point's offset (clip units -> uv is x0.5).
    vec2 uv = vUv - vOffset * 0.5 * uGain;
    gl_FragColor = vec4(texture2D(uTexture, coverUV(uv)).rgb, 1.0);
  }
`;

const COLS = 140;
const ROWS = 80;

const hash = (ix: number, iy: number) => {
  let n = (ix * 374761393 + iy * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967295;
};
const vnoise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (
    a * (1 - ux) * (1 - uy) +
    b * ux * (1 - uy) +
    c * (1 - ux) * uy +
    d * ux * uy
  );
};

const FlowField = ({
  image,
  className,
  dpr = 2,
  controls = false,
  anchorY = 0.5,
  onReady,
}: {
  image: string;
  className?: string;
  dpr?: number;
  controls?: boolean;
  /** Vertical anchor of the cover crop: 0.5 centers (original), 0 keeps the
   *  image's bottom edge and crops only from the top. */
  anchorY?: number;
  onReady?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();

    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const homeX = new Float32Array(count);
    const homeY = new Float32Array(count);
    let p = 0;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const u = (i + 0.5) / COLS;
        const v = (j + 0.5) / ROWS;
        const x = u * 2 - 1;
        const y = v * 2 - 1;
        homeX[p] = x;
        homeY[p] = y;
        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        uvs[p * 2] = u;
        uvs[p * 2 + 1] = v;
        p++;
      }
    }
    // The grid is drawn as a static, full-frame mesh at the home positions;
    // the simulated points only feed each vertex's offset.
    const home = new Float32Array(positions);
    const offsets = new Float32Array(count * 2);
    const indices: number[] = [];
    for (let j = 0; j < ROWS - 1; j++) {
      for (let i = 0; i < COLS - 1; i++) {
        const a = j * COLS + i;
        indices.push(a, a + 1, a + COLS, a + 1, a + COLS + 1, a + COLS);
      }
    }
    // Stretch the outer ring of vertices to the frame edge so the mesh covers
    // it fully (cell centers sit half a cell inside).
    for (let k = 0; k < count; k++) {
      const i = k % COLS;
      const j = Math.floor(k / COLS);
      if (i === 0) { home[k * 3] = -1; uvs[k * 2] = 0; }
      if (i === COLS - 1) { home[k * 3] = 1; uvs[k * 2] = 1; }
      if (j === 0) { home[k * 3 + 1] = -1; uvs[k * 2 + 1] = 0; }
      if (j === ROWS - 1) { home[k * 3 + 1] = 1; uvs[k * 2 + 1] = 1; }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(home, 3));
    geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
    const offsetAttr = new THREE.BufferAttribute(offsets, 2);
    offsetAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("aOffset", offsetAttr);
    geometry.setIndex(indices);

    const animated = createAnimatedTexture(image);
    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uAnchorY: { value: anchorY },
      uGain: { value: 0.3 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    // Fill the frame exactly (clientWidth is rounded; a fractional frame
    // would otherwise leave the canvas a sub-pixel off the static image).
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    // stir is raised from the original 1.8: with uGain 0.3 the cursor's push
    // (~33px peak) barely stood out from the ambient drift (~17px peak); 3.2
    // gives ~48px. Ambient flow is unchanged.
    const sim = { flow: 0.5, scale: 2.2, homeSpring: 5, radius: 0.4, stir: 3.2 };

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

    let t = 0;
    const step = (dt: number, aspect: number) => {
      t += dt * 0.25;
      const { flow, scale, homeSpring, radius, stir } = sim;
      const eps = 0.05;
      const hasMouse = mouse.x < 100;
      const mx = mouse.x;
      const my = mouse.y;
      for (let i = 0; i < count; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];

        const sx = px * scale;
        const sy = py * scale;
        const fy1 = vnoise(sx + t, sy + eps);
        const fy0 = vnoise(sx + t, sy - eps);
        const fx1 = vnoise(sx + eps + t, sy);
        const fx0 = vnoise(sx - eps + t, sy);
        let vx = (fy1 - fy0) / (2 * eps);
        let vy = -(fx1 - fx0) / (2 * eps);

        let amp = flow;
        if (hasMouse) {
          const exa = (px - mx) * aspect;
          const ey = py - my;
          const dist = Math.sqrt(exa * exa + ey * ey);
          if (dist < radius) amp += (1 - dist / radius) * stir; // turbulence
        }
        vx *= amp;
        vy *= amp;

        vx += (homeX[i] - px) * homeSpring;
        vy += (homeY[i] - py) * homeSpring;

        positions[i * 3] = px + vx * dt;
        positions[i * 3 + 1] = py + vy * dt;
        offsets[i * 2] = positions[i * 3] - homeX[i];
        offsets[i * 2 + 1] = positions[i * 3 + 1] - homeY[i];
      }
      offsetAttr.needsUpdate = true;
    };

    let announced = false;
    const render = () => {
      if (animated.ready) {
        uniforms.uImageResolution.value.set(animated.width, animated.height);
      }
      renderer.render(scene, camera);
      if (!announced && animated.ready && uniforms.uResolution.value.x > 0) {
        announced = true;
        onReadyRef.current?.();
      }
    };

    let shaderTime = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      const res = uniforms.uResolution.value;
      step(dt, res.y > 0 ? res.x / res.y : 1);
      render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      render();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      tick();
    };
    animate();

    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000";
      gui.add(sim, "flow", 0, 2, 0.05).name("flow speed");
      gui.add(sim, "scale", 0.5, 6, 0.1).name("field scale");
      gui.add(sim, "stir", 0, 5, 0.1).name("cursor stir");
      gui.add(sim, "radius", 0.1, 0.8, 0.01).name("stir radius");
      gui.add(sim, "homeSpring", 1, 20, 0.5).name("home pull");
      gui.add(uniforms.uGain, "value", 0, 1, 0.05).name("image follow");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, dpr, controls, anchorY]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default FlowField;
