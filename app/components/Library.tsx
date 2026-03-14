"use client";

import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  flattenDirs,
  deleteDirectoryTree,
  type DirRow,
  type UrlRow,
} from "../lib/db";
import { UrlSegment } from "../lib/types";

interface LibraryProps {
  onLoad: (data: { originalUrl: string; segments: UrlSegment[] }) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-3 h-3 shrink-0 opacity-40 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0 opacity-50" fill="currentColor">
      <path d="M1.5 3.5A1.5 1.5 0 013 2h3.172a1.5 1.5 0 011.06.44l.83.83A1.5 1.5 0 009.12 3.8H13A1.5 1.5 0 0114.5 5.3v6.2A1.5 1.5 0 0113 13H3a1.5 1.5 0 01-1.5-1.5v-8z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5l3-3M10 4h2.5v2.5M9 12.5H4.5a2 2 0 01-2-2v-5a2 2 0 012-2H7" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
      <circle cx="3" cy="8" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="13" cy="8" r="1.3" />
    </svg>
  );
}

// ─── URL Item ─────────────────────────────────────────────────────────────────

interface UrlItemProps {
  url: UrlRow;
  allDirs: DirRow[];
  depth: number;
  onLoad: LibraryProps["onLoad"];
  draggingUrlId: number | null;
  setDraggingUrlId: (id: number | null) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

function UrlItem({
  url,
  allDirs,
  depth,
  onLoad,
  draggingUrlId,
  setDraggingUrlId,
  openMenuId,
  setOpenMenuId,
}: UrlItemProps) {
  const menuId = `url-${url.id}`;
  const isMenuOpen = openMenuId === menuId;
  const [showMoveTo, setShowMoveTo] = useState(false);
  const flatDirs = flattenDirs(allDirs);

  const handleLoad = () => onLoad({ originalUrl: url.originalUrl, segments: url.segments });

  const handleMove = async (dirId: number | null) => {
    await db.savedUrls.update(url.id, { directoryId: dirId });
    setOpenMenuId(null);
    setShowMoveTo(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${url.title}"?`)) {
      await db.savedUrls.delete(url.id);
    }
    setOpenMenuId(null);
  };

  return (
    <div
      className={`group flex items-center gap-1.5 py-1.5 pr-2 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors ${draggingUrlId === url.id ? "opacity-40" : ""}`}
      style={{ paddingLeft: `${10 + depth * 16}px` }}
      draggable
      onDragStart={(e) => { e.stopPropagation(); setDraggingUrlId(url.id); }}
      onDragEnd={() => setDraggingUrlId(null)}
      onClick={handleLoad}
    >
      <LinkIcon />
      <span className="flex-1 min-w-0 text-xs truncate text-zinc-600 dark:text-zinc-400">
        {url.title}
      </span>

      {/* Menu button */}
      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          className={`rounded p-0.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity ${isMenuOpen ? "!opacity-100" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isMenuOpen) { setOpenMenuId(null); setShowMoveTo(false); }
            else { setOpenMenuId(menuId); setShowMoveTo(false); }
          }}
        >
          <DotsIcon />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 z-30 min-w-44 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 py-1">
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={(e) => { e.stopPropagation(); handleLoad(); setOpenMenuId(null); }}
            >
              Load in editor
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
              onClick={(e) => { e.stopPropagation(); setShowMoveTo((v) => !v); }}
            >
              Move to
              <svg viewBox="0 0 16 16" className={`w-3 h-3 opacity-40 transition-transform ${showMoveTo ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>

            {showMoveTo && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1 max-h-44 overflow-y-auto">
                <button
                  className="w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={(e) => { e.stopPropagation(); handleMove(null); }}
                >
                  No folder
                </button>
                {flatDirs.map(({ dir, depth: d }) => (
                  <button
                    key={dir.id}
                    className="w-full py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    style={{ paddingLeft: `${12 + d * 12}px` }}
                    onClick={(e) => { e.stopPropagation(); handleMove(dir.id); }}
                  >
                    {dir.name}
                  </button>
                ))}
              </div>
            )}

            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
            <button
              className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Directory Node ────────────────────────────────────────────────────────────

interface DirNodeProps {
  dir: DirRow;
  allDirs: DirRow[];
  allUrls: UrlRow[];
  depth: number;
  onLoad: LibraryProps["onLoad"];
  draggingUrlId: number | null;
  setDraggingUrlId: (id: number | null) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

function DirectoryNode({
  dir,
  allDirs,
  allUrls,
  depth,
  onLoad,
  draggingUrlId,
  setDraggingUrlId,
  openMenuId,
  setOpenMenuId,
}: DirNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(dir.name);
  const [dragOver, setDragOver] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  const menuId = `dir-${dir.id}`;
  const isMenuOpen = openMenuId === menuId;

  const children = allDirs.filter((d) => d.parentId === dir.id);
  const urls = allUrls.filter((u) => u.directoryId === dir.id);

  useEffect(() => {
    if (renaming) renameRef.current?.select();
  }, [renaming]);

  const commitRename = async () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== dir.name) {
      await db.directories.update(dir.id, { name: trimmed });
    } else {
      setNewName(dir.name);
    }
    setRenaming(false);
  };

  const handleDelete = async () => {
    const hasContent = children.length > 0 || urls.length > 0;
    const msg = hasContent
      ? `Delete "${dir.name}" and all its contents?`
      : `Delete "${dir.name}"?`;
    if (confirm(msg)) await deleteDirectoryTree(allDirs, dir.id);
    setOpenMenuId(null);
  };

  const handleAddSubfolder = async () => {
    await db.directories.add({ name: "New Folder", parentId: dir.id, createdAt: Date.now() });
    setExpanded(true);
    setOpenMenuId(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (draggingUrlId != null) {
      await db.savedUrls.update(draggingUrlId, { directoryId: dir.id });
      setDraggingUrlId(null);
    }
  };

  return (
    <div>
      {/* Row */}
      <div
        className={`group flex items-center gap-1 py-1.5 pr-2 rounded-md select-none transition-colors ${
          dragOver
            ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-800"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
        }`}
        style={{ paddingLeft: `${6 + depth * 16}px` }}
        onDragOver={(e) => { if (draggingUrlId != null) { e.preventDefault(); e.stopPropagation(); setDragOver(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
        onDrop={handleDrop}
      >
        <button
          className="flex items-center gap-1 flex-1 min-w-0"
          onClick={() => !renaming && setExpanded((v) => !v)}
          onDoubleClick={() => { setRenaming(true); setNewName(dir.name); }}
        >
          <ChevronIcon open={expanded} />
          <FolderIcon />
          {renaming ? (
            <input
              ref={renameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setNewName(dir.name); setRenaming(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-1 py-0.5 outline-none"
            />
          ) : (
            <span className="flex-1 min-w-0 text-xs truncate text-zinc-700 dark:text-zinc-300">
              {dir.name}
            </span>
          )}
        </button>

        {/* Menu button */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            className={`rounded p-0.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity ${isMenuOpen ? "!opacity-100" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(isMenuOpen ? null : menuId);
            }}
          >
            <DotsIcon />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-40 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 py-1">
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={(e) => { e.stopPropagation(); setRenaming(true); setNewName(dir.name); setOpenMenuId(null); }}
              >
                Rename
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={(e) => { e.stopPropagation(); handleAddSubfolder(); }}
              >
                New subfolder
              </button>
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <button
                className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && (
        <div>
          {children.map((child) => (
            <DirectoryNode
              key={child.id}
              dir={child}
              allDirs={allDirs}
              allUrls={allUrls}
              depth={depth + 1}
              onLoad={onLoad}
              draggingUrlId={draggingUrlId}
              setDraggingUrlId={setDraggingUrlId}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
            />
          ))}
          {urls.map((url) => (
            <UrlItem
              key={url.id}
              url={url}
              allDirs={allDirs}
              depth={depth + 1}
              onLoad={onLoad}
              draggingUrlId={draggingUrlId}
              setDraggingUrlId={setDraggingUrlId}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Library ──────────────────────────────────────────────────────────────────

export default function Library({ onLoad }: LibraryProps) {
  const allDirs = (useLiveQuery(() => db.directories.orderBy("createdAt").toArray()) ?? []) as DirRow[];
  const allUrls = (useLiveQuery(() => db.savedUrls.orderBy("createdAt").reverse().toArray()) ?? []) as UrlRow[];

  const [draggingUrlId, setDraggingUrlId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [uncatDragOver, setUncatDragOver] = useState(false);

  const rootDirs = allDirs.filter((d) => d.parentId === null);
  const uncategorized = allUrls.filter((u) => u.directoryId === null);
  const isEmpty = allDirs.length === 0 && allUrls.length === 0;

  // Close menus on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuId]);

  const handleDropUncategorized = async (e: React.DragEvent) => {
    e.preventDefault();
    setUncatDragOver(false);
    if (draggingUrlId != null) {
      await db.savedUrls.update(draggingUrlId, { directoryId: null });
      setDraggingUrlId(null);
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 h-screen sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Library
        </span>
        <button
          title="New folder"
          onClick={() => db.directories.add({ name: "New Folder", parentId: null, createdAt: Date.now() })}
          className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 4.5A1.5 1.5 0 013 3h3l1.5 1.5H13A1.5 1.5 0 0114.5 5.3v6.2A1.5 1.5 0 0113 13H3a1.5 1.5 0 01-1.5-1.5v-8z" />
            <path d="M8 7v4M6 9h4" />
          </svg>
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5 min-h-0">
        {isEmpty ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">No saved URLs yet.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Parse a URL and click Save.</p>
          </div>
        ) : (
          <>
            {rootDirs.map((dir) => (
              <DirectoryNode
                key={dir.id}
                dir={dir}
                allDirs={allDirs}
                allUrls={allUrls}
                depth={0}
                onLoad={onLoad}
                draggingUrlId={draggingUrlId}
                setDraggingUrlId={setDraggingUrlId}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            ))}

            {/* Uncategorized */}
            {uncategorized.length > 0 && (
              <div>
                {rootDirs.length > 0 && (
                  <div className="mx-2 my-2 border-t border-zinc-100 dark:border-zinc-800" />
                )}
                <div
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
                    uncatDragOver
                      ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-800"
                      : ""
                  }`}
                  onDragOver={(e) => { if (draggingUrlId != null) { e.preventDefault(); setUncatDragOver(true); } }}
                  onDragLeave={() => setUncatDragOver(false)}
                  onDrop={handleDropUncategorized}
                >
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
                    Uncategorized
                  </span>
                </div>
                {uncategorized.map((url) => (
                  <UrlItem
                    key={url.id}
                    url={url}
                    allDirs={allDirs}
                    depth={0}
                    onLoad={onLoad}
                    draggingUrlId={draggingUrlId}
                    setDraggingUrlId={setDraggingUrlId}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Local-only notice */}
      <div className="shrink-0 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-600">
          <span className="font-semibold text-zinc-500 dark:text-zinc-500">Local only.</span>{" "}
          Data is stored in this browser and won't sync across devices or survive clearing site data.
        </p>
      </div>
    </aside>
  );
}
