"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (label) {
    return (
      <button
        data-goatcounter-click="Shared URL copied"
        onClick={handleCopy}
        className="inline-block rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {copied ? "Copied!" : label}
      </button>
    );
  }

  return (
    <button
      data-goatcounter-click="Shared URL copied as Markdown"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy"}
      className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8l3.5 3.5L13 4" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="8" height="9" rx="1.5" />
          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v7A1.5 1.5 0 003.5 12H5" />
        </svg>
      )}
    </button>
  );
}
