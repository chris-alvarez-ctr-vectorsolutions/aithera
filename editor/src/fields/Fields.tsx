import { ReactNode, useEffect, useState } from "react";
import { useStore } from "../store";

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

export function ImageField(props: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  /** Target folder relative to the assets/ dir, e.g. "scenarios" */
  folder: string;
  /** Suggested basename (no extension), usually the entity id */
  basename: string;
  /** Convention path used to render a preview when no explicit value is set */
  conventionPath?: string;
}) {
  const saveAsset = useStore((s) => s.saveAsset);
  const assetsDirHandle = useStore((s) => s.assetsDirHandle);
  const pickAssetsDir = useStore((s) => s.pickAssetsDir);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBust, setPreviewBust] = useState(0);

  const explicit = props.value && props.value.length > 0;

  // Resolve preview. For paths under assets/, read from the linked
  // assets handle and produce a blob URL. For absolute URLs (https://...
  // or data:), use directly.
  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;
    const target = explicit ? props.value! : props.conventionPath;
    if (!target) { setPreviewUrl(null); return; }
    if (/^(https?:|data:)/.test(target)) { setPreviewUrl(target); return; }
    const stripped = target.replace(/^assets\//, "");
    if (!assetsDirHandle) { setPreviewUrl(null); return; }
    (async () => {
      try {
        const parts = stripped.split("/");
        const filename = parts.pop()!;
        let dir: FileSystemDirectoryHandle = assetsDirHandle;
        for (const p of parts) dir = await dir.getDirectoryHandle(p);
        const fh = await dir.getFileHandle(filename);
        const file = await fh.getFile();
        if (cancelled) return;
        const url = URL.createObjectURL(file);
        revokedUrl = url;
        setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [props.value, props.conventionPath, assetsDirHandle, explicit, previewBust]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    const extFromName = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
    const extFromType = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "jpg";
    const ext = extFromName || extFromType;
    const relPath = `${props.folder}/${props.basename}.${ext}`;
    const saved = await saveAsset(relPath, file);
    if (saved) {
      // If saved path matches the convention, leave value empty so the
      // convention resolves it. Otherwise store the explicit assets path.
      const conventionRel = props.conventionPath?.replace(/^assets\//, "");
      if (conventionRel === relPath) props.onChange(undefined);
      else props.onChange(`assets/${relPath}`);
      setPreviewBust(Date.now());
    }
    setBusy(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Field label={props.label}>
      <div
        className={`image-drop ${dragOver ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="image-drop-preview">
          {previewUrl ? (
            <img src={previewUrl} alt="" />
          ) : (
            <span className="muted">No image</span>
          )}
        </div>
        <div className="image-drop-body">
          <div className="image-drop-hint">
            Drop an image here, or
            <label className="image-drop-pick">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              choose a file…
            </label>
          </div>
          <div className="image-drop-meta">
            <code>{explicit ? props.value : props.conventionPath || "(none)"}</code>
            {!explicit && props.conventionPath && (
              <span className="muted"> · convention</span>
            )}
          </div>
          {!assetsDirHandle && (
            <div className="image-drop-warning">
              No assets folder linked yet — you'll be prompted on drop. <button onClick={pickAssetsDir} type="button">Link assets/ folder now…</button>
            </div>
          )}
          <div className="image-drop-actions">
            <input
              type="text"
              placeholder="Or paste a path / URL"
              value={props.value ?? ""}
              onChange={(e) => props.onChange(e.target.value || undefined)}
            />
            {explicit && (
              <button type="button" onClick={() => props.onChange(undefined)}>Clear override</button>
            )}
          </div>
          {busy && <div className="muted">Saving…</div>}
        </div>
      </div>
    </Field>
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
