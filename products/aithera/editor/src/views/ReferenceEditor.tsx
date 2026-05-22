import { useStore } from "../store";
import { TextField, ArrayField, SelectField, RawJsonView } from "../fields/Fields";

export function ReferenceEditor({ id }: { id: string }) {
  const file = useStore((s) => s.files["reference.json"]);
  const industries = useStore((s) =>
    Object.values(s.files)
      .filter((f) => f.relPath.startsWith("industries/"))
      .map((f) => (f.parsed as any).id as string)
  );
  const update = useStore((s) => s.updateFile);
  if (!file) return null;
  const data: any = file.parsed;
  const idx = (data.categories || []).findIndex((c: any) => c.id === id);
  if (idx === -1) return <div>Category not found.</div>;
  const cat = data.categories[idx];

  const setCat = (patch: any) => {
    const next = { ...data, categories: data.categories.slice() };
    next.categories[idx] = { ...cat, ...patch };
    update("reference.json", next);
  };

  return (
    <div>
      <div className="entity-header">
        <div>
          <h2>{cat.label || cat.id}</h2>
          <div className="subtitle">reference.json · {cat.id}</div>
        </div>
      </div>
      <div className="field-row">
        <TextField label="ID" value={cat.id} onChange={(x) => setCat({ id: x })} />
        <TextField label="Label" value={cat.label} onChange={(x) => setCat({ label: x })} />
      </div>

      <ArrayField<any>
        label="Items"
        items={cat.items || []}
        newItem={() => ({ id: "", title: "", industry: "", kind: "", lastUpdated: new Date().toISOString().slice(0, 10) })}
        itemLabel={(it, i) => it.title || it.id || `Item ${i + 1}`}
        onChange={(items) => setCat({ items })}
        renderItem={(it, _, upd) => (
          <>
            <div className="field-row">
              <TextField label="ID" value={it.id} onChange={(x) => upd({ ...it, id: x })} />
              <TextField label="Title" value={it.title} onChange={(x) => upd({ ...it, title: x })} />
            </div>
            <div className="field-row-3">
              <SelectField
                label="Industry"
                value={it.industry}
                options={industries.map((i) => ({ value: i, label: i }))}
                onChange={(x) => upd({ ...it, industry: x })}
                allowEmpty
              />
              <TextField label="Kind" value={it.kind} onChange={(x) => upd({ ...it, kind: x })} />
              <TextField label="Last updated" value={it.lastUpdated} onChange={(x) => upd({ ...it, lastUpdated: x })} />
            </div>
          </>
        )}
      />

      <RawJsonView value={cat} />
    </div>
  );
}
