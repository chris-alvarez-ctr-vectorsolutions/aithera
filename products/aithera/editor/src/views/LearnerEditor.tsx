import { useStore } from "../store";
import { TextField, NumberField, SelectField, ArrayField, TagsField, RawJsonView } from "../fields/Fields";

export function LearnerEditor({ relPath }: { relPath: string }) {
  const file = useStore((s) => s.files[relPath]);
  const industries = useStore((s) =>
    Object.values(s.files)
      .filter((f) => f.relPath.startsWith("industries/"))
      .map((f) => (f.parsed as any).id as string)
  );
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const v: any = file.parsed;
  const set = (patch: any) => update(relPath, { ...v, ...patch });
  const setPref = (patch: any) => update(relPath, { ...v, preferences: { ...(v.preferences || {}), ...patch } });
  const setStats = (patch: any) => update(relPath, { ...v, stats: { ...(v.stats || {}), ...patch } });

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{v.name || v.learnerId}</h2>
          <div className="subtitle">{relPath}</div>
        </div>
      </div>

      <div className="field-row">
        <TextField label="Learner ID" value={v.learnerId} onChange={(x) => set({ learnerId: x })} />
        <TextField label="Name" value={v.name} onChange={(x) => set({ name: x })} />
      </div>
      <div className="field-row-3">
        <TextField label="Role" value={v.role} onChange={(x) => set({ role: x })} />
        <SelectField
          label="Industry"
          value={v.industry}
          options={industries.map((i) => ({ value: i, label: i }))}
          onChange={(x) => set({ industry: x })}
          allowEmpty
        />
        <TextField label="Experience level" value={v.experienceLevel} onChange={(x) => set({ experienceLevel: x })} />
      </div>
      <NumberField label="Years in role" value={v.yearsInRole} onChange={(x) => set({ yearsInRole: x })} />

      <ArrayField<any>
        label="Certifications"
        items={v.certifications || []}
        newItem={() => ({ id: "", label: "", expiresInDays: 0 })}
        itemLabel={(c, i) => c.label || c.id || `Cert ${i + 1}`}
        onChange={(items) => set({ certifications: items })}
        renderItem={(c, _, upd) => (
          <div className="field-row-3">
            <TextField label="ID" value={c.id} onChange={(x) => upd({ ...c, id: x })} />
            <TextField label="Label" value={c.label} onChange={(x) => upd({ ...c, label: x })} />
            <NumberField label="Expires in days" value={c.expiresInDays} onChange={(x) => upd({ ...c, expiresInDays: x })} />
          </div>
        )}
      />

      <fieldset>
        <legend>Preferences</legend>
        <div className="field-row">
          <SelectField
            label="Theme"
            value={v.preferences?.theme}
            options={[
              { value: "dark", label: "dark" },
              { value: "light", label: "light" },
            ]}
            onChange={(x) => setPref({ theme: x })}
            allowEmpty
          />
          <SelectField
            label="Coach tone"
            value={v.preferences?.coachTone}
            options={[
              { value: "direct", label: "direct" },
              { value: "warm", label: "warm" },
              { value: "formal", label: "formal" },
            ]}
            onChange={(x) => setPref({ coachTone: x })}
            allowEmpty
          />
        </div>
        <TagsField
          label="Media preference"
          value={v.preferences?.mediaPreference}
          onChange={(x) => setPref({ mediaPreference: x })}
        />
      </fieldset>

      <fieldset>
        <legend>Stats</legend>
        <div className="field-row-3">
          <NumberField label="Weekly minutes" value={v.stats?.weeklyMinutes} onChange={(x) => setStats({ weeklyMinutes: x })} />
          <NumberField label="Scenarios this month" value={v.stats?.scenariosThisMonth} onChange={(x) => setStats({ scenariosThisMonth: x })} />
          <NumberField label="Streak days" value={v.stats?.streakDays} onChange={(x) => setStats({ streakDays: x })} />
        </div>
      </fieldset>

      <RawJsonView value={v} />
    </div>
  );
}
