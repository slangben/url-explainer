"use client";

import { useState } from "react";
import Library from "./Library";
import UrlEditor from "./UrlEditor";
import { UrlBreakdown } from "../lib/types";

export default function Workspace() {
  const [loadedBreakdown, setLoadedBreakdown] = useState<UrlBreakdown | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleLoad = (breakdown: UrlBreakdown) => {
    setLoadedBreakdown(breakdown);
    setLibraryOpen(false); // close drawer on mobile after selecting
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="flex-1 min-w-0 flex justify-center px-6 py-20 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-12 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              URL Explainer
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Paste a URL to break it down into its parts. Edit descriptions, add or remove segments, then share or save.
            </p>
          </div>
          <UrlEditor loadedBreakdown={loadedBreakdown} />
        </div>
      </main>

      {/* Mobile backdrop */}
      {libraryOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setLibraryOpen(false)}
        />
      )}

      <Library onLoad={handleLoad} open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      {/* Floating button — mobile only */}
      <button
        onClick={() => setLibraryOpen(true)}
        className="fixed bottom-6 right-6 z-30 md:hidden flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 pl-4 pr-5 py-3 shadow-lg text-white dark:text-zinc-900 text-sm font-medium"
        aria-label="Open library"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2.5A1.5 1.5 0 013.5 1h8A1.5 1.5 0 0113 2.5v11l-4.5-2-4.5 2V2.5z" />
        </svg>
        Library
      </button>
    </div>
  );
}
