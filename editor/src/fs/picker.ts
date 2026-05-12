// File System Access API wrappers. Falls back to download for unsupported browsers.
import { idbDel, idbGet, idbSet } from "./idb";

export const FS_SUPPORTED =
  typeof window !== "undefined" && "showDirectoryPicker" in window;

const HANDLE_KEY = "data-dir";

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemDirectoryHandle {
    queryPermission?: (opts: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
    requestPermission?: (opts: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
    values: () => AsyncIterableIterator<FileSystemHandle>;
  }
}

export async function pickDataDir(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) throw new Error("File System Access API not supported");
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await idbSet(HANDLE_KEY, handle);
  return handle;
}

export async function getSavedDir(): Promise<FileSystemDirectoryHandle | null> {
  const h = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  return h ?? null;
}

export async function clearSavedDir() {
  await idbDel(HANDLE_KEY);
}

export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "readwrite"
): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const q = await handle.queryPermission({ mode });
  if (q === "granted") return true;
  const r = await handle.requestPermission({ mode });
  return r === "granted";
}

export type LoadedFile = {
  relPath: string;            // e.g. "scenarios.json" or "learners/firefighter.json"
  parsed: unknown;
  raw: string;
};

async function getDirHandle(
  root: FileSystemDirectoryHandle,
  name: string,
  create = false
): Promise<FileSystemDirectoryHandle> {
  return root.getDirectoryHandle(name, { create });
}

async function readJsonFile(handle: FileSystemFileHandle): Promise<{ parsed: unknown; raw: string }> {
  const file = await handle.getFile();
  const raw = await file.text();
  return { parsed: JSON.parse(raw), raw };
}

export async function loadAllData(root: FileSystemDirectoryHandle): Promise<LoadedFile[]> {
  const out: LoadedFile[] = [];

  // Top-level files
  for (const name of ["courses.json", "scenarios.json", "mastery.json", "coach-script.json", "reference.json"]) {
    try {
      const fh = await root.getFileHandle(name);
      const { parsed, raw } = await readJsonFile(fh);
      out.push({ relPath: name, parsed, raw });
    } catch {
      // missing — skip
    }
  }

  for (const subdir of ["learners", "industries"]) {
    try {
      const dh = await getDirHandle(root, subdir);
      for await (const entry of dh.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".json")) {
          const fh = entry as FileSystemFileHandle;
          const { parsed, raw } = await readJsonFile(fh);
          out.push({ relPath: `${subdir}/${entry.name}`, parsed, raw });
        }
      }
    } catch {
      // missing — skip
    }
  }

  return out;
}

export async function writeFile(
  root: FileSystemDirectoryHandle,
  relPath: string,
  content: string
): Promise<void> {
  const parts = relPath.split("/");
  const filename = parts.pop()!;
  let dir = root;
  for (const p of parts) dir = await getDirHandle(dir, p, true);
  const fh = await dir.getFileHandle(filename, { create: true });
  const writable = await (fh as any).createWritable();
  await writable.write(content);
  await writable.close();
}

export function downloadFile(relPath: string, content: string) {
  const filename = relPath.split("/").pop()!;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
