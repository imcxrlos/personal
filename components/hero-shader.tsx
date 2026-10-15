/**
 * The hero photograph, shown as-is: the original image at its natural
 * proportions, filling the frame the hero reserves for it.
 */
export function HeroShader({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--color-paper)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="A quiet coastal cove — turquoise water framed by limestone cliffs and a pale shoreline."
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
