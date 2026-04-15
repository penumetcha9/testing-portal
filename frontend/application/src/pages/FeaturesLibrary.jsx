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

  .fl-ms-item { transition: background 0.1s; cursor: pointer; }
  .fl-ms-item:hover { background: #F4F6F3; }
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

// ─── Single-select Dropdown ────────────────────────────────────────────────────
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

// ─── Multi-select Dropdown ─────────────────────────────────────────────────────
const MultiSelectDropdown = memo(({ options, selected = [], onChange, placeholder = "Select..." }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(o => o.name.toLowerCase().includes(q) || (o.code || "").toLowerCase().includes(q));
    }, [options, search]);

    const toggle = useCallback((id) => {
        onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    }, [selected, onChange]);

    const selectedLabels = useMemo(() =>
        selected.map(id => options.find(o => o.id === id)).filter(Boolean),
        [selected, options]
    );

    return (
        <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
            {/* Trigger */}
            <div
                onClick={() => setOpen(p => !p)}
                style={{
                    minHeight: 40, padding: selected.length ? "6px 36px 6px 8px" : "9px 36px 9px 13px",
                    background: open ? T.surface : "#FAFBF9",
                    border: `1px solid ${open ? T.green : T.border}`,
                    borderRadius: 8, cursor: "pointer",
                    boxShadow: open ? `0 0 0 3px rgba(29,61,47,0.08)` : "none",
                    transition: "all 0.15s", position: "relative",
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4,
                }}
            >
                {selectedLabels.length === 0 && (
                    <span style={{ fontSize: 13, color: T.textFaint, fontFamily: T.sans }}>{placeholder}</span>
                )}
                {selectedLabels.map(opt => (
                    <span
                        key={opt.id}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: T.purpleTint, color: T.purple,
                            borderRadius: 5, padding: "2px 6px 2px 7px",
                            fontSize: 11, fontWeight: 600, fontFamily: T.mono,
                        }}
                    >
                        {opt.code || opt.name}
                        <span
                            onClick={(e) => { e.stopPropagation(); toggle(opt.id); }}
                            style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 14, height: 14, borderRadius: 3,
                                background: "rgba(124,58,237,0.15)", cursor: "pointer",
                                fontSize: 9, color: T.purple, fontFamily: T.sans, lineHeight: 1,
                            }}
                        >✕</span>
                    </span>
                ))}
                {/* Chevron */}
                <span style={{
                    position: "absolute", right: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    transition: "transform 0.2s", color: open ? T.green : T.textFaint, display: "flex",
                }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0,
                    zIndex: 9999, background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    animation: "ddIn 0.16s cubic-bezier(.4,0,.2,1)", overflow: "hidden",
                }}>
                    {/* Search */}
                    <div style={{ padding: "8px 8px 4px", borderBottom: `1px solid ${T.borderLight}` }}>
                        <div style={{ position: "relative" }}>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search user stories…"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: "100%", padding: "7px 10px 7px 30px",
                                    background: T.surfaceAlt, border: `1px solid ${T.border}`,
                                    borderRadius: 7, fontSize: 12, color: T.text,
                                    fontFamily: T.sans, outline: "none",
                                }}
                            />
                            <i className="fa-solid fa-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textFaint, fontSize: 11 }}></i>
                        </div>
                    </div>

                    {/* Options */}
                    <div style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}>
                        {filtered.length === 0 && (
                            <div style={{ padding: "10px 12px", fontSize: 12, color: T.textFaint, fontFamily: T.sans, textAlign: "center" }}>No stories found</div>
                        )}
                        {filtered.map(opt => {
                            const sel = selected.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    className="fl-ms-item"
                                    onClick={() => toggle(opt.id)}
                                    style={{
                                        padding: "8px 10px", borderRadius: 7,
                                        display: "flex", alignItems: "center", gap: 9,
                                        background: sel ? T.greenLight : "transparent",
                                    }}
                                >
                                    {/* Checkbox */}
                                    <div style={{
                                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                        border: `1.5px solid ${sel ? T.green : T.border}`,
                                        background: sel ? T.green : T.surface,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.13s",
                                    }}>
                                        {sel && (
                                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                                <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            {opt.code && (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>{opt.code}</span>
                                            )}
                                            <span style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? T.green : T.text, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.name}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    {selected.length > 0 && (
                        <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans }}>{selected.length} selected</span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                                style={{ background: "none", border: "none", color: T.red, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}
                            >Clear all</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [{ id: "High", name: "High" }, { id: "Medium", name: "Medium" }, { id: "Low", name: "Low" }];
const STATUS_OPTIONS = [{ id: "Active", name: "Active" }, { id: "Draft", name: "Draft" }, { id: "Archived", name: "Archived" }];
const FILTER_STATUS_OPT = [{ id: "", name: "All Status" }, { id: "Active", name: "Active" }, { id: "Draft", name: "Draft" }, { id: "Archived", name: "Archived" }];
const PRIORITY_WITH_PH = [{ id: "", name: "Select Priority" }, ...PRIORITY_OPTIONS];

const emptyForm = { id: "", name: "", description: "", preconditions: "", steps: "", expected: "", assignee: "", status: "Active", priority: "", tags: "", userStoryIds: [] };
const emptyFeatureForm = { moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };
const emptyEditFeatureForm = { id: "", moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

// ─── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const parseRow = (line) => {
        const result = []; let current = ""; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
            else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ""; }
            else current += ch;
        }
        result.push(current.trim()); return result;
    };
    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
    const rows = lines.slice(1).filter(l => l.trim()).map(l => {
        const vals = parseRow(l); const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; }); return obj;
    });
    return { headers, rows };
}

