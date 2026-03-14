import { UrlSegment } from "./types";

const TYPE_COLOR_VARIANTS: Record<string, string[]> = {
  pathname: [
    "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200",
    "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-200",
    "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/40 dark:border-violet-700 dark:text-violet-200",
    "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200",
  ],
  "search-param": [
    "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200",
    "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200",
    "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200",
    "bg-lime-100 border-lime-300 text-lime-800 dark:bg-lime-900/40 dark:border-lime-700 dark:text-lime-200",
    "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200",
  ],
  hash: [
    "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200",
    "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200",
    "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:border-fuchsia-700 dark:text-fuchsia-200",
  ],
  custom: [
    "bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200",
    "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200",
    "bg-stone-100 border-stone-300 text-stone-800 dark:bg-stone-800 dark:border-stone-600 dark:text-stone-200",
  ],
  port: [
    "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-200",
  ],
};

// Hex equivalents for edge-runtime contexts (OG image) — must stay in sync with above.
export type HexColors = { bg: string; text: string; border: string };

const TYPE_HEX_VARIANTS: Record<string, HexColors[]> = {
  pathname: [
    { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
    { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
    { bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6" },
    { bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8" },
  ],
  "search-param": [
    { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
    { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
    { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
    { bg: "#ecfccb", border: "#bef264", text: "#3f6212" },
    { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  ],
  hash: [
    { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
    { bg: "#ffe4e6", border: "#fda4af", text: "#9f1239" },
    { bg: "#fdf4ff", border: "#f0abfc", text: "#86198f" },
  ],
  custom: [
    { bg: "#f4f4f5", border: "#d4d4d8", text: "#27272a" },
    { bg: "#f1f5f9", border: "#cbd5e1", text: "#1e293b" },
    { bg: "#f5f5f4", border: "#d6d3d1", text: "#292524" },
  ],
  port: [
    { bg: "#ccfbf1", border: "#5eead4", text: "#115e59" },
  ],
};

const TYPE_ORDER: Record<string, number> = {
  protocol: 0,
  host: 1,
  port: 2,
  pathname: 3,
  "search-param": 4,
  hash: 5,
  custom: 6,
};

export function sortSegments(segments: UrlSegment[]): UrlSegment[] {
  return [...segments].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99)
  );
}

function variantIndex(segment: UrlSegment, allSegments: UrlSegment[]): number {
  return allSegments
    .filter((s) => s.type === segment.type)
    .findIndex((s) => s.id === segment.id);
}

export function getSegmentColor(segment: UrlSegment, allSegments: UrlSegment[]): string {
  const variants = TYPE_COLOR_VARIANTS[segment.type] ?? TYPE_COLOR_VARIANTS.custom;
  const i = variantIndex(segment, allSegments);
  return variants[i % variants.length];
}

export function getSegmentColorHex(segment: UrlSegment, allSegments: UrlSegment[]): HexColors {
  const variants = TYPE_HEX_VARIANTS[segment.type] ?? TYPE_HEX_VARIANTS.custom;
  const i = variantIndex(segment, allSegments);
  return variants[i % variants.length];
}
