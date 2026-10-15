import * as THREE from "three";

/**
 * Loads a still photograph into a THREE texture with natural (sRGB) color.
 * The FlowField samples colors from this texture; all motion comes from the
 * particle positions, so `update` is intentionally a no-op here. The texture
 * starts as a 1x1 placeholder so consumers can read `image.width` before load.
 */
export type AnimatedTexture = {
  texture: THREE.Texture;
  update: (ms: number) => void;
  dispose: () => void;
};

export function createAnimatedTexture(url: string): AnimatedTexture {
  const texture = new THREE.Texture();
  texture.image = { width: 1, height: 1 };
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  let disposed = false;
  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous";
  const apply = () => {
    if (disposed || img.naturalWidth < 1) return;
    texture.image = img;
    texture.needsUpdate = true;
  };
  img.onload = apply;
  img.src = url;
  // A cached image can be `complete` before onload is attached or fires, in
  // which case onload never runs and the texture would keep its 1x1 placeholder
  // — making the shader's cover-fit default to a square crop (a false "zoom").
  // Apply immediately when the image is already decoded.
  if (img.complete && img.naturalWidth > 0) apply();

  return {
    texture,
    // Still image — no per-frame texture animation.
    update: () => {},
    dispose: () => {
      disposed = true;
      img.onload = null;
      texture.dispose();
    },
  };
}
