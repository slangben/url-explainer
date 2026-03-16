function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeUrl(url: string): string {
  if (typeof window !== "undefined") {
    return toUrlSafe(btoa(unescape(encodeURIComponent(url))));
  }
  return toUrlSafe(Buffer.from(url, "utf-8").toString("base64"));
}

export function decodeUrl(encoded: string): string | null {
  try {
    const safe = fromUrlSafe(encoded);
    if (typeof window !== "undefined") {
      return decodeURIComponent(escape(atob(safe)));
    }
    return Buffer.from(safe, "base64").toString("utf-8");
  } catch {
    return null;
  }
}
