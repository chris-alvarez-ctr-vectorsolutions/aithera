import { useStore } from "../store";
import { TextField, TagsField, RawJsonView, Field } from "../fields/Fields";

export function IndustryEditor({ relPath }: { relPath: string }) {
  const file = useStore((s) => s.files[relPath]);
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const v: any = file.parsed;
  const set = (patch: any) => update(relPath, { ...v, ...patch });
  const setTheme = (patch: any) => update(relPath, { ...v, theme: { ...(v.theme || {}), ...patch } });
  const setLang = (patch: any) => update(relPath, { ...v, language: { ...(v.language || {}), ...patch } });

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{v.label || v.id}</h2>
          <div className="subtitle">{relPath}</div>
        </div>
      </div>

      <div className="field-row">
        <TextField label="ID" value={v.id} onChange={(x) => set({ id: x })} />
        <TextField label="Label" value={v.label} onChange={(x) => set({ label: x })} />
      </div>
      <TextField label="Tagline" value={v.tagline} onChange={(x) => set({ tagline: x })} multiline />

      <fieldset>
        <legend>Theme</legend>
        <div className="field-row-3">
          <Field label="Accent">
            <input type="color" value={v.theme?.accent || "#000000"} onChange={(e) => setTheme({ accent: e.target.value })} />
          </Field>
          <Field label="Accent 2">
            <input type="color" value={v.theme?.accent2 || "#000000"} onChange={(e) => setTheme({ accent2: e.target.value })} />
          </Field>
          <Field label="Background">
            <input type="color" value={v.theme?.bg || "#000000"} onChange={(e) => setTheme({ bg: e.target.value })} />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>Language</legend>
        <div className="field-row-3">
          <TextField label="Scenario word" value={v.language?.scenarioWord} onChange={(x) => setLang({ scenarioWord: x })} />
          <TextField label="Practice word" value={v.language?.practiceWord} onChange={(x) => setLang({ practiceWord: x })} />
          <TextField label="Peer word" value={v.language?.peerWord} onChange={(x) => setLang({ peerWord: x })} />
        </div>
      </fieldset>

      <TagsField label="Home emphasis" value={v.homeEmphasis} onChange={(x) => set({ homeEmphasis: x })} />
      <TagsField label="Example alerts" value={v.exampleAlerts} onChange={(x) => set({ exampleAlerts: x })} />

      <RawJsonView value={v} />
    </div>
  );
}
