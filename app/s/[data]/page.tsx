import { Metadata } from "next";
import CopyButton from "./CopyButton";
import { decodeUrl } from "../../lib/encoding";
import { parseUrl } from "../../lib/url-parser";
import { UrlSegment } from "../../lib/types";
import { getSegmentColor, getSegmentColorHex, sortSegments } from "../../lib/segment-colors";
import { colorizeUrl } from "../../lib/colorize-url";

type Props = {
  params: Promise<{ data: string }>;
};

function decodeBreakdown(data: string) {
  const url = decodeUrl(decodeURIComponent(data));
  if (!url) return null;
  return { originalUrl: url, segments: parseUrl(url) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  const breakdown = decodeBreakdown(data);
  const title = breakdown
    ? `URL Explained: ${breakdown.originalUrl}`
    : "URL Explainer";

  const visibleSegments = breakdown
    ? breakdown.segments.filter((s) => s.type !== "protocol" && s.type !== "host")
    : [];
  const description = breakdown
    ? `Annotated breakdown of ${breakdown.originalUrl} across ${visibleSegments.length} part${visibleSegments.length !== 1 ? "s" : ""} — path, query parameters, and fragments.`
    : "Annotated URL breakdown — path, query parameters, and fragments.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://url-explainer.com/s/${data}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: `/s/${data}/og`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/s/${data}/og`],
    },
  };
}

function buildMarkdown(originalUrl: string, segments: UrlSegment[]): string {
  const rows = sortSegments(segments)
    .filter((s) => s.type !== "protocol" && s.type !== "host")
    .map((s) => {
      const type = s.type === "search-param" ? "Param" : s.label;
      const eqIdx = s.value.indexOf("=");
      const value = s.type === "search-param" && eqIdx !== -1
        ? `\`${s.value.slice(0, eqIdx)}\` = \`${s.value.slice(eqIdx + 1)}\``
        : `\`${s.value}\``;
      return `| ${type} | ${value} | ${s.description} |`;
    });

  const header = `# ${originalUrl}\n\n| Segment | Value | Description |\n|---------|-------|-------------|`;
  return [header, ...rows].join("\n");
}

function SegmentCard({ segment, allSegments }: { segment: UrlSegment; allSegments: UrlSegment[] }) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-1 ${getSegmentColor(segment, allSegments)}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
          {segment.type === "search-param" ? "Param" : segment.label}
        </span>
        {segment.type === "search-param" ? (() => {
          const eqIdx = segment.value.indexOf("=");
          const key = eqIdx === -1 ? segment.value : segment.value.slice(0, eqIdx);
          const val = eqIdx === -1 ? "" : segment.value.slice(eqIdx + 1);
          return (
            <span className="flex items-center gap-1 text-sm font-mono">
              <span>{key}</span>
              <span className="opacity-50">=</span>
              <span>{val}</span>
            </span>
          );
        })() : (
          <code className="text-sm font-mono">{segment.value}</code>
        )}
      </div>
      {segment.description && (
        <p className="text-sm opacity-80">{segment.description}</p>
      )}
    </div>
  );
}

export default async function SharePage({ params }: Props) {
  const { data } = await params;
  const breakdown = decodeBreakdown(data);

  if (!breakdown) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500">Invalid or corrupted share link.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl px-6 py-20">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            url-explainer.com
          </h1>
          <div className="flex items-start gap-2">
          <p className="text-2xl font-mono break-all leading-relaxed flex-1">
            {colorizeUrl(breakdown.originalUrl, breakdown.segments).map((piece, i) =>
              piece.segment ? (
                <span
                  key={i}
                  style={{
                    backgroundColor: getSegmentColorHex(piece.segment, breakdown.segments).bg,
                    color: getSegmentColorHex(piece.segment, breakdown.segments).text,
                    borderRadius: "3px",
                    padding: "1px 3px",
                  }}
                >
                  {piece.text}
                </span>
              ) : (
                <span key={i} className="text-zinc-400 dark:text-zinc-500">{piece.text}</span>
              )
            )}
          </p>
            <CopyButton text={breakdown.originalUrl} />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          {sortSegments(breakdown.segments)
            .filter((seg) => seg.type !== "protocol" && seg.type !== "host")
            .map((seg) => (
              <SegmentCard key={seg.id} segment={seg} allSegments={breakdown.segments} />
            ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="inline-block rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Explain your own URL
          </a>
          <CopyButton text={buildMarkdown(breakdown.originalUrl, breakdown.segments)} label="Copy as Markdown" />
        </div>
      </main>
    </div>
  );
}
