import { useId } from "react";
import { Grenze_Gotisch } from "next/font/google";

/** The mark's gothic face (spirit spec §2). Reused by the Trial's rank letter and ARISE so they share one hand. */
export const gothic = Grenze_Gotisch({ weight: "800", subsets: ["latin"] });

/** A tapered, bent spike from a base point toward a tip. bend > 0 curves it clockwise. */
function thorn(x: number, y: number, tx: number, ty: number, width: number, bend: number): string {
  const dx = tx - x;
  const dy = ty - y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const mx = x + dx * 0.5 + nx * bend;
  const my = y + dy * 0.5 + ny * bend;
  const w = width / 2;
  return `M${x + nx * w},${y + ny * w} Q${mx + nx * w * 0.6},${my + ny * w * 0.6} ${tx},${ty} Q${mx - nx * w * 0.6},${my - ny * w * 0.6} ${x - nx * w},${y - ny * w} Z`;
}

// calibration knob: the right-half thorns as [baseX, baseY, tipX, tipY, width, bend]; the left half mirrors them
// about x = 500. Bases sit inside the letters so every thorn grows out of the word.
const RIGHT: [number, number, number, number, number, number][] = [
  [560, 118, 735, 6, 44, -60], // great horn
  [640, 130, 860, 70, 34, -40],
  [700, 150, 950, 150, 26, -30],
  [800, 205, 985, 235, 22, 20],
  [790, 285, 940, 380, 24, 40], // lower sweep
  [690, 300, 760, 395, 18, 25],
  [600, 255, 640, 300, 14, 0],
];
// calibration knob: the drips under the word as [x, topY, length].
const DRIPS: [number, number, number][] = [
  [430, 300, 70],
  [478, 305, 110],
  [520, 302, 52],
  [566, 300, 88],
];

const PATHS = (() => {
  const paths = RIGHT.flatMap(([x, y, tx, ty, w, b]) => [thorn(x, y, tx, ty, w, b), thorn(1000 - x, y, 1000 - tx, ty, w, -b)]);
  paths.push(thorn(500, 120, 500, 0, 36, 0)); // crown spike
  for (const [x, y, l] of DRIPS) paths.push(thorn(x, y, x, y + l, 20, 0));
  return paths;
})();

/**
 * RYUMA (spirit spec §3.3), after kvs.services: a gothic word grown into symmetric thorns, horns and drips, filled
 * with a halftone dot screen in currentColor. Each dot's radius follows --dot (1 = full), so the broadcast's reveal can
 * dissolve the mark into the screen.
 */
export default function RyumaMark({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 1000 400" role="img" aria-label="Ryuma" className={className}>
      <defs>
        <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" fill="currentColor" style={{ r: "calc(2.3px * var(--dot, 1))" } as React.CSSProperties} />
        </pattern>
        <mask id={`${id}-shape`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="400">
          {PATHS.map((d, i) => (
            <path key={i} d={d} fill="#fff" />
          ))}
          <text x="500" y="290" textAnchor="middle" fontSize="235" fill="#fff" className={gothic.className} letterSpacing="-6">
            Ryuma
          </text>
        </mask>
      </defs>
      <rect width="1000" height="400" fill={`url(#${id}-dots)`} mask={`url(#${id}-shape)`} />
    </svg>
  );
}
