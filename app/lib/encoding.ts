import { UrlBreakdown } from "./types";

export function encodeBreakdown(breakdown: UrlBreakdown): string {
  const json = JSON.stringify(breakdown);
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, "utf-8").toString("base64");
}

export function decodeBreakdown(encoded: string): UrlBreakdown | null {
  try {
    let json: string;
    if (typeof window !== "undefined") {
      json = decodeURIComponent(escape(atob(encoded)));
    } else {
      json = Buffer.from(encoded, "base64").toString("utf-8");
    }
    return JSON.parse(json) as UrlBreakdown;
  } catch {
    return null;
  }
}
