import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import supabase from "../services/supabaseClient";

// ─── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fl-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .fl-feat-card-row { transition: background 0.13s; }
  .fl-feat-card-row:hover { background: #F4F6F3 !important; }

  .fl-tc-row { transition: background 0.13s; }
  .fl-tc-row:hover { background: #F4F6F3 !important; }

  .fl-btn-ghost {
    background: none; border: 1px solid #DDE3D8; color: #4A5568;
    border-radius: 7px; font-size: 12px; font-weight: 500;
    cursor: pointer; padding: 6px 12px; display: inline-flex;
    align-items: center; gap: 5px; transition: all 0.13s;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .fl-btn-ghost:hover { background: #EFF3EC; border-color: #B8C9AE; color: #1D3D2F; }

  .fl-btn-primary {
    background: #15803d; border: none; color: #fff;
    border-radius: 7px; font-size: 12px; font-weight: 600;
    cursor: pointer; padding: 6px 14px; display: inline-flex;
    align-items: center; gap: 5px; transition: all 0.13s;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .fl-btn-primary:hover { background: #166534; }

  .fl-btn-danger-sm {
    background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.18);
    color: #DC2626; border-radius: 7px; font-size: 12px;
    cursor: pointer; padding: 6px 10px; display: inline-flex;
    align-items: center; gap: 4px; transition: all 0.13s;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .fl-btn-danger-sm:hover { background: rgba(220,38,38,0.14); }

  .fl-icon-btn {
    background: none; border: none; cursor: pointer;
    width: 28px; height: 28px; border-radius: 6px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; transition: all 0.13s; color: #6B7280;
  }
  .fl-icon-btn.edit:hover { background: rgba(59,130,246,0.10); color: #3B82F6; }
  .fl-icon-btn.delete:hover { background: rgba(220,38,38,0.10); color: #DC2626; }

  .fl-input {
    width: 100%; padding: 9px 13px;
    background: #FAFBF9; border: 1px solid #DDE3D8;
    border-radius: 8px; font-size: 13px; color: #111827;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none; transition: border 0.15s, box-shadow 0.15s;
    line-height: 1.5;
  }
  .fl-input:focus { border-color: #1D3D2F; box-shadow: 0 0 0 3px rgba(29,61,47,0.08); background: #fff; }

  .fl-label {
    display: block; font-size: 12px; font-weight: 600;
    color: #374151; margin-bottom: 5px; letter-spacing: 0.02em;
    text-transform: uppercase;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .fl-tag {
    display: inline-flex; align-items: center;
    padding: 2px 9px; border-radius: 5px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
    font-family: 'DM Mono', monospace;
  }

  .fl-chevron { transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .fl-chevron.open { transform: rotate(90deg); }

  @keyframes ddIn {
    from { opacity:0; transform:translateY(-4px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .fl-modal-enter { animation: fadeUp 0.2s cubic-bezier(.4,0,.2,1); }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type="number"] { -moz-appearance: textfield; }
`;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bg: "#F7F9F6",
    surface: "#FFFFFF",
    surfaceAlt: "#F4F6F3",
    border: "#DDE3D8",
    borderLight: "#EBF0E7",
    green: "#1D3D2F",
    greenMid: "#2A5240",
    greenLight: "#EFF3EC",
    greenTint: "#D4E8D0",
    text: "#111827",
    textMid: "#374151",
    textMuted: "#6B7280",
    textFaint: "#9CA3AF",
    mono: "'DM Mono', monospace",
    sans: "'DM Sans', system-ui, sans-serif",
    red: "#DC2626",
    redTint: "rgba(220,38,38,0.08)",
    amber: "#D97706",
    amberTint: "rgba(217,119,6,0.08)",
    blue: "#2563EB",
    blueTint: "rgba(37,99,235,0.08)",
    purple: "#7C3AED",
    purpleTint: "rgba(124,58,237,0.08)",
};

// ─── Badges ────────────────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
    High: { background: "rgba(220,38,38,0.09)", color: "#B91C1C" },
    Medium: { background: "rgba(217,119,6,0.09)", color: "#B45309" },
    Low: { background: "rgba(34,197,94,0.09)", color: "#15803D" },
};

const STATUS_STYLE = {
    Active: { background: "rgba(34,197,94,0.09)", color: "#15803D" },
    Draft: { background: "rgba(107,114,128,0.09)", color: "#4B5563" },
    Archived: { background: "rgba(107,114,128,0.09)", color: "#4B5563" },
    active: { background: "rgba(34,197,94,0.09)", color: "#15803D" },
    draft: { background: "rgba(107,114,128,0.09)", color: "#4B5563" },
    archived: { background: "rgba(107,114,128,0.09)", color: "#4B5563" },
};

const Chip = ({ label, style: s, mono }) => (
    <span className="fl-tag" style={{ fontFamily: mono ? T.mono : T.sans, ...s }}>
        {label}
    </span>
);

// ─── Dropdown ──────────────────────────────────────────────────────────────────
const Dropdown = memo(({ options, selected, onChange, placeholder = "Select..." }) => {
    const [open, setOpen] = useState(false);
    const [hov, setHov] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const label = useMemo(() => options.find(o => o.id === selected)?.name || null, [options, selected]);

    return (
        <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "9px 13px",
                    background: open ? T.surface : "#FAFBF9",
                    border: `1px solid ${open ? T.green : T.border}`,
                    borderRadius: 8, fontSize: 13, color: selected ? T.text : T.textFaint,
                    fontWeight: selected ? 500 : 400, cursor: "pointer",
                    boxShadow: open ? `0 0 0 3px rgba(29,61,47,0.08)` : "none",
                    outline: "none", transition: "all 0.15s",
                    fontFamily: T.sans,
                }}
            >
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label || placeholder}
                </span>
                <span style={{ marginLeft: 8, display: "flex", alignItems: "center", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: open ? T.green : T.textFaint, flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0,
                    zIndex: 9999, background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    animation: "ddIn 0.16s cubic-bezier(.4,0,.2,1)", overflow: "hidden",
                }}>
                    <div style={{ padding: 4, maxHeight: 240, overflowY: "auto" }}>
                        {options.map((opt, i) => {
                            const sel = opt.id === selected;
                            return (
                                <div
                                    key={opt.id}
                                    onMouseEnter={() => setHov(i)}
                                    onMouseLeave={() => setHov(null)}
                                    onClick={() => { onChange(opt.id); setOpen(false); }}
                                    style={{
                                        padding: "8px 11px", borderRadius: 7, cursor: "pointer",
                                        fontSize: 13, fontWeight: sel ? 600 : 400,
                                        color: sel ? T.green : hov === i ? T.text : T.textMid,
                                        background: sel ? T.greenLight : hov === i ? T.surfaceAlt : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        transition: "all 0.1s", fontFamily: T.sans,
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {sel && (
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Constants ─────────────────────────────────────────────────────────────────
const TEST_TYPE_OPTIONS = [
    { id: "Functional", name: "Functional" }, { id: "Regression", name: "Regression" },
    { id: "Smoke", name: "Smoke" }, { id: "Sanity", name: "Sanity" },
    { id: "Integration", name: "Integration" }, { id: "UAT", name: "UAT" },
    { id: "Performance", name: "Performance" }, { id: "Security", name: "Security" },
];
const TEST_TYPE_WITH_PH = [{ id: "", name: "Select Test Type" }, ...TEST_TYPE_OPTIONS];
const PRIORITY_OPTIONS = [{ id: "High", name: "High" }, { id: "Medium", name: "Medium" }, { id: "Low", name: "Low" }];
const STATUS_OPTIONS = [{ id: "Active", name: "Active" }, { id: "Draft", name: "Draft" }, { id: "Archived", name: "Archived" }];
const FILTER_STATUS_OPT = [{ id: "", name: "All Status" }, { id: "Active", name: "Active" }, { id: "Draft", name: "Draft" }, { id: "Archived", name: "Archived" }];
const PRIORITY_WITH_PH = [{ id: "", name: "Select Priority" }, ...PRIORITY_OPTIONS];

const emptyForm = { id: "", name: "", description: "", testScenario: "", preconditions: "", steps: "", expected: "", assignee: "", status: "Active", priority: "", testType: "", tags: "", userStoryIds: [] };
const emptyFeatureForm = { moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };
const emptyEditFeatureForm = { id: "", moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

// Derives the next TC-NNN id from an existing flat list of test cases
const generateNextTcId = (allTestCases) => {
    let max = 0;
    for (const tc of allTestCases) {
        const m = (tc.tcId || tc.id || "").match(/^TC-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `TC-${String(max + 1).padStart(3, "0")}`;
};

// Derives the next FEAT-NNN code from an existing flat list of features
const generateNextFeatCode = (allFeatures) => {
    let max = 0;
    for (const f of allFeatures) {
        const code = f.feature_code || f.code || "";
        const m = code.match(/^FEAT-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `FEAT-${String(max + 1).padStart(3, "0")}`;
};

// ─── CSV helpers ───────────────────────────────────────────────────────────────
const splitCSVLine = (line) => {
    const cells = []; let inQ = false, cur = "";
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
        else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ""; }
        else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
};
const normaliseHeader = (h) => h.replace(/^\uFEFF/, "").replace(/^["'\s]+|["'\s]+$/g, "").toLowerCase().trim();

// ─── Column definitions ────────────────────────────────────────────────────────
const FEATURE_COLUMNS = [
    { label: "Module Name", required: true, hint: "Any text. Must match an existing module name." },
    { label: "Feature Name", required: true, hint: "Name of the feature." },
    { label: "Feature Code", required: true, hint: "e.g. FEAT-001 — must be unique." },
    { label: "User Story", required: true, hint: "e.g. US-015." },
    { label: "Description", required: true, hint: "Brief description of the feature." },
    { label: "Assign To", required: true, hint: "Full name — must match an existing user." },
];
const TC_COLUMNS = [
    { label: "Feature Code", required: true, hint: "Must match an existing feature code e.g. FEAT-001" },
    { label: "Test Case Name", required: true, hint: "Descriptive name for the test case." },
    { label: "Description", required: true, hint: "Brief description of what is being tested." },
    { label: "Priority", required: true, hint: "High | Medium | Low" },
    { label: "Status", required: true, hint: "Active | Draft | Archived" },
    { label: "Test Type", required: true, hint: "Functional | Regression | Smoke | Sanity | Integration | UAT | Performance | Security" },
    { label: "Test Scenario", required: true, hint: "High-level scenario being tested." },
    { label: "Pre Requisites", required: true, hint: "Conditions that must be met before running the test." },
    { label: "Test Steps", required: true, hint: "Step-by-step instructions, use | to separate steps." },
    { label: "Expected Result", required: true, hint: "What the expected outcome should be." },
    { label: "Assigned To", required: true, hint: "Full name — must match an existing user." },
    { label: "User Story Codes", required: true, hint: "Semicolon-separated story codes e.g. US-001;US-002." },
];
const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_STATUSES = ["Active", "Draft", "Archived"];
const VALID_TEST_TYPES = TEST_TYPE_OPTIONS.map(o => o.id);

// ─── Shared Import UI ──────────────────────────────────────────────────────────
function ColumnReference({ columns }) {
    return (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.borderLight}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.sans }}>Column Reference</span>
            </div>
            {columns.map((col, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < columns.length - 1 ? `1px solid ${T.borderLight}` : "none", background: T.surface }}>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.textMid, background: T.surfaceAlt, padding: "3px 10px", borderRadius: 5, flexShrink: 0, minWidth: 140, whiteSpace: "nowrap" }}>{col.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col.required ? T.red : T.textFaint, flexShrink: 0, minWidth: 60, fontFamily: T.sans }}>
                        {col.required ? "Required" : <span style={{ color: T.textFaint, fontWeight: 500 }}>Optional</span>}
                    </span>
                    <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.sans, lineHeight: 1.5 }}>{col.hint}</span>
                </div>
            ))}
        </div>
    );
}

function DropZone({ file, onFile }) {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const handleFile = (f) => {
        if (!f?.name.toLowerCase().endsWith(".csv")) { alert("Only .csv files are supported."); return; }
        onFile(f);
    };
    return (
        <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, border: `2px dashed ${dragOver ? T.green : file ? "#16a34a" : "#D1D5DB"}`, padding: "40px 20px", cursor: "pointer", transition: "all 0.15s", background: dragOver ? T.greenLight : file ? "rgba(22,163,74,0.04)" : "#FAFAFA" }}
        >
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: file ? "rgba(22,163,74,0.12)" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${file ? "rgba(22,163,74,0.25)" : "#E5E7EB"}` }}>
                <i className={`fa-solid ${file ? "fa-file-csv" : "fa-cloud-arrow-up"}`} style={{ fontSize: 22, color: file ? "#16a34a" : "#9CA3AF" }}></i>
            </div>
            {file ? (
                <><p style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", margin: 0, fontFamily: T.sans }}>{file.name}</p><p style={{ fontSize: 12, color: T.textMuted, margin: 0, fontFamily: T.sans }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p></>
            ) : (
                <><p style={{ fontSize: 14, fontWeight: 600, color: T.textMid, margin: 0, fontFamily: T.sans }}>Click to upload CSV</p><p style={{ fontSize: 12, color: T.textFaint, margin: 0, fontFamily: T.sans }}>Drag & drop or click to browse — .csv only</p></>
            )}
        </div>
    );
}

function ImportResultScreen({ result }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 20, background: "rgba(22,163,74,0.07)", border: `1px solid rgba(22,163,74,0.2)`, borderRadius: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "#15803D", margin: "0 0 4px", fontFamily: T.sans }}>{result.success.length}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, fontFamily: T.sans }}>Imported Successfully</p>
                </div>
                <div style={{ padding: 20, background: result.failed.length ? "rgba(220,38,38,0.07)" : T.surfaceAlt, border: `1px solid ${result.failed.length ? "rgba(220,38,38,0.2)" : T.border}`, borderRadius: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 32, fontWeight: 700, color: result.failed.length ? T.red : T.textFaint, margin: "0 0 4px", fontFamily: T.sans }}>{result.failed.length}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: result.failed.length ? T.red : T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, fontFamily: T.sans }}>Failed / Skipped</p>
                </div>
            </div>
            {result.success.length > 0 && (
                <div style={{ border: `1px solid rgba(22,163,74,0.2)`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "rgba(22,163,74,0.06)", borderBottom: `1px solid rgba(22,163,74,0.12)`, display: "flex", alignItems: "center", gap: 7 }}>
                        <i className="fa-solid fa-circle-check" style={{ color: "#15803D", fontSize: 11 }}></i>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>Imported</span>
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {result.success.map((name, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: i < result.success.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                                <i className="fa-solid fa-check" style={{ color: "#22C55E", fontSize: 10, flexShrink: 0 }}></i>
                                <span style={{ fontSize: 13, color: T.text, fontWeight: 500, fontFamily: T.sans }}>{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {result.failed.length > 0 && (
                <div style={{ border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: "rgba(220,38,38,0.06)", borderBottom: `1px solid rgba(220,38,38,0.12)`, display: "flex", alignItems: "center", gap: 7 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: T.red, fontSize: 11 }}></i>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>Failed / Skipped</span>
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {result.failed.map((f, i) => (
                            <div key={i} style={{ padding: "9px 14px", borderBottom: i < result.failed.length - 1 ? `1px solid rgba(220,38,38,0.06)` : "none" }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: "0 0 2px", fontFamily: T.sans }}>{f.name}</p>
                                <p style={{ fontSize: 11, color: T.red, margin: 0, fontFamily: T.sans }}>{f.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const downloadCSV = (columns, filename, exampleRow) => {
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const header = columns.map(c => c.label).join(",");
    const content = exampleRow ? [header, exampleRow.map(escape).join(",")].join("\n") : header;
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

function ParseFeedback({ parsed }) {
    if (!parsed) return null;
    const { rows = [], rowErrors = [], fatalError } = parsed;
    const validCount = rows.length;
    const errorCount = rowErrors.length;
    if (fatalError) {
        return (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "rgba(220,38,38,0.06)", border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 9 }}>
                <i className="fa-solid fa-circle-xmark" style={{ color: T.red, fontSize: 13, flexShrink: 0, marginTop: 1 }}></i>
                <span style={{ fontSize: 13, color: T.red, fontFamily: T.sans }}>{fatalError}</span>
            </div>
        );
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: validCount > 0 ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.06)", border: `1px solid ${validCount > 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 9 }}>
                <i className={`fa-solid ${validCount > 0 ? "fa-circle-check" : "fa-circle-xmark"}`} style={{ color: validCount > 0 ? "#15803D" : T.red, fontSize: 13, flexShrink: 0 }}></i>
                <span style={{ fontSize: 13, color: validCount > 0 ? "#15803D" : T.red, fontFamily: T.sans }}>
                    {validCount > 0 && <><strong>{validCount}</strong>{` valid row${validCount > 1 ? "s" : ""} ready to import.`}</>}
                    {errorCount > 0 && <> <strong style={{ color: T.red }}>{errorCount}</strong><span style={{ color: T.red }}>{` row${errorCount > 1 ? "s" : ""} have errors and will be skipped.`}</span></>}
                    {validCount === 0 && errorCount === 0 && " No data rows found."}
                </span>
            </div>
            {errorCount > 0 && (
                <div style={{ border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 9, overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", background: "rgba(220,38,38,0.05)", borderBottom: `1px solid rgba(220,38,38,0.1)` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>Row Errors — fix in your CSV and re-upload</span>
                    </div>
                    <div style={{ maxHeight: 150, overflowY: "auto" }}>
                        {rowErrors.map((err, i) => (
                            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 14px", borderBottom: i < rowErrors.length - 1 ? `1px solid rgba(220,38,38,0.06)` : "none" }}>
                                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.red, flexShrink: 0, whiteSpace: "nowrap" }}>Row {err.row}</span>
                                {err.name && <span style={{ fontSize: 11, fontWeight: 600, color: T.textMid, flexShrink: 0, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{err.name}</span>}
                                <span style={{ fontSize: 12, color: "#B91C1C", fontFamily: T.sans }}>{Array.isArray(err.messages) ? err.messages.join(" · ") : err.messages}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {validCount > 0 && rows.length > 0 && (
                <div style={{ border: `1px solid rgba(22,163,74,0.2)`, borderRadius: 9, overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", background: "rgba(22,163,74,0.05)", borderBottom: `1px solid rgba(22,163,74,0.1)` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>Preview — {validCount} valid row{validCount > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ overflowX: "auto", maxHeight: 200 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: T.sans }}>
                            <thead><tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>{Object.keys(rows[0]).map(k => (<th key={k} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{k.replace(/_/g, " ")}</th>))}</tr></thead>
                            <tbody>{rows.map((row, i) => (<tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.borderLight}` : "none", background: i % 2 === 0 ? T.surface : T.surfaceAlt }}>{Object.values(row).map((v, j) => (<td key={j} style={{ padding: "7px 12px", color: T.text, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v || "—")}</td>))}</tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Import Features Modal ─────────────────────────────────────────────────────
function ImportFeaturesModal({ onClose, onSuccess, modules, users }) {
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const handleClose = () => { setFile(null); setParsed(null); setImporting(false); setResult(null); onClose(); };
    const parseCSV = (text) => {
        const allLines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
        if (allLines.length < 2) return { rows: [], rowErrors: [], fatalError: "CSV must have a header row and at least one data row." };
        const rawHeaders = splitCSVLine(allLines[0]).map(normaliseHeader);
        const keyMap = { "module name": "module_name", "feature name": "feature_name", "feature code": "feature_code", "user story": "user_story", "description": "description", "assign to": "assign_to" };
        const idxMap = {};
        rawHeaders.forEach((h, i) => { const k = keyMap[h]; if (k) idxMap[k] = i; });
        const required = ["module_name", "feature_name", "feature_code", "user_story", "description", "assign_to"];
        const missing = required.filter(k => idxMap[k] === undefined).map(k => FEATURE_COLUMNS.find(c => keyMap[normaliseHeader(c.label)] === k)?.label || k);
        if (missing.length) return { rows: [], rowErrors: [], fatalError: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Please use the provided template.` };
        const rows = [], rowErrors = [];
        allLines.slice(1).forEach((line, i) => {
            const cells = splitCSVLine(line);
            const get = (k) => idxMap[k] !== undefined ? (cells[idxMap[k]] || "").replace(/^"|"$/g, "").trim() : "";
            const rowNum = i + 2;
            const module_name = get("module_name"), feature_name = get("feature_name"), feature_code = get("feature_code"), user_story = get("user_story"), description = get("description"), assign_to = get("assign_to");
            const errs = [];
            if (!module_name) errs.push("Module Name is required");
            if (!feature_name) errs.push("Feature Name is required");
            if (!feature_code) errs.push("Feature Code is required");
            if (!user_story) errs.push("User Story is required");
            if (!description) errs.push("Description is required");
            if (!assign_to) errs.push("Assign To is required");
            if (errs.length) rowErrors.push({ row: rowNum, name: feature_name || `Row ${rowNum}`, messages: errs });
            else rows.push({ module_name, feature_name, feature_code, user_story, description, assign_to });
        });
        return { rows, rowErrors, fatalError: null };
    };
    const handleFile = (f) => { setFile(f); setResult(null); setParsed(null); const reader = new FileReader(); reader.onload = (e) => setParsed(parseCSV(e.target.result)); reader.readAsText(f); };
    const handleImport = async () => {
        if (!parsed?.rows?.length) return;
        setImporting(true);
        const success = [], failed = [];
        const moduleMap = {};
        for (const m of modules) { const key = (m.module_name || m.name || "").toLowerCase().trim(); if (key) moduleMap[key] = m.id; }
        const userMap = {};
        for (const u of users) { if (u.name) userMap[u.name.toLowerCase().trim()] = u.id; }
        for (const row of parsed.rows) {
            const moduleId = moduleMap[row.module_name.toLowerCase().trim()];
            if (!moduleId) { failed.push({ name: row.feature_name, reason: `Module "${row.module_name}" not found.` }); continue; }
            const assignId = row.assign_to ? (userMap[row.assign_to.toLowerCase().trim()] || null) : null;
            const { error } = await supabase.from("features").insert([{ module_id: moduleId, feature_name: row.feature_name, feature_code: row.feature_code, user_story: row.user_story || null, description: row.description, assign_to: assignId, created_at: new Date().toISOString() }]);
            if (error) failed.push({ name: row.feature_name, reason: error.message });
            else success.push(row.feature_name);
        }
        const skipped = (parsed.rowErrors || []).map(e => ({ name: e.name || `Row ${e.row}`, reason: Array.isArray(e.messages) ? e.messages.join(" · ") : e.messages }));
        setResult({ success, failed: [...skipped, ...failed] });
        setImporting(false);
        if (success.length) onSuccess();
    };
    const validRows = parsed?.rows?.length || 0;
    const canImport = !importing && !!file && !parsed?.fatalError && validRows > 0;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={handleClose}>
            <div className="fl-modal-enter" style={{ background: T.surface, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", fontFamily: T.sans }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "sticky", top: 0, background: T.surface, zIndex: 10 }}>
                    <div><h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>Import Features</h3><p style={{ fontSize: 13, color: T.textMuted, margin: "3px 0 0" }}>Upload a CSV file to bulk import features</p></div>
                    <button onClick={handleClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 4px", lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                    {!result ? (<>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 18px", background: T.blueTint, border: `1px solid rgba(37,99,235,0.18)`, borderRadius: 10 }}>
                            <div><p style={{ fontSize: 13, fontWeight: 700, color: T.blue, margin: "0 0 2px" }}>Download Import Template</p><p style={{ fontSize: 12, color: "#3B82F6", margin: 0 }}>Get the CSV template with all required columns.</p></div>
                            <button onClick={() => downloadCSV(FEATURE_COLUMNS, "features_import_template.csv", ["Login Module", "Two-Factor Auth", "FEAT-001", "US-015", "Adds 2FA via TOTP", "Jane Smith"])} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.surface, border: `1px solid rgba(37,99,235,0.3)`, color: T.blue, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: T.sans }}><i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Template</button>
                        </div>
                        {modules.length > 0 && (<div style={{ padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.borderLight}`, borderRadius: 9 }}><p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Module Names</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{modules.map(m => (<span key={m.id} style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, border: `1px solid ${T.border}`, color: T.textMid, padding: "2px 8px", borderRadius: 5 }}>{m.module_name || m.name}</span>))}</div></div>)}
                        <ColumnReference columns={FEATURE_COLUMNS} />
                        <DropZone file={file} onFile={handleFile} />
                        <ParseFeedback parsed={parsed} />
                    </>) : (<ImportResultScreen result={result} />)}
                </div>
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.borderLight}`, position: "sticky", bottom: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={handleClose} disabled={importing} style={{ padding: "9px 22px", background: T.surface, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: T.sans }}>Cancel</button>
                    {!result ? (
                        <button onClick={handleImport} disabled={!canImport} style={{ padding: "9px 22px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: canImport ? "pointer" : "not-allowed", fontFamily: T.sans, opacity: canImport ? 1 : 0.45, display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {importing ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i> Importing…</> : <><i className="fa-solid fa-file-import" style={{ fontSize: 11 }}></i> Import {validRows > 0 ? `${validRows} Feature${validRows !== 1 ? "s" : ""}` : "Features"}</>}
                        </button>
                    ) : (
                        <button onClick={handleClose} style={{ padding: "9px 22px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: T.sans }}>Done</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Import Test Cases Modal ───────────────────────────────────────────────────
function ImportTestCasesModal({ onClose, onSuccess, flatFeatures, users, userStories }) {
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const handleClose = () => { setFile(null); setParsed(null); setImporting(false); setResult(null); onClose(); };
    const parseCSV = (text) => {
        const allLines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
        if (allLines.length < 2) return { rows: [], rowErrors: [], fatalError: "CSV must have a header row and at least one data row." };
        const rawHeaders = splitCSVLine(allLines[0]).map(normaliseHeader);
        const keyMap = { "feature code": "feature_code", "test case name": "name", "description": "description", "priority": "priority", "status": "status", "test type": "test_type", "test scenario": "test_scenario", "pre requisites": "pre_requisites", "test steps": "test_steps", "expected result": "expected_result", "assigned to": "assigned_to", "user story codes": "user_story_codes" };
        const idxMap = {};
        rawHeaders.forEach((h, i) => { const k = keyMap[h]; if (k) idxMap[k] = i; });
        const required = ["feature_code", "name", "description", "priority", "status", "test_type", "test_scenario", "pre_requisites", "test_steps", "expected_result", "assigned_to", "user_story_codes"];
        const missing = required.filter(k => idxMap[k] === undefined).map(k => TC_COLUMNS.find(c => keyMap[normaliseHeader(c.label)] === k)?.label || k);
        if (missing.length) return { rows: [], rowErrors: [], fatalError: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Please use the provided template.` };
        const rows = [], rowErrors = [];
        allLines.slice(1).forEach((line, i) => {
            const cells = splitCSVLine(line);
            const get = (k) => idxMap[k] !== undefined ? (cells[idxMap[k]] || "").replace(/^"|"$/g, "").trim() : "";
            const rowNum = i + 2;
            const feature_code = get("feature_code"), name = get("name"), description = get("description"), priority = get("priority"), status = get("status"), test_type = get("test_type"), assigned_to = get("assigned_to"), user_story_codes = get("user_story_codes");
            const errs = [];
            if (!feature_code) errs.push("Feature Code is required");
            if (!name) errs.push("Test Case Name is required");
            if (!description) errs.push("Description is required");
            if (!priority) errs.push("Priority is required"); else if (!VALID_PRIORITIES.includes(priority)) errs.push(`Invalid Priority "${priority}"`);
            if (!status) errs.push("Status is required"); else if (!VALID_STATUSES.includes(status)) errs.push(`Invalid Status "${status}"`);
            if (!test_type) errs.push("Test Type is required"); else if (!VALID_TEST_TYPES.includes(test_type)) errs.push(`Invalid Test Type "${test_type}"`);
            if (!get("test_scenario")) errs.push("Test Scenario is required");
            if (!get("pre_requisites")) errs.push("Pre Requisites is required");
            if (!get("test_steps")) errs.push("Test Steps is required");
            if (!get("expected_result")) errs.push("Expected Result is required");
            if (!assigned_to) errs.push("Assigned To is required");
            if (!user_story_codes) errs.push("User Story Codes is required");
            if (errs.length) rowErrors.push({ row: rowNum, name: name || `Row ${rowNum}`, messages: errs });
            else rows.push({ feature_code, name, description, priority, status, test_type, test_scenario: get("test_scenario"), pre_requisites: get("pre_requisites"), test_steps: get("test_steps"), expected_result: get("expected_result"), assigned_to, user_story_codes });
        });
        return { rows, rowErrors, fatalError: null };
    };
    const handleFile = (f) => { setFile(f); setResult(null); setParsed(null); const reader = new FileReader(); reader.onload = (e) => setParsed(parseCSV(e.target.result)); reader.readAsText(f); };
    const handleImport = async () => {
        if (!parsed?.rows?.length) return;
        setImporting(true);
        const success = [], failed = [];
        const featureMap = {};
        for (const f of flatFeatures) { const key = (f.feature_code || f.code || "").toLowerCase().trim(); if (key) featureMap[key] = { id: f.id, moduleId: f.moduleId }; }
        const userMap = {};
        for (const u of users) { if (u.name) userMap[u.name.toLowerCase().trim()] = u.id; }
        const storyMap = {};
        for (const s of userStories) { if (s.code) storyMap[s.code.toLowerCase().trim()] = s.id; }
        const { data: existingTCs } = await supabase.from("test_cases").select("test_case_id");
        let allTCIds = (existingTCs || []).map(t => ({ tcId: t.test_case_id }));
        const { data: { user: authUser } } = await supabase.auth.getUser();
        for (const row of parsed.rows) {
            const feat = featureMap[row.feature_code.toLowerCase().trim()];
            if (!feat) { failed.push({ name: row.name, reason: `Feature code "${row.feature_code}" not found.` }); continue; }
            const assignId = row.assigned_to ? (userMap[row.assigned_to.toLowerCase().trim()] || null) : null;
            let storyIds = [];
            if (row.user_story_codes) {
                const storyCodes = row.user_story_codes.split(";").map(s => s.trim()).filter(Boolean);
                const notFound = storyCodes.filter(code => !storyMap[code.toLowerCase().trim()]);
                if (notFound.length) { failed.push({ name: row.name, reason: `User story code(s) not found: ${notFound.join(", ")}` }); continue; }
                storyIds = storyCodes.map(code => storyMap[code.toLowerCase().trim()]);
            }
            const nextTcId = generateNextTcId(allTCIds);
            allTCIds.push({ tcId: nextTcId });
            const { error } = await supabase.from("test_cases").insert([{ id: generateUUID(), test_case_id: nextTcId, name: row.name, description: row.description, test_scenario: row.test_scenario || null, preconditions: row.pre_requisites || null, test_steps: row.test_steps ? row.test_steps.split("|").map(s => s.trim()).filter(Boolean) : null, expected_result: row.expected_result || null, feature_id: feat.id, module_id: feat.moduleId, priority: row.priority, status: row.status, test_type: row.test_type, assigned_to: assignId, user_story_ids: storyIds.length > 0 ? storyIds : null, created_by: authUser?.id || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
            if (error) failed.push({ name: row.name, reason: error.message });
            else success.push(row.name);
        }
        const skipped = (parsed.rowErrors || []).map(e => ({ name: e.name || `Row ${e.row}`, reason: Array.isArray(e.messages) ? e.messages.join(" · ") : e.messages }));
        setResult({ success, failed: [...skipped, ...failed] });
        setImporting(false);
        if (success.length) onSuccess();
    };
    const validRows = parsed?.rows?.length || 0;
    const canImport = !importing && !!file && !parsed?.fatalError && validRows > 0;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={handleClose}>
            <div className="fl-modal-enter" style={{ background: T.surface, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", fontFamily: T.sans }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "sticky", top: 0, background: T.surface, zIndex: 10 }}>
                    <div><h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>Import Test Cases</h3><p style={{ fontSize: 13, color: T.textMuted, margin: "3px 0 0" }}>Upload a CSV file to bulk import test cases</p></div>
                    <button onClick={handleClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 4px", lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                    {!result ? (<>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 18px", background: T.blueTint, border: `1px solid rgba(37,99,235,0.18)`, borderRadius: 10 }}>
                            <div><p style={{ fontSize: 13, fontWeight: 700, color: T.blue, margin: "0 0 2px" }}>Download Import Template</p><p style={{ fontSize: 12, color: "#3B82F6", margin: 0 }}>Get the CSV template with all required columns.</p></div>
                            <button onClick={() => downloadCSV(TC_COLUMNS, "test_cases_import_template.csv", null)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.surface, border: `1px solid rgba(37,99,235,0.3)`, color: T.blue, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: T.sans }}><i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Template</button>
                        </div>
                        {flatFeatures.length > 0 && (<div style={{ padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.borderLight}`, borderRadius: 9 }}><p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Feature Codes</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{flatFeatures.map(f => (<span key={f.id} style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, border: `1px solid ${T.border}`, color: T.purple, padding: "2px 8px", borderRadius: 5 }}>{f.feature_code || f.code}</span>))}</div></div>)}
                        <ColumnReference columns={TC_COLUMNS} />
                        <DropZone file={file} onFile={handleFile} />
                        <ParseFeedback parsed={parsed} />
                    </>) : (<ImportResultScreen result={result} />)}
                </div>
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.borderLight}`, position: "sticky", bottom: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={handleClose} disabled={importing} style={{ padding: "9px 22px", background: T.surface, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: T.sans }}>Cancel</button>
                    {!result ? (
                        <button onClick={handleImport} disabled={!canImport} style={{ padding: "9px 22px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: canImport ? "pointer" : "not-allowed", fontFamily: T.sans, opacity: canImport ? 1 : 0.45, display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {importing ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i> Importing…</> : <><i className="fa-solid fa-file-import" style={{ fontSize: 11 }}></i> Import {validRows > 0 ? `${validRows} Test Case${validRows !== 1 ? "s" : ""}` : "Test Cases"}</>}
                        </button>
                    ) : (
                        <button onClick={handleClose} style={{ padding: "9px 22px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: T.sans }}>Done</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const STAT_COLORS = {
    blue: { bg: T.blueTint, fg: T.blue },
    green: { bg: T.greenLight, fg: T.green },
    purple: { bg: T.purpleTint, fg: T.purple },
    amber: { bg: T.amberTint, fg: T.amber },
    red: { bg: T.redTint, fg: T.red },
};

const StatCard = ({ stat }) => {
    const c = STAT_COLORS[stat.color] || STAT_COLORS.blue;
    return (
        <div style={{
            background: T.surface, border: `1px solid ${T.borderLight}`,
            borderRadius: 10, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 10,
            fontFamily: T.sans,
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <p style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, margin: 0, lineHeight: 1.4, letterSpacing: "0.01em" }}>{stat.label}</p>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                    <i className={`fa-solid ${stat.icon}`} style={{ color: c.fg, fontSize: 13 }}></i>
                </div>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{stat.value}</h3>
        </div>
    );
};

// ─── Test Case Row ──────────────────────────────────────────────────────────────
const TestCaseRow = memo(({ tc, onEdit, onDelete }) => (
    <tr className="fl-tc-row" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "2px 8px", borderRadius: 5 }}>{tc.tcId}</span>
        </td>
        <td style={{ padding: "10px 16px" }}>
            <p style={{ fontSize: 12, color: T.text, fontWeight: 500, margin: 0, fontFamily: T.sans }}>{tc.name}</p>
            {tc.description && <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1, fontFamily: T.sans, lineHeight: 1.4 }}>{tc.description}</p>}
        </td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            <Chip label={tc.priority} style={PRIORITY_STYLE[tc.priority] || {}} mono />
        </td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            <Chip label={tc.status} style={STATUS_STYLE[tc.status] || STATUS_STYLE["Active"]} />
        </td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            {tc.assignee
                ? <span style={{ fontSize: 11, color: T.textMid, fontFamily: T.sans, display: "flex", alignItems: "center", gap: 5 }}>
                    <i className="fa-solid fa-user" style={{ fontSize: 9, color: T.textFaint }}></i>{tc.assignee}
                </span>
                : <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>—</span>
            }
        </td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", fontSize: 11, color: T.textMuted, fontFamily: T.mono }}>{tc.updated}</td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button className="fl-icon-btn edit" onClick={onEdit} title="Edit"><i className="fa-solid fa-pen-to-square"></i></button>
                <button className="fl-icon-btn delete" onClick={onDelete} title="Delete"><i className="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>
));

// ─── Feature Card (PRIMARY level) ─────────────────────────────────────────────
const FeatureCard = memo(({ feat, isOpen, onToggle, onAddTC, onEdit, onDelete }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>

        {/* ── Feature header row ── */}
        <div
            className="fl-feat-card-row"
            style={{ padding: "14px 20px", cursor: "pointer", background: T.surface }}
            onClick={onToggle}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {/* Left: icon + meta */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <i className="fa-solid fa-list-check" style={{ color: T.green, fontSize: 14 }}></i>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.sans, letterSpacing: "-0.01em" }}>{feat.name}</span>
                            <Chip label={feat.code} style={{ background: T.purpleTint, color: T.purple }} mono />
                            {feat.user_story && <Chip label={feat.user_story} style={{ background: T.redTint, color: T.red }} mono />}
                            <Chip label={feat.status || "Active"} style={STATUS_STYLE[feat.status] || STATUS_STYLE["Active"]} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            {feat.description && (
                                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>{feat.description}</span>
                            )}
                            <span style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                <i className="fa-solid fa-vial" style={{ fontSize: 9 }}></i>
                                {feat.testCasesCount} test{feat.testCasesCount !== 1 ? "s" : ""}
                            </span>
                            {feat.assign_to && (
                                <span style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                    <i className="fa-solid fa-user" style={{ fontSize: 9 }}></i> {feat.assign_to_name || feat.assign_to}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="fl-btn-primary" onClick={(e) => { e.stopPropagation(); onAddTC(e, feat.moduleId, feat.id); }}>
                        <i className="fa-solid fa-plus" style={{ fontSize: 10 }}></i> Test Case
                    </button>
                    <button className="fl-btn-ghost" onClick={onEdit} title="Edit Feature">
                        <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }}></i>
                    </button>
                    <button className="fl-btn-danger-sm" onClick={onDelete} title="Delete Feature">
                        <i className="fa-solid fa-trash" style={{ fontSize: 11 }}></i>
                    </button>
                    <i className={`fa-solid fa-chevron-right fl-chevron${isOpen ? " open" : ""}`}
                        style={{ color: T.textFaint, fontSize: 10 }}></i>
                </div>
            </div>
        </div>

        {/* ── Module badge — always visible ── */}
        <div style={{
            background: T.surfaceAlt,
            borderTop: `1px solid ${T.borderLight}`,
            padding: "8px 20px",
            display: "flex", alignItems: "center", gap: 10,
        }}>
            <span style={{
                fontSize: 10, fontWeight: 700, color: T.textFaint,
                textTransform: "uppercase", letterSpacing: "0.07em",
                fontFamily: T.sans, flexShrink: 0,
            }}>Module</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid, fontFamily: T.sans }}>{feat.moduleName}</span>
            <Chip label={feat.moduleCode} style={{ background: T.blueTint, color: T.blue }} mono />
        </div>

        {/* ── Test cases (expanded) ── */}
        {isOpen && feat.testCases.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.borderLight}` }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                                {["ID", "Name", "Priority", "Status", "Assignee", "Updated", ""].map(h => (
                                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody style={{ background: T.surface }}>
                            {feat.testCases.map(tc => (
                                <TestCaseRow
                                    key={tc.id}
                                    tc={tc}
                                    onEdit={(e) => { e.stopPropagation(); onAddTC.__editTC(e, feat.moduleId, feat.id, tc); }}
                                    onDelete={(e) => { e.stopPropagation(); onAddTC.__deleteTC(e, feat.moduleId, feat.id, tc); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {isOpen && feat.testCases.length === 0 && (
            <div style={{ borderTop: `1px solid ${T.borderLight}`, background: "#F9FAF8", padding: "18px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: T.textFaint, margin: 0, fontFamily: T.sans }}>No test cases yet — add one above</p>
            </div>
        )}
    </div>
));

// ─── Modal primitives ──────────────────────────────────────────────────────────
const OVERLAY = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const modalBox = (maxW = "600px") => ({
    background: T.surface, borderRadius: 14,
    boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
    width: "100%", maxWidth: maxW, maxHeight: "90vh", overflowY: "auto",
    fontFamily: T.sans,
});
const MODAL_HEADER = {
    padding: "18px 22px", borderBottom: `1px solid ${T.borderLight}`,
    position: "sticky", top: 0, background: T.surface, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
};
const MODAL_FOOTER = {
    padding: "14px 22px", borderTop: `1px solid ${T.borderLight}`,
    position: "sticky", bottom: 0, background: T.surface,
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
};
const BTN_CANCEL = {
    padding: "9px 20px", background: T.surface, border: `1px solid ${T.border}`,
    color: T.textMid, borderRadius: 8, fontWeight: 500, fontSize: 13,
    cursor: "pointer", fontFamily: T.sans,
};
const BTN_PRIMARY = {
    padding: "9px 20px", background: "#15803d", border: "none",
    color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: "pointer", fontFamily: T.sans,
};
const BTN_DANGER = {
    padding: "9px 20px", background: T.red, border: "none",
    color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: "pointer", fontFamily: T.sans,
};

// ─── Form field helpers ────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div>
        <label className="fl-label">{label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}</label>
        {children}
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FeaturesLibrary() {
    const [modules, setModules] = useState([]);
    const [users, setUsers] = useState([]);
    const [userStories, setUserStories] = useState([]);
    const [openFeatures, setOpenFeatures] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [importFeaturesModal, setImportFeaturesModal] = useState(false);
    const [importTCModal, setImportTCModal] = useState(false);
    const [addModal, setAddModal] = useState({ open: false, featureId: null, moduleId: null });
    const [editModal, setEditModal] = useState({ open: false, tc: null, featureId: null, moduleId: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, tc: null, featureId: null, moduleId: null });
    const [addFeatureModal, setAddFeatureModal] = useState(false);
    const [featureForm, setFeatureForm] = useState(emptyFeatureForm);

    const [editFeatureModal, setEditFeatureModal] = useState(false);
    const [editFeatureForm, setEditFeatureForm] = useState(emptyEditFeatureForm);
    const [deleteFeatureModal, setDeleteFeatureModal] = useState(false);
    const [deleteFeatureTarget, setDeleteFeatureTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const fetchModulesWithFeatures = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const [
                { data: modulesData, error: modulesError },
                { data: featuresData, error: featuresError },
                { data: testCasesData, error: testCasesError },
            ] = await Promise.all([
                supabase.from("modules").select("*").order("module_code", { ascending: false }),
                supabase.from("features").select("*"),
                supabase.from("test_cases").select("id, test_case_id, name, description, priority, status, updated_at, feature_id, module_id, assigned_to"),
            ]);
            if (modulesError) throw modulesError;
            if (featuresError) console.warn("Features:", featuresError.message);
            if (testCasesError) console.warn("Test cases:", testCasesError.message);

            const feats = featuresData || [];
            const tcs = testCasesData || [];
            const tcsByFeature = {};
            for (const tc of tcs) {
                if (!tc.feature_id) continue;
                if (!tcsByFeature[tc.feature_id]) tcsByFeature[tc.feature_id] = [];
                tcsByFeature[tc.feature_id].push({
                    id: tc.id,
                    tcId: tc.test_case_id || tc.id,
                    name: tc.name, description: tc.description,
                    priority: tc.priority, status: tc.status,
                    assignee: tc.assigned_to || null,
                    updated: new Date(tc.updated_at).toLocaleDateString(),
                });
            }
            const featsByModule = {};
            for (const f of feats) {
                if (!featsByModule[f.module_id]) featsByModule[f.module_id] = [];
                featsByModule[f.module_id].push(f);
            }
            const enriched = (modulesData || []).map(mod => {
                const mf = featsByModule[mod.id] || [];
                const ef = mf.map(feat => {
                    return {
                        ...feat,
                        name: feat.feature_name || feat.name,
                        code: feat.feature_code || feat.code,
                        moduleId: mod.id,
                        moduleName: mod.module_name || mod.name,
                        moduleCode: mod.module_code,
                        testCasesCount: (tcsByFeature[feat.id] || []).length,
                        testCases: tcsByFeature[feat.id] || [],
                    };
                });
                return {
                    ...mod,
                    name: mod.module_name || mod.name,
                    featuresCount: ef.length,
                    testCasesCount: ef.reduce((a, f) => a + f.testCasesCount, 0),
                    features: ef,
                    status: "Active",
                };
            });
            setModules(enriched);
        } catch (err) { setError(err.message || "Failed to load"); }
        finally { setLoading(false); }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name", { ascending: true });
            setUsers((data || []).map(u => ({ id: u.id, name: u.full_name || u.email || u.id })));
        } catch (err) { console.error(err); }
    }, []);

    const fetchUserStories = useCallback(async () => {
        try {
            const { data, error } = await supabase.from("user_stories").select("id, story_id, story_title").order("story_id", { ascending: true });
            if (error) { console.warn("User stories:", error.message); return; }
            setUserStories((data || []).map(s => ({ id: s.id, code: s.story_id, name: s.story_title || s.story_id })));
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { Promise.all([fetchModulesWithFeatures(), fetchUsers(), fetchUserStories()]); }, [fetchModulesWithFeatures, fetchUsers, fetchUserStories]);

    // ── Flat features list (primary view) ──────────────────────────────────────
    const flatFeatures = useMemo(() =>
        modules.flatMap(mod => mod.features.map(feat => {
            const assignedUser = users.find(u => u.id === feat.assign_to);
            return {
                ...feat,
                assign_to_name: assignedUser ? assignedUser.name : (feat.assign_to || null),
            };
        })),
        [modules, users]
    );

    const totalFeatures = useMemo(() => flatFeatures.length, [flatFeatures]);
    const totalModules = useMemo(() => modules.length, [modules]);
    const totalTestCases = useMemo(() => flatFeatures.reduce((a, f) => a + f.testCasesCount, 0), [flatFeatures]);

    const userOptions = useMemo(() => [{ id: "", name: "Select Assignee" }, ...users.map(u => ({ id: u.id, name: u.name }))], [users]);
    const testerOptions = useMemo(() => [{ id: "", name: "Select Tester" }, ...users.map(u => ({ id: u.name, name: u.name }))], [users]);
    const moduleOptions = useMemo(() => [{ id: "", name: "Choose Module" }, ...modules.map(m => ({ id: m.id, name: m.name }))], [modules]);

    // ── Filtered flat features ──────────────────────────────────────────────────
    const filteredFeatures = useMemo(() => {
        let list = flatFeatures;
        if (filterStatus) {
            list = list.filter(f => (f.status || "Active").toLowerCase() === filterStatus.toLowerCase());
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.code.toLowerCase().includes(q) ||
                (f.moduleName || "").toLowerCase().includes(q) ||
                (f.moduleCode || "").toLowerCase().includes(q) ||
                f.testCases.some(tc => (tc.tcId || tc.id).toLowerCase().includes(q) || tc.name.toLowerCase().includes(q))
            );
        }
        return list;
    }, [flatFeatures, searchQuery, filterStatus]);

    const stats = useMemo(() => [
        { label: "Modules", value: totalModules, icon: "fa-puzzle-piece", color: "blue" },
        { label: "Features", value: totalFeatures, icon: "fa-list-check", color: "green" },
        { label: "Test Cases", value: totalTestCases.toLocaleString(), icon: "fa-vial", color: "purple" },
        { label: "Active Features", value: flatFeatures.filter(f => (f.status || "Active") === "Active").length, icon: "fa-check-circle", color: "amber" },
        { label: "Team Members", value: users.length, icon: "fa-users", color: "red" },
    ], [totalModules, totalFeatures, totalTestCases, flatFeatures, users.length]);

    const toggleFeature = useCallback(id => setOpenFeatures(p => ({ ...p, [id]: !p[id] })), []);

    const openAddFeatureModal = useCallback(() => {
        const nextCode = generateNextFeatCode(flatFeatures);
        setFeatureForm({ ...emptyFeatureForm, code: nextCode });
        setAddFeatureModal(true);
    }, [flatFeatures]);

    const openAddModal = useCallback((e, moduleId, featureId) => {
        e.stopPropagation();
        const allTCs = modules.flatMap(m => m.features.flatMap(f => f.testCases));
        const nextId = generateNextTcId(allTCs);
        setForm({ ...emptyForm, id: nextId });
        setAddModal({ open: true, featureId, moduleId });
    }, [modules]);
    const openEditModal = useCallback((e, moduleId, featureId, tc) => {
        e.stopPropagation();
        setForm({ id: tc.tcId, name: tc.name, description: tc.description, testScenario: tc.testScenario || "", preconditions: tc.preconditions || "", steps: tc.steps || "", expected: tc.expected || "", assignee: tc.assignee || "", status: tc.status, priority: tc.priority, testType: tc.testType || "", tags: "", userStoryIds: tc.userStoryIds || [] });
        setEditModal({ open: true, tc, featureId, moduleId });
    }, []);
    const openDeleteModal = useCallback((e, moduleId, featureId, tc) => {
        e.stopPropagation(); setDeleteModal({ open: true, tc, featureId, moduleId });
    }, []);
    const openEditFeatureModal = useCallback((e, feat) => {
        e.stopPropagation();
        setEditFeatureForm({ id: feat.id, moduleId: feat.moduleId, name: feat.feature_name || feat.name || "", code: feat.feature_code || feat.code || "", user_story: feat.user_story || "", description: feat.description || "", assign_to: feat.assign_to || "" });
        setEditFeatureModal(true);
    }, []);
    const openDeleteFeatureModal = useCallback((e, feat) => {
        e.stopPropagation(); setDeleteFeatureTarget(feat); setDeleteFeatureModal(true);
    }, []);

    const handleAddTestCase = useCallback(async () => {
        if (!form.name || !form.priority || !form.testType) { alert("Name, Priority and Test Type are required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Must be logged in"); return; }
            const { error } = await supabase.from("test_cases").insert([{
                id: generateUUID(), test_case_id: form.id, name: form.name,
                description: form.description,
                test_scenario: form.testScenario || null,
                preconditions: form.preconditions || null,
                test_steps: form.steps ? form.steps.split("\n").map(s => s.trim()).filter(Boolean) : null,
                expected_result: form.expected || null,
                feature_id: addModal.featureId || null,
                module_id: addModal.moduleId || null,
                priority: form.priority, status: form.status,
                test_type: form.testType || null,
                created_by: user.id,
                assigned_to: form.assignee || null,
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }]);
            if (error) throw error;
            setAddModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, addModal.featureId, addModal.moduleId, fetchModulesWithFeatures]);

    const handleEditTestCase = useCallback(async () => {
        if (!form.name || !form.priority || !form.testType) { alert("Name, Priority and Test Type are required"); return; }
        if (!editModal.tc?.id) return;
        try {
            const { error } = await supabase.from("test_cases").update({
                name: form.name, description: form.description,
                test_scenario: form.testScenario || null,
                preconditions: form.preconditions || null,
                test_steps: form.steps ? form.steps.split("\n").map(s => s.trim()).filter(Boolean) : null,
                expected_result: form.expected || null,
                priority: form.priority, status: form.status,
                test_type: form.testType || null,
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                updated_at: new Date().toISOString(),
            }).eq("id", editModal.tc.id);
            if (error) throw error;
            setEditModal({ open: false, tc: null, featureId: null, moduleId: null }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, editModal.tc, fetchModulesWithFeatures]);

    const handleDeleteTestCase = useCallback(async () => {
        try {
            const { error } = await supabase.from("test_cases").delete().eq("id", deleteModal.tc.id);
            if (error) throw error;
            setDeleteModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [deleteModal.tc, fetchModulesWithFeatures]);

    const handleAddFeature = useCallback(async () => {
        if (!featureForm.moduleId || !featureForm.name) { alert("Module and Name required"); return; }
        try {
            const ins = {
                module_id: featureForm.moduleId, feature_name: featureForm.name,
                feature_code: featureForm.code, description: featureForm.description,
                created_at: new Date().toISOString(),
            };
            if (featureForm.user_story) ins.user_story = featureForm.user_story;
            if (featureForm.assign_to) ins.assign_to = featureForm.assign_to;
            const { error } = await supabase.from("features").insert([ins]);
            if (error) throw error;
            setAddFeatureModal(false); setFeatureForm(emptyFeatureForm); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [featureForm, fetchModulesWithFeatures]);

    const handleEditFeature = useCallback(async () => {
        if (!editFeatureForm.name || !editFeatureForm.code) { alert("Name and Code required"); return; }
        try {
            const { error } = await supabase.from("features").update({
                feature_name: editFeatureForm.name, feature_code: editFeatureForm.code,
                description: editFeatureForm.description,
                user_story: editFeatureForm.user_story || null,
                assign_to: editFeatureForm.assign_to || null,
                module_id: editFeatureForm.moduleId,
            }).eq("id", editFeatureForm.id);
            if (error) throw error;
            setEditFeatureModal(false); setEditFeatureForm(emptyEditFeatureForm); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [editFeatureForm, fetchModulesWithFeatures]);

    const handleDeleteFeature = useCallback(async () => {
        if (!deleteFeatureTarget) return;
        try {
            await supabase.from("test_cases").delete().eq("feature_id", deleteFeatureTarget.id);
            const { error } = await supabase.from("features").delete().eq("id", deleteFeatureTarget.id);
            if (error) throw error;
            setDeleteFeatureModal(false); setDeleteFeatureTarget(null); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [deleteFeatureTarget, fetchModulesWithFeatures]);

    const exportToCSV = useCallback(() => {
        if (!flatFeatures.length) { alert("No data"); return; }
        const rows = [];
        flatFeatures.forEach(feat => {
            rows.push({ Module: feat.moduleName, "Module Code": feat.moduleCode, Feature: feat.name, "Feature Code": feat.code, "User Story": feat.user_story || "", Status: feat.status || "Active", Type: "FEATURE" });
            feat.testCases.forEach(tc => rows.push({
                Module: feat.moduleName, "Module Code": feat.moduleCode,
                Feature: feat.name, "Feature Code": feat.code,
                "TC ID": tc.tcId, "TC Name": tc.name,
                Priority: tc.priority, Status: tc.status, Type: "TEST_CASE",
            }));
        });
        const headers = Object.keys(rows.reduce((acc, r) => ({ ...acc, ...r }), {}));
        const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h] || ""}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `features_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    }, [flatFeatures]);

    const addTCHandler = useCallback((e, moduleId, featureId) => openAddModal(e, moduleId, featureId), [openAddModal]);
    addTCHandler.__editTC = openEditModal;
    addTCHandler.__deleteTC = openDeleteModal;

    if (loading) return (
        <div className="fl-root" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: T.textMuted, fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 10, display: "block", color: T.green }}></i>
                Loading Features Library…
            </div>
        </div>
    );

    return (
        <div className="fl-root" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: T.bg }}>
            <style>{GLOBAL_STYLES}</style>

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, zIndex: 40, position: "sticky", top: 0 }}>
                <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>Features Library</h2>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0", lineHeight: 1.5 }}>All features with linked modules and test cases</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="fl-btn-ghost" onClick={exportToCSV} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Export
                        </button>
                        <button className="fl-btn-ghost" onClick={() => setImportFeaturesModal(true)} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i> Import Features
                        </button>
                        <button className="fl-btn-ghost" onClick={() => setImportTCModal(true)} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i> Import Test Cases
                        </button>
                        <button className="fl-btn-primary" onClick={openAddFeatureModal} style={{ padding: "8px 16px", fontSize: 13 }}>
                            <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i> Add Feature
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

                    {error && (
                        <div style={{ background: T.redTint, border: `1px solid rgba(220,38,38,0.2)`, color: T.red, padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                            {error} <button onClick={fetchModulesWithFeatures} style={{ marginLeft: 12, textDecoration: "underline", background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12 }}>Retry</button>
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                        {stats.map(s => <StatCard key={s.label} stat={s} />)}
                    </div>

                    {/* Filters */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 20, padding: "14px 18px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px", gap: 12 }}>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="fl-input"
                                    type="text"
                                    placeholder="Search features, modules, test case IDs…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                                <i className="fa-solid fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textFaint, fontSize: 12 }}></i>
                            </div>
                            <Dropdown options={FILTER_STATUS_OPT} selected={filterStatus} onChange={setFilterStatus} placeholder="All Status" />
                            <button className="fl-btn-ghost" onClick={() => { setSearchQuery(""); setFilterStatus(""); }} style={{ justifyContent: "center" }}>
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Empty */}
                    {filteredFeatures.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 48, height: 48, background: T.surfaceAlt, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <i className="fa-solid fa-inbox" style={{ color: T.textFaint, fontSize: 20 }}></i>
                            </div>
                            <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No features found. Create one to get started.</p>
                        </div>
                    )}

                    {/* ── Feature cards (primary level) ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filteredFeatures.map(feat => (
                            <FeatureCard
                                key={feat.id}
                                feat={feat}
                                isOpen={!!openFeatures[feat.id]}
                                onToggle={() => toggleFeature(feat.id)}
                                onAddTC={addTCHandler}
                                onEdit={(e) => openEditFeatureModal(e, feat)}
                                onDelete={(e) => openDeleteFeatureModal(e, feat)}
                            />
                        ))}
                    </div>
                </div>
            </main>

            {/* ── Add Feature Modal ──────────────────────────────────────────────── */}
            {addFeatureModal && (
                <div style={OVERLAY} onClick={() => setAddFeatureModal(false)}>
                    <div className="fl-modal-enter" style={modalBox()} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Add New Feature</h3>
                            <button onClick={() => setAddFeatureModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <Field label="Module" required>
                                <Dropdown options={moduleOptions} selected={featureForm.moduleId} onChange={v => setFeatureForm(f => ({ ...f, moduleId: v }))} placeholder="Choose Module" />
                            </Field>
                            <Field label="Feature Name" required>
                                <input className="fl-input" type="text" placeholder="e.g., Two-Factor Authentication" value={featureForm.name} onChange={e => setFeatureForm(f => ({ ...f, name: e.target.value }))} />
                            </Field>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Feature Code">
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "9px 13px", background: T.surfaceAlt,
                                        border: `1px solid ${T.border}`, borderRadius: 8,
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, fontFamily: T.mono }}>{featureForm.code}</span>
                                        <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>Auto-generated</span>
                                    </div>
                                </Field>
                                <Field label="User Story">
                                    <input className="fl-input" type="text" placeholder="e.g., US-015" value={featureForm.user_story} onChange={e => setFeatureForm(f => ({ ...f, user_story: e.target.value }))} />
                                </Field>
                            </div>
                            <Field label="Description">
                                <textarea className="fl-input" rows="3" placeholder="Brief description…" value={featureForm.description} onChange={e => setFeatureForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Assign To">
                                <Dropdown options={userOptions} selected={featureForm.assign_to} onChange={v => setFeatureForm(f => ({ ...f, assign_to: v }))} placeholder="Select Assignee" />
                            </Field>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setAddFeatureModal(false)} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleAddFeature} style={BTN_PRIMARY}>Add Feature</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Feature Modal ─────────────────────────────────────────────── */}
            {editFeatureModal && (
                <div style={OVERLAY} onClick={() => setEditFeatureModal(false)}>
                    <div className="fl-modal-enter" style={modalBox()} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, background: T.blueTint, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className="fa-solid fa-pen-to-square" style={{ color: T.blue, fontSize: 13 }}></i>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Edit Feature</h3>
                            </div>
                            <button onClick={() => setEditFeatureModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <Field label="Module" required>
                                <Dropdown options={moduleOptions} selected={editFeatureForm.moduleId} onChange={v => setEditFeatureForm(f => ({ ...f, moduleId: v }))} placeholder="Choose Module" />
                            </Field>
                            <Field label="Feature Name" required>
                                <input className="fl-input" type="text" value={editFeatureForm.name} onChange={e => setEditFeatureForm(f => ({ ...f, name: e.target.value }))} />
                            </Field>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Feature Code" required>
                                    <input className="fl-input" type="text" value={editFeatureForm.code} onChange={e => setEditFeatureForm(f => ({ ...f, code: e.target.value }))} />
                                </Field>
                                <Field label="User Story">
                                    <input className="fl-input" type="text" value={editFeatureForm.user_story} onChange={e => setEditFeatureForm(f => ({ ...f, user_story: e.target.value }))} />
                                </Field>
                            </div>
                            <Field label="Description">
                                <textarea className="fl-input" rows="3" value={editFeatureForm.description} onChange={e => setEditFeatureForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Assign To">
                                <Dropdown options={userOptions} selected={editFeatureForm.assign_to} onChange={v => setEditFeatureForm(f => ({ ...f, assign_to: v }))} placeholder="Select Assignee" />
                            </Field>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setEditFeatureModal(false)} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleEditFeature} style={BTN_PRIMARY}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Feature Modal ───────────────────────────────────────────── */}
            {deleteFeatureModal && (
                <div style={OVERLAY} onClick={() => setDeleteFeatureModal(false)}>
                    <div className="fl-modal-enter" style={{ ...modalBox("440px"), maxHeight: "none" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: "0 0 3px" }}>Delete Feature</h3>
                                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>This action cannot be undone.</p>
                                </div>
                                <div style={{ width: 40, height: 40, background: T.redTint, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 14 }}>
                                    <i className="fa-solid fa-triangle-exclamation" style={{ color: T.red, fontSize: 16 }}></i>
                                </div>
                            </div>
                            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{deleteFeatureTarget?.feature_name || deleteFeatureTarget?.name}</p>
                                <p style={{ fontSize: 12, color: T.textMuted, margin: 0, fontFamily: T.mono }}>{deleteFeatureTarget?.feature_code || deleteFeatureTarget?.code}</p>
                            </div>
                            {/* Module context in delete dialog */}
                            <div style={{ background: T.blueTint, border: `1px solid rgba(37,99,235,0.15)`, borderRadius: 8, padding: "10px 14px", marginBottom: deleteFeatureTarget?.testCasesCount > 0 ? 10 : 16 }}>
                                <p style={{ fontSize: 12, color: "#1D4ED8", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                                    <i className="fa-solid fa-puzzle-piece" style={{ fontSize: 11 }}></i>
                                    Module: <strong>{deleteFeatureTarget?.moduleName}</strong>
                                </p>
                            </div>
                            {deleteFeatureTarget?.testCasesCount > 0 && (
                                <div style={{ background: T.amberTint, border: `1px solid rgba(217,119,6,0.2)`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                                    <p style={{ fontSize: 12, color: "#92400E", margin: 0 }}>
                                        <i className="fa-solid fa-warning" style={{ marginRight: 7 }}></i>
                                        <strong>{deleteFeatureTarget.testCasesCount} test case(s)</strong> will also be deleted.
                                    </p>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button onClick={() => setDeleteFeatureModal(false)} style={BTN_CANCEL}>Cancel</button>
                                <button onClick={handleDeleteFeature} style={BTN_DANGER}>Delete Feature</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Test Case Modal ────────────────────────────────────────────── */}
            {addModal.open && (
                <div style={OVERLAY} onClick={() => setAddModal({ open: false })}>
                    <div className="fl-modal-enter" style={modalBox("620px")} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Add Test Case</h3>
                            <button onClick={() => setAddModal({ open: false })} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Case ID">
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "9px 13px", background: T.surfaceAlt,
                                        border: `1px solid ${T.border}`, borderRadius: 8,
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, fontFamily: T.mono }}>{form.id}</span>
                                        <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>Auto-generated</span>
                                    </div>
                                </Field>
                                <Field label="Priority" required>
                                    <Dropdown options={PRIORITY_WITH_PH} selected={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                </Field>
                            </div>
                            <Field label="Test Case Name" required>
                                <input className="fl-input" type="text" placeholder="e.g., Valid login with correct credentials" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </Field>
                            <Field label="Description" required>
                                <textarea className="fl-input" rows="3" placeholder="Brief description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Type" required>
                                    <Dropdown options={TEST_TYPE_WITH_PH} selected={form.testType} onChange={v => setForm(f => ({ ...f, testType: v }))} placeholder="Select Test Type" />
                                </Field>
                                <Field label="Assigned To">
                                    <Dropdown options={testerOptions} selected={form.assignee} onChange={v => setForm(f => ({ ...f, assignee: v }))} placeholder="Select Tester" />
                                </Field>
                            </div>
                            <Field label="Status" required>
                                <Dropdown options={STATUS_OPTIONS} selected={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                            </Field>
                            <Field label="Test Scenario">
                                <input className="fl-input" type="text" placeholder="e.g., Verify user can log in with valid credentials" value={form.testScenario} onChange={e => setForm(f => ({ ...f, testScenario: e.target.value }))} />
                            </Field>
                            <Field label="Pre-Requisites">
                                <textarea className="fl-input" rows="2" placeholder="e.g., User must have a registered account" value={form.preconditions} onChange={e => setForm(f => ({ ...f, preconditions: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Steps">
                                <textarea className="fl-input" rows="4" placeholder="1. Navigate to login page&#10;2. Enter valid credentials&#10;3. Click Login button" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Expected Result">
                                <textarea className="fl-input" rows="2" placeholder="e.g., User is redirected to dashboard" value={form.expected} onChange={e => setForm(f => ({ ...f, expected: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setAddModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleAddTestCase} style={BTN_PRIMARY}>Add Test Case</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Test Case Modal ───────────────────────────────────────────── */}
            {editModal.open && (
                <div style={OVERLAY} onClick={() => setEditModal({ open: false })}>
                    <div className="fl-modal-enter" style={modalBox("620px")} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Edit Test Case</h3>
                            <button onClick={() => setEditModal({ open: false })} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Case ID">
                                    <input className="fl-input" type="text" value={form.id} readOnly style={{ background: T.surfaceAlt, color: T.textMuted, cursor: "default" }} />
                                </Field>
                                <Field label="Priority" required>
                                    <Dropdown options={PRIORITY_OPTIONS} selected={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                </Field>
                            </div>
                            <Field label="Test Case Name" required>
                                <input className="fl-input" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </Field>
                            <Field label="Description">
                                <textarea className="fl-input" rows="3" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Type" required>
                                    <Dropdown options={TEST_TYPE_OPTIONS} selected={form.testType} onChange={v => setForm(f => ({ ...f, testType: v }))} placeholder="Select Test Type" />
                                </Field>
                                <Field label="Status" required>
                                    <Dropdown options={STATUS_OPTIONS} selected={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                                </Field>
                            </div>
                            <Field label="Test Scenario">
                                <input className="fl-input" type="text" placeholder="e.g., Verify user can log in with valid credentials" value={form.testScenario} onChange={e => setForm(f => ({ ...f, testScenario: e.target.value }))} />
                            </Field>
                            <Field label="Pre-Requisites">
                                <textarea className="fl-input" rows="2" placeholder="e.g., User must have a registered account" value={form.preconditions} onChange={e => setForm(f => ({ ...f, preconditions: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Steps">
                                <textarea className="fl-input" rows="4" placeholder="1. Navigate to login page&#10;2. Enter valid credentials&#10;3. Click Login button" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Expected Result">
                                <textarea className="fl-input" rows="2" placeholder="e.g., User is redirected to dashboard" value={form.expected} onChange={e => setForm(f => ({ ...f, expected: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setEditModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleEditTestCase} style={BTN_PRIMARY}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Test Case Modal ─────────────────────────────────────────── */}
            {deleteModal.open && (
                <div style={OVERLAY} onClick={() => setDeleteModal({ open: false })}>
                    <div className="fl-modal-enter" style={{ ...modalBox("420px"), maxHeight: "none" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: "0 0 3px" }}>Delete Test Case</h3>
                                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>This action cannot be undone.</p>
                                </div>
                                <div style={{ width: 40, height: 40, background: T.redTint, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 14 }}>
                                    <i className="fa-solid fa-trash" style={{ color: T.red, fontSize: 15 }}></i>
                                </div>
                            </div>
                            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 18 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "0 0 2px", fontFamily: T.mono }}>{deleteModal.tc?.tcId}</p>
                                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{deleteModal.tc?.name}</p>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button onClick={() => setDeleteModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                                <button onClick={handleDeleteTestCase} style={BTN_DANGER}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {importFeaturesModal && (
                <ImportFeaturesModal
                    onClose={() => setImportFeaturesModal(false)}
                    onSuccess={fetchModulesWithFeatures}
                    modules={modules}
                    users={users}
                />
            )}
            {importTCModal && (
                <ImportTestCasesModal
                    onClose={() => setImportTCModal(false)}
                    onSuccess={fetchModulesWithFeatures}
                    flatFeatures={flatFeatures}
                    users={users}
                    userStories={userStories}
                />
            )}
        </div>
    );
}