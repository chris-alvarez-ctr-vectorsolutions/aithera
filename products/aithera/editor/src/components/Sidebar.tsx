import { useStore } from "../store";

type Group = {
  title: string;
  items: { relPath: string; id: string | null; label: string; dirty: boolean }[];
  // optional "new" handler for multi-entity files
  onNew?: () => void;
};

export function Sidebar() {
  const files = useStore((s) => s.files);
  const selection = useStore((s) => s.selection);
  const selectionId = useStore((s) => s.selectionId);
  const select = useStore((s) => s.select);
  const newEntity = useStore((s) => s.newEntity);

  const groups: Group[] = [];

  // Industries
  const industries = Object.values(files).filter((f) => f.relPath.startsWith("industries/"));
  if (industries.length) {
    groups.push({
      title: "Industries",
      items: industries.map((f) => ({
        relPath: f.relPath,
        id: null,
        label: (f.parsed as any).label || (f.parsed as any).id || f.relPath,
        dirty: f.dirty,
      })),
    });
  }

  // Learners
  const learners = Object.values(files).filter((f) => f.relPath.startsWith("learners/"));
  if (learners.length) {
    groups.push({
      title: "Learners",
      items: learners.map((f) => ({
        relPath: f.relPath,
        id: null,
        label: `${(f.parsed as any).name || (f.parsed as any).learnerId}`,
        dirty: f.dirty,
      })),
    });
  }

  // Courses
  const coursesFile = files["courses.json"];
  if (coursesFile) {
    const courses = (coursesFile.parsed as any).courses || [];
    groups.push({
      title: "Courses",
      onNew: () => {
        const id = prompt("Course ID");
        if (id) newEntity("courses.json", id);
      },
      items: courses.map((c: any) => ({
        relPath: "courses.json",
        id: c.id,
        label: c.title || c.id,
        dirty: coursesFile.dirty,
      })),
    });
  }

  // Scenarios
  const scenariosFile = files["scenarios.json"];
  if (scenariosFile) {
    const scenarios = (scenariosFile.parsed as any).scenarios || [];
    groups.push({
      title: "Scenarios",
      onNew: () => {
        const id = prompt("Scenario ID");
        if (id) newEntity("scenarios.json", id);
      },
      items: scenarios.map((s: any) => ({
        relPath: "scenarios.json",
        id: s.id,
        label: s.title || s.id,
        dirty: scenariosFile.dirty,
      })),
    });
  }

  // Mastery
  const masteryFile = files["mastery.json"];
  if (masteryFile) {
    const byLearner = (masteryFile.parsed as any).byLearner || {};
    groups.push({
      title: "Mastery",
      onNew: () => {
        const id = prompt("Learner ID");
        if (id) newEntity("mastery.json", id);
      },
      items: Object.keys(byLearner).map((lid) => ({
        relPath: "mastery.json",
        id: lid,
        label: lid,
        dirty: masteryFile.dirty,
      })),
    });
  }

  // Coach script
  const coach = files["coach-script.json"];
  if (coach) {
    const data: any = coach.parsed;
    const openerItems = (data.openers || []).map((e: any) => ({
      relPath: "coach-script.json",
      id: `openers:${e.id}`,
      label: `opener · ${e.id}`,
      dirty: coach.dirty,
    }));
    const intentItems = (data.intents || []).map((e: any) => ({
      relPath: "coach-script.json",
      id: `intents:${e.id}`,
      label: `intent · ${e.id}`,
      dirty: coach.dirty,
    }));
    groups.push({
      title: "Coach Script",
      onNew: () => {
        const which = prompt("Bucket: openers or intents", "openers");
        if (!which) return;
        const id = prompt("Entry ID");
        if (id) newEntity("coach-script.json", `${which}:${id}`);
      },
      items: [...openerItems, ...intentItems],
    });
  }

  // Reference
  const refFile = files["reference.json"];
  if (refFile) {
    const cats = (refFile.parsed as any).categories || [];
    groups.push({
      title: "Reference",
      onNew: () => {
        const id = prompt("Category ID");
        if (id) newEntity("reference.json", id);
      },
      items: cats.map((c: any) => ({
        relPath: "reference.json",
        id: c.id,
        label: c.label || c.id,
        dirty: refFile.dirty,
      })),
    });
  }

  return (
    <nav className="sidebar">
      {groups.length === 0 && (
        <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>No data loaded.</div>
      )}
      {groups.map((g) => (
        <div key={g.title}>
          <div className="group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{g.title}</span>
            {g.onNew && (
              <button className="ghost" style={{ padding: "0 6px", fontSize: 14 }} onClick={g.onNew} title="New">
                +
              </button>
            )}
          </div>
          {g.items.map((it) => {
            const active = selection === it.relPath && selectionId === it.id;
            return (
              <div
                key={`${it.relPath}:${it.id ?? "_"}`}
                className={`item ${active ? "active" : ""} ${it.dirty ? "dirty" : ""}`}
                onClick={() => select(it.relPath, it.id)}
              >
                <span>{it.label}</span>
                <span className="badge">{it.dirty ? "" : ""}</span>
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
