"use client";

/**
 * A full-frame fragment-shader canvas for image effects. The effect's
 * fragment shader is given a small prelude of uniforms and helpers:
 *
 *   uniform vec2  resolution;        // canvas size, device px
 *   uniform vec2  mouse;             // pointer in 0..1 (y up); far off-screen when absent
 *   uniform float time;             // seconds
 *   vec2  uv01();                    // this fragment's 0..1 coordinate
 *   float luma(vec3);
 *   float hash21(vec2);
 *   vec4  texCover(vec2 uv);         // cover-fit sample of the image (no crop/zoom)
 *
 * Image fit is resolved in GLSL from the image's real dimensions, so there is
 * no CPU-side aspect bookkeeping to get wrong. Three.js loads on the client
 * only. Handles cached images, resize, visibility/offscreen pausing, WebGL
 * context loss, and cleanup.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PRELUDE = /* glsl */ `
precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D uTexture;
uniform vec2 uImageResolution;

vec2 uv01() { return gl_FragCoord.xy / resolution; }

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec4 texCover(vec2 uv) {
  float sa = resolution.x / resolution.y;
  float ia = uImageResolution.x / uImageResolution.y;
  vec2 s = vec2(1.0);
  if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
  vec2 c = (uv - 0.5) * s + 0.5;
  return texture2D(uTexture, c);
}
`;

const VERTEX_SHADER = /* glsl */ `
precision highp float;
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

type Props = {
  fragmentShader: string;
  image: string;
  className?: string;
  dpr?: number;
  /** Fires after the first frame drawn with the image's real dimensions. */
  onReady?: () => void;
};

export default function ImageShaderCanvas({
  fragmentShader,
  image,
  className,
  dpr = 2,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    // Full-frame triangle.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 3, -1, -1, 3]), 2),
    );

    const uniforms = {
      resolution: { value: new THREE.Vector2(1, 1) },
      mouse: { value: new THREE.Vector2(-10, -10) },
      time: { value: 0 },
      uTexture: { value: new THREE.Texture() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
    };

    // Cached-safe image load: a decoded (cached) image may never fire onload,
    // so apply it immediately when it is already complete.
    const texture = uniforms.uTexture.value;
    texture.image = { width: 1, height: 1 };
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    let disposed = false;
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    const applyImage = () => {
      if (disposed || img.naturalWidth < 1) return;
      texture.image = img;
      texture.needsUpdate = true;
      uniforms.uImageResolution.value.set(img.naturalWidth, img.naturalHeight);
    };
    img.onload = applyImage;
    img.src = image;
    if (img.complete && img.naturalWidth > 0) applyImage();

    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: PRELUDE + "\n" + fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

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
      texture.dispose();
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
    const onLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onRestored = () => {
      contextLost = false;
      last = performance.now();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      uniforms.mouse.value.set(
        (e.clientX - r.left) / r.width,
        1 - (e.clientY - r.top) / r.height,
      );
    };
    const onPointerLeave = () => uniforms.mouse.value.set(-10, -10);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let readyFired = false;
    const render = () => {
      if (contextLost) return;
      renderer.render(scene, camera);
      if (!readyFired && uniforms.uImageResolution.value.x > 1) {
        readyFired = true;
        onReadyRef.current?.();
      }
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(
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

    let last = performance.now();
    let seconds = 0;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || !tabVisible || contextLost) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      seconds += dt;
      uniforms.time.value = seconds;
      render();
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      img.onload = null;
      if (canvas.parentNode === container) container.removeChild(canvas);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [fragmentShader, image, dpr]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  );
}
