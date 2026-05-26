import { useStore } from "../store";
import { TextField, NumberField, SelectField, BoolField, ArrayField, TagsField, ImageField, RawJsonView } from "../fields/Fields";

export function ScenarioEditor({ id }: { id: string }) {
  const file = useStore((s) => s.files["scenarios.json"]);
  const industries = useStore((s) =>
    Object.values(s.files)
      .filter((f) => f.relPath.startsWith("industries/"))
      .map((f) => (f.parsed as any).id as string)
  );
  const courses = useStore((s) => {
    const c = s.files["courses.json"];
    return c ? ((c.parsed as any).courses || []).map((x: any) => x.id) : [];
  });
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const data: any = file.parsed;
  const idx = (data.scenarios || []).findIndex((sc: any) => sc.id === id);
  if (idx === -1) return <div>Scenario not found.</div>;
  const sc = data.scenarios[idx];

  const setScenario = (patch: any) => {
    const next = { ...data, scenarios: data.scenarios.slice() };
    next.scenarios[idx] = { ...sc, ...patch };
    update("scenarios.json", next);
  };
  const setWelcome = (patch: any) =>
    setScenario({ welcome: { ...(sc.welcome || {}), ...patch } });

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{sc.title || sc.id}</h2>
          <div className="subtitle">scenarios.json · {sc.id}</div>
        </div>
      </div>

      <div className="field-row">
        <TextField label="ID" value={sc.id} onChange={(x) => setScenario({ id: x })} />
        <TextField label="Title" value={sc.title} onChange={(x) => setScenario({ title: x })} />
      </div>
      <div className="field-row-3">
        <SelectField
          label="Course"
          value={sc.courseId}
          options={courses.map((id: string) => ({ value: id, label: id }))}
          onChange={(x) => setScenario({ courseId: x })}
          allowEmpty
        />
        <SelectField
          label="Industry"
          value={sc.industry}
          options={industries.map((i) => ({ value: i, label: i }))}
          onChange={(x) => setScenario({ industry: x })}
          allowEmpty
        />
        <NumberField label="Est minutes" value={sc.estMinutes} onChange={(x) => setScenario({ estMinutes: x })} />
      </div>
      <div className="field-row-3">
        <TextField label="Kicker" value={sc.kicker} onChange={(x) => setScenario({ kicker: x })} />
        <TextField label="Module label" value={sc.moduleLabel} onChange={(x) => setScenario({ moduleLabel: x })} />
        <TextField label="Outcome type" value={sc.outcomeType} onChange={(x) => setScenario({ outcomeType: x })} />
      </div>
      <div className="field-row-3">
        <SelectField
          label="Tier"
          value={sc.tier}
          options={["core", "stretch", "remedial"].map((t) => ({ value: t, label: t }))}
          onChange={(x) => setScenario({ tier: x })}
          allowEmpty
        />
        <SelectField
          label="Difficulty"
          value={sc.difficulty}
          options={["intro", "standard", "advanced"].map((t) => ({ value: t, label: t }))}
          onChange={(x) => setScenario({ difficulty: x })}
          allowEmpty
        />
        <SelectField
          label="Status"
          value={sc.status}
          options={["active", "draft", "archived"].map((t) => ({ value: t, label: t }))}
          onChange={(x) => setScenario({ status: x })}
          allowEmpty
        />
      </div>
      <div className="field-row-3">
        <TextField label="Icon" value={sc.icon} onChange={(x) => setScenario({ icon: x })} />
        <BoolField label="Featured" value={sc.featured} onChange={(x) => setScenario({ featured: x })} />
        <NumberField label="Phase hint" value={sc.phaseHint} onChange={(x) => setScenario({ phaseHint: x })} />
      </div>
      <TagsField label="Concepts" value={sc.concepts} onChange={(x) => setScenario({ concepts: x })} />
      <TagsField label="Topics" value={sc.topics} onChange={(x) => setScenario({ topics: x })} />
      <TextField label="Context" value={sc.context} onChange={(x) => setScenario({ context: x })} multiline />

      <ImageField
        label="Hero image"
        value={sc.heroImage}
        onChange={(x) => setScenario({ heroImage: x })}
        folder="scenarios"
        basename={sc.id}
        conventionPath={`assets/scenarios/${sc.id}.jpg`}
      />

      <fieldset>
        <legend>Welcome</legend>
        <div className="field-row">
          <TextField label="Kicker" value={sc.welcome?.kicker} onChange={(x) => setWelcome({ kicker: x })} />
          <TextField label="Title" value={sc.welcome?.title} onChange={(x) => setWelcome({ title: x })} />
        </div>
        <TextField label="Body" value={sc.welcome?.body} onChange={(x) => setWelcome({ body: x })} multiline />
        <TextField label="Highlight" value={sc.welcome?.highlight} onChange={(x) => setWelcome({ highlight: x })} />
        <TextField label="Reassurance" value={sc.welcome?.reassurance} onChange={(x) => setWelcome({ reassurance: x })} multiline />
        <TextField label="Expected outcome" value={sc.welcome?.expectedOutcome} onChange={(x) => setWelcome({ expectedOutcome: x })} multiline />
      </fieldset>

      <ArrayField<any>
        label="Steps"
        items={sc.steps || []}
        newItem={() => ({ id: `s${(sc.steps?.length || 0) + 1}`, title: "New step", prompt: "", options: [] })}
        itemLabel={(s, i) => `${s.id || `s${i + 1}`} · ${s.title || s.kicker || ""}`}
        onChange={(items) => setScenario({ steps: items })}
        renderItem={(s, _, upd) => (
          <>
            <div className="field-row-3">
              <TextField label="ID" value={s.id} onChange={(x) => upd({ ...s, id: x })} />
              <TextField label="Kicker" value={s.kicker} onChange={(x) => upd({ ...s, kicker: x })} />
              <SelectField
                label="Tension"
                value={s.tension}
                options={["low", "medium", "high"].map((t) => ({ value: t, label: t }))}
                onChange={(x) => upd({ ...s, tension: x })}
                allowEmpty
              />
            </div>
            <TextField label="Title" value={s.title} onChange={(x) => upd({ ...s, title: x })} />
            <TextField label="Prompt" value={s.prompt} onChange={(x) => upd({ ...s, prompt: x })} multiline />
            <div className="field-row">
              <TextField label="Coach hint" value={s.coachHint} onChange={(x) => upd({ ...s, coachHint: x })} multiline />
              <TextField label="Indicator" value={s.indicator} onChange={(x) => upd({ ...s, indicator: x })} />
            </div>
            <div className="field-row-3">
              <SelectField
                label="Input type"
                value={s.input}
                options={["", "text", "voice"].map((t) => ({ value: t, label: t || "(none)" }))}
                onChange={(x) => upd({ ...s, input: x || undefined })}
              />
              <TextField label="Input label" value={s.inputLabel} onChange={(x) => upd({ ...s, inputLabel: x })} />
              <TextField label="Voice prompt" value={s.voicePrompt} onChange={(x) => upd({ ...s, voicePrompt: x })} />
            </div>
            <TextField label="Model answer" value={s.modelAnswer} onChange={(x) => upd({ ...s, modelAnswer: x })} multiline />
            <TagsField label="Rubric" value={s.rubric} onChange={(x) => upd({ ...s, rubric: x })} />
            <ArrayField<any>
              label="Options"
              items={s.options || []}
              newItem={() => ({ id: String.fromCharCode(97 + (s.options?.length || 0)), label: "", outcome: "ok", feedback: "", insight: "" })}
              itemLabel={(o, i) => `${o.id || i + 1} · ${o.label || ""}`}
              onChange={(options) => upd({ ...s, options })}
              renderItem={(o, _, oupd) => (
                <>
                  <div className="field-row-3">
                    <TextField label="ID" value={o.id} onChange={(x) => oupd({ ...o, id: x })} />
                    <TextField label="Label" value={o.label} onChange={(x) => oupd({ ...o, label: x })} />
                    <SelectField
                      label="Outcome"
                      value={o.outcome}
                      options={[
                        { value: "good", label: "good" },
                        { value: "ok", label: "ok" },
                        { value: "bad", label: "bad" },
                      ]}
                      onChange={(x) => oupd({ ...o, outcome: x })}
                    />
                  </div>
                  <TextField label="Feedback" value={o.feedback} onChange={(x) => oupd({ ...o, feedback: x })} multiline />
                  <TextField label="Insight" value={o.insight} onChange={(x) => oupd({ ...o, insight: x })} multiline />
                </>
              )}
            />
          </>
        )}
      />

      <RawJsonView value={sc} />
    </div>
  );
}
