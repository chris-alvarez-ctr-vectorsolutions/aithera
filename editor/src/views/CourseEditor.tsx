import { useStore } from "../store";
import { TextField, NumberField, SelectField, BoolField, ArrayField, TagsField, RawJsonView } from "../fields/Fields";

export function CourseEditor({ id }: { id: string }) {
  const file = useStore((s) => s.files["courses.json"]);
  const industries = useStore((s) =>
    Object.values(s.files)
      .filter((f) => f.relPath.startsWith("industries/"))
      .map((f) => (f.parsed as any).id as string)
  );
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const data: any = file.parsed;
  const idx = (data.courses || []).findIndex((c: any) => c.id === id);
  if (idx === -1) return <div>Course not found.</div>;
  const c = data.courses[idx];

  const setCourse = (patch: any) => {
    const next = { ...data, courses: data.courses.slice() };
    next.courses[idx] = { ...c, ...patch };
    update("courses.json", next);
  };

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{c.title || c.id}</h2>
          <div className="subtitle">courses.json · {c.id}</div>
        </div>
      </div>

      <div className="field-row">
        <TextField label="ID" value={c.id} onChange={(x) => setCourse({ id: x })} />
        <SelectField
          label="Industry"
          value={c.industry}
          options={industries.map((i) => ({ value: i, label: i }))}
          onChange={(x) => setCourse({ industry: x })}
          allowEmpty
        />
      </div>
      <TextField label="Title" value={c.title} onChange={(x) => setCourse({ title: x })} />
      <TextField label="Summary" value={c.summary} onChange={(x) => setCourse({ summary: x })} multiline />
      <div className="field-row-3">
        <NumberField label="Est minutes" value={c.estMinutes} onChange={(x) => setCourse({ estMinutes: x })} />
        <BoolField label="Mandated" value={c.mandated} onChange={(x) => setCourse({ mandated: x })} />
        <TextField label="Credibility" value={c.credibility} onChange={(x) => setCourse({ credibility: x })} />
      </div>
      <TagsField label="Capabilities" value={c.capabilities} onChange={(x) => setCourse({ capabilities: x })} />

      <ArrayField<any>
        label="Concepts"
        items={c.concepts || []}
        newItem={() => ({ id: "", label: "", mastery: 0.5 })}
        itemLabel={(co, i) => co.label || co.id || `Concept ${i + 1}`}
        onChange={(items) => setCourse({ concepts: items })}
        renderItem={(co, _, upd) => (
          <div className="field-row-3">
            <TextField label="ID" value={co.id} onChange={(x) => upd({ ...co, id: x })} />
            <TextField label="Label" value={co.label} onChange={(x) => upd({ ...co, label: x })} />
            <NumberField label="Mastery (0–1)" value={co.mastery} step={0.01} min={0} max={1} onChange={(x) => upd({ ...co, mastery: x })} />
          </div>
        )}
      />

      <ArrayField<any>
        label="Lessons"
        items={c.lessons || []}
        newItem={() => ({ id: `ch${(c.lessons?.length || 0) + 1}`, title: "New lesson", blocks: [] })}
        itemLabel={(l, i) => l.title || l.id || `Lesson ${i + 1}`}
        onChange={(items) => setCourse({ lessons: items })}
        renderItem={(l, _, upd) => (
          <>
            <div className="field-row-3">
              <TextField label="ID" value={l.id} onChange={(x) => upd({ ...l, id: x })} />
              <TextField label="Title" value={l.title} onChange={(x) => upd({ ...l, title: x })} />
              <NumberField label="Minutes" value={l.minutes} onChange={(x) => upd({ ...l, minutes: x })} />
            </div>
            <TextField label="Kicker" value={l.kicker} onChange={(x) => upd({ ...l, kicker: x })} />
            <BlocksEditor blocks={l.blocks || []} onChange={(blocks) => upd({ ...l, blocks })} />
          </>
        )}
      />

      <RawJsonView value={c} />
    </div>
  );
}

const BLOCK_TYPES = ["text", "prose", "video", "poll", "concept", "callout-row", "image", "quote"];

function BlocksEditor({ blocks, onChange }: { blocks: any[]; onChange: (b: any[]) => void }) {
  return (
    <ArrayField<any>
      label="Blocks"
      items={blocks}
      newItem={() => ({ type: "text", body: "" })}
      itemLabel={(b, i) => `${b.type}${b.title ? ` · ${b.title}` : ""}` || `Block ${i + 1}`}
      onChange={onChange}
      renderItem={(b, _, upd) => (
        <>
          <SelectField
            label="Type"
            value={b.type}
            options={BLOCK_TYPES.map((t) => ({ value: t, label: t }))}
            onChange={(x) => upd({ ...b, type: x })}
          />
          {(b.type === "video" || b.type === "prose" || b.type === "image" || b.type === "callout-row") && (
            <TextField label="Title" value={b.title} onChange={(x) => upd({ ...b, title: x })} />
          )}
          {(b.type === "text" || b.type === "prose" || b.type === "quote") && (
            <TextField label="Body" value={b.body} onChange={(x) => upd({ ...b, body: x })} multiline />
          )}
          {b.type === "concept" && (
            <TextField label="Concept ref" value={b.ref} onChange={(x) => upd({ ...b, ref: x })} />
          )}
          {b.type === "poll" && (
            <>
              <TextField label="Prompt" value={b.prompt} onChange={(x) => upd({ ...b, prompt: x })} multiline />
              <ArrayField<any>
                label="Options"
                items={b.options || []}
                newItem={() => ({ label: "", correct: false, feedback: "" })}
                itemLabel={(o, i) => o.label || `Option ${i + 1}`}
                onChange={(options) => upd({ ...b, options })}
                renderItem={(o, _, oupd) => (
                  <>
                    <TextField label="Label" value={o.label} onChange={(x) => oupd({ ...o, label: x })} />
                    <BoolField label="Correct" value={o.correct} onChange={(x) => oupd({ ...o, correct: x })} />
                    <TextField label="Feedback" value={o.feedback} onChange={(x) => oupd({ ...o, feedback: x })} multiline />
                  </>
                )}
              />
            </>
          )}
        </>
      )}
    />
  );
}
