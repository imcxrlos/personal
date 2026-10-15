"use client";

/**
 * Move the cursor to shove the particles aside — a damped spring snaps them
 * back. Particles sample the photograph; gaps are transparent so the page
 * shows through. Debug UI removed; texture load is cached-safe (no zoom);
 * fades in via onReady; pauses offscreen and when the tab is hidden.
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
    float alpha = smoothstep(0.5, 0.4, length(pc));
    gl_FragColor = vec4(col, alpha);
  }
`;

type Props = {
  image: string;
  className?: string;
  dpr?: number;
  cols?: number;
  rows?: number;
  pointScale?: number;
  onReady?: () => void;
};

const InertiaParticles = ({
  image,
  className,
  dpr = 2,
  cols = 140,
  rows = 80,
  pointScale = 1.2,
  onReady,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const COLS = Math.max(24, Math.round(cols));
    const ROWS = Math.max(16, Math.round(rows));

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();

    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const homeX = new Float32Array(count);
    const homeY = new Float32Array(count);
    const velX = new Float32Array(count);
    const velY = new Float32Array(count);
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
        positions[p * 3 + 2] = 0;
        uvs[p * 2] = u;
        uvs[p * 2 + 1] = v;
        p++;
      }
    }
    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));

    const animated = createAnimatedTexture(image);

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uCols: { value: COLS },
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
      last = performance.now();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const sim = { stiffness: 70, damping: 0.88, radius: 0.3, force: 32 };

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
      const { stiffness, radius, force } = sim;
      const damp = Math.pow(sim.damping, dt * 60);
      const hasMouse = mouse.x < 100;
      const mx = mouse.x;
      const my = mouse.y;
      const r2 = radius * radius;
      for (let i = 0; i < count; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];

        let ax = (homeX[i] - px) * stiffness;
        let ay = (homeY[i] - py) * stiffness;

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

        const vx = (velX[i] + ax * dt) * damp;
        const vy = (velY[i] + ay * dt) * damp;
        velX[i] = vx;
        velY[i] = vy;
        positions[i * 3] = px + vx * dt;
        positions[i * 3 + 1] = py + vy * dt;
      }
      positionAttr.needsUpdate = true;
    };

    let readyFired = false;
    const render = () => {
      if (contextLost) return;
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
      render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
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
  }, [image, dpr, cols, rows, pointScale]);

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
