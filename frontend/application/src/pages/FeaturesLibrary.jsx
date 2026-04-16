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
                <span style={{
                    position: "absolute", right: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    transition: "transform 0.2s", color: open ? T.green : T.textFaint, display: "flex",
                }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0,
                    zIndex: 9999, background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    animation: "ddIn 0.16s cubic-bezier(.4,0,.2,1)", overflow: "hidden",
                }}>
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
const TEST_TYPE_OPTIONS = [
    { id: "", name: "Select Type" },
    { id: "Functional", name: "Functional" },
    { id: "Integration", name: "Integration" },
    { id: "Regression", name: "Regression" },
    { id: "Smoke", name: "Smoke" },
    { id: "Sanity", name: "Sanity" },
    { id: "Performance", name: "Performance" },
    { id: "Security", name: "Security" },
    { id: "UI/UX", name: "UI/UX" },
    { id: "API", name: "API" },
    { id: "Exploratory", name: "Exploratory" },
];

const emptyForm = { id: "", name: "", description: "", test_type: "", test_scenario: "", pre_requisites: "", test_steps: "", expected_result: "", assignee: "", status: "Active", priority: "", tags: "", userStoryIds: [] };
const emptyFeatureForm = { moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };
const emptyEditFeatureForm = { id: "", moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

const generateNextFeatCode = (allFeatures) => {
    let max = 0;
    for (const f of allFeatures) {
        const code = f.feature_code || f.code || "";
        const m = code.match(/^FEAT-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `FEAT-${String(max + 1).padStart(3, "0")}`;
};

// ─── CSV template column definitions ──────────────────────────────────────────
const FEATURE_IMPORT_COLUMNS = [
    { name: "Module name", req: true, hint: "Exact module name e.g. Authentication" },
    { name: "Feature Name", req: true, hint: "e.g. Two-Factor Authentication" },
    { name: "Feature Code", req: true, hint: "e.g. FEAT-001" },
    { name: "User Story", req: true, hint: "e.g. US-015" },
    { name: "Description", req: true, hint: "Brief description of the feature" },
    { name: "Assign To", req: true, hint: "Full name of assignee (must match a user in the system)" },
    { name: "Status", req: true, hint: "Active / Draft / Archived" },
];

const TC_IMPORT_COLUMNS = [
    { name: "Feature Code", req: true, hint: "e.g. FEAT-001 (must exist in the system)" },
    { name: "TC Name", req: true, hint: "Short descriptive name" },
    { name: "Priority", req: true, hint: "High / Medium / Low" },
    { name: "Status", req: true, hint: "Active / Draft / Archived" },
    { name: "Test Type", req: true, hint: "Functional / Integration / Regression / Smoke / Sanity / Performance / Security / UI/UX / API / Exploratory" },
    { name: "Description", req: true, hint: "Brief description of what is being tested" },
    { name: "Test Scenario", req: true, hint: "High-level scenario narrative" },
    { name: "Pre-Requisites", req: true, hint: "Conditions that must be true before running" },
    { name: "Test Steps", req: true, hint: "Numbered step-by-step instructions" },
    { name: "Expected Result", req: true, hint: "What should happen if the test passes" },
    { name: "Assigned To", req: true, hint: "Tester full name" },
    { name: "User Story IDs", req: false, hint: "Optional · Semicolon-separated story_id codes e.g. US-001;US-002" },
];

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

// ─── Test Case Row ─────────────────────────────────────────────────────────────
const TEST_TYPE_COLORS = {
    Functional: { bg: "rgba(37,99,235,0.08)", fg: "#1D4ED8" },
    Integration: { bg: "rgba(124,58,237,0.08)", fg: "#7C3AED" },
    Regression: { bg: "rgba(217,119,6,0.08)", fg: "#B45309" },
    Smoke: { bg: "rgba(20,184,166,0.08)", fg: "#0F766E" },
    Sanity: { bg: "rgba(34,197,94,0.08)", fg: "#15803D" },
    Performance: { bg: "rgba(239,68,68,0.08)", fg: "#DC2626" },
    Security: { bg: "rgba(239,68,68,0.12)", fg: "#B91C1C" },
    "UI/UX": { bg: "rgba(236,72,153,0.08)", fg: "#BE185D" },
    API: { bg: "rgba(14,165,233,0.08)", fg: "#0369A1" },
    Exploratory: { bg: "rgba(107,114,128,0.08)", fg: "#4B5563" },
};

const DetailSection = ({ icon, label, value }) => value ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans, display: "flex", alignItems: "center", gap: 5 }}>
            <i className={`fa-solid ${icon}`} style={{ fontSize: 9 }}></i>{label}
        </span>
        <p style={{ fontSize: 12, color: T.textMid, margin: 0, fontFamily: T.sans, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</p>
    </div>
) : null;

const TestCaseRow = memo(({ tc, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const hasDetails = tc.test_type || tc.test_scenario || tc.pre_requisites || tc.test_steps || tc.expected_result;
    const typeStyle = TEST_TYPE_COLORS[tc.test_type] || {};

    return (
        <>
            <tr className="fl-tc-row" style={{ borderBottom: expanded ? "none" : `1px solid ${T.borderLight}` }}>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "2px 8px", borderRadius: 5 }}>{tc.tcId}</span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 12, color: T.text, fontWeight: 500, margin: 0, fontFamily: T.sans }}>{tc.name}</p>
                        {tc.test_type && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: T.mono, background: typeStyle.bg, color: typeStyle.fg }}>{tc.test_type}</span>
                        )}
                    </div>
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
                        {hasDetails && (
                            <button
                                className="fl-icon-btn"
                                onClick={() => setExpanded(p => !p)}
                                title={expanded ? "Hide details" : "Show details"}
                                style={{ color: expanded ? T.blue : T.textFaint }}
                            >
                                <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`} style={{ fontSize: 10 }}></i>
                            </button>
                        )}
                        <button className="fl-icon-btn edit" onClick={onEdit} title="Edit"><i className="fa-solid fa-pen-to-square"></i></button>
                        <button className="fl-icon-btn delete" onClick={onDelete} title="Delete"><i className="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
            {expanded && hasDetails && (
                <tr style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td colSpan={8} style={{ padding: 0, background: "#FAFBF8" }}>
                        <div style={{ padding: "16px 20px", borderTop: `1px dashed ${T.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className="fa-solid fa-file-lines" style={{ color: T.green, fontSize: 10 }}></i>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.sans }}>Test Case Template</span>
                                <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.mono }}>{tc.tcId}</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <DetailSection icon="fa-tag" label="Test Type" value={tc.test_type} />
                                    <DetailSection icon="fa-align-left" label="Test Scenario" value={tc.test_scenario} />
                                    <DetailSection icon="fa-list-check" label="Pre-Requisites" value={tc.pre_requisites} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <DetailSection icon="fa-shoe-prints" label="Test Steps" value={tc.test_steps} />
                                    <DetailSection icon="fa-circle-check" label="Expected Result" value={tc.expected_result} />
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
});

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

    // ── Import state ──
    const [importModal, setImportModal] = useState({ open: false });
    const [importFile, setImportFile] = useState(null);
    const [importRows, setImportRows] = useState([]);
    const [importType, setImportType] = useState("features");
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState("");
    const [importSuccess, setImportSuccess] = useState("");
    const importFileRef = useRef(null);

    // ─── Data fetching ────────────────────────────────────────────────────────
    const fetchModulesWithFeatures = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const [
                { data: modulesData, error: modulesError },
                { data: featuresData, error: featuresError },
                { data: testCasesData, error: testCasesError },
                { data: storiesData, error: storiesError },
            ] = await Promise.all([
                supabase.from("modules").select("*").order("module_code", { ascending: false }),
                supabase.from("features").select("*"),
                supabase.from("test_cases").select("id, test_case_id, name, description, priority, status, updated_at, feature_id, module_id, assigned_to, user_story_ids, test_type, test_scenario, pre_requisites, test_steps, expected_result"),
                supabase.from("user_stories").select("id, story_id, story_title"),
            ]);
            if (modulesError) throw modulesError;
            if (featuresError) console.warn("Features:", featuresError.message);
            if (testCasesError) console.warn("Test cases:", testCasesError.message);
            if (storiesError) console.warn("User stories:", storiesError.message);

            const storyCodeMap = {};
            for (const s of (storiesData || [])) storyCodeMap[s.id] = s.story_id;

            const feats = featuresData || [];
            const tcs = testCasesData || [];
            const tcsByFeature = {};
            for (const tc of tcs) {
                if (!tc.feature_id) continue;
                if (!tcsByFeature[tc.feature_id]) tcsByFeature[tc.feature_id] = [];
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
                    test_type: tc.test_type || "",
                    test_scenario: tc.test_scenario || "",
                    pre_requisites: tc.pre_requisites || "",
                    test_steps: tc.test_steps || "",
                    expected_result: tc.expected_result || "",
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
            setUserStories((data || []).map(s => ({ id: s.id, code: s.story_id, name: s.story_title || s.story_id })));
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        Promise.all([fetchModulesWithFeatures(), fetchUsers(), fetchUserStories()]);
    }, [fetchModulesWithFeatures, fetchUsers, fetchUserStories]);

    // ─── Derived data ─────────────────────────────────────────────────────────
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

    const getNextTcId = useCallback(async () => {
        try {
            const { data } = await supabase.from("test_cases").select("test_case_id");
            let max = 0;
            for (const row of (data || [])) {
                const m = (row.test_case_id || "").match(/^TC-(\d+)$/i);
                if (m) max = Math.max(max, parseInt(m[1], 10));
            }
            return `TC-${String(max + 1).padStart(3, "0")}`;
        } catch (_) { return `TC-${Date.now()}`; }
    }, []);

    const openAddModal = useCallback(async (e, moduleId, featureId) => {
        e.stopPropagation();
        const nextId = await getNextTcId();
        setForm({ ...emptyForm, id: nextId });
        setAddModal({ open: true, featureId, moduleId });
    }, [getNextTcId]);

    const openEditModal = useCallback((e, moduleId, featureId, tc) => {
        e.stopPropagation();
        setForm({
            id: tc.tcId,
            name: tc.name,
            description: tc.description,
            test_type: tc.test_type || "",
            test_scenario: tc.test_scenario || "",
            pre_requisites: tc.pre_requisites || "",
            test_steps: tc.test_steps || "",
            expected_result: tc.expected_result || "",
            assignee: tc.assignee || "",
            status: tc.status,
            priority: tc.priority,
            tags: "",
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

    // ─── CRUD handlers ────────────────────────────────────────────────────────
    const handleAddTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Must be logged in"); return; }
            const freshId = await getNextTcId();
            const { error } = await supabase.from("test_cases").insert([{
                id: generateUUID(),
                test_case_id: freshId,
                name: form.name,
                description: form.description,
                feature_id: addModal.featureId || null,
                module_id: addModal.moduleId || null,
                priority: form.priority,
                status: form.status,
                created_by: user.id,
                assigned_to: form.assignee || null,
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                test_type: form.test_type || null,
                test_scenario: form.test_scenario || null,
                pre_requisites: form.pre_requisites || null,
                test_steps: form.test_steps || null,
                expected_result: form.expected_result || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }]);
            if (error) throw error;
            setAddModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, addModal.featureId, addModal.moduleId, fetchModulesWithFeatures, getNextTcId]);

    const handleEditTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        try {
            const { error } = await supabase.from("test_cases").update({
                name: form.name,
                description: form.description,
                priority: form.priority,
                status: form.status,
                user_story_ids: form.userStoryIds.length > 0 ? form.userStoryIds : null,
                test_type: form.test_type || null,
                test_scenario: form.test_scenario || null,
                pre_requisites: form.pre_requisites || null,
                test_steps: form.test_steps || null,
                expected_result: form.expected_result || null,
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

    // ─── CSV Import ───────────────────────────────────────────────────────────
    const parseCSV = useCallback((text) => {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
        return lines.slice(1).map(line => {
            const vals = [];
            let cur = "", inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { inQ = !inQ; }
                else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
                else { cur += ch; }
            }
            vals.push(cur.trim());
            const row = {};
            headers.forEach((h, i) => { row[h] = vals[i] || ""; });
            return row;
        }).filter(row => Object.values(row).some(v => v));
    }, []);

    const validateImportRows = useCallback((rows, type) => {
        const requiredCols = type === "features"
            ? FEATURE_IMPORT_COLUMNS.filter(c => c.req).map(c => c.name)
            : TC_IMPORT_COLUMNS.filter(c => c.req).map(c => c.name);

        const missingHeaders = requiredCols.filter(col => !(col in rows[0]));
        if (missingHeaders.length) {
            return `Missing required column(s): ${missingHeaders.join(", ")}`;
        }
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const emptyFields = requiredCols.filter(col => !row[col] || !row[col].trim());
            if (emptyFields.length) {
                return `Row ${i + 2}: required field(s) are empty — ${emptyFields.join(", ")}`;
            }
        }
        return null;
    }, []);

    const handleImportFile = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFile(file);
        setImportError("");
        setImportSuccess("");
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const rows = parseCSV(ev.target.result);
                if (!rows.length) { setImportError("No data rows found in the CSV."); setImportRows([]); return; }
                setImportRows(rows);
            } catch (err) { setImportError("Failed to parse CSV: " + err.message); setImportRows([]); }
        };
        reader.readAsText(file);
    }, [parseCSV]);

    // ── FIX: corrected handleImportSubmit ─────────────────────────────────────
    const handleImportSubmit = useCallback(async () => {
        if (!importRows.length) return;

        const validationError = validateImportRows(importRows, importType);
        if (validationError) { setImportError(validationError); return; }

        setImportLoading(true); setImportError(""); setImportSuccess("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Must be logged in");

            if (importType === "features") {
                // Build module lookup: both name (lowercase) and code → UUID
                const modMap = {};
                for (const m of modules) {
                    const code = String(m.module_code || "").trim();
                    if (code) modMap[code.toLowerCase()] = m.id;
                    const name = String(m.module_name || m.name || "").trim();
                    if (name) modMap[name.toLowerCase()] = m.id;
                }

                // Build user name → UUID map
                const userMap = {};
                for (const u of users) {
                    if (u.name) userMap[u.name.toLowerCase()] = u.id;
                }

                // ── STEP 1: Check all module names resolve — block import if any don't ──
                const VALID_STATUSES = ["active", "draft", "archived"];
                const rowErrors = [];
                importRows.forEach((row, i) => {
                    const moduleKey = String(row["Module name"] || "").trim().toLowerCase();
                    if (!modMap[moduleKey]) {
                        rowErrors.push(`Row ${i + 2}: Module "${row["Module name"]}" not found. Available modules: ${modules.map(m => m.module_name || m.name).join(", ")}`);
                    }
                    const status = (row["Status"] || "").trim().toLowerCase();
                    if (status && !VALID_STATUSES.includes(status)) {
                        rowErrors.push(`Row ${i + 2}: Status "${row["Status"]}" is invalid. Use: Active, Draft, or Archived`);
                    }
                });
                if (rowErrors.length) {
                    setImportError(rowErrors.join("\n"));
                    return;
                }

                // ── STEP 2: Check for duplicate feature codes ──
                const { data: existingFeatures } = await supabase.from("features").select("feature_code");
                const existingCodes = new Set((existingFeatures || []).map(f => (f.feature_code || "").trim().toLowerCase()));

                const skippedDuplicates = [];
                const inserts = importRows
                    .map(row => {
                        const moduleKey = String(row["Module name"] || "").trim().toLowerCase();
                        const moduleId = modMap[moduleKey];
                        const assignToName = String(row["Assign To"] || "").trim().toLowerCase();
                        const assignToId = userMap[assignToName] || null;
                        const rawStatus = (row["Status"] || "Active").trim();
                        // Normalize status to proper case
                        const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
                        return {
                            module_id: moduleId,
                            feature_name: row["Feature Name"].trim(),
                            feature_code: row["Feature Code"].trim(),
                            user_story: row["User Story"].trim() || null,
                            description: row["Description"].trim() || null,
                            assign_to: assignToId,
                            status: status || "Active",
                            created_at: new Date().toISOString(),
                        };
                    })
                    .filter(row => {
                        const isDuplicate = existingCodes.has((row.feature_code || "").toLowerCase());
                        if (isDuplicate) skippedDuplicates.push(row.feature_code);
                        return !isDuplicate;
                    });

                if (!inserts.length) {
                    setImportError(`All ${importRows.length} row(s) were skipped — feature codes already exist: ${skippedDuplicates.join(", ")}`);
                    return;
                }

                const { error } = await supabase.from("features").insert(inserts);
                if (error) throw error;

                const skippedMsg = skippedDuplicates.length
                    ? ` (${skippedDuplicates.length} duplicate(s) skipped: ${skippedDuplicates.join(", ")})`
                    : "";
                setImportSuccess(`✓ Successfully imported ${inserts.length} feature(s).${skippedMsg}`);

            } else {
                // Test cases
                const featMap = {};
                for (const m of modules) {
                    for (const f of m.features) {
                        featMap[(f.code || "").trim()] = { id: f.id, moduleId: m.id };
                    }
                }

                // FIX 3: build story_id code → UUID map so user_story_ids stores UUIDs
                const storyUUIDMap = {};
                for (const s of userStories) {
                    if (s.code) storyUUIDMap[s.code] = s.id;   // s.code = "US-001", s.id = UUID
                }

                const { data: allTcIds } = await supabase.from("test_cases").select("test_case_id");
                let tcCounter = 0;
                for (const row of (allTcIds || [])) {
                    const m = (row.test_case_id || "").match(/^TC-(\d+)$/i);
                    if (m) tcCounter = Math.max(tcCounter, parseInt(m[1], 10));
                }

                const inserts = importRows.map(row => {
                    const feat = featMap[(row["Feature Code"] || "").trim()] || {};
                    tcCounter++;

                    // FIX: convert semicolon-separated story codes to actual UUIDs
                    const rawStoryCodes = row["User Story IDs"]
                        ? row["User Story IDs"].split(/[;,]/).map(s => s.trim()).filter(Boolean)
                        : [];
                    const storyUUIDs = rawStoryCodes
                        .map(code => storyUUIDMap[code])
                        .filter(Boolean);   // drop any codes with no matching UUID

                    return {
                        id: generateUUID(),
                        test_case_id: `TC-${String(tcCounter).padStart(3, "0")}`,
                        name: row["TC Name"].trim(),
                        description: row["Description"].trim() || null,
                        priority: row["Priority"].trim() || "Medium",
                        status: row["Status"].trim() || "Active",
                        feature_id: feat.id || null,
                        module_id: feat.moduleId || null,
                        test_type: row["Test Type"].trim() || null,
                        test_scenario: row["Test Scenario"].trim() || null,
                        pre_requisites: row["Pre-Requisites"].trim() || null,
                        test_steps: row["Test Steps"].trim() || null,
                        expected_result: row["Expected Result"].trim() || null,
                        assigned_to: row["Assigned To"].trim() || null,
                        user_story_ids: storyUUIDs.length > 0 ? storyUUIDs : null,  // ✅ UUIDs
                        created_by: user.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                });

                const { error } = await supabase.from("test_cases").insert(inserts);
                if (error) throw error;
                setImportSuccess(`✓ Successfully imported ${inserts.length} test case(s).`);
            }

            fetchModulesWithFeatures();
        } catch (err) { setImportError(err.message); }
        finally { setImportLoading(false); }
    }, [importRows, importType, modules, users, userStories, fetchModulesWithFeatures, validateImportRows]);

    const openImportModal = useCallback((type = "features") => {
        setImportModal({ open: true });
        setImportFile(null); setImportRows([]); setImportError(""); setImportSuccess("");
        setImportType(type);
    }, []);

    const downloadSampleTemplate = useCallback((type) => {
        const cols = type === "features" ? FEATURE_IMPORT_COLUMNS : TC_IMPORT_COLUMNS;
        const headers = cols.map(c => c.name);
        const escape = (v) => {
            const s = String(v ?? "");
            return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csvLines = [headers.join(",")];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${type}_import_template.csv`;
        a.click();
    }, []);

    const exportToCSV = useCallback(() => {
        if (!flatFeatures.length) { alert("No data"); return; }
        const rows = [];
        flatFeatures.forEach(feat => {
            rows.push({ Module: feat.moduleName, "Module name": feat.moduleCode, Feature: feat.name, "Feature Code": feat.code, "User Story": feat.user_story || "", Status: feat.status || "Active", Type: "FEATURE" });
            feat.testCases.forEach(tc => rows.push({
                Module: feat.moduleName, "Module name": feat.moduleCode,
                Feature: feat.name, "Feature Code": feat.code,
                "TC ID": tc.tcId, "TC Name": tc.name,
                Priority: tc.priority, Status: tc.status,
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

            {/* ── Header ── */}
            <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, zIndex: 40, position: "sticky", top: 0 }}>
                <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>Features Library</h2>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0", lineHeight: 1.5 }}>All features with linked modules and test cases</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="fl-btn-ghost" onClick={() => openImportModal("features")} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i> Import Features
                        </button>
                        <button className="fl-btn-ghost" onClick={() => openImportModal("testcases")} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i> Import Test Cases
                        </button>
                        <button className="fl-btn-ghost" onClick={exportToCSV} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Export
                        </button>
                        <button className="fl-btn-primary" onClick={openAddFeatureModal} style={{ padding: "8px 16px", fontSize: 13 }}>
                            <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i> Add Feature
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main content ── */}
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
                            <Field label="Feature Code">
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, fontFamily: T.mono }}>{featureForm.code}</span>
                                    <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>Auto-generated</span>
                                </div>
                            </Field>
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
                    <div className="fl-modal-enter" style={modalBox("680px")} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Add Test Case</h3>
                            <button onClick={() => setAddModal({ open: false })} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: "12px 14px" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", fontFamily: T.sans }}>Identifiers</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <Field label="Test Case ID">
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, fontFamily: T.mono }}>{form.id}</span>
                                            <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.sans }}>Auto</span>
                                        </div>
                                    </Field>
                                    <Field label="Priority" required>
                                        <Dropdown options={PRIORITY_WITH_PH} selected={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                    </Field>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Case Name" required>
                                    <input className="fl-input" type="text" placeholder="e.g., Valid login with correct credentials" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </Field>
                                <Field label="Test Type">
                                    <Dropdown options={TEST_TYPE_OPTIONS} selected={form.test_type} onChange={v => setForm(f => ({ ...f, test_type: v }))} placeholder="Select Type" />
                                </Field>
                            </div>
                            <Field label="Description">
                                <textarea className="fl-input" rows="2" placeholder="Brief description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Scenario">
                                <textarea className="fl-input" rows="2" placeholder="Describe the scenario being tested…" value={form.test_scenario} onChange={e => setForm(f => ({ ...f, test_scenario: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Pre-Requisites">
                                <textarea className="fl-input" rows="2" placeholder="List all conditions that must be met before running this test…" value={form.pre_requisites} onChange={e => setForm(f => ({ ...f, pre_requisites: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Steps">
                                <textarea className="fl-input" rows="4" placeholder={"1. Navigate to login page\n2. Enter valid credentials\n3. Click Sign In…"} value={form.test_steps} onChange={e => setForm(f => ({ ...f, test_steps: e.target.value }))} style={{ resize: "vertical" }} />
                            </Field>
                            <Field label="Expected Result">
                                <textarea className="fl-input" rows="2" placeholder="Describe what the expected outcome should be…" value={form.expected_result} onChange={e => setForm(f => ({ ...f, expected_result: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
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
                    <div className="fl-modal-enter" style={modalBox("680px")} onClick={e => e.stopPropagation()}>
                        <div style={MODAL_HEADER}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Edit Test Case</h3>
                            <button onClick={() => setEditModal({ open: false })} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: "12px 14px" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", fontFamily: T.sans }}>Identifiers</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <Field label="Test Case ID">
                                        <input className="fl-input" type="text" value={form.id} readOnly style={{ background: T.surface, color: T.textMuted, cursor: "default" }} />
                                    </Field>
                                    <Field label="Priority" required>
                                        <Dropdown options={PRIORITY_OPTIONS} selected={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                    </Field>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Test Case Name" required>
                                    <input className="fl-input" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </Field>
                                <Field label="Test Type">
                                    <Dropdown options={TEST_TYPE_OPTIONS} selected={form.test_type} onChange={v => setForm(f => ({ ...f, test_type: v }))} placeholder="Select Type" />
                                </Field>
                            </div>
                            <Field label="Description">
                                <textarea className="fl-input" rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Scenario">
                                <textarea className="fl-input" rows="2" placeholder="Describe the scenario being tested…" value={form.test_scenario} onChange={e => setForm(f => ({ ...f, test_scenario: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Pre-Requisites">
                                <textarea className="fl-input" rows="2" placeholder="List all conditions that must be met before running this test…" value={form.pre_requisites} onChange={e => setForm(f => ({ ...f, pre_requisites: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
                            <Field label="Test Steps">
                                <textarea className="fl-input" rows="4" placeholder={"1. Navigate to login page\n2. Enter valid credentials\n3. Click Sign In…"} value={form.test_steps} onChange={e => setForm(f => ({ ...f, test_steps: e.target.value }))} style={{ resize: "vertical" }} />
                            </Field>
                            <Field label="Expected Result">
                                <textarea className="fl-input" rows="2" placeholder="Describe what the expected outcome should be…" value={form.expected_result} onChange={e => setForm(f => ({ ...f, expected_result: e.target.value }))} style={{ resize: "none" }} />
                            </Field>
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

            {/* ── Import CSV Modal ── */}
            {importModal.open && (
                <div style={OVERLAY} onClick={() => setImportModal({ open: false })}>
                    <div className="fl-modal-enter" style={{ ...modalBox("640px"), maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 42, height: 42, background: T.greenLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <i className={`fa-solid ${importType === "features" ? "fa-list-check" : "fa-vial"}`} style={{ color: T.green, fontSize: 17 }}></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 2px", letterSpacing: "-0.01em" }}>
                                        Import {importType === "features" ? "Features" : "Test Cases"} via CSV
                                    </h3>
                                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                                        All columns are <strong style={{ color: T.red }}>required</strong> — download the template for correct formatting
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setImportModal({ open: false })} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, marginTop: -2 }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

                            {/* Template banner */}
                            <div style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <i className="fa-solid fa-circle-info" style={{ color: T.blue, fontSize: 15, flexShrink: 0 }}></i>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1E40AF", margin: 0 }}>Download the CSV template to get started</p>
                                </div>
                                <button
                                    onClick={() => downloadSampleTemplate(importType)}
                                    style={{
                                        flexShrink: 0, padding: "7px 14px", borderRadius: 7, cursor: "pointer",
                                        fontSize: 12, fontWeight: 600, fontFamily: T.sans,
                                        background: T.surface, border: `1.5px solid #93C5FD`, color: "#1D4ED8",
                                        display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.13s", whiteSpace: "nowrap",
                                    }}
                                >
                                    <i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Template
                                </button>
                            </div>

                            {/* Expected columns */}
                            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontFamily: T.sans }}>
                                    Required Columns <span style={{ color: T.red }}>*</span>
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                    {(importType === "features" ? FEATURE_IMPORT_COLUMNS : TC_IMPORT_COLUMNS).map(col => (
                                        <span key={col.name} style={{
                                            display: "inline-flex", alignItems: "center", gap: 2,
                                            padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                                            background: T.greenLight, border: `1px solid ${T.greenTint}`,
                                            color: T.green, fontFamily: T.sans,
                                        }}>
                                            {col.name}<span style={{ color: T.red, marginLeft: 1, fontWeight: 700 }}>*</span>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {(importType === "features" ? FEATURE_IMPORT_COLUMNS : TC_IMPORT_COLUMNS).map(col => (
                                        <p key={col.name} style={{ fontSize: 11, color: T.textFaint, margin: 0, fontFamily: T.sans }}>
                                            <span style={{ fontWeight: 600, color: T.textMuted }}>{col.name}:</span> {col.hint}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div
                                style={{
                                    border: `2px dashed ${importFile ? T.green : "#D1D5DB"}`,
                                    borderRadius: 12, padding: "36px 24px", textAlign: "center",
                                    background: importFile ? T.greenLight : "#FAFAFA",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}
                                onClick={() => importFileRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); }}
                                onDrop={e => {
                                    e.preventDefault();
                                    const f = e.dataTransfer.files[0];
                                    if (f) { if (importFileRef.current) importFileRef.current.value = ""; handleImportFile({ target: { files: [f] } }); setImportFile(f); }
                                }}
                            >
                                <input ref={importFileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleImportFile} />
                                {importFile ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                        <i className="fa-solid fa-file-csv" style={{ fontSize: 28, color: T.green }}></i>
                                        <div style={{ textAlign: "left" }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: T.green, margin: "0 0 2px" }}>{importFile.name}</p>
                                            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{importRows.length} row{importRows.length !== 1 ? "s" : ""} detected</p>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); setImportFile(null); setImportRows([]); setImportError(""); setImportSuccess(""); if (importFileRef.current) importFileRef.current.value = ""; }}
                                            style={{ marginLeft: 6, background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 15, padding: 4 }}
                                        >
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 20, color: "#9CA3AF" }}></i>
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: T.textMid, margin: "0 0 4px", fontFamily: T.sans }}>Drop your CSV file here</p>
                                        <p style={{ fontSize: 12, color: T.textFaint, margin: 0, fontFamily: T.sans }}>or click to browse · .csv files only</p>
                                    </>
                                )}
                            </div>

                            {/* Preview table */}
                            {importRows.length > 0 && (
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px", fontFamily: T.sans }}>
                                        Preview <span style={{ fontWeight: 400, textTransform: "none", color: T.textFaint }}>· first {Math.min(5, importRows.length)} of {importRows.length} rows</span>
                                    </p>
                                    <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: T.sans }}>
                                            <thead>
                                                <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                                                    {Object.keys(importRows[0]).map(h => (
                                                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: T.textMuted, whiteSpace: "nowrap", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importRows.slice(0, 5).map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}`, background: i % 2 === 0 ? T.surface : T.surfaceAlt }}>
                                                        {Object.values(row).map((v, j) => (
                                                            <td key={j} style={{ padding: "7px 12px", color: T.textMid, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {v || <span style={{ color: T.textFaint }}>—</span>}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Error / Success banners */}
                            {importError && (
                                <div style={{ background: T.redTint, border: `1px solid rgba(220,38,38,0.2)`, color: T.red, padding: "10px 14px", borderRadius: 8, fontSize: 12 }}>
                                    {importError.split("\n").map((line, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < importError.split("\n").length - 1 ? 6 : 0 }}>
                                            <i className="fa-solid fa-circle-exclamation" style={{ marginTop: 2, flexShrink: 0 }}></i>
                                            <span>{line}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {importSuccess && (
                                <div style={{ background: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.25)`, color: "#15803D", padding: "10px 14px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                    <i className="fa-solid fa-circle-check"></i> {importSuccess}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: T.surface }}>
                            <button onClick={() => setImportModal({ open: false })} style={BTN_CANCEL}>Cancel</button>
                            {importRows.length > 0 && (
                                <button
                                    onClick={handleImportSubmit}
                                    disabled={importLoading}
                                    style={{ ...BTN_PRIMARY, padding: "9px 20px", fontSize: 13, opacity: importLoading ? 0.7 : 1, cursor: importLoading ? "not-allowed" : "pointer" }}
                                >
                                    {importLoading
                                        ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i> Importing…</>
                                        : <><i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i> Import {importRows.length} Row{importRows.length !== 1 ? "s" : ""}</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}