import Image from "next/image";

type Cloud = {
  top: string; // from the top of the layer
  width: string;
  duration: number; // seconds for one pass, off-screen to off-screen
  phase: number; // 0–1: where in its pass the cloud starts (and rests)
  opacity?: number;
  flip?: boolean;
};

/**
 * Clouds drifting left to right through the hero sky. Pure CSS (see .cloud in
 * globals.css): each one crosses its layer from fully off one edge to fully off
 * the other, so the loop has no visible seam; with reduced motion they rest at
 * their phase. The layer never takes pointer events, so the cursor ripples
 * underneath keep working.
 */
export function HeroClouds({ clouds, className }: { clouds: Cloud[]; className: string }) {
  return (
    <div aria-hidden className={`cloud-layer pointer-events-none overflow-x-clip ${className}`}>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="cloud"
          style={
            {
              top: c.top,
              width: c.width,
              opacity: c.opacity ?? 1,
              "--dur": `${c.duration}s`,
              "--phase": c.phase,
            } as React.CSSProperties
          }
        >
          <Image
            src="/hero-cloud.png"
            alt=""
            width={1419}
            height={863}
            sizes={c.width}
            loading="eager"
            draggable={false}
            className={`block h-auto w-full select-none ${c.flip ? "-scale-x-100" : ""}`}
          />
        </div>
      ))}
    </div>
  );
}

// Desktop: five, in the band above the title. Sized by viewport height so
// they fit the band (14–17vh) on short, wide screens too.
export const desktopClouds: Cloud[] = [
  { top: "4%", width: "24vh", duration: 140, phase: 0.55 },
  { top: "12%", width: "19vh", duration: 95, phase: 0.08 },
  { top: "30%", width: "15vh", duration: 130, phase: 0.92, flip: true },
  { top: "20%", width: "16vh", duration: 120, phase: 0.33, opacity: 0.85, flip: true },
  { top: "44%", width: "12vh", duration: 105, phase: 0.76, opacity: 0.8 },
];

// Mobile: two, in the band above the title.
export const mobileClouds: Cloud[] = [
  { top: "8%", width: "38vw", duration: 60, phase: 0.18 },
  { top: "40%", width: "26vw", duration: 78, phase: 0.68, opacity: 0.85, flip: true },
];
