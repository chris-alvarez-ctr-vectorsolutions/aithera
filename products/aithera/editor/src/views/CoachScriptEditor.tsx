import { useStore } from "../store";
import { TextField, NumberField, TagsField, RawJsonView, SelectField } from "../fields/Fields";

export function CoachScriptEditor({ entryId }: { entryId: string }) {
  // entryId format: openers:foo or intents:foo
  const file = useStore((s) => s.files["coach-script.json"]);
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const [bucket, eid] = entryId.split(":");
  const data: any = file.parsed;
  const list: any[] = data[bucket] || [];
  const idx = list.findIndex((e) => e.id === eid);
  if (idx === -1) return <div>Entry not found.</div>;
  const e = list[idx];

  const setEntry = (patch: any) => {
    const nextList = list.slice();
    nextList[idx] = { ...e, ...patch };
    update("coach-script.json", { ...data, [bucket]: nextList });
  };

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{e.id}</h2>
          <div className="subtitle">coach-script.json · {bucket}</div>
        </div>
      </div>

      <div className="field-row">
        <TextField label="ID" value={e.id} onChange={(x) => setEntry({ id: x })} />
        {bucket === "openers" ? (
          <SelectField
            label="When"
            value={e.when}
            options={[
              { value: "default", label: "default" },
              { value: "lowest-mastery-below", label: "lowest-mastery-below" },
              { value: "cert-expires-within", label: "cert-expires-within" },
            ]}
            onChange={(x) => setEntry({ when: x })}
            allowEmpty
          />
        ) : (
          <TextField label="Match (regex)" value={e.match} onChange={(x) => setEntry({ match: x })} />
        )}
      </div>
      {bucket === "openers" && (
        <div className="field-row">
          <NumberField label="Threshold (mastery)" value={e.threshold} step={0.01} onChange={(x) => setEntry({ threshold: x })} />
          <NumberField label="Threshold days" value={e.thresholdDays} onChange={(x) => setEntry({ thresholdDays: x })} />
        </div>
      )}
      <TextField label="Text" value={e.text} onChange={(x) => setEntry({ text: x })} multiline />
      <TagsField label="Suggested replies" value={e.suggested} onChange={(x) => setEntry({ suggested: x })} />

      <RawJsonView value={e} />
    </div>
  );
}
