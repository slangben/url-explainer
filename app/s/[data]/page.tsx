import { Metadata } from "next";
import { decodeBreakdown } from "../../lib/encoding";
import { UrlSegment } from "../../lib/types";

const TYPE_COLORS: Record<string, string> = {
  protocol: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200",
  host: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200",
  port: "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200",
  pathname: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200",
  "search-param": "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200",
  hash: "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200",
  custom: "bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200",
};

type Props = {
  params: Promise<{ data: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  const breakdown = decodeBreakdown(decodeURIComponent(data));
  const title = breakdown
    ? `URL Explained: ${breakdown.originalUrl}`
    : "URL Explainer";

  return {
    title,
    description: breakdown
      ? `Breakdown of ${breakdown.originalUrl} into ${breakdown.segments.length} parts`
      : "URL breakdown",
    openGraph: {
      title,
      images: [
        {
          url: `/s/${data}/og`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [`/s/${data}/og`],
    },
  };
}

function SegmentCard({ segment }: { segment: UrlSegment }) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-1 ${TYPE_COLORS[segment.type] || TYPE_COLORS.custom}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
          {segment.label}
        </span>
        <code className="text-sm font-mono">{segment.value}</code>
      </div>
      {segment.description && (
        <p className="text-sm opacity-80">{segment.description}</p>
      )}
    </div>
  );
}

export default async function SharePage({ params }: Props) {
  const { data } = await params;
  const breakdown = decodeBreakdown(decodeURIComponent(data));

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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            URL Explained
          </h1>
          <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 break-all">
            {breakdown.originalUrl}
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          {breakdown.segments.map((seg) => (
            <SegmentCard key={seg.id} segment={seg} />
          ))}
        </div>

        <a
          href="/"
          className="inline-block rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Explain your own URL
        </a>
      </main>
    </div>
  );
}
