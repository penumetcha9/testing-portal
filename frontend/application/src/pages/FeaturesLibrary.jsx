import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import supabase from "../services/supabaseClient";

// ─── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fl-root { font-family: 'DM Sans', system-ui, sans-serif; }

  .fl-acc-row { transition: background 0.13s; }
  .fl-acc-row:hover { background: #F4F6F3 !important; }

  .fl-feat-row { transition: background 0.13s; }
  .fl-feat-row:hover { background: #F9FAF8 !important; }

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
    background: #1D3D2F; border: none; color: #fff;
    border-radius: 7px; font-size: 12px; font-weight: 600;
    cursor: pointer; padding: 6px 14px; display: inline-flex;
    align-items: center; gap: 5px; transition: all 0.13s;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .fl-btn-primary:hover { background: #2A5240; }

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
const PRIORITY_OPTIONS = [{ id: "High", name: "High" }, { id: "Medium", name: "Medium" }, { id: "Low", name: "Low" }];
const STATUS_OPTIONS = [{ id: "Active", name: "Active" }, { id: "Draft", name: "Draft" }, { id: "Archived", name: "Archived" }];
const FILTER_STATUS_OPT = [{ id: "", name: "All Status" }, { id: "active", name: "Active" }, { id: "draft", name: "Draft" }, { id: "archived", name: "Archived" }];
const PRIORITY_WITH_PH = [{ id: "", name: "Select Priority" }, ...PRIORITY_OPTIONS];

const emptyForm = { id: "", name: "", description: "", preconditions: "", steps: "", expected: "", assignee: "", status: "Active", priority: "", tags: "" };
const emptyFeatureForm = { moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };
const emptyEditFeatureForm = { id: "", moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "" };

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

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
            <span style={{ fontSize: 11, fontWeight: 600, color: T.purple, fontFamily: T.mono, background: T.purpleTint, padding: "2px 8px", borderRadius: 5 }}>{tc.id}</span>
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
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", fontSize: 11, color: T.textMuted, fontFamily: T.mono }}>{tc.updated}</td>
        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button className="fl-icon-btn edit" onClick={onEdit} title="Edit"><i className="fa-solid fa-pen-to-square"></i></button>
                <button className="fl-icon-btn delete" onClick={onDelete} title="Delete"><i className="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>
));

// ─── Feature Row ───────────────────────────────────────────────────────────────
const FeatureRow = memo(({ feat, modId, isOpen, onToggle, onAddTC, onEdit, onDelete }) => (
    <div style={{ borderBottom: `1px solid ${T.borderLight}` }}>
        <div
            className="fl-feat-row"
            style={{ padding: "13px 20px", cursor: "pointer", background: T.surface }}
            onClick={onToggle}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {/* Left: chevron + meta */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <i className={`fa-solid fa-chevron-right fl-chevron${isOpen ? " open" : ""}`}
                        style={{ color: T.textFaint, fontSize: 10, flexShrink: 0 }}></i>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.sans }}>{feat.name}</span>
                            <Chip label={feat.code} style={{ background: T.purpleTint, color: T.purple }} mono />
                            {feat.user_story && <Chip label={feat.user_story} style={{ background: T.redTint, color: T.red }} mono />}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {feat.description && (
                                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{feat.description}</span>
                            )}
                            <span style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                <i className="fa-solid fa-vial" style={{ fontSize: 9 }}></i>
                                {feat.testCasesCount} test{feat.testCasesCount !== 1 ? "s" : ""}
                            </span>
                            {feat.assign_to && (
                                <span style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                    <i className="fa-solid fa-user" style={{ fontSize: 9 }}></i> Assigned
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="fl-btn-primary" onClick={(e) => { e.stopPropagation(); onAddTC(e, modId, feat.id); }}>
                        <i className="fa-solid fa-plus" style={{ fontSize: 10 }}></i> Test Case
                    </button>
                    <button className="fl-btn-ghost" onClick={onEdit} title="Edit Feature">
                        <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }}></i>
                    </button>
                    <button className="fl-btn-danger-sm" onClick={onDelete} title="Delete Feature">
                        <i className="fa-solid fa-trash" style={{ fontSize: 11 }}></i>
                    </button>
                </div>
            </div>
        </div>

        {isOpen && feat.testCases.length > 0 && (
            <div style={{ background: "#F9FAF8", borderTop: `1px solid ${T.borderLight}` }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                                {["ID", "Name", "Priority", "Status", "Updated", ""].map(h => (
                                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: T.sans }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody style={{ background: T.surface }}>
                            {feat.testCases.map(tc => (
                                <TestCaseRow
                                    key={tc.id}
                                    tc={tc}
                                    onEdit={(e) => { e.stopPropagation(); onAddTC.__editTC(e, modId, feat.id, tc); }}
                                    onDelete={(e) => { e.stopPropagation(); onAddTC.__deleteTC(e, modId, feat.id, tc); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {isOpen && feat.testCases.length === 0 && (
            <div style={{ background: "#F9FAF8", borderTop: `1px solid ${T.borderLight}`, padding: "18px 20px", textAlign: "center" }}>
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
    padding: "9px 20px", background: T.green, border: "none",
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
    const [openModules, setOpenModules] = useState({});
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
                supabase.from("test_cases").select("id, name, description, priority, status, updated_at, feature_id, module_id, assigned_to"),
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
                tcsByFeature[tc.feature_id].push({ id: tc.id, name: tc.name, description: tc.description, priority: tc.priority, status: tc.status, updated: new Date(tc.updated_at).toLocaleDateString() });
            }
            const featsByModule = {};
            for (const f of feats) {
                if (!featsByModule[f.module_id]) featsByModule[f.module_id] = [];
                featsByModule[f.module_id].push(f);
            }
            const enriched = (modulesData || []).map(mod => {
                const mf = featsByModule[mod.id] || [];
                const ef = mf.map(feat => ({ ...feat, name: feat.feature_name || feat.name, code: feat.feature_code || feat.code, testCasesCount: (tcsByFeature[feat.id] || []).length, testCases: tcsByFeature[feat.id] || [] }));
                return { ...mod, name: mod.module_name || mod.name, featuresCount: ef.length, testCasesCount: ef.reduce((a, f) => a + f.testCasesCount, 0), features: ef, icon: "fa-puzzle-piece", status: "Active" };
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

    useEffect(() => { Promise.all([fetchModulesWithFeatures(), fetchUsers()]); }, [fetchModulesWithFeatures, fetchUsers]);

    const totalFeatures = useMemo(() => modules.reduce((a, m) => a + m.featuresCount, 0), [modules]);
    const totalTestCases = useMemo(() => modules.reduce((a, m) => a + m.testCasesCount, 0), [modules]);

    const userOptions = useMemo(() => [{ id: "", name: "Select Assignee" }, ...users.map(u => ({ id: u.id, name: u.name }))], [users]);
    const testerOptions = useMemo(() => [{ id: "", name: "Select Tester" }, ...users.map(u => ({ id: u.name, name: u.name }))], [users]);
    const moduleOptions = useMemo(() => [{ id: "", name: "Choose Module" }, ...modules.map(m => ({ id: m.id, name: m.name }))], [modules]);

    const filteredModules = useMemo(() => {
        if (!searchQuery && !filterStatus) return modules;
        const q = searchQuery.toLowerCase();
        return modules.map(mod => ({
            ...mod,
            features: mod.features.filter(f =>
                !q || f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q) ||
                mod.name.toLowerCase().includes(q) || f.testCases.some(tc => tc.id.toLowerCase().includes(q))
            ),
        })).filter(mod => !q || mod.features.length > 0 || mod.name.toLowerCase().includes(q));
    }, [modules, searchQuery, filterStatus]);

    const stats = useMemo(() => [
        { label: "Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue" },
        { label: "Features", value: totalFeatures, icon: "fa-list-check", color: "green" },
        { label: "Test Cases", value: totalTestCases.toLocaleString(), icon: "fa-vial", color: "purple" },
        { label: "Active", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "amber" },
        { label: "Team Members", value: users.length, icon: "fa-users", color: "red" },
    ], [modules, totalFeatures, totalTestCases, users.length]);

    const toggleModule = useCallback(id => setOpenModules(p => ({ ...p, [id]: !p[id] })), []);
    const toggleFeature = useCallback(id => setOpenFeatures(p => ({ ...p, [id]: !p[id] })), []);

    const openAddModal = useCallback((e, moduleId, featureId) => {
        e.stopPropagation(); setForm(emptyForm); setAddModal({ open: true, featureId, moduleId });
    }, []);
    const openEditModal = useCallback((e, moduleId, featureId, tc) => {
        e.stopPropagation();
        setForm({ id: tc.id, name: tc.name, description: tc.description, preconditions: "", steps: "", expected: "", assignee: tc.assignee || "", status: tc.status, priority: tc.priority, tags: "" });
        setEditModal({ open: true, tc, featureId, moduleId });
    }, []);
    const openDeleteModal = useCallback((e, moduleId, featureId, tc) => {
        e.stopPropagation(); setDeleteModal({ open: true, tc, featureId, moduleId });
    }, []);
    const openEditFeatureModal = useCallback((e, feat, moduleId) => {
        e.stopPropagation();
        setEditFeatureForm({ id: feat.id, moduleId, name: feat.feature_name || feat.name || "", code: feat.feature_code || feat.code || "", user_story: feat.user_story || "", description: feat.description || "", assign_to: feat.assign_to || "" });
        setEditFeatureModal(true);
    }, []);
    const openDeleteFeatureModal = useCallback((e, feat) => {
        e.stopPropagation(); setDeleteFeatureTarget(feat); setDeleteFeatureModal(true);
    }, []);

    const handleAddTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        if (!form.id) { alert("Test Case ID required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Must be logged in"); return; }
            const { data: existing } = await supabase.from("test_cases").select("id").eq("test_case_id", form.id).maybeSingle();
            if (existing) { alert(`ID "${form.id}" already exists`); return; }
            const { error } = await supabase.from("test_cases").insert([{ id: generateUUID(), test_case_id: form.id, name: form.name, description: form.description, feature_id: addModal.featureId || null, priority: form.priority, status: form.status, created_by: user.id, assigned_to: form.assignee || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
            if (error) throw error;
            setAddModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, addModal.featureId, fetchModulesWithFeatures]);

    const handleEditTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority required"); return; }
        try {
            const { error } = await supabase.from("test_cases").update({ name: form.name, description: form.description, priority: form.priority, status: form.status, updated_at: new Date().toISOString() }).eq("id", editModal.tc.id);
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
        if (!featureForm.moduleId || !featureForm.name || !featureForm.code) { alert("Module, Name, and Code required"); return; }
        try {
            const ins = { module_id: featureForm.moduleId, feature_name: featureForm.name, feature_code: featureForm.code, description: featureForm.description, created_at: new Date().toISOString() };
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
            const { error } = await supabase.from("features").update({ feature_name: editFeatureForm.name, feature_code: editFeatureForm.code, description: editFeatureForm.description, user_story: editFeatureForm.user_story || null, assign_to: editFeatureForm.assign_to || null, module_id: editFeatureForm.moduleId }).eq("id", editFeatureForm.id);
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
        if (!modules.length) { alert("No data"); return; }
        const rows = [];
        modules.forEach(mod => {
            rows.push({ Module: mod.name, Code: mod.module_code, Type: "MODULE" });
            mod.features.forEach(feat => {
                rows.push({ Module: mod.name, Feature: feat.name, Code: feat.code, Type: "FEATURE" });
                feat.testCases.forEach(tc => rows.push({ Module: mod.name, Feature: feat.name, "TC ID": tc.id, "TC Name": tc.name, Priority: tc.priority, Status: tc.status, Type: "TEST_CASE" }));
            });
        });
        const headers = Object.keys(rows.reduce((acc, r) => ({ ...acc, ...r }), {}));
        const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h] || ""}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `features_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    }, [modules]);

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
                        <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0", lineHeight: 1.5 }}>Manage features and test cases across all modules</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="fl-btn-ghost" onClick={exportToCSV} style={{ padding: "8px 14px", fontSize: 13 }}>
                            <i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Export
                        </button>
                        <button className="fl-btn-primary" onClick={() => setAddFeatureModal(true)} style={{ padding: "8px 16px", fontSize: 13 }}>
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
                                    placeholder="Search modules, features, test case IDs…"
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
                    {filteredModules.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 48, height: 48, background: T.surfaceAlt, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <i className="fa-solid fa-inbox" style={{ color: T.textFaint, fontSize: 20 }}></i>
                            </div>
                            <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No features found. Create one to get started.</p>
                        </div>
                    )}

                    {/* Accordion */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filteredModules.map(mod => (
                            <div key={mod.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>

                                {/* Module header */}
                                <div
                                    className="fl-acc-row"
                                    style={{ padding: "14px 20px", cursor: "pointer", background: T.surface, borderBottom: openModules[mod.id] ? `1px solid ${T.borderLight}` : "none" }}
                                    onClick={() => toggleModule(mod.id)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 36, height: 36, background: T.blueTint, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <i className={`fa-solid ${mod.icon}`} style={{ color: T.blue, fontSize: 14 }}></i>
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                    <h3 style={{ fontWeight: 700, color: T.text, fontSize: 14, margin: 0, letterSpacing: "-0.01em" }}>{mod.name}</h3>
                                                    <Chip label={mod.module_code} style={{ background: T.blueTint, color: T.blue }} mono />
                                                </div>
                                                <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                                                    {mod.featuresCount} feature{mod.featuresCount !== 1 ? "s" : ""} · {mod.testCasesCount} test case{mod.testCasesCount !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Chip label={mod.status} style={STATUS_STYLE[mod.status] || STATUS_STYLE["Active"]} />
                                            <i className="fa-solid fa-chevron-down" style={{ color: T.textFaint, fontSize: 11, transition: "transform 0.2s", transform: openModules[mod.id] ? "rotate(180deg)" : "rotate(0deg)" }}></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                {openModules[mod.id] && (
                                    <div>
                                        {mod.features.length === 0 ? (
                                            <div style={{ padding: "18px 20px", textAlign: "center" }}>
                                                <p style={{ color: T.textFaint, fontSize: 12, margin: 0 }}>No features in this module yet</p>
                                            </div>
                                        ) : mod.features.map(feat => (
                                            <FeatureRow
                                                key={feat.id}
                                                feat={feat}
                                                modId={mod.id}
                                                isOpen={!!openFeatures[feat.id]}
                                                onToggle={() => toggleFeature(feat.id)}
                                                onAddTC={addTCHandler}
                                                onEdit={(e) => openEditFeatureModal(e, feat, mod.id)}
                                                onDelete={(e) => openDeleteFeatureModal(e, feat)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
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
                                <Field label="Feature Code" required>
                                    <input className="fl-input" type="text" placeholder="e.g., FEAT-004" value={featureForm.code} onChange={e => setFeatureForm(f => ({ ...f, code: e.target.value }))} />
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
                                <Field label="Test Case ID" required>
                                    <input className="fl-input" type="text" placeholder="e.g., TC-001" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
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
                                <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "0 0 2px", fontFamily: T.mono }}>{deleteModal.tc?.id}</p>
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