const downloadCSV = (content, filename) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
    a.download = filename; a.style.visibility = "hidden";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_TC_STATUSES = ["Active", "Draft", "Archived"];
const VALID_FEAT_STATUSES = ["Active", "Draft", "Archived"];

// ─── Feature CSV Import Modal ──────────────────────────────────────────────────
function FeatureImportModal({ onClose, onSuccess, modules, flatFeatures, users }) {
    const fileInputRef = useRef(null);
    const [step, setStep] = useState("upload");
    const [dragging, setDragging] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [validRows, setValidRows] = useState([]);
    const [errorRows, setErrorRows] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const moduleMap = useMemo(() => {
        const m = {};
        modules.forEach(mod => {
            m[(mod.module_name || mod.name || "").toLowerCase()] = mod.id;
            m[String(mod.module_code).toLowerCase()] = mod.id;
        });
        return m;
    }, [modules]);

    const userMap = useMemo(() => {
        const m = {};
        users.forEach(u => { m[u.name.toLowerCase()] = u.id; });
        return m;
    }, [users]);

    const downloadTemplate = () => {
        downloadCSV(
            ["Module Name,Feature Name,Description,User Story,Assign To,Status"].concat([
                '"User Management","Login Feature","Handles user authentication","US-001","Alice","Active"',
                '"Reporting & Analytics","Dashboard Charts","KPI widgets","","","Draft"',
            ]).join("\n"),
            "features_import_template.csv"
        );
    };

    const validate = (rows) => {
        const valid = [], errors = [];
        let max = 0;
        flatFeatures.forEach(f => { const m = (f.feature_code || f.code || "").match(/^FEAT-(\d+)$/i); if (m) max = Math.max(max, parseInt(m[1], 10)); });

        rows.forEach((row, idx) => {
            const errs = [];
            const moduleName = (row["module_name"] || row["module"] || "").trim();
            const name = (row["feature_name"] || row["feature"] || "").trim();
            const status = (row["status"] || "Active").trim();
            const moduleId = moduleMap[moduleName.toLowerCase()];

            if (!name) errs.push("Feature Name is required");
            if (!moduleName) errs.push("Module Name is required");
            else if (!moduleId) errs.push(`Module "${moduleName}" not found — must match an existing module`);
            if (status && !VALID_FEAT_STATUSES.includes(status)) errs.push(`Status must be: ${VALID_FEAT_STATUSES.join(" / ")}`);

            if (errs.length) { errors.push({ rowNum: idx + 2, name: name || "(blank)", errors: errs }); }
            else {
                max++;
                const code = `FEAT-${String(max).padStart(3, "0")}`;
                const assignTo = userMap[(row["assign_to"] || "").toLowerCase()] || null;
                valid.push({ module_id: moduleId, feature_name: name, feature_code: code, description: (row["description"] || "").trim(), user_story: (row["user_story"] || "").trim() || null, assign_to: assignTo, status: status || "Active", created_at: new Date().toISOString() });
            }
        });
        return { valid, errors };
    };

    const processFile = (file) => {
        if (!file?.name.endsWith(".csv")) { alert("Please upload a .csv file"); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const { rows } = parseCSV(e.target.result);
            if (!rows.length) { alert("CSV has no data rows."); return; }
            const { valid, errors } = validate(rows);
            setParsedRows(rows); setValidRows(valid); setErrorRows(errors); setStep("preview");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setImporting(true);
        const { error } = await supabase.from("features").insert(validRows);
        setImporting(false);
        if (error) { alert(`Import failed: ${error.message}`); return; }
        setImportResult({ success: validRows.length, skipped: errorRows.length });
        setStep("done"); onSuccess();
    };

    const reset = () => { setStep("upload"); setParsedRows([]); setValidRows([]); setErrorRows([]); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div className="fl-modal-enter" style={{ background: T.surface, borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,0.16)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", fontFamily: T.sans }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderLight}`, position: "sticky", top: 0, background: T.surface, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="fa-solid fa-file-import" style={{ color: T.green, fontSize: 14 }}></i>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Import Features via CSV</h3>
                            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                                {step === "upload" && "Upload a CSV to bulk-create features"}
                                {step === "preview" && `${parsedRows.length} rows · ${validRows.length} valid · ${errorRows.length} errors`}
                                {step === "done" && "Import complete"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                </div>

                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {step === "upload" && (
                        <>
                            {/* Info + template */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.blueTint, border: `1px solid rgba(37,99,235,0.15)`, borderRadius: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <i className="fa-solid fa-circle-info" style={{ color: T.blue, fontSize: 14 }}></i>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1D4ED8", margin: 0 }}>Need a template?</p>
                                        <p style={{ fontSize: 11, color: "#3B82F6", margin: 0 }}>Download a pre-formatted CSV with example rows</p>
                                    </div>
                                </div>
                                <button onClick={downloadTemplate} style={{ padding: "6px 12px", background: T.surface, border: `1px solid rgba(37,99,235,0.25)`, color: T.blue, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                                    <i className="fa-solid fa-download" style={{ marginRight: 5 }}></i>Template
                                </button>
                            </div>

                            {/* Columns */}
                            <div style={{ padding: "12px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Expected Columns</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {[["Module Name", true], ["Feature Name", true], ["Description", false], ["User Story", false], ["Assign To", false], ["Status", false]].map(([col, req]) => (
                                        <span key={col} style={{ padding: "3px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.mono, color: T.textMid }}>
                                            {col}{req && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: T.textFaint, margin: "8px 0 0" }}>Status: <span style={{ fontFamily: T.mono }}>Active / Draft / Archived</span> &nbsp;·&nbsp; Module Name must match an existing module exactly</p>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                style={{ border: `2px dashed ${dragging ? T.green : T.border}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragging ? T.greenLight : T.surfaceAlt, transition: "all 0.15s" }}
                            >
                                <div style={{ width: 44, height: 44, background: T.surface, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: `1px solid ${T.border}` }}>
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: dragging ? T.green : T.textFaint, fontSize: 20 }}></i>
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: T.textMid, margin: "0 0 4px" }}>Drop CSV file here or click to browse</p>
                                <p style={{ fontSize: 11, color: T.textFaint, margin: 0 }}>.csv files only</p>
                                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => processFile(e.target.files[0])} />
                            </div>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            {/* Summary */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                {[["Total Rows", parsedRows.length, T.textMid, T.surfaceAlt, T.border], ["Ready", validRows.length, T.green, T.greenLight, T.greenTint], ["Errors", errorRows.length, T.red, T.redTint, "rgba(220,38,38,0.15)"]].map(([label, val, fg, bg, border]) => (
                                    <div key={label} style={{ padding: "12px 14px", background: bg, border: `1px solid ${border}`, borderRadius: 10, textAlign: "center" }}>
                                        <p style={{ fontSize: 24, fontWeight: 700, color: fg, margin: 0 }}>{val}</p>
                                        <p style={{ fontSize: 11, color: T.textMuted, margin: "2px 0 0" }}>{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Errors */}
                            {errorRows.length > 0 && (
                                <div style={{ border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 10, overflow: "hidden" }}>
                                    <div style={{ padding: "10px 14px", background: T.redTint, borderBottom: `1px solid rgba(220,38,38,0.15)`, display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="fa-solid fa-triangle-exclamation" style={{ color: T.red, fontSize: 12 }}></i>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>Rows with errors (will be skipped)</span>
                                    </div>
                                    <div style={{ maxHeight: 140, overflowY: "auto" }}>
                                        {errorRows.map((er, i) => (
                                            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderLight}` }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: T.textMid, margin: "0 0 3px" }}>Row {er.rowNum}: <span style={{ fontWeight: 400 }}>{er.name}</span></p>
                                                {er.errors.map((e, j) => <p key={j} style={{ fontSize: 11, color: T.red, margin: "1px 0 0" }}>• {e}</p>)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Valid preview */}
                            {validRows.length > 0 && (
                                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                                    <div style={{ padding: "10px 14px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="fa-solid fa-check-circle" style={{ color: T.green, fontSize: 12 }}></i>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>Features to be created</span>
                                    </div>
                                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                                        {validRows.map((row, i) => (
                                            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <i className="fa-solid fa-list-check" style={{ color: T.green, fontSize: 12 }}></i>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.feature_name}</p>
                                                    <p style={{ fontSize: 11, color: T.textMuted, margin: "1px 0 0" }}>{row.feature_code} &nbsp;·&nbsp; {row.description || "—"}</p>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, ...STATUS_STYLE[row.status] }}>{row.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {validRows.length === 0 && (
                                <div style={{ textAlign: "center", padding: "24px", background: T.redTint, border: `1px solid rgba(220,38,38,0.15)`, borderRadius: 10 }}>
                                    <i className="fa-solid fa-circle-exclamation" style={{ color: T.red, fontSize: 24, marginBottom: 8, display: "block" }}></i>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: T.red, margin: 0 }}>No valid rows to import</p>
                                    <p style={{ fontSize: 11, color: T.red, margin: "4px 0 0", opacity: 0.8 }}>Fix the errors in your CSV and try again</p>
                                </div>
                            )}
                        </>
                    )}

                    {step === "done" && importResult && (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <i className="fa-solid fa-circle-check" style={{ color: T.green, fontSize: 24 }}></i>
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Import Successful!</p>
                            <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 20px" }}>
                                <span style={{ fontWeight: 700, color: T.green }}>{importResult.success} feature{importResult.success !== 1 ? "s" : ""}</span> created.
                                {importResult.skipped > 0 && <> <span style={{ fontWeight: 700, color: T.red }}>{importResult.skipped} skipped</span>.</>}
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                                <button onClick={reset} style={BTN_CANCEL}>Import More</button>
                                <button onClick={onClose} style={BTN_PRIMARY}>Done</button>
                            </div>
                        </div>
                    )}
                </div>

                {step !== "done" && (
                    <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.borderLight}`, position: "sticky", bottom: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <button onClick={step === "preview" ? reset : onClose} style={BTN_CANCEL}>{step === "preview" ? "← Back" : "Cancel"}</button>
                        {step === "preview" && (
                            <button onClick={handleImport} disabled={importing || validRows.length === 0} style={{ ...BTN_PRIMARY, opacity: (importing || validRows.length === 0) ? 0.5 : 1 }}>
                                {importing ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Importing…</> : <><i className="fa-solid fa-file-import" style={{ marginRight: 6 }}></i>Import {validRows.length} Feature{validRows.length !== 1 ? "s" : ""}</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Test Case CSV Import Modal ────────────────────────────────────────────────
function TestCaseImportModal({ onClose, onSuccess, modules, flatFeatures, users }) {
    const fileInputRef = useRef(null);
    const [step, setStep] = useState("upload");
    const [dragging, setDragging] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [validRows, setValidRows] = useState([]);
    const [errorRows, setErrorRows] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const featureMap = useMemo(() => {
        const m = {};
        flatFeatures.forEach(f => {
            m[(f.feature_name || f.name || "").toLowerCase()] = { id: f.id, moduleId: f.moduleId };
            m[(f.feature_code || f.code || "").toLowerCase()] = { id: f.id, moduleId: f.moduleId };
        });
        return m;
    }, [flatFeatures]);

    const testerMap = useMemo(() => {
        const m = {};
        users.forEach(u => { m[u.name.toLowerCase()] = u.name; });
        return m;
    }, [users]);

    const downloadTemplate = () => {
        downloadCSV(
            ["Feature Name,Feature Code,Test Case Name,Description,Priority,Status,Assigned To"].concat([
                '"Login Feature","FEAT-001","Valid login with correct credentials","Test with correct email and password","High","Active","Alice"',
                '"Login Feature","FEAT-001","Invalid login with wrong password","Test with wrong password","Medium","Active",""',
            ]).join("\n"),
            "test_cases_import_template.csv"
        );
    };

    const validate = (rows) => {
        const valid = [], errors = [];
        // compute next TC id
        const allTCs = flatFeatures.flatMap(f => f.testCases);
        let tcMax = 0;
        allTCs.forEach(tc => { const m = (tc.tcId || "").match(/^TC-(\d+)$/i); if (m) tcMax = Math.max(tcMax, parseInt(m[1], 10)); });

        rows.forEach((row, idx) => {
            const errs = [];
            const featureName = (row["feature_name"] || row["feature"] || "").trim();
            const featureCode = (row["feature_code"] || "").trim();
            const name = (row["test_case_name"] || row["name"] || "").trim();
            const priority = (row["priority"] || "").trim();
            const status = (row["status"] || "Active").trim();

            const featureKey = featureCode.toLowerCase() || featureName.toLowerCase();
            const featureRef = featureMap[featureKey] || featureMap[featureName.toLowerCase()] || featureMap[featureCode.toLowerCase()];

            if (!name) errs.push("Test Case Name is required");
            if (!priority) errs.push("Priority is required");
            else if (!VALID_PRIORITIES.includes(priority)) errs.push(`Priority must be: ${VALID_PRIORITIES.join(" / ")}`);
            if (!featureName && !featureCode) errs.push("Feature Name or Feature Code is required");
            else if (!featureRef) errs.push(`Feature "${featureName || featureCode}" not found — must match an existing feature`);
            if (status && !VALID_TC_STATUSES.includes(status)) errs.push(`Status must be: ${VALID_TC_STATUSES.join(" / ")}`);

            if (errs.length) { errors.push({ rowNum: idx + 2, name: name || "(blank)", errors: errs }); }
            else {
                tcMax++;
                const tcId = `TC-${String(tcMax).padStart(3, "0")}`;
                const assignedTo = testerMap[(row["assigned_to"] || "").toLowerCase()] || null;
                valid.push({
                    id: generateUUID(), test_case_id: tcId,
                    name, description: (row["description"] || "").trim(),
                    feature_id: featureRef.id, module_id: featureRef.moduleId,
                    priority, status: status || "Active",
                    assigned_to: assignedTo,
                    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                });
            }
        });
        return { valid, errors };
    };

    const processFile = (file) => {
        if (!file?.name.endsWith(".csv")) { alert("Please upload a .csv file"); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const { rows } = parseCSV(e.target.result);
            if (!rows.length) { alert("CSV has no data rows."); return; }
            const { valid, errors } = validate(rows);
            setParsedRows(rows); setValidRows(valid); setErrorRows(errors); setStep("preview");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setImporting(true);
        const { data: { user } } = await supabase.auth.getUser();
        const rows = validRows.map(r => ({ ...r, created_by: user?.id || null }));
        const { error } = await supabase.from("test_cases").insert(rows);
        setImporting(false);
        if (error) { alert(`Import failed: ${error.message}`); return; }
        setImportResult({ success: validRows.length, skipped: errorRows.length });
        setStep("done"); onSuccess();
    };

    const reset = () => { setStep("upload"); setParsedRows([]); setValidRows([]); setErrorRows([]); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div className="fl-modal-enter" style={{ background: T.surface, borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,0.16)", width: "100%", maxWidth: 660, maxHeight: "90vh", overflowY: "auto", fontFamily: T.sans }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderLight}`, position: "sticky", top: 0, background: T.surface, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: T.purpleTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="fa-solid fa-vial" style={{ color: T.purple, fontSize: 14 }}></i>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Import Test Cases via CSV</h3>
                            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                                {step === "upload" && "Upload a CSV to bulk-create test cases under existing features"}
                                {step === "preview" && `${parsedRows.length} rows · ${validRows.length} valid · ${errorRows.length} errors`}
                                {step === "done" && "Import complete"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                </div>

                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {step === "upload" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.purpleTint, border: `1px solid rgba(124,58,237,0.15)`, borderRadius: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <i className="fa-solid fa-circle-info" style={{ color: T.purple, fontSize: 14 }}></i>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: T.purple, margin: 0 }}>Need a template?</p>
                                        <p style={{ fontSize: 11, color: T.purple, margin: 0, opacity: 0.75 }}>Download a pre-formatted CSV with example rows</p>
                                    </div>
                                </div>
                                <button onClick={downloadTemplate} style={{ padding: "6px 12px", background: T.surface, border: `1px solid rgba(124,58,237,0.25)`, color: T.purple, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                                    <i className="fa-solid fa-download" style={{ marginRight: 5 }}></i>Template
                                </button>
                            </div>

                            <div style={{ padding: "12px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Expected Columns</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {[["Feature Name", true], ["Feature Code", false], ["Test Case Name", true], ["Description", false], ["Priority", true], ["Status", false], ["Assigned To", false]].map(([col, req]) => (
                                        <span key={col} style={{ padding: "3px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.mono, color: T.textMid }}>
                                            {col}{req && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: T.textFaint, margin: "8px 0 0" }}>Priority: <span style={{ fontFamily: T.mono }}>High / Medium / Low</span> &nbsp;·&nbsp; Status: <span style={{ fontFamily: T.mono }}>Active / Draft / Archived</span> &nbsp;·&nbsp; Feature must match an existing feature name or code</p>
                            </div>

                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                style={{ border: `2px dashed ${dragging ? T.purple : T.border}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragging ? T.purpleTint : T.surfaceAlt, transition: "all 0.15s" }}
                            >
                                <div style={{ width: 44, height: 44, background: T.surface, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: `1px solid ${T.border}` }}>
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: dragging ? T.purple : T.textFaint, fontSize: 20 }}></i>
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: T.textMid, margin: "0 0 4px" }}>Drop CSV file here or click to browse</p>
                                <p style={{ fontSize: 11, color: T.textFaint, margin: 0 }}>.csv files only</p>
                                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => processFile(e.target.files[0])} />
                            </div>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                {[["Total Rows", parsedRows.length, T.textMid, T.surfaceAlt, T.border], ["Ready", validRows.length, T.green, T.greenLight, T.greenTint], ["Errors", errorRows.length, T.red, T.redTint, "rgba(220,38,38,0.15)"]].map(([label, val, fg, bg, border]) => (
                                    <div key={label} style={{ padding: "12px 14px", background: bg, border: `1px solid ${border}`, borderRadius: 10, textAlign: "center" }}>
                                        <p style={{ fontSize: 24, fontWeight: 700, color: fg, margin: 0 }}>{val}</p>
                                        <p style={{ fontSize: 11, color: T.textMuted, margin: "2px 0 0" }}>{label}</p>
                                    </div>
                                ))}
                            </div>

                            {errorRows.length > 0 && (
                                <div style={{ border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 10, overflow: "hidden" }}>
                                    <div style={{ padding: "10px 14px", background: T.redTint, borderBottom: `1px solid rgba(220,38,38,0.15)`, display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="fa-solid fa-triangle-exclamation" style={{ color: T.red, fontSize: 12 }}></i>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>Rows with errors (will be skipped)</span>
                                    </div>
                                    <div style={{ maxHeight: 140, overflowY: "auto" }}>
                                        {errorRows.map((er, i) => (
                                            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderLight}` }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: T.textMid, margin: "0 0 3px" }}>Row {er.rowNum}: <span style={{ fontWeight: 400 }}>{er.name}</span></p>
                                                {er.errors.map((e, j) => <p key={j} style={{ fontSize: 11, color: T.red, margin: "1px 0 0" }}>• {e}</p>)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {validRows.length > 0 && (
                                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                                    <div style={{ padding: "10px 14px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="fa-solid fa-check-circle" style={{ color: T.green, fontSize: 12 }}></i>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>Test cases to be created</span>
                                    </div>
                                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                                        {validRows.map((row, i) => (
                                            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "2px 7px", borderRadius: 5, flexShrink: 0 }}>{row.test_case_id}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</p>
                                                    {row.description && <p style={{ fontSize: 11, color: T.textMuted, margin: "1px 0 0" }}>{row.description}</p>}
                                                </div>
                                                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, ...PRIORITY_STYLE[row.priority] }}>{row.priority}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, ...STATUS_STYLE[row.status] }}>{row.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {validRows.length === 0 && (
                                <div style={{ textAlign: "center", padding: "24px", background: T.redTint, border: `1px solid rgba(220,38,38,0.15)`, borderRadius: 10 }}>
                                    <i className="fa-solid fa-circle-exclamation" style={{ color: T.red, fontSize: 24, marginBottom: 8, display: "block" }}></i>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: T.red, margin: 0 }}>No valid rows to import</p>
                                </div>
                            )}
                        </>
                    )}

                    {step === "done" && importResult && (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <i className="fa-solid fa-circle-check" style={{ color: T.green, fontSize: 24 }}></i>
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Import Successful!</p>
                            <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 20px" }}>
                                <span style={{ fontWeight: 700, color: T.green }}>{importResult.success} test case{importResult.success !== 1 ? "s" : ""}</span> created.
                                {importResult.skipped > 0 && <> <span style={{ fontWeight: 700, color: T.red }}>{importResult.skipped} skipped</span>.</>}
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                                <button onClick={reset} style={BTN_CANCEL}>Import More</button>
                                <button onClick={onClose} style={BTN_PRIMARY}>Done</button>
                            </div>
                        </div>
                    )}
                </div>

                {step !== "done" && (
                    <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.borderLight}`, position: "sticky", bottom: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <button onClick={step === "preview" ? reset : onClose} style={BTN_CANCEL}>{step === "preview" ? "← Back" : "Cancel"}</button>
                        {step === "preview" && (
                            <button onClick={handleImport} disabled={importing || validRows.length === 0} style={{ ...BTN_PRIMARY, opacity: (importing || validRows.length === 0) ? 0.5 : 1 }}>
                                {importing ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Importing…</> : <><i className="fa-solid fa-vial" style={{ marginRight: 6 }}></i>Import {validRows.length} Test Case{validRows.length !== 1 ? "s" : ""}</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const generateNextTcId = (allTestCases) => {
    let max = 0;
    for (const tc of allTestCases) {
        const m = (tc.tcId || tc.id || "").match(/^TC-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `TC-${String(max + 1).padStart(3, "0")}`;
};

const generateNextFeatCode = (allFeatures) => {
    let max = 0;
    for (const f of allFeatures) {
        const code = f.feature_code || f.code || "";
        const m = code.match(/^FEAT-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `FEAT-${String(max + 1).padStart(3, "0")}`;
};

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
        {/* ── FIX: show linked user stories ── */}
        <td style={{ padding: "10px 16px" }}>
            {tc.userStoryIds && tc.userStoryIds.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {tc.userStoryCodes && tc.userStoryCodes.length > 0
                        ? tc.userStoryCodes.map((code, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "1px 6px", borderRadius: 4 }}>{code}</span>
                        ))
                        : tc.userStoryIds.map((id, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "1px 6px", borderRadius: 4 }}>US</span>
                        ))
                    }
                </div>
            ) : (
                <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>—</span>
            )}
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

// ─── Feature Card ──────────────────────────────────────────────────────────────
const FeatureCard = memo(({ feat, isOpen, onToggle, onAddTC, onEdit, onDelete }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div className="fl-feat-card-row" style={{ padding: "14px 20px", cursor: "pointer", background: T.surface }} onClick={onToggle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                    <i className={`fa-solid fa-chevron-right fl-chevron${isOpen ? " open" : ""}`} style={{ color: T.textFaint, fontSize: 10 }}></i>
                </div>
            </div>
        </div>

        <div style={{ background: T.surfaceAlt, borderTop: `1px solid ${T.borderLight}`, padding: "8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans, flexShrink: 0 }}>Module</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid, fontFamily: T.sans }}>{feat.moduleName}</span>
            <Chip label={feat.moduleCode} style={{ background: T.blueTint, color: T.blue }} mono />
        </div>

        {isOpen && feat.testCases.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.borderLight}` }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                                {/* ── FIX: added User Stories column header ── */}
                                {["ID", "Name", "Priority", "Status", "Assignee", "User Stories", "Updated", ""].map(h => (
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

    const [showFeatureImport, setShowFeatureImport] = useState(false);
    const [showTCImport, setShowTCImport] = useState(false);

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
                // ── FIX: also fetch user_story_ids from test_cases ──
                { data: testCasesData, error: testCasesError },
                { data: storiesData, error: storiesError },
            ] = await Promise.all([
                supabase.from("modules").select("*").order("module_code", { ascending: false }),
                supabase.from("features").select("*"),
                supabase.from("test_cases").select("id, test_case_id, name, description, priority, status, updated_at, feature_id, module_id, assigned_to, user_story_ids"),
                supabase.from("user_stories").select("id, story_id, story_title"),
            ]);
            if (modulesError) throw modulesError;
            if (featuresError) console.warn("Features:", featuresError.message);
            if (testCasesError) console.warn("Test cases:", testCasesError.message);
            if (storiesError) console.warn("User stories:", storiesError.message);

            // ── Build a UUID → story_id code lookup map ──
            const storyCodeMap = {};
            for (const s of (storiesData || [])) {
                storyCodeMap[s.id] = s.story_id;
            }

            const feats = featuresData || [];
            const tcs = testCasesData || [];
            const tcsByFeature = {};
            for (const tc of tcs) {
                if (!tc.feature_id) continue;
                if (!tcsByFeature[tc.feature_id]) tcsByFeature[tc.feature_id] = [];
                // ── FIX: include user_story_ids and resolve to codes ──
                const userStoryIds = Array.isArray(tc.user_story_ids) ? tc.user_story_ids : [];
                const userStoryCodes = userStoryIds.map(uid => storyCodeMap[uid]).filter(Boolean);
                tcsByFeature[tc.feature_id].push({
                    id: tc.id,
                    tcId: tc.test_case_id || tc.id,
                    name: tc.name, description: tc.description,
                    priority: tc.priority, status: tc.status,
                    assignee: tc.assigned_to || null,
                    updated: new Date(tc.updated_at).toLocaleDateString(),
                    userStoryIds,
                    userStoryCodes,
                });
            }
            const featsByModule = {};
            for (const f of feats) {
                if (!featsByModule[f.module_id]) featsByModule[f.module_id] = [];
                featsByModule[f.module_id].push(f);
            }
            const enriched = (modulesData || []).map(mod => {
                const mf = featsByModule[mod.id] || [];
                const ef = mf.map(feat => ({
                    ...feat,
                    name: feat.feature_name || feat.name,
                    code: feat.feature_code || feat.code,
                    moduleId: mod.id,
                    moduleName: mod.module_name || mod.name,
                    moduleCode: mod.module_code,
                    testCasesCount: (tcsByFeature[feat.id] || []).length,
                    testCases: tcsByFeature[feat.id] || [],
                }));
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
            const { data, error } = await supabase
                .from("user_stories")
                .select("id, story_id, story_title")
                .order("story_id", { ascending: true });
            if (error) { console.warn("User stories:", error.message); return; }
            setUserStories(
                (data || []).map(s => ({
                    id: s.id,
                    code: s.story_id,
                    name: s.story_title || s.story_id,
                }))
            );
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        Promise.all([fetchModulesWithFeatures(), fetchUsers(), fetchUserStories()]);
    }, [fetchModulesWithFeatures, fetchUsers, fetchUserStories]);

    const flatFeatures = useMemo(() =>
        modules.flatMap(mod => mod.features.map(feat => {
            const assignedUser = users.find(u => u.id === feat.assign_to);
            return { ...feat, assign_to_name: assignedUser ? assignedUser.name : (feat.assign_to || null) };
        })),
        [modules, users]
    );

    const totalFeatures = useMemo(() => flatFeatures.length, [flatFeatures]);
    const totalModules = useMemo(() => modules.length, [modules]);
    const totalTestCases = useMemo(() => flatFeatures.reduce((a, f) => a + f.testCasesCount, 0), [flatFeatures]);

    const userOptions = useMemo(() => [{ id: "", name: "Select Assignee" }, ...users.map(u => ({ id: u.id, name: u.name }))], [users]);
    const testerOptions = useMemo(() => [{ id: "", name: "Select Tester" }, ...users.map(u => ({ id: u.name, name: u.name }))], [users]);
    const moduleOptions = useMemo(() => [{ id: "", name: "Choose Module" }, ...modules.map(m => ({ id: m.id, name: m.name }))], [modules]);

    const filteredFeatures = useMemo(() => {
        let list = flatFeatures;
        if (filterStatus) list = list.filter(f => (f.status || "Active").toLowerCase() === filterStatus.toLowerCase());
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.code.toLowerCase().includes(q) ||
                (f.moduleName || "").toLowerCase().includes(q) ||
                (f.moduleCode || "").toLowerCase().includes(q) ||
                f.testCases.some(tc =>
                    (tc.tcId || tc.id).toLowerCase().includes(q) ||
                    tc.name.toLowerCase().includes(q) ||
                    // ── FIX: also search by linked story codes ──
                    (tc.userStoryCodes || []).some(code => code.toLowerCase().includes(q))
                )
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
        setForm({
            id: tc.tcId,
            name: tc.name,
            description: tc.description,
            preconditions: "", steps: "", expected: "",
            assignee: tc.assignee || "",
            status: tc.status,
            priority: tc.priority,
            tags: "",
            // ── FIX: preserve userStoryIds on edit ──
            userStoryIds: tc.userStoryIds || [],
        });
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
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Must be logged in"); return; }
            const { error } = await supabase.from("test_cases").insert([{
                id: generateUUID(),
                test_case_id: form.id,
                name: form.name,
                description: form.description,
                feature_id: addModal.featureId || null,
                module_id: addModal.moduleId || null,
                priority: form.priority,
                status: form.status,
                created_by: user.id,
                assigned_to: form.assignee || null,
                // ── FIX: save user_story_ids as uuid array ──
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }]);
            if (error) throw error;
            setAddModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, addModal.featureId, addModal.moduleId, fetchModulesWithFeatures]);

    const handleEditTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        try {
            const { error } = await supabase.from("test_cases").update({
                name: form.name,
                description: form.description,
                priority: form.priority,
                status: form.status,
                // ── FIX: also update user_story_ids on edit ──
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                updated_at: new Date().toISOString(),
            }).eq("id", editModal.tc.id);
            if (error) throw error;
            setEditModal({ open: false }); fetchModulesWithFeatures();
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
                Priority: tc.priority, Status: tc.status,
                // ── FIX: include linked stories in CSV export ──
                "User Stories": (tc.userStoryCodes || []).join("; "),
                Type: "TEST_CASE",
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
                        <button className="fl-btn-ghost" onClick={() => setShowTCImport(true)} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-file-import" style={{ fontSize: 11 }}></i> Import Test Cases
                        </button>
                        <button className="fl-btn-ghost" onClick={() => setShowFeatureImport(true)} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-file-import" style={{ fontSize: 11 }}></i> Import Features
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

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                        {stats.map(s => <StatCard key={s.label} stat={s} />)}
                    </div>

                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 20, padding: "14px 18px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px", gap: 12 }}>
                            <div style={{ position: "relative" }}>
                                <input className="fl-input" type="text" placeholder="Search features, modules, test case IDs, story codes…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
                                <i className="fa-solid fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textFaint, fontSize: 12 }}></i>
                            </div>
                            <Dropdown options={FILTER_STATUS_OPT} selected={filterStatus} onChange={setFilterStatus} placeholder="All Status" />
                            <button className="fl-btn-ghost" onClick={() => { setSearchQuery(""); setFilterStatus(""); }} style={{ justifyContent: "center" }}>Clear</button>
                        </div>
                    </div>

                    {filteredFeatures.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 48, height: 48, background: T.surfaceAlt, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <i className="fa-solid fa-inbox" style={{ color: T.textFaint, fontSize: 20 }}></i>
                            </div>
                            <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No features found. Create one to get started.</p>
                        </div>
                    )}

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

            {/* ── Feature Import Modal ── */}
            {showFeatureImport && (
                <FeatureImportModal
                    onClose={() => setShowFeatureImport(false)}
                    onSuccess={() => { fetchModulesWithFeatures(); setShowFeatureImport(false); }}
                    modules={modules}
                    flatFeatures={flatFeatures}
                    users={users}
                />
            )}

            {/* ── Test Case Import Modal ── */}
            {showTCImport && (
                <TestCaseImportModal
                    onClose={() => setShowTCImport(false)}
                    onSuccess={() => { fetchModulesWithFeatures(); setShowTCImport(false); }}
                    modules={modules}
                    flatFeatures={flatFeatures}
                    users={users}
                />
            )}

            {/* ── Add Feature Modal ── */}
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
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8 }}>
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

            {/* ── Edit Feature Modal ── */}
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

            {/* ── Delete Feature Modal ── */}
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

            {/* ── Add Test Case Modal ── */}
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
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8 }}>
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
                            <Field label="Description">
                                <textarea className="fl-input" rows="3" placeholder="Brief description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>

                            {/* ── User Stories multi-select ── */}
                            <Field label="User Stories">
                                <MultiSelectDropdown
                                    options={userStories}
                                    selected={form.userStoryIds}
                                    onChange={ids => setForm(f => ({ ...f, userStoryIds: ids }))}
                                    placeholder={userStories.length === 0 ? "No user stories available" : "Select user stories…"}
                                />
                            </Field>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Assigned To">
                                    <Dropdown options={testerOptions} selected={form.assignee} onChange={v => setForm(f => ({ ...f, assignee: v }))} placeholder="Select Tester" />
                                </Field>
                                <Field label="Status" required>
                                    <Dropdown options={STATUS_OPTIONS} selected={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                                </Field>
                            </div>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setAddModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleAddTestCase} style={BTN_PRIMARY}>Add Test Case</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Test Case Modal ── */}
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

                            {/* ── FIX: added User Stories to edit modal too ── */}
                            <Field label="User Stories">
                                <MultiSelectDropdown
                                    options={userStories}
                                    selected={form.userStoryIds}
                                    onChange={ids => setForm(f => ({ ...f, userStoryIds: ids }))}
                                    placeholder={userStories.length === 0 ? "No user stories available" : "Select user stories…"}
                                />
                            </Field>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Status" required>
                                    <Dropdown options={STATUS_OPTIONS} selected={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                                </Field>
                            </div>
                        </div>
                        <div style={MODAL_FOOTER}>
                            <button onClick={() => setEditModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                            <button onClick={handleEditTestCase} style={BTN_PRIMARY}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Test Case Modal ── */}
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
        </div>
    );
}