"use client";

import { useState, useCallback } from "react";
import { UrlSegment } from "../lib/types";
import { parseUrl } from "../lib/url-parser";
import { encodeBreakdown } from "../lib/encoding";

const TYPE_COLORS: Record<string, string> = {
  protocol: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200",
  host: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200",
  port: "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200",
  pathname: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200",
  "search-param": "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200",
  hash: "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200",
  custom: "bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200",
};

export default function UrlEditor() {
  const [protocol, setProtocol] = useState("https://");
  const [rawUrl, setRawUrl] = useState("");
  const [segments, setSegments] = useState<UrlSegment[]>([]);
  const [parsed, setParsed] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleParse = useCallback(() => {
    const input = rawUrl.trim();
    if (!input) return;
    const result = parseUrl(protocol + input);
    setSegments(result);
    setParsed(true);
    setShareUrl(null);
  }, [rawUrl, protocol]);

  const rebuildUrl = (segs: UrlSegment[]): string => {
    const proto = segs.find((s) => s.type === "protocol")?.value || "https";
    const host = segs.find((s) => s.type === "host")?.value || "";
    const port = segs.find((s) => s.type === "port")?.value || "";
    const pathname = segs.find((s) => s.type === "pathname")?.value || "";
    const params = segs
      .filter((s) => s.type === "search-param")
      .map((s) => s.value)
      .join("&");
    const hash = segs.find((s) => s.type === "hash")?.value || "";

    setProtocol(`${proto}://`);
    let url = `${host}`;
    if (port) url += `:${port}`;
    url += pathname || "/";
    if (params) url += `?${params}`;
    if (hash) url += `#${hash}`;
    return url;
  };

  const updateSegment = (id: string, field: keyof UrlSegment, value: string) => {
    setSegments((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, [field]: value } : s));
      if (field === "value") {
        setRawUrl(rebuildUrl(updated));
      }
      return updated;
    });
    setShareUrl(null);
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      setRawUrl(rebuildUrl(updated));
      return updated;
    });
    setShareUrl(null);
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      {
        id: `seg-${Date.now()}`,
        type: "custom",
        label: "Custom",
        value: "",
        description: "",
      },
    ]);
    setShareUrl(null);
  };

  const handleShare = () => {
    const encoded = encodeBreakdown({ originalUrl: protocol + rawUrl, segments });
    const url = `${window.location.origin}/s/${encoded}`;
    setShareUrl(url);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <label htmlFor="url-input" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Enter a URL to break down
        </label>
        <div className="flex gap-2">
          <select
            value={protocol}
            onChange={(e) => {
              setProtocol(e.target.value);
              setParsed(false);
              setShareUrl(null);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-3 text-sm font-mono outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          >
            <option value="https://">https://</option>
            <option value="http://">http://</option>
          </select>
          <input
            id="url-input"
            type="text"
            value={rawUrl}
            onChange={(e) => {
              setRawUrl(e.target.value);
              setParsed(false);
              setShareUrl(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            placeholder="example.com/path?key=value#section"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
          <button
            onClick={handleParse}
            className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Parse
          </button>
        </div>
      </div>

      {parsed && segments.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`rounded-lg border p-4 flex flex-col gap-2 ${TYPE_COLORS[seg.type] || TYPE_COLORS.custom}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70 shrink-0">
                      {seg.label}
                    </span>
                    <input
                      type="text"
                      value={seg.value}
                      onChange={(e) => updateSegment(seg.id, "value", e.target.value)}
                      className="text-sm font-mono truncate min-w-0 rounded border border-current/10 bg-white/50 px-2 py-0.5 outline-none dark:bg-black/20"
                    />
                  </div>
                  <button
                    onClick={() => removeSegment(seg.id)}
                    className="shrink-0 rounded p-1 opacity-50 transition-opacity hover:opacity-100"
                    aria-label="Remove segment"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={seg.description}
                  onChange={(e) => updateSegment(seg.id, "description", e.target.value)}
                  placeholder="Add a description…"
                  className="w-full rounded border border-current/10 bg-white/50 px-3 py-1.5 text-sm outline-none placeholder:opacity-40 dark:bg-black/20"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addSegment}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              + Add segment
            </button>
            <button
              onClick={handleShare}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Share
            </button>
          </div>

          {shareUrl && (
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Shareable link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded border border-zinc-200 bg-white px-3 py-2 text-xs font-mono outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
