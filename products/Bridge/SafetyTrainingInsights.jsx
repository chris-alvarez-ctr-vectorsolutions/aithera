/**
 * Bridge — Safety Training Insights
 * -------------------------------------------------------------------------
 * A cross-product (EHS × Convergence) dashboard concept.
 *
 * Bridge is the internal name for unifying EHS (safety) and Convergence (LMS).
 * Keystone/Bridge handles SSO, employee sync, app-switching and cross-app
 * reporting — assume the user is already authenticated across both. This file
 * is ONLY the experience layer: making safety data actionable for training.
 *
 * The data flow is one-way: EHS (signals) -> Convergence (training).
 *
 * Single-file React prototype: default export, no required props, Tailwind
 * core classes, recharts for charts, lucide-react for icons, hard-coded mock
 * data. Concept mock for internal discussion — no backend.
 */

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Factory,
  Warehouse,
  HardHat,
  Truck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ClipboardCheck,
  Eye,
  BadgeCheck,
  GraduationCap,
  Download,
  MessageSquare,
  Check,
  X,
  CalendarPlus,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Users,
  ArrowRight,
  RefreshCw,
  Send,
  CircleDot,
  Undo2,
  BookOpen,
  Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   Design tokens
   Chart series use the validated data-viz reference palette (blue + orange);
   UI status colors use Tailwind's semantic scale. Light theme only — this is
   built to be screenshotted into a deck.
   ═══════════════════════════════════════════════════════════════════════ */
const BLUE = "#2a78d6"; // training completion (the "good" thing going up)
const ORANGE = "#eb6834"; // recordable incidents (the thing going down)
const GRID = "#e2e8f0";
const AXIS = "#94a3b8";

const cx = (...a) => a.filter(Boolean).join(" ");
const num = (n) => n.toLocaleString("en-US");

/* ═══════════════════════════════════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════════════════════════════════ */

// ── Facilities (mix of plants, warehouses, construction, distribution) ──
const RAW_FACILITIES = [
  { id: "dayton",       name: "Dayton Plant",                  type: "plant",        workers: 420, incidents90: 23, incidentsPrior: 15, topCategory: "Forklift / powered trucks",  openCAs: 7, compliancePct: 78, yoyComplianceGain: 9 },
  { id: "bakersfield",  name: "Bakersfield Construction Site", type: "construction", workers: 180, incidents90: 27, incidentsPrior: 21, topCategory: "Falls from height / ladders",  openCAs: 9, compliancePct: 64, yoyComplianceGain: 11 },
  { id: "tucson",       name: "Tucson Warehouse",              type: "warehouse",    workers: 310, incidents90: 19, incidentsPrior: 12, topCategory: "Improper lifting / ergonomics", openCAs: 5, compliancePct: 82, yoyComplianceGain: 7 },
  { id: "elpaso",       name: "El Paso Construction Site",     type: "construction", workers: 200, incidents90: 21, incidentsPrior: 14, topCategory: "Electrical / lockout-tagout", openCAs: 6, compliancePct: 71, yoyComplianceGain: 8 },
  { id: "reno",         name: "Reno Warehouse",                type: "warehouse",    workers: 240, incidents90: 11, incidentsPrior: 10, topCategory: "Hazardous materials",         openCAs: 4, compliancePct: 88, yoyComplianceGain: 6 },
  { id: "fresno",       name: "Fresno Distribution Center",    type: "distribution", workers: 260, incidents90: 14, incidentsPrior: 16, topCategory: "Slips, trips & falls",        openCAs: 3, compliancePct: 91, yoyComplianceGain: 4 },
  { id: "toledo",       name: "Toledo Plant",                  type: "plant",        workers: 350, incidents90: 8,  incidentsPrior: 11, topCategory: "Machine guarding",            openCAs: 2, compliancePct: 94, yoyComplianceGain: 3 },
  { id: "savannah",     name: "Savannah Distribution Center",  type: "distribution", workers: 150, incidents90: 6,  incidentsPrior: 9,  topCategory: "Powered trucks",             openCAs: 1, compliancePct: 96, yoyComplianceGain: 2 },
];

