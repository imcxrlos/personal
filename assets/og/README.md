# Share-card assets

Read at build time by `lib/og.tsx` to render the `opengraph-image` routes.

## Fonts

Satori (behind `next/og`) needs static TTF/OTF files, so these are static
instances of the site's three families, subset to Latin with kerning kept.
Sources are the variable fonts in [google/fonts](https://github.com/google/fonts),
all under the SIL Open Font License 1.1 (copyright notices are in each file's
name table).

| File | Source | Instance |
| --- | --- | --- |
| `Newsreader-Display-Regular.ttf` | `ofl/newsreader/Newsreader[opsz,wght].ttf` | opsz 48, wght 400 |
| `Newsreader-Display-Italic.ttf` | `ofl/newsreader/Newsreader-Italic[opsz,wght].ttf` | opsz 48, wght 400 |
| `Inter-Regular.ttf` | `ofl/inter/Inter[opsz,wght].ttf` | opsz 20, wght 400 |
| `Inter-Medium.ttf` | `ofl/inter/Inter[opsz,wght].ttf` | opsz 20, wght 500 |
| `JetBrainsMono-Medium.ttf` | `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` | wght 500 |

```sh
fonttools varLib.instancer Newsreader[opsz,wght].ttf opsz=48 wght=400 -o nr.ttf
pyftsubset nr.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2199,U+00A7,U+2122" \
  --layout-features='kern,liga,clig,calt,ccmp,locl,mark,mkmk' --no-hinting --desubroutinize \
  --output-file=Newsreader-Display-Regular.ttf
```

## cove.png

A band of `public/hero-cove.jpg` for the home card: scaled to 1200 px wide
(Lanczos), rows 290–670 cropped, and multiplied onto the card ground `#f7f7f5`
so the white sky matches it (Satori ignores `mix-blend-mode`).

```python
from PIL import Image, ImageChops
src = Image.open("public/hero-cove.jpg").convert("RGB")
band = src.resize((1200, round(src.height * 1200 / src.width)), Image.LANCZOS).crop((0, 290, 1200, 670))
ImageChops.multiply(band, Image.new("RGB", band.size, (0xF7, 0xF7, 0xF5))).save("assets/og/cove.png", optimize=True)
```
