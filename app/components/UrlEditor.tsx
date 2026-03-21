"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { UrlSegment, UrlBreakdown } from "../lib/types";
import { parseUrl } from "../lib/url-parser";
import { encodeUrl } from "../lib/encoding";
import { getSegmentColor, sortSegments } from "../lib/segment-colors";
import { db, flattenDirs, type DirRow } from "../lib/db";

function sanitizeSegmentValue(value: string): string {
  return value.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@%]/g, "");
}

function withProtocol(url: string): string {
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  return "https://" + url;
}

interface UrlEditorProps {
  loadedBreakdown?: UrlBreakdown | null;
}

export default function UrlEditor({ loadedBreakdown }: UrlEditorProps) {
  const [rawUrl, setRawUrl] = useState("");
  const [segments, setSegments] = useState<UrlSegment[]>([]);
  const [parsed, setParsed] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  // Save dialog state
  const [showSave, setShowSave] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDirId, setSaveDirId] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const dirs = (useLiveQuery(() => db.directories.orderBy("createdAt").toArray()) ?? []) as DirRow[];
  const flatDirs = flattenDirs(dirs);

  // Load breakdown from library click
  useEffect(() => {
    if (!loadedBreakdown) return;
    setRawUrl(loadedBreakdown.originalUrl);
    setSegments(loadedBreakdown.segments);
    setParsed(true);
    setShareUrl(null);
    setShowSave(false);
  }, [loadedBreakdown]);

  // Close add-segment menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  const handleParse = useCallback(() => {
    const input = rawUrl.trim();
    if (!input) return;
    const result = parseUrl(withProtocol(input));
    setSegments(result);
    setParsed(true);
    setShareUrl(null);
    setShowSave(false);
  }, [rawUrl]);

  const rebuildUrl = (segs: UrlSegment[]): string => {
    const proto = segs.find((s) => s.type === "protocol")?.value || "https";
    const host = segs.find((s) => s.type === "host")?.value || "";
    const port = segs.find((s) => s.type === "port")?.value || "";
    const pathParts = segs.filter((s) => s.type === "pathname").map((s) => s.value).filter(Boolean);
    const params = segs.filter((s) => s.type === "search-param").map((s) => s.value).join("&");
    const hash = segs.find((s) => s.type === "hash")?.value || "";

    let url = `${proto}://${host}`;
    if (port) url += `:${port}`;
    url += pathParts.length ? `/${pathParts.join("/")}` : "/";
    if (params) url += `?${params}`;
    if (hash) url += `#${hash}`;
    return url;
  };

  const updateSegment = (id: string, field: keyof UrlSegment, value: string) => {
    const sanitized = field === "value" ? sanitizeSegmentValue(value) : value;
    setSegments((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, [field]: sanitized } : s));
      if (field === "value") setRawUrl(rebuildUrl(updated));
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

  const addSegment = (type: "pathname" | "search-param" | "hash") => {
    const presets = {
      pathname: { label: "Path", value: "" },
      "search-param": { label: "Param", value: "key=value" },
      hash: { label: "Fragment", value: "" },
    };
    const newSeg = { id: `seg-${Date.now()}`, type, description: "", ...presets[type] };
    const updated = [...segments, newSeg];
    setSegments(updated);
    setRawUrl(rebuildUrl(updated));
    setShareUrl(null);
    setShowAddMenu(false);
  };

  const handleShare = () => {
    const payload = JSON.stringify({ v: 2, url: withProtocol(rawUrl), segments });
    const encoded = encodeUrl(payload);
    setShareUrl(`${window.location.origin}/s/${encoded}`);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSaveDialog = () => {
    setSaveTitle(withProtocol(rawUrl));
    setSaveDirId(null);
    setShowSave(true);
  };

  const handleSave = async () => {
    navigator.storage?.persist?.();
    const title = saveTitle.trim() || withProtocol(rawUrl);
    await db.savedUrls.add({
      directoryId: saveDirId,
      title,
      originalUrl: withProtocol(rawUrl),
      segments,
      createdAt: Date.now(),
    });
    setShowSave(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      {/* URL input */}
      <div className="flex flex-col gap-3">
        <label htmlFor="url-input" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Enter a URL to break down
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="url-input"
            type="text"
            value={rawUrl}
            onChange={(e) => { setRawUrl(e.target.value); setParsed(false); setShareUrl(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            placeholder="example.com/path?key=value#section"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
          <button
            onClick={handleParse}
            className="rounded-lg w-full sm:w-auto bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Parse
          </button>
        </div>
      </div>

      {parsed && segments.length > 0 && (
        <>
          {/* Segment cards */}
          <div className="flex flex-col gap-3">
            {sortSegments(segments)
              .filter((seg) => seg.type !== "protocol" && seg.type !== "host")
              .map((seg) => (
                <div
                  key={seg.id}
                  className={`rounded-lg border p-4 flex flex-col gap-2 ${getSegmentColor(seg, segments)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 shrink-0">
                        {seg.type === "search-param" ? "Param" : seg.label}
                      </span>
                      {seg.type === "search-param" ? (() => {
                        const eqIdx = seg.value.indexOf("=");
                        const paramKey = eqIdx === -1 ? seg.value : seg.value.slice(0, eqIdx);
                        const paramVal = eqIdx === -1 ? "" : seg.value.slice(eqIdx + 1);
                        return (
                          <>
                            <input
                              type="text"
                              value={paramKey}
                              onChange={(e) => updateSegment(seg.id, "value", `${e.target.value}=${paramVal}`)}
                              placeholder="name"
                              className="text-sm font-mono w-28 rounded border border-current/10 bg-white/50 px-2 py-0.5 outline-none placeholder:opacity-40 dark:bg-black/20"
                            />
                            <span className="text-xs opacity-50 shrink-0">=</span>
                            <input
                              type="text"
                              value={paramVal}
                              onChange={(e) => updateSegment(seg.id, "value", `${paramKey}=${e.target.value}`)}
                              placeholder="value"
                              className="text-sm font-mono min-w-0 flex-1 rounded border border-current/10 bg-white/50 px-2 py-0.5 outline-none placeholder:opacity-40 dark:bg-black/20"
                            />
                          </>
                        );
                      })() : (
                        <input
                          type="text"
                          value={seg.value}
                          onChange={(e) => updateSegment(seg.id, "value", e.target.value)}
                          className="text-sm font-mono truncate min-w-0 rounded border border-current/10 bg-white/50 px-2 py-0.5 outline-none dark:bg-black/20"
                        />
                      )}
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

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <div ref={addMenuRef} className="relative">
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                + Add segment
              </button>
              {showAddMenu && (
                <div className="absolute left-0 top-full mt-1 z-10 flex flex-col rounded-lg border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                  {(["pathname", "search-param", "hash"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => addSegment(type)}
                      className="px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {type === "pathname" ? "Path" : type === "search-param" ? "Query param" : "Fragment"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleShare}
              className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Share
            </button>

            <button
              onClick={openSaveDialog}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {savedFlash ? "Saved ✓" : "Save"}
            </button>
          </div>

          {/* Share link */}
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

          {/* Save dialog */}
          {showSave && (
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Save to library</p>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowSave(false); }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
              />
              <select
                value={saveDirId ?? ""}
                onChange={(e) => setSaveDirId(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
              >
                <option value="">No folder</option>
                {flatDirs.map(({ dir, depth }) => (
                  <option key={dir.id} value={dir.id}>
                    {"  ".repeat(depth)}{dir.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSave(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