// Computed risk — a transparent weighted score so the level is defensible.
function riskScore(f) {
  const trendUp = Math.max(0, ((f.incidents90 - f.incidentsPrior) / f.incidentsPrior) * 100);
  return (
    f.incidents90 * 1.5 +
    trendUp * 0.4 +
    f.openCAs * 2.5 +
    (100 - f.compliancePct) * 0.8
  );
}
function riskLevel(score) {
  if (score >= 65) return "high";
  if (score >= 32) return "medium";
  return "low";
}
const FACILITIES = RAW_FACILITIES.map((f) => {
  const trendPct = Math.round(((f.incidents90 - f.incidentsPrior) / f.incidentsPrior) * 100);
  const score = riskScore(f);
  return { ...f, trendPct, riskScore: Math.round(score), risk: riskLevel(score) };
});
const facilityById = Object.fromEntries(FACILITIES.map((f) => [f.id, f]));

// ── 12-month trend series (per facility + aggregate). Deterministic. ──
const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const WIGGLE = [0, 0.6, -0.4, 0.8, -0.3, 0.5, -0.6, 0.3, -0.2, 0.4, -0.5, 0.1];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function buildTrend(f) {
  const endC = f.compliancePct;
  const startC = endC - f.yoyComplianceGain;
  const endRate = Math.max(0.6, +(f.incidents90 / 12).toFixed(1)); // recent monthly avg
  const startRate = +(endRate * 1.5 + 0.8).toFixed(1); // higher a year ago
  return MONTHS.map((month, i) => {
    const t = i / 11;
    const completion = clamp(Math.round(startC + f.yoyComplianceGain * t + WIGGLE[i] * 1.1), 40, 100);
    let rate = startRate + (endRate - startRate) * t;
    // Recent-quarter bend: the last 3 months reflect this facility's 90-day trend
    if (i >= 9) rate += (f.trendPct / 100) * endRate * (i - 8) * 0.5;
    rate = Math.max(0.3, +(rate + WIGGLE[i] * 0.12).toFixed(1));
    return { month, completion, incidentRate: rate };
  });
}
const TREND = Object.fromEntries(FACILITIES.map((f) => [f.id, buildTrend(f)]));
TREND.all = MONTHS.map((month, i) => {
  const completion = Math.round(FACILITIES.reduce((s, f) => s + TREND[f.id][i].completion, 0) / FACILITIES.length);
  const incidentRate = +(FACILITIES.reduce((s, f) => s + TREND[f.id][i].incidentRate, 0) / FACILITIES.length).toFixed(1);
  return { month, completion, incidentRate };
});

