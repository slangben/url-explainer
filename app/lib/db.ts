import Dexie, { type Table } from "dexie";
import { UrlSegment } from "./types";

export interface Directory {
  id?: number;
  name: string;
  parentId: number | null;
  createdAt: number;
}

export interface SavedUrl {
  id?: number;
  directoryId: number | null;
  title: string;
  originalUrl: string;
  segments: UrlSegment[];
  createdAt: number;
}

export type DirRow = Directory & { id: number };
export type UrlRow = SavedUrl & { id: number };

class UrlLibraryDB extends Dexie {
  directories!: Table<Directory>;
  savedUrls!: Table<SavedUrl>;

  constructor() {
    super("url-library");
    this.version(1).stores({
      directories: "++id, parentId",
      savedUrls: "++id, directoryId",
    });
    this.version(2).stores({
      directories: "++id, parentId, createdAt",
      savedUrls: "++id, directoryId, createdAt",
    });
  }
}

export const db = new UrlLibraryDB();

export function flattenDirs(
  dirs: DirRow[],
  parentId: number | null = null,
  depth = 0
): { dir: DirRow; depth: number }[] {
  return dirs
    .filter((d) => d.parentId === parentId)
    .flatMap((d) => [
      { dir: d, depth },
      ...flattenDirs(dirs, d.id, depth + 1),
    ]);
}

function getDescendantIds(dirs: DirRow[], id: number): number[] {
  const children = dirs.filter((d) => d.parentId === id);
  return [id, ...children.flatMap((c) => getDescendantIds(dirs, c.id))];
}

export async function deleteDirectoryTree(dirs: DirRow[], id: number) {
  const ids = getDescendantIds(dirs, id);
  await db.transaction("rw", db.directories, db.savedUrls, async () => {
    await db.directories.bulkDelete(ids);
    for (const dirId of ids) {
      await db.savedUrls.where("directoryId").equals(dirId).delete();
    }
  });
}
