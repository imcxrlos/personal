import * as THREE from "three";

/**
 * Loads a still photograph into a THREE texture with natural (sRGB) color.
 * Motion comes from the particle positions, so `update` is a no-op. The texture
 * starts as a 1x1 placeholder; a cached image can be `complete` before onload
 * attaches/fires, so it is applied immediately in that case — otherwise the
 * texture would keep its placeholder and the shader's cover-fit would default
 * to a square crop (a false "zoom").
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
  if (img.complete && img.naturalWidth > 0) apply();

  return {
    texture,
    update: () => {},
    dispose: () => {
      disposed = true;
      img.onload = null;
      texture.dispose();
    },
  };
}
