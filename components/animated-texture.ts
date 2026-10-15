import * as THREE from "three";

/**
 * Loads a still photograph into a THREE texture, colors passed through as-is.
 * The texture's backing image never changes after it is applied, and its
 * dimensions are reported from the image's intrinsic size, so consumers can
 * fit it without guessing. Until the image decodes, `ready` is false and the
 * texture holds a 1x1 placeholder.
 */
export type AnimatedTexture = {
  texture: THREE.Texture;
  /** True once the real image is on the texture. */
  readonly ready: boolean;
  /** Intrinsic image size in pixels; 1x1 until ready. */
  readonly width: number;
  readonly height: number;
  update: (ms: number) => void;
  dispose: () => void;
};

export function createAnimatedTexture(url: string): AnimatedTexture {
  const texture = new THREE.Texture();
  texture.image = { width: 1, height: 1 };
  // The smear's raw ShaderMaterial writes the sampled color straight out with
  // no sRGB re-encode, so the texture must not be decoded to linear either —
  // otherwise the canvas renders darker and contrastier than the photograph.
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;

  let disposed = false;
  let ready = false;
  let width = 1;
  let height = 1;

  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous";
  img.onload = () => {
    if (disposed || img.naturalWidth < 1) return;
    width = img.naturalWidth;
    height = img.naturalHeight;
    texture.image = img;
    texture.needsUpdate = true;
    ready = true;
  };
  img.src = url;

  return {
    texture,
    get ready() {
      return ready;
    },
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    // Still photograph: all motion comes from the shader's displacement.
    update: () => {},
    dispose: () => {
      disposed = true;
      img.onload = null;
      texture.dispose();
    },
  };
}
