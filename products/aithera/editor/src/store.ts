import { create } from "zustand";
import { FS_SUPPORTED, LoadedFile, downloadBlob, downloadFile, ensurePermission, getSavedAssetsDir, getSavedDir, loadAllData, pickAssetsDir as pickAssetsDirFs, pickDataDir, writeBinary, writeFile } from "./fs/picker";

export type FileState = LoadedFile & { dirty: boolean; error?: string };

type Toast = { msg: string; kind: "info" | "error" } | null;

type State = {
  dirHandle: FileSystemDirectoryHandle | null;
  assetsDirHandle: FileSystemDirectoryHandle | null;
  files: Record<string, FileState>;
  selection: string | null;       // relPath of selected file
  selectionId: string | null;     // id within file (for multi-entity files)
  toast: Toast;
  loading: boolean;
  // actions
  initFromIdb(): Promise<void>;
  pickDir(): Promise<void>;
  pickAssetsDir(): Promise<void>;
  reload(): Promise<void>;
  select(relPath: string, id?: string | null): void;
  updateFile(relPath: string, parsed: unknown): void;
  saveAll(): Promise<void>;
  saveFile(relPath: string): Promise<void>;
  saveAsset(relPath: string, data: Blob): Promise<string | null>;
  setToast(t: Toast): void;
  newEntity(relPath: string, id: string): void;
  deleteEntity(relPath: string, id: string): void;
};

function buildFileState(loaded: LoadedFile, originalRaw?: string): FileState {
  return { ...loaded, dirty: originalRaw !== undefined ? loaded.raw !== originalRaw : false };
}