// ── Training recommendations (the centerpiece). Sources are mixed. ──
const RECOMMENDATIONS = [
  {
    id: "rec-1",
    source: "incident-trend",
    priority: "high",
    facilityIds: ["dayton"],
    signal: "6 forklift incidents at Dayton Plant in the last 90 days — up 50% vs. the prior quarter, concentrated on 2nd shift.",
    evidence: "Trend • 6 events • INV-114…INV-119",
    courses: [{ code: "FLT-201", name: "Powered Industrial Truck Refresher", mins: 45 }],
    audience: { role: "Forklift operators", learners: 34 },
    dueInDays: 30,
    comments: [
      { author: "M. Reyes", role: "safety", text: "Spike is concentrated on 2nd shift, dock 4. Worth prioritizing that crew first.", when: "2d ago" },
    ],
  },
  {
    id: "rec-2",
    source: "corrective-action",
    priority: "high",
    facilityIds: ["bakersfield"],
    signal: "Corrective action CA-2210 (from incident INV-118) specifies refresher training for the crew involved before returning to elevated work.",
    evidence: "CA-2210 • linked to INV-118",
    courses: [
      { code: "FALL-130", name: "Fall Protection Refresher", mins: 60 },
      { code: "LAD-110", name: "Ladder Safety Essentials", mins: 30 },
    ],
    audience: { role: "Scaffolding & roofing crew", learners: 12 },
    dueInDays: 14,
    comments: [
      { author: "J. Okafor", role: "safety", text: "CA can't close until training completion is on record. This is the gating item.", when: "1d ago" },
    ],
  },
  {
    id: "rec-3",
    source: "observation",
    priority: "medium",
    facilityIds: ["tucson"],
    signal: "14 improper-lifting observations logged at Tucson Warehouse this quarter — a repeating pattern, not one-off.",
    evidence: "Observation • 14 reports",
    courses: [{ code: "ERG-105", name: "Safe Lifting & Ergonomics", mins: 25 }],
    audience: { role: "Warehouse associates", learners: 58 },
    dueInDays: 45,
    comments: [],
  },
  {
    id: "rec-4",
    source: "failed-inspection",
    priority: "high",
    facilityIds: ["bakersfield", "elpaso"],
    signal: "Failed ladder inspections at 2 sites (Bakersfield, El Paso). Equipment is being replaced; crews need refresher on inspection + safe use.",
    evidence: "Inspection • 2 sites failed",
    courses: [{ code: "LAD-110", name: "Ladder Safety Essentials", mins: 30 }],
    audience: { role: "Field crews (2 sites)", learners: 47 },
    dueInDays: 21,
    comments: [],
  },
  {
    id: "rec-5",
    source: "expiring-cert",
    priority: "medium",
    facilityIds: ["dayton", "tucson", "savannah"],
    signal: "41 forklift-operator certifications expire within 60 days across 3 facilities. Schedule renewals to avoid lapses in coverage.",
    evidence: "Certification • 41 expiring ≤ 60d",
    courses: [{ code: "FLT-100", name: "Forklift Operator Certification (Renewal)", mins: 90 }],
    audience: { role: "Certified operators (3 sites)", learners: 41 },
    dueInDays: 60,
    comments: [],
  },
  {
    id: "rec-6",
    source: "incident-trend",
    priority: "high",
    facilityIds: ["elpaso"],
    signal: "Electrical / lockout-tagout incidents at El Paso up 50% (90 days). Two near-misses involved unverified de-energization.",
    evidence: "Trend • 3 events",
    courses: [{ code: "LOTO-210", name: "Lockout / Tagout for Authorized Employees", mins: 50 }],
    audience: { role: "Maintenance technicians", learners: 22 },
    dueInDays: 30,
    comments: [],
  },
];

// ── Incident-to-training loop tracker ──
const LOOP = [
  { id: "lp-1", facilityId: "dayton",      event: { type: "Incident",   ref: "INV-118", label: "Forklift strike, Dayton dock 4" },     ca: { ref: "CA-2210", label: "Refresher training required" }, course: "FLT-201",  assignment: { status: "in-progress", id: "CV-88213" }, completion: 62 },
  { id: "lp-2", facilityId: "bakersfield", event: { type: "Inspection", ref: "INS-3391", label: "Failed ladder inspection, Bakersfield" }, ca: { ref: "CA-2247", label: "Replace equipment + retrain" },  course: "LAD-110",  assignment: { status: "assigned", id: "CV-88190" },    completion: 18 },
  { id: "lp-3", facilityId: "tucson",      event: { type: "Observation", ref: "OBS-771", label: "Improper lifting, Tucson pick line" },  ca: { ref: "CA-2201", label: "Coaching + ergonomics training" }, course: "ERG-105", assignment: { status: "in-progress", id: "CV-87940" }, completion: 74 },
  { id: "lp-4", facilityId: "reno",        event: { type: "Incident",   ref: "INV-102", label: "Chemical splash, Reno mixing area" },   ca: { ref: "CA-2165", label: "HazCom refresher" },            course: "HAZ-120",  assignment: { status: "complete", id: "CV-87720" },    completion: 100 },
  { id: "lp-5", facilityId: "elpaso",      event: { type: "Incident",   ref: "INV-090", label: "Arc-flash near-miss, El Paso" },        ca: { ref: "CA-2150", label: "LOTO retraining" },             course: "LOTO-210", assignment: { status: "complete", id: "CV-87610" },    completion: 100 },
];

// ── Derived stat helpers (recompute on filter) ──
const overdueFor = (f) => Math.round((f.workers * (100 - f.compliancePct)) / 100);
const preventedFor = (f) => Math.round(f.incidents90 * (f.compliancePct / 100) * 0.5);

