import { UrlSegment } from "./types";

export type UrlPiece = {
  text: string;
  segment: UrlSegment | null;
};

export function colorizeUrl(originalUrl: string, segments: UrlSegment[]): UrlPiece[] {
  let url: URL;
  try {
    url = new URL(originalUrl);
  } catch {
    return [{ text: originalUrl, segment: null }];
  }

  const pieces: UrlPiece[] = [];

  const protocolSeg = segments.find((s) => s.type === "protocol") ?? null;
  const hostSeg = segments.find((s) => s.type === "host") ?? null;
  const portSeg = segments.find((s) => s.type === "port") ?? null;
  const pathSegs = segments.filter((s) => s.type === "pathname");
  const paramSegs = segments.filter((s) => s.type === "search-param");
  const hashSeg = segments.find((s) => s.type === "hash") ?? null;

  pieces.push({ text: url.protocol + "//", segment: protocolSeg });
  pieces.push({ text: url.hostname, segment: hostSeg });

  if (url.port) {
    pieces.push({ text: ":" + url.port, segment: portSeg });
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length === 0) {
    pieces.push({ text: "/", segment: null });
  } else {
    pathParts.forEach((part, i) => {
      pieces.push({ text: "/" + part, segment: pathSegs[i] ?? null });
    });
  }

  const paramEntries: Array<[string, string]> = [];
  url.searchParams.forEach((val, key) => paramEntries.push([key, val]));
  paramEntries.forEach(([key, val], i) => {
    pieces.push({ text: (i === 0 ? "?" : "&") + key + "=" + val, segment: paramSegs[i] ?? null });
  });

  if (url.hash) {
    pieces.push({ text: url.hash, segment: hashSeg });
  }

  return pieces;
}
