// Gate rank (spec §5): S beats Ryuma's best outright; below that, bands by share of his best.
export type Rank = "S" | "A" | "B" | "C" | "D" | "E";

// Percent of Ryuma's best needed for each band, best first. Integer maths, so 80% of 5300 is exactly 4240.
const BANDS: [Rank, number][] = [["A", 80], ["B", 60], ["C", 40], ["D", 20]];

export function rankFor(score: number, ryuma: number): Rank {
  if (score > ryuma) return "S";
  if (ryuma <= 0) return "E";
  for (const [rank, pct] of BANDS) if (score * 100 >= ryuma * pct) return rank;
  return "E";
}