/* ═══════════════════════════════════════════════════════════════════════
   Persona framing — same data, different verbs
   ═══════════════════════════════════════════════════════════════════════ */
const COPY = {
  training: {
    role: "Training admin",
    product: "Convergence",
    feedTitle: "Recommended training",
    feedSub: "Safety signals from EHS, turned into training you can assign — targeted by facility and role.",
    primary: "Assign",
    primaryIcon: GraduationCap,
    doneVerb: "Assigned",
    doneNote: (id) => `Assignment ${id} created in Convergence`,
  },
  safety: {
    role: "Safety admin",
    product: "EHS",
    feedTitle: "Insights to share with training",
    feedSub: "Safety signals worth handing to the training team — replaces the annual report email.",
    primary: "Share with training",
    primaryIcon: Send,
    doneVerb: "Shared",
    doneNote: () => "Sent to the Convergence training admin",
  },
};

const SOURCE_META = {
  "incident-trend":    { label: "Incident trend",         icon: TrendingUp },
  "corrective-action": { label: "Corrective action",      icon: ClipboardCheck },
  observation:         { label: "Observation",            icon: Eye },
  "expiring-cert":     { label: "Expiring certification", icon: BadgeCheck },
  "failed-inspection": { label: "Failed inspection",      icon: AlertTriangle },
};
const TYPE_ICON = { plant: Factory, warehouse: Warehouse, construction: HardHat, distribution: Truck };
const DUE_OPTIONS = [7, 14, 30, 45, 60, 90];
const DISMISS_REASONS = [
  "Already covered by existing training",
  "Not applicable to this facility",
  "Duplicate recommendation",
  "Deferring to next planning cycle",
];

/* ═══════════════════════════════════════════════════════════════════════
   Small presentational pieces
   ═══════════════════════════════════════════════════════════════════════ */
function RiskBadge({ level }) {
  const map = {
    high: "bg-red-50 text-red-700 ring-red-200",
    medium: "bg-amber-50 text-amber-700 ring-amber-200",
    low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  const label = { high: "High", medium: "Medium", low: "Low" }[level];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1", map[level])}>
      <CircleDot className="h-3 w-3" /> {label}
    </span>
  );
}

function TrendBadge({ pct }) {
  if (pct === 0) return <span className="text-xs font-medium text-slate-400">—</span>;
  const up = pct > 0; // up = more incidents = bad
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cx("inline-flex items-center gap-1 text-xs font-semibold tabular-nums", up ? "text-red-600" : "text-emerald-600")}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}

function PriorityDot({ priority }) {
  const c = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-400" }[priority];
  return <span className={cx("inline-block h-2 w-2 rounded-full", c)} />;
}

function SourceChip({ source }) {
  const m = SOURCE_META[source];
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {m.label}
    </span>
  );
}

function ExportButton({ onClick, label = "Export" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Download className="h-4 w-4 text-slate-500" />
      {label}
    </button>
  );
}

function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

