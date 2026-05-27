import { useEffect } from "react";
import { useStore } from "./store";
import { Sidebar } from "./components/Sidebar";
import { IndustryEditor } from "./views/IndustryEditor";
import { LearnerEditor } from "./views/LearnerEditor";
import { CourseEditor } from "./views/CourseEditor";
import { ScenarioEditor } from "./views/ScenarioEditor";
import { MasteryEditor } from "./views/MasteryEditor";
import { CoachScriptEditor } from "./views/CoachScriptEditor";
import { ReferenceEditor } from "./views/ReferenceEditor";
import { FS_SUPPORTED } from "./fs/picker";

export function App() {
  const initFromIdb = useStore((s) => s.initFromIdb);
  const pickDir = useStore((s) => s.pickDir);
  const pickAssetsDir = useStore((s) => s.pickAssetsDir);
  const assetsDirHandle = useStore((s) => s.assetsDirHandle);
  const saveAll = useStore((s) => s.saveAll);
  const reload = useStore((s) => s.reload);
  const dirHandle = useStore((s) => s.dirHandle);
  const files = useStore((s) => s.files);
  const selection = useStore((s) => s.selection);
  const selectionId = useStore((s) => s.selectionId);
  const toast = useStore((s) => s.toast);
  const setToast = useStore((s) => s.setToast);
  const loading = useStore((s) => s.loading);

  useEffect(() => {
    initFromIdb();
  }, [initFromIdb]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveAll]);

  const dirtyCount = Object.values(files).filter((f) => f.dirty).length;
  const hasData = Object.keys(files).length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Aithera Content Editor</h1>
        <div className="spacer" />
        {hasData && (
          <span className={`status ${dirtyCount > 0 ? "dirty" : ""}`}>
            {dirtyCount > 0 ? `${dirtyCount} unsaved` : "All saved"}
          </span>
        )}
        <button onClick={pickDir} disabled={loading}>
          {dirHandle ? "Change data/…" : "Open data/ folder…"}
        </button>
        <button onClick={pickAssetsDir}>
          {assetsDirHandle ? "Change assets/…" : "Link assets/ folder…"}
        </button>
        <button onClick={reload} disabled={!dirHandle}>
          Reload
        </button>
        <button className="primary" onClick={saveAll} disabled={dirtyCount === 0}>
          Save all {dirtyCount > 0 ? `(${dirtyCount})` : ""}
        </button>
      </header>

      <Sidebar />

      <main className="main">
        {!hasData ? (
          <div className="empty">
            <h2>Open the data/ folder to begin</h2>
            <p style={{ maxWidth: 460 }}>
              {FS_SUPPORTED
                ? "This editor reads and writes the prototype's JSON files directly. Pick the data/ folder once — your choice is remembered for next time."
                : "Your browser doesn't support direct file writes. You can still load files (via picker) and download edits. Use Chrome, Edge, Brave, or Arc for direct save."}
            </p>
            <button className="primary" onClick={pickDir} disabled={loading}>
              {loading ? "Loading…" : "Open data/ folder…"}
            </button>
          </div>
        ) : (
          <SelectedEditor selection={selection} selectionId={selectionId} />
        )}
      </main>

      {toast && <div className={`toast ${toast.kind === "error" ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
}

function SelectedEditor({ selection, selectionId }: { selection: string | null; selectionId: string | null }) {
  if (!selection) {
    return (
      <div className="empty">
        <h2>Pick an item from the sidebar</h2>
        <p>Choose an industry, learner, course, scenario, mastery record, coach entry, or reference category.</p>
      </div>
    );
  }
  if (selection.startsWith("industries/")) return <IndustryEditor relPath={selection} />;
  if (selection.startsWith("learners/")) return <LearnerEditor relPath={selection} />;
  if (selection === "courses.json" && selectionId) return <CourseEditor id={selectionId} />;
  if (selection === "scenarios.json" && selectionId) return <ScenarioEditor id={selectionId} />;
  if (selection === "mastery.json" && selectionId) return <MasteryEditor learnerId={selectionId} />;
  if (selection === "coach-script.json" && selectionId) return <CoachScriptEditor entryId={selectionId} />;
  if (selection === "reference.json" && selectionId) return <ReferenceEditor id={selectionId} />;
  return <div className="empty"><p>Select a child item.</p></div>;
}
