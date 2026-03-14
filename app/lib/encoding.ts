import { UrlBreakdown } from "./types";

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeBreakdown(breakdown: UrlBreakdown): string {
  const json = JSON.stringify(breakdown);
  if (typeof window !== "undefined") {
    return toUrlSafe(btoa(unescape(encodeURIComponent(json))));
  }
  return toUrlSafe(Buffer.from(json, "utf-8").toString("base64"));
}

export function decodeBreakdown(encoded: string): UrlBreakdown | null {
  try {
    const safe = fromUrlSafe(encoded);
    let json: string;
    if (typeof window !== "undefined") {
      json = decodeURIComponent(escape(atob(safe)));
    } else {
      json = Buffer.from(safe, "base64").toString("utf-8");
    }
    return JSON.parse(json) as UrlBreakdown;
  } catch {
    return null;
  }
}