export const useStore = create<State>((set, get) => ({
  dirHandle: null,
  assetsDirHandle: null,
  files: {},
  selection: null,
  selectionId: null,
  toast: null,
  loading: false,

  async initFromIdb() {
    if (!FS_SUPPORTED) return;
    const handle = await getSavedDir();
    const assetsHandle = await getSavedAssetsDir();
    if (assetsHandle) {
      try {
        const ok = await ensurePermission(assetsHandle, "readwrite");
        if (ok) set({ assetsDirHandle: assetsHandle });
      } catch {}
    }
    if (!handle) return;
    try {
      const ok = await ensurePermission(handle, "readwrite");
      if (!ok) return;
      set({ loading: true });
      const loaded = await loadAllData(handle);
      const files: Record<string, FileState> = {};
      for (const f of loaded) files[f.relPath] = { ...f, dirty: false };
      set({ dirHandle: handle, files, loading: false });
    } catch (e: any) {
      set({ loading: false });
    }
  },

  async pickDir() {
    try {
      set({ loading: true });
      const handle = await pickDataDir();
      const loaded = await loadAllData(handle);
      const files: Record<string, FileState> = {};
      for (const f of loaded) files[f.relPath] = { ...f, dirty: false };
      set({ dirHandle: handle, files, loading: false, toast: { msg: `Loaded ${loaded.length} files`, kind: "info" } });
    } catch (e: any) {
      set({ loading: false, toast: { msg: `Pick failed: ${e.message ?? e}`, kind: "error" } });
    }
  },

  async pickAssetsDir() {
    try {
      const handle = await pickAssetsDirFs();
      set({ assetsDirHandle: handle, toast: { msg: `Assets folder linked`, kind: "info" } });
    } catch (e: any) {
      set({ toast: { msg: `Pick failed: ${e.message ?? e}`, kind: "error" } });
    }
  },

  async saveAsset(relPath, data) {
    let { assetsDirHandle } = get();
    // No handle yet: prompt the user to link an assets/ folder so the
    // drop completes as an in-project save rather than a download.
    if (!assetsDirHandle) {
      try {
        assetsDirHandle = await pickAssetsDirFs();
        set({ assetsDirHandle, toast: { msg: `Assets folder linked`, kind: "info" } });
      } catch (e: any) {
        // User canceled the picker — fall back to download so they
        // still get the file out.
        const filename = relPath.split("/").pop()!;
        downloadBlob(filename, data);
        set({ toast: { msg: `Downloaded ${filename} — link assets/ folder to save in-project`, kind: "info" } });
        return relPath;
      }
    }
    try {
      await writeBinary(assetsDirHandle, relPath, data);
      set({ toast: { msg: `Saved ${relPath}`, kind: "info" } });
      return relPath;
    } catch (e: any) {
      set({ toast: { msg: `Save failed: ${e.message ?? e}`, kind: "error" } });
      return null;
    }
  },

  async reload() {
    const { dirHandle } = get();
    if (!dirHandle) return;
    const loaded = await loadAllData(dirHandle);
    const files: Record<string, FileState> = {};
    for (const f of loaded) files[f.relPath] = { ...f, dirty: false };
    set({ files, toast: { msg: "Reloaded from disk", kind: "info" } });
  },

  select(relPath, id = null) {
    set({ selection: relPath, selectionId: id });
  },

  updateFile(relPath, parsed) {
    const state = get();
    const prev = state.files[relPath];
    if (!prev) return;
    const raw = JSON.stringify(parsed, null, 2) + "\n";
    set({
      files: {
        ...state.files,
        [relPath]: { ...prev, parsed, raw, dirty: true, error: undefined },
      },
    });
  },

  async saveFile(relPath) {
    const { dirHandle, files } = get();
    const f = files[relPath];
    if (!f) return;
    if (dirHandle) {
      try {
        await writeFile(dirHandle, relPath, f.raw);
        set({
          files: { ...files, [relPath]: { ...f, dirty: false } },
          toast: { msg: `Saved ${relPath}`, kind: "info" },
        });
      } catch (e: any) {
        set({ toast: { msg: `Save failed: ${e.message ?? e}`, kind: "error" } });
      }
    } else {
      downloadFile(relPath, f.raw);
      set({ toast: { msg: `Downloaded ${relPath}`, kind: "info" } });
    }
  },

  async saveAll() {
    const { files, saveFile } = get();
    const dirty = Object.values(files).filter((f) => f.dirty);
    if (dirty.length === 0) {
      set({ toast: { msg: "Nothing to save", kind: "info" } });
      return;
    }
    for (const f of dirty) await saveFile(f.relPath);
    set({ toast: { msg: `Saved ${dirty.length} file(s)`, kind: "info" } });
  },

  setToast(t) {
    set({ toast: t });
  },

  newEntity(relPath, id) {
    const state = get();
    const f = state.files[relPath];
    if (!f) return;
    const parsed: any = JSON.parse(JSON.stringify(f.parsed));
    if (relPath === "scenarios.json") {
      parsed.scenarios = parsed.scenarios || [];
      parsed.scenarios.push({ id, courseId: "", industry: "", title: "New scenario", concepts: [], topics: [], steps: [] });
    } else if (relPath === "courses.json") {
      parsed.courses = parsed.courses || [];
      parsed.courses.push({ id, industry: "", title: "New course", summary: "", capabilities: [], concepts: [], lessons: [] });
    } else if (relPath === "reference.json") {
      parsed.categories = parsed.categories || [];
      parsed.categories.push({ id, label: "New category", items: [] });
    } else if (relPath === "mastery.json") {
      parsed.byLearner = parsed.byLearner || {};
      parsed.byLearner[id] = { courseProgress: {}, concepts: {}, saved: [], recentPractice: [] };
    } else if (relPath === "coach-script.json") {
      // id format: openers:foo or intents:foo
      const [bucket, eid] = id.split(":");
      parsed[bucket] = parsed[bucket] || [];
      parsed[bucket].push({ id: eid, when: "default", text: "", suggested: [] });
    }
    state.updateFile(relPath, parsed);
    set({ selectionId: id });
  },

  deleteEntity(relPath, id) {
    const state = get();
    const f = state.files[relPath];
    if (!f) return;
    const parsed: any = JSON.parse(JSON.stringify(f.parsed));
    if (relPath === "scenarios.json") parsed.scenarios = (parsed.scenarios || []).filter((s: any) => s.id !== id);
    else if (relPath === "courses.json") parsed.courses = (parsed.courses || []).filter((c: any) => c.id !== id);
    else if (relPath === "reference.json") parsed.categories = (parsed.categories || []).filter((c: any) => c.id !== id);
    else if (relPath === "mastery.json") delete parsed.byLearner[id];
    else if (relPath === "coach-script.json") {
      const [bucket, eid] = id.split(":");
      parsed[bucket] = (parsed[bucket] || []).filter((e: any) => e.id !== eid);
    }
    state.updateFile(relPath, parsed);
    if (state.selectionId === id) set({ selectionId: null });
  },
}));
