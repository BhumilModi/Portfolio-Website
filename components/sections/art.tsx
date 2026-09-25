import type { CSSProperties } from "react";

export type ArtName = "apollo" | "carceri" | "sant-angelo" | "hercules" | "amphora";

// Decorative dithered engraving (public/art, CC0 — The Met). The PNG is an alpha mask inked in
// currentColor: colour it with text-*, fade with opacity-*, size/place with [mask-size:…]/[mask-position:…].
export default function Art({ name, className = "" }: { name: ArtName; className?: string }) {
  return <div aria-hidden className={`art ${className}`} style={{ "--art": `url(/art/${name}.png)` } as CSSProperties} />;
}