function StatTile({ label, value, sub, tone = "slate" }) {
  const toneCls = {
    slate: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-red-600",
    blue: "text-blue-700",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={cx("mt-1 text-2xl font-semibold tabular-nums", toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Facility risk overview (sortable table, click to filter)
   ═══════════════════════════════════════════════════════════════════════ */
const COLUMNS = [
  { key: "name", label: "Facility", align: "left" },
  { key: "incidents90", label: "Incidents (90d)", align: "right" },
  { key: "trendPct", label: "Trend", align: "right" },
  { key: "topCategory", label: "Top category", align: "left", sortable: false },
  { key: "openCAs", label: "Open CAs", align: "right" },
  { key: "compliancePct", label: "Compliance", align: "right" },
  { key: "riskScore", label: "Risk", align: "right" },
];

function FacilityTable({ selected, onSelect, onExport }) {
  const [sort, setSort] = useState({ key: "riskScore", dir: "desc" });
  const rows = useMemo(() => {
    const arr = [...FACILITIES];
    arr.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [sort]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "topCategory" ? "asc" : "desc" }));

  const SortIcon = ({ col }) => {
    if (col.sortable === false) return null;
    if (sort.key !== col.key) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
    return sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-slate-500" /> : <ArrowDown className="h-3.5 w-3.5 text-slate-500" />;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        eyebrow="Summary"
        title="Facility risk overview"
        subtitle="Where safety risk is concentrated right now. Click a facility to filter the whole dashboard to it."
        right={<ExportButton onClick={() => onExport("Facility risk overview")} />}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className={cx(
                    "whitespace-nowrap py-2 pr-4 text-xs font-semibold text-slate-500",
                    col.align === "right" ? "text-right" : "text-left",
                    col.sortable !== false && "cursor-pointer select-none hover:text-slate-800"
                  )}
                >
                  <span className={cx("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const Icon = TYPE_ICON[f.type];
              const active = selected === f.id;
              return (
                <tr
                  key={f.id}
                  onClick={() => onSelect(active ? null : f.id)}
                  className={cx(
                    "cursor-pointer border-b border-slate-100 transition",
                    active ? "bg-blue-50/70" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-medium text-slate-900">{f.name}</div>
                        <div className="text-xs capitalize text-slate-400">{f.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-slate-700">{f.incidents90}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <TrendBadge pct={f.trendPct} />
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{f.topCategory}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{f.openCAs}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cx("h-full rounded-full", f.compliancePct >= 90 ? "bg-emerald-500" : f.compliancePct >= 75 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${f.compliancePct}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-medium tabular-nums text-slate-700">{f.compliancePct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <RiskBadge level={f.risk} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Cross-team comment thread (replaces the safety↔training email back-and-forth)
   ═══════════════════════════════════════════════════════════════════════ */
function CommentThread({ comments, persona, onAdd }) {
  const [open, setOpen] = useState(comments.length > 0);
  const [draft, setDraft] = useState("");
  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  };
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {comments.length > 0 ? `${comments.length} note${comments.length > 1 ? "s" : ""} between safety & training` : "Add a note for the other team"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <span
                className={cx(
                  "mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold uppercase tracking-wide",
                  c.role === "safety" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                )}
              >
                {c.role === "safety" ? "Safety" : "Training"}
              </span>
              <div className="min-w-0">
                <div className="text-sm text-slate-700">{c.text}</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {c.author} · {c.when}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={persona === "safety" ? "Add context for the training admin…" : "Ask the safety team or add context…"}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Recommendation card (the centerpiece)
   ═══════════════════════════════════════════════════════════════════════ */
function RecCard({ rec, persona, onAssign, onDismiss, onUndo, onAdjust, onTogglePlan, onAddComment }) {
  const [adjusting, setAdjusting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [role, setRole] = useState(rec.audience.role);
  const [due, setDue] = useState(rec.dueInDays);
  const [reason, setReason] = useState(DISMISS_REASONS[0]);

  const copy = COPY[persona];
  const PrimaryIcon = copy.primaryIcon;
  const facs = rec.facilityIds.map((id) => facilityById[id].name);

  // ── Dismissed state: collapsed strip with undo ──
  if (rec.status === "dismissed") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <X className="h-4 w-4" />
          <span className="line-through">{rec.courses[0].name}</span>
          <span className="text-xs text-slate-400">· dismissed — {rec.dismissReason}</span>
        </div>
        <button type="button" onClick={onUndo} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
      </div>
    );
  }

  const done = rec.status === "assigned";

  return (
    <div className={cx("rounded-xl border bg-white p-4 shadow-sm transition", done ? "border-emerald-200" : "border-slate-200")}>
      {/* header row: source + priority + facility */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SourceChip source={rec.source} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <PriorityDot priority={rec.priority} />
            {rec.priority === "high" ? "High priority" : rec.priority === "medium" ? "Medium priority" : "Low priority"}
          </span>
        </div>
        {rec.addedToPlan && (
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
            <CalendarPlus className="h-3.5 w-3.5" /> In annual plan
          </span>
        )}
      </div>

      {/* WHY — the EHS signal */}
      <p className="text-base leading-relaxed text-slate-800">{rec.signal}</p>
      <div className="mt-1 text-xs text-slate-400">{rec.evidence}</div>

      {/* WHAT + WHO */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <BookOpen className="h-3.5 w-3.5" /> Recommended course{rec.courses.length > 1 ? "s" : ""}
          </div>
          <ul className="space-y-1">
            {rec.courses.map((c) => (
              <li key={c.code} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-800">
                  <span className="font-medium">{c.name}</span> <span className="text-slate-400">· {c.code}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{c.mins}m</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Users className="h-3.5 w-3.5" /> Target audience
          </div>
          <div className="text-sm text-slate-800">
            <div className="font-medium">{rec.audience.role}</div>
            <div className="text-slate-500">{facs.join(", ")}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {num(rec.audience.learners)} learners
            </div>
          </div>
        </div>
      </div>

      {/* inline ADJUST panel */}
      {adjusting && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 sm:flex-row sm:items-end">
          <label className="text-xs font-medium text-slate-600 sm:flex-1">
            Audience
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Due
            <select
              value={due}
              onChange={(e) => setDue(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  In {d} days
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                onAdjust({ role, dueInDays: due });
                setAdjusting(false);
              }}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save
            </button>
            <button type="button" onClick={() => setAdjusting(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* inline DISMISS panel */}
      {dismissing && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-medium text-slate-600">
            Reason for dismissing
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-64 max-w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
            >
              {DISMISS_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              onDismiss(reason);
              setDismissing(false);
            }}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Confirm dismiss
          </button>
          <button type="button" onClick={() => setDismissing(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>
      )}

      {/* footer: due + actions OR done state */}
      {done ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
            {copy.doneVerb} · {rec.audience.learners} learners
          </div>
          <span className="text-xs text-emerald-700">{copy.doneNote(rec.assignmentId)}</span>
        </div>
      ) : (
        !dismissing && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Suggested due in {rec.dueInDays} days
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAdjusting((a) => !a)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" /> Adjust
              </button>
              <button
                type="button"
                onClick={onTogglePlan}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
                  rec.addedToPlan ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <CalendarPlus className="h-3.5 w-3.5" /> {rec.addedToPlan ? "In annual plan" : "Add to plan"}
              </button>
              <button
                type="button"
                onClick={() => setDismissing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
              <button
                type="button"
                onClick={onAssign}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <PrimaryIcon className="h-4 w-4" /> {copy.primary}
              </button>
            </div>
          </div>
        )
      )}

      {/* cross-team thread */}
      <CommentThread comments={rec.comments} persona={persona} onAdd={onAddComment} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Program value / correlation view (two stacked small-multiples — one x-axis,
   never a dual y-axis)
   ═══════════════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label, unit, name, color }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold text-slate-700">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-slate-500">{name}</span>
        <span className="font-semibold tabular-nums text-slate-800">
          {payload[0].value}
          {unit}
        </span>
      </div>
    </div>
  );
}

function ProgramValue({ facility, data, stats, onExport }) {
  const scope = facility ? facility.name : "all facilities";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        eyebrow="Proving value"
        title="Does the training move the numbers?"
        subtitle={`Training completion against recordable incidents over 12 months — ${scope}. When completion climbs, incidents fall.`}
        right={<ExportButton onClick={() => onExport("Program value")} />}
      />

      {/* stat row */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Incidents prevented (est.)" value={stats.prevented} sub="modeled vs. pre-training baseline" tone="good" />
        <StatTile label="Training compliance trend" value={`+${stats.complianceTrend} pts`} sub="last 12 months" tone="blue" />
        <StatTile label="Overdue training" value={num(stats.overdue)} sub="learners past due date" tone={stats.overdue > 100 ? "warn" : "slate"} />
      </div>

      {/* completion % (line) */}
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BLUE }} />
        Training completion %
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: AXIS }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={40} unit="%" />
          <Tooltip content={<ChartTooltip unit="%" name="Completion" color={BLUE} />} />
          <Line type="monotone" dataKey="completion" stroke={BLUE} strokeWidth={2} dot={{ r: 2.5, fill: BLUE }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* incident rate (bars) — shares the same month axis below */}
      <div className="mb-1 mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />
        Recordable incidents / month
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: AXIS }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<ChartTooltip unit="" name="Incidents / mo" color={ORANGE} />} />
          <Bar dataKey="incidentRate" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Incident-to-training loop tracker
   ═══════════════════════════════════════════════════════════════════════ */
function LoopCell({ label, children }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-2.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  );
}
function AssignmentPill({ status }) {
  const map = {
    complete: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "in-progress": "bg-blue-50 text-blue-700 ring-blue-200",
    assigned: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const label = { complete: "Complete", "in-progress": "In progress", assigned: "Assigned" }[status];
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1", map[status])}>{label}</span>;
}
function LoopTracker({ facility, onExport }) {
  const rows = facility ? LOOP.filter((l) => l.facilityId === facility.id) : LOOP;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        eyebrow="Closing the loop"
        title="Incident → corrective action → training → done"
        subtitle="Each safety event traced end-to-end, so nothing falls through the cracks between the two teams."
        right={<ExportButton onClick={() => onExport("Loop tracker")} />}
      />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">No tracked loops for this facility yet.</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((l) => {
            const Arrow = () => <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 md:block" />;
            return (
              <div key={l.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center">
                <LoopCell label="Safety event">
                  <span className="font-medium">{l.event.ref}</span>
                  <div className="text-xs text-slate-500">{l.event.label}</div>
                </LoopCell>
                <Arrow />
                <LoopCell label="Corrective action">
                  <span className="font-medium">{l.ca.ref}</span>
                  <div className="text-xs text-slate-500">{l.ca.label}</div>
                </LoopCell>
                <Arrow />
                <LoopCell label="Training">
                  <span className="font-medium">{l.course}</span>
                  <div className="text-xs text-slate-500">{l.assignment.id}</div>
                </LoopCell>
                <Arrow />
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    <AssignmentPill status={l.assignment.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className={cx("h-full rounded-full", l.completion === 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${l.completion}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-medium tabular-nums text-slate-500">{l.completion}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   App
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [persona, setPersona] = useState("training"); // 'training' | 'safety'
  const [selected, setSelected] = useState(null); // facility id | null
  const [toast, setToast] = useState(null);
  const [recs, setRecs] = useState(() =>
    RECOMMENDATIONS.map((r) => ({ ...r, status: "open", assignmentId: null, addedToPlan: false, dismissReason: null }))
  );

  const copy = COPY[persona];
  const facility = selected ? facilityById[selected] : null;

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  const onExport = (what) => flash(`Exporting “${what}”… (PDF + CSV)`);

  // filtered slices
  const visibleRecs = useMemo(
    () => (selected ? recs.filter((r) => r.facilityIds.includes(selected)) : recs),
    [recs, selected]
  );
  const openCount = visibleRecs.filter((r) => r.status === "open").length;
  const trendData = TREND[selected || "all"];

  const stats = useMemo(() => {
    if (facility) {
      return { prevented: preventedFor(facility), complianceTrend: facility.yoyComplianceGain, overdue: overdueFor(facility) };
    }
    return {
      prevented: FACILITIES.reduce((s, f) => s + preventedFor(f), 0),
      complianceTrend: 6,
      overdue: FACILITIES.reduce((s, f) => s + overdueFor(f), 0),
    };
  }, [facility]);

  // top KPI strip
  const kpis = useMemo(() => {
    if (facility) {
      return {
        facilities: 1,
        open: openCount,
        incidents: facility.incidents90,
        avgCompliance: facility.compliancePct,
      };
    }
    const totalWorkers = FACILITIES.reduce((s, f) => s + f.workers, 0);
    return {
      facilities: FACILITIES.length,
      open: openCount,
      incidents: FACILITIES.reduce((s, f) => s + f.incidents90, 0),
      avgCompliance: Math.round(FACILITIES.reduce((s, f) => s + f.compliancePct * f.workers, 0) / totalWorkers),
    };
  }, [facility, openCount]);

  // ── recommendation actions ──
  const assign = (id) =>
    setRecs((rs) =>
      rs.map((r, i) => (r.id === id ? { ...r, status: "assigned", assignmentId: `CV-${88231 + i * 7}` } : r))
    );
  const dismiss = (id, reason) => setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, status: "dismissed", dismissReason: reason } : r)));
  const undo = (id) => setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, status: "open", dismissReason: null } : r)));
  const adjust = (id, patch) =>
    setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, audience: { ...r.audience, role: patch.role }, dueInDays: patch.dueInDays } : r)));
  const togglePlan = (id) => setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, addedToPlan: !r.addedToPlan } : r)));
  const addComment = (id, text) =>
    setRecs((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, comments: [...r.comments, { author: persona === "safety" ? "You (safety)" : "You (training)", role: persona, text, when: "just now" }] }
          : r
      )
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              {/* Bridge mark */}
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">B</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900">Safety Training Insights</h1>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Bridge</span>
                </div>
                <div className="text-xs text-slate-500">EHS safety data → Convergence training</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw className="h-3.5 w-3.5" /> Data refreshed nightly
              </span>
              {/* persona toggle */}
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
                {[
                  { k: "training", label: "Training admin" },
                  { k: "safety", label: "Safety admin" },
                ].map((p) => (
                  <button
                    key={p.k}
                    type="button"
                    onClick={() => setPersona(p.k)}
                    className={cx(
                      "rounded-md px-3 py-1.5 font-medium transition",
                      persona === p.k ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <ExportButton onClick={() => onExport("Full dashboard")} label="Export view" />
            </div>
          </div>

          {/* persona context line */}
          <div className="mt-2 text-xs text-slate-500">
            Viewing as <span className="font-medium text-slate-700">{copy.role}</span> ({copy.product}).{" "}
            {persona === "training"
              ? "Recommendations are framed for assigning training."
              : "Recommendations are framed for sharing safety insights with the training team."}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* active-facility filter chip */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Showing:</span>
          {facility ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              {facility.name}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">All facilities</span>
          )}
          {facility && <span className="text-xs text-slate-400">— dashboard filtered to this facility</span>}
        </div>

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Facilities monitored" value={kpis.facilities} sub={facility ? facility.topCategory : "plants · warehouses · sites"} />
          <StatTile label="Open recommendations" value={kpis.open} sub="ready to act on" tone={kpis.open > 0 ? "blue" : "slate"} />
          <StatTile label="Incidents (90 days)" value={num(kpis.incidents)} sub="recordable events" tone="bad" />
          <StatTile label="Avg training compliance" value={`${kpis.avgCompliance}%`} sub="workforce weighted" tone={kpis.avgCompliance >= 85 ? "good" : "warn"} />
        </div>

        <div className="space-y-6">
          {/* 1 — Facility risk overview */}
          <FacilityTable selected={selected} onSelect={setSelected} onExport={onExport} />

          {/* 2 — Recommendations feed (centerpiece) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              eyebrow="Take action"
              title={copy.feedTitle}
              subtitle={copy.feedSub}
              right={
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{openCount} open</span>
                  <ExportButton onClick={() => onExport(copy.feedTitle)} />
                </div>
              }
            />
            {visibleRecs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No recommendations for this facility right now.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRecs.map((rec) => (
                  <RecCard
                    key={rec.id}
                    rec={rec}
                    persona={persona}
                    onAssign={() => assign(rec.id)}
                    onDismiss={(reason) => dismiss(rec.id, reason)}
                    onUndo={() => undo(rec.id)}
                    onAdjust={(patch) => adjust(rec.id, patch)}
                    onTogglePlan={() => togglePlan(rec.id)}
                    onAddComment={(text) => addComment(rec.id, text)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 3 + 4 side by side on wide screens */}
          <div className="grid gap-6 xl:grid-cols-2">
            <ProgramValue facility={facility} data={trendData} stats={stats} onExport={onExport} />
            <LoopTracker facility={facility} onExport={onExport} />
          </div>
        </div>

        {/* disclaimer footer */}
        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Concept prototype — mock data, pre-research directional ideas. Bridge (EHS × Convergence). Not a committed design.
        </footer>
      </main>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
