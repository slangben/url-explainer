"use client";

import { useState } from "react";
import Library from "./Library";
import UrlEditor from "./UrlEditor";
import { UrlBreakdown } from "../lib/types";

export default function Workspace() {
  const [loadedBreakdown, setLoadedBreakdown] = useState<UrlBreakdown | null>(null);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <Library onLoad={setLoadedBreakdown} />
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
    </div>
  );
}
