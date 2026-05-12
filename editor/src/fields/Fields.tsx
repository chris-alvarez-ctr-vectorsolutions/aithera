import { ReactNode, useState } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function TextField(props: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <Field label={props.label}>
      {props.multiline ? (
        <textarea
          value={props.value ?? ""}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          value={props.value ?? ""}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function NumberField(props: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={props.label}>
      <input
        type="number"
        step={props.step ?? 1}
        min={props.min}
        max={props.max}
        value={props.value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          props.onChange(v === "" ? undefined : Number(v));
        }}
      />
    </Field>
  );
}

export function SelectField(props: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <Field label={props.label}>
      <select value={props.value ?? ""} onChange={(e) => props.onChange(e.target.value)}>
        {props.allowEmpty && <option value="">—</option>}
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function BoolField(props: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label={props.label}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text)" }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={!!props.value}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        <span>{props.value ? "Yes" : "No"}</span>
      </label>
    </Field>
  );
}

export function TagsField(props: {
  label: string;
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const list = props.value ?? [];
  return (
    <Field label={props.label}>
      <div className="tag-list" style={{ marginBottom: 6 }}>
        {list.map((t, i) => (
          <span className="tag" key={i}>
            {t}
            <button onClick={() => props.onChange(list.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        placeholder={props.placeholder ?? "Type and press Enter"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            e.preventDefault();
            props.onChange([...list, draft.trim()]);
            setDraft("");
          }
        }}
      />
    </Field>
  );
}

export function ArrayField<T>(props: {
  label: string;
  items: T[];
  newItem: () => T;
  renderItem: (item: T, idx: number, update: (v: T) => void) => ReactNode;
  itemLabel: (item: T, idx: number) => string;
  onChange: (items: T[]) => void;
}) {
  const update = (idx: number, v: T) => {
    const next = props.items.slice();
    next[idx] = v;
    props.onChange(next);
  };
  const remove = (idx: number) => props.onChange(props.items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= props.items.length) return;
    const next = props.items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    props.onChange(next);
  };
  return (
    <fieldset>
      <legend>{props.label}</legend>
      {props.items.map((item, idx) => (
        <div className="array-item" key={idx}>
          <header>
            <h4>{props.itemLabel(item, idx)}</h4>
            <div className="controls">
              <button onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
              <button onClick={() => move(idx, 1)} disabled={idx === props.items.length - 1}>↓</button>
              <button className="danger" onClick={() => remove(idx)}>Remove</button>
            </div>
          </header>
          {props.renderItem(item, idx, (v) => update(idx, v))}
        </div>
      ))}
      <button onClick={() => props.onChange([...props.items, props.newItem()])}>+ Add</button>
    </fieldset>
  );
}

export function RawJsonView({ value }: { value: unknown }) {
  return (
    <details className="raw-toggle">
      <summary>Raw JSON</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}
