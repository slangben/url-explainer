import { db, type DirRow, type UrlRow } from "./db";
import { UrlSegment } from "./types";

// ─── Bundle format ─────────────────────────────────────────────────────────────

interface ExportDir {
  exportId: string;
  parentExportId: string | null; // null when parent is outside the exported subtree
  name: string;
  createdAt: number;
}

interface ExportUrl {
  directoryExportId: string | null;
  title: string;
  originalUrl: string;
  segments: UrlSegment[];
  createdAt: number;
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  directories: ExportDir[];
  urls: ExportUrl[];
}

// ─── Compression ───────────────────────────────────────────────────────────────

async function compress(data: string): Promise<string> {
  const input = new TextEncoder().encode(data);
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }

  let binary = "";
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function decompress(encoded: string): Promise<string> {
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }

  return new TextDecoder().decode(out);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function collectDescendantDirIds(allDirs: DirRow[], rootId: number): number[] {
  const children = allDirs.filter((d) => d.parentId === rootId);
  return [rootId, ...children.flatMap((c) => collectDescendantDirIds(allDirs, c.id))];
}

function buildBundle(dirs: DirRow[], urls: UrlRow[]): ExportBundle {
  const idMap = new Map<number, string>();
  for (const dir of dirs) idMap.set(dir.id, crypto.randomUUID());

  return {
    version: 1,
    exportedAt: Date.now(),
    directories: dirs.map((dir) => ({
      exportId: idMap.get(dir.id)!,
      // If parent isn't in the exported set it resolves to null → becomes a root folder on import
      parentExportId: dir.parentId != null ? (idMap.get(dir.parentId) ?? null) : null,
      name: dir.name,
      createdAt: dir.createdAt,
    })),
    urls: urls.map((url) => ({
      directoryExportId: url.directoryId != null ? (idMap.get(url.directoryId) ?? null) : null,
      title: url.title,
      originalUrl: url.originalUrl,
      segments: url.segments,
      createdAt: url.createdAt,
    })),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function exportFolder(dirId: number, allDirs: DirRow[], allUrls: UrlRow[]): Promise<string> {
  const dirIds = new Set(collectDescendantDirIds(allDirs, dirId));
  const dirs = allDirs.filter((d) => dirIds.has(d.id));
  const urls = allUrls.filter((u) => u.directoryId != null && dirIds.has(u.directoryId));
  return compress(JSON.stringify(buildBundle(dirs, urls)));
}

export async function exportUrl(url: UrlRow): Promise<string> {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: Date.now(),
    directories: [],
    urls: [{
      directoryExportId: null,
      title: url.title,
      originalUrl: url.originalUrl,
      segments: url.segments,
      createdAt: url.createdAt,
    }],
  };
  return compress(JSON.stringify(bundle));
}

export async function importBundle(key: string): Promise<{ dirs: number; urls: number }> {
  const json = await decompress(key.trim());
  const bundle: ExportBundle = JSON.parse(json);
  if (bundle.version !== 1) throw new Error("Unsupported bundle version");

  const exportIdToLocalId = new Map<string, number>();

  // Directories are ordered parent-first so we can resolve parentId in one pass
  for (const dir of bundle.directories) {
    const parentId = dir.parentExportId != null
      ? (exportIdToLocalId.get(dir.parentExportId) ?? null)
      : null;
    const id = await db.directories.add({ name: dir.name, parentId, createdAt: dir.createdAt });
    exportIdToLocalId.set(dir.exportId, id as number);
  }

  for (const url of bundle.urls) {
    const directoryId = url.directoryExportId != null
      ? (exportIdToLocalId.get(url.directoryExportId) ?? null)
      : null;
    await db.savedUrls.add({
      directoryId,
      title: url.title,
      originalUrl: url.originalUrl,
      segments: url.segments,
      createdAt: url.createdAt,
    });
  }

  return { dirs: bundle.directories.length, urls: bundle.urls.length };
}
