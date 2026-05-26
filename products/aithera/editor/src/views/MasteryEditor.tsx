import { useStore } from "../store";
import { NumberField, RawJsonView, Field } from "../fields/Fields";

export function MasteryEditor({ learnerId }: { learnerId: string }) {
  const file = useStore((s) => s.files["mastery.json"]);
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const data: any = file.parsed;
  const rec = data.byLearner?.[learnerId];
  if (!rec) return <div>No mastery record for {learnerId}.</div>;

  const setRec = (patch: any) => {
    const next = { ...data, byLearner: { ...data.byLearner, [learnerId]: { ...rec, ...patch } } };
    update("mastery.json", next);
  };
  const setConcept = (cid: string, val: number | undefined) => {
    const concepts = { ...(rec.concepts || {}) };
    if (val === undefined) delete concepts[cid];
    else concepts[cid] = val;
    setRec({ concepts });
  };
  const conceptIds = Object.keys(rec.concepts || {});

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{learnerId}</h2>
          <div className="subtitle">mastery.json</div>
        </div>
      </div>

      <fieldset>
        <legend>Concept mastery (0–1)</legend>
        {conceptIds.length === 0 && <div style={{ color: "var(--muted)" }}>No concepts yet.</div>}
        {conceptIds.map((cid) => (
          <div key={cid} className="field-row" style={{ alignItems: "end" }}>
            <Field label="Concept ID">
              <input
                type="text"
                value={cid}
                onChange={(e) => {
                  const next = { ...(rec.concepts || {}) };
                  const v = next[cid];
                  delete next[cid];
                  next[e.target.value] = v;
                  setRec({ concepts: next });
                }}
              />
            </Field>
            <NumberField
              label="Mastery"
              value={rec.concepts[cid]}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => setConcept(cid, v)}
            />
          </div>
        ))}
        <button
          onClick={() => {
            const cid = prompt("Concept ID");
            if (cid) setConcept(cid, 0.5);
          }}
        >
          + Add concept
        </button>
      </fieldset>

      <RawJsonView value={rec} />
    </div>
  );
}
