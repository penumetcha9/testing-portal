import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import supabase from "../services/supabaseClient";

// ─── Memoized SingleDropdown ───────────────────────────────────────────────────
const SingleDropdown = memo(({ options, selected, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedLabel = useMemo(
        () => options.find(o => o.id === selected)?.name || null,
        [options, selected]
    );

    return (
        <div ref={ref} style={{ position: "relative", userSelect: "none", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#FFFFFF",
                    border: isOpen ? "1.5px solid #1B5E3B" : "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: selected ? "#111827" : "#9CA3AF",
                    fontWeight: selected ? 500 : 400,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: isOpen ? "0 0 0 3px rgba(27,94,59,0.10)" : "none",
                    outline: "none",
                    letterSpacing: "0.01em",
                }}
            >
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedLabel || placeholder}
                </span>
                <span style={{
                    marginLeft: 8,
                    display: "flex",
                    alignItems: "center",
                    transition: "transform 0.22s cubic-bezier(.4,0,.2,1)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: isOpen ? "#1B5E3B" : "#9CA3AF",
                    flexShrink: 0,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    animation: "ddIn 0.18s cubic-bezier(.4,0,.2,1)",
                }}>
                    <style>{`
                        @keyframes ddIn {
                            from { opacity:0; transform:translateY(-6px) scale(0.98); }
                            to   { opacity:1; transform:translateY(0) scale(1); }
                        }
                    `}</style>
                    <div style={{ padding: "6px", maxHeight: "260px", overflowY: "auto" }}>
                        {options.map((opt, i) => {
                            const isSel = opt.id === selected;
                            const isHov = hovered === i;
                            return (
                                <div
                                    key={opt.id}
                                    onMouseEnter={() => setHovered(i)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: isSel ? 600 : 400,
                                        color: isSel ? "#1B5E3B" : isHov ? "#111827" : "#374151",
                                        background: isSel ? "#E8F5EF" : isHov ? "#F8F8F7" : "transparent",
                                        transition: "all 0.12s ease",
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {isSel && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#1B5E3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Constants (defined once, outside component) ───────────────────────────────
const PRIORITY_OPTIONS = [
    { id: "High", name: "High" },
    { id: "Medium", name: "Medium" },
    { id: "Low", name: "Low" },
];

const STATUS_OPTIONS = [
    { id: "Active", name: "Active" },
    { id: "Draft", name: "Draft" },
    { id: "Archived", name: "Archived" },
];

const FILTER_STATUS_OPTIONS = [
    { id: "", name: "All Status" },
    { id: "active", name: "Active" },
    { id: "draft", name: "Draft" },
    { id: "archived", name: "Archived" },
];

const PRIORITY_OPTIONS_WITH_PLACEHOLDER = [{ id: "", name: "Select Priority" }, ...PRIORITY_OPTIONS];

// Design-system badge styles
const priorityBadge = {
    High: { background: "rgba(229,62,62,0.10)", color: "#E53E3E" },
    Medium: { background: "rgba(245,158,11,0.10)", color: "#F59E0B" },
    Low: { background: "rgba(34,197,94,0.10)", color: "#22C55E" },
};

const statusBadge = {
    Active: { background: "rgba(34,197,94,0.10)", color: "#22C55E" },
    Draft: { background: "rgba(107,114,128,0.10)", color: "#6B7280" },
    Archived: { background: "rgba(107,114,128,0.10)", color: "#6B7280" },
    active: { background: "rgba(34,197,94,0.10)", color: "#22C55E" },
    draft: { background: "rgba(107,114,128,0.10)", color: "#6B7280" },
    archived: { background: "rgba(107,114,128,0.10)", color: "#6B7280" },
};

const Badge = ({ label, style: customStyle }) => (
    <span style={{
        padding: "2px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        letterSpacing: "0.01em",
        ...customStyle,
    }}>{label}</span>
);

const emptyForm = {
    id: "", name: "", description: "", preconditions: "",
    steps: "", expected: "", assignee: "", status: "Active",
    priority: "", tags: "",
};

const emptyFeatureForm = {
    moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "",
};

const emptyEditFeatureForm = {
    id: "", moduleId: "", name: "", code: "", user_story: "", description: "", assign_to: "",
};

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

// ─── Memoized sub-components ───────────────────────────────────────────────────

const TestCaseRow = memo(({ tc, onEdit, onDelete }) => (
    <tr style={{ borderBottom: "1px solid #E5E7EB", transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#F8F8F7"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
        <td style={{ padding: "14px 24px", whiteSpace: "nowrap", fontSize: "13px", fontWeight: 500, color: "#111827", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>{tc.id}</td>
        <td style={{ padding: "14px 24px" }}>
            <p style={{ fontSize: "13px", color: "#111827", fontWeight: 500, margin: 0, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>{tc.name}</p>
            <p style={{ fontSize: "12px", color: "#6B7280", marginTop: 2, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>{tc.description}</p>
        </td>
        <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
            <Badge label={tc.priority} style={priorityBadge[tc.priority] || {}} />
        </td>
        <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
            <Badge label={tc.status} style={statusBadge[tc.status] || statusBadge["Active"]} />
        </td>
        <td style={{ padding: "14px 24px", whiteSpace: "nowrap", fontSize: "13px", color: "#6B7280", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>{tc.updated}</td>
        <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button style={{ color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} onClick={onEdit} title="Edit">
                    <i className="fa-solid fa-edit"></i>
                </button>
                <button style={{ color: "#E53E3E", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} onClick={onDelete} title="Delete">
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>
));

const FeatureRow = memo(({ feat, modId, isOpen, onToggle, onAddTC, onEdit, onDelete }) => (
    <div style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div
            style={{ padding: "20px 24px", cursor: "pointer", transition: "background 0.15s", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8F8F7"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={onToggle}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                    <i className={`fa-solid fa-chevron-right`} style={{
                        color: "#9CA3AF", fontSize: "12px",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s"
                    }}></i>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <h4 style={{ fontWeight: 600, color: "#111827", fontSize: "15px", margin: 0 }}>{feat.name}</h4>
                            <Badge label={feat.code} style={{ background: "rgba(139,92,246,0.10)", color: "#8B5CF6" }} />
                            {feat.user_story && (
                                <Badge label={feat.user_story} style={{ background: "rgba(229,62,62,0.10)", color: "#E53E3E" }} />
                            )}
                        </div>
                        <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{feat.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}><i className="fa-solid fa-vial" style={{ marginRight: 4 }}></i>{feat.testCasesCount} Test Cases</span>
                            {feat.assign_to && <span style={{ fontSize: "12px", color: "#6B7280" }}><i className="fa-solid fa-user" style={{ marginRight: 4 }}></i>Assigned</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                        style={{ padding: "8px 16px", background: "#1B5E3B", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#2D7A50"}
                        onMouseLeave={e => e.currentTarget.style.background = "#1B5E3B"}
                        onClick={onAddTC}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>Add Test Case</span>
                    </button>
                    <button
                        style={{ padding: "8px 12px", background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#374151", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8F8F7"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
                        onClick={onEdit} title="Edit Feature"
                    >
                        <i className="fa-solid fa-edit"></i>
                    </button>
                    <button
                        style={{ padding: "8px 12px", background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.20)", color: "#E53E3E", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(229,62,62,0.12)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(229,62,62,0.06)"}
                        onClick={onDelete} title="Delete Feature"
                    >
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>

        {isOpen && feat.testCases.length > 0 && (
            <div style={{ background: "#F8F8F7" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
                            <tr>
                                {["Test Case ID", "Test Case Name", "Priority", "Status", "Last Updated", "Actions"].map((h) => (
                                    <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody style={{ background: "#FFFFFF" }}>
                            {feat.testCases.map((tc) => (
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
    </div>
));

// ─── Stat Card — rectangle, icon top-right, label top-left, number below label ─
const StatCard = ({ stat }) => {
    const iconColors = {
        blue: { bg: "rgba(59,130,246,0.10)", color: "#3B82F6" },
        green: { bg: "#E8F5EF", color: "#1B5E3B" },
        purple: { bg: "rgba(139,92,246,0.10)", color: "#8B5CF6" },
        amber: { bg: "rgba(245,158,11,0.10)", color: "#F59E0B" },
        red: { bg: "rgba(229,62,62,0.10)", color: "#E53E3E" },
    };
    const ic = iconColors[stat.color] || iconColors.blue;

    return (
        <div style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            minHeight: "110px",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}>
            {/* Top row: label left, icon right */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: "13px", color: "#6B7280", fontWeight: 400, margin: 0, lineHeight: 1.5 }}>{stat.label}</p>
                <div style={{
                    width: 40, height: 40, borderRadius: "10px",
                    background: ic.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12,
                }}>
                    <i className={`fa-solid ${stat.icon}`} style={{ color: ic.color, fontSize: "16px" }}></i>
                </div>
            </div>
            {/* Number below label */}
            <h3 style={{ fontSize: "32px", fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.0 }}>{stat.value}</h3>
        </div>
    );
};

// ─── Shared modal input style ──────────────────────────────────────────────────
const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#111827",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.5,
};

const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#111827",
    marginBottom: 6,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

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
            setLoading(true);
            setError(null);

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
            if (featuresError) console.warn("Features table:", featuresError.message);
            if (testCasesError) console.warn("Test cases table:", testCasesError.message);

            const feats = featuresData || [];
            const tcs = testCasesData || [];

            const tcsByFeature = {};
            for (const tc of tcs) {
                if (!tc.feature_id) continue;
                if (!tcsByFeature[tc.feature_id]) tcsByFeature[tc.feature_id] = [];
                tcsByFeature[tc.feature_id].push({
                    id: tc.id,
                    name: tc.name,
                    description: tc.description,
                    priority: tc.priority,
                    status: tc.status,
                    updated: new Date(tc.updated_at).toLocaleDateString(),
                });
            }

            const featsByModule = {};
            for (const f of feats) {
                if (!featsByModule[f.module_id]) featsByModule[f.module_id] = [];
                featsByModule[f.module_id].push(f);
            }

            const enriched = (modulesData || []).map((mod) => {
                const moduleFeatures = featsByModule[mod.id] || [];
                const enrichedFeatures = moduleFeatures.map((feat) => {
                    const featureTestCases = tcsByFeature[feat.id] || [];
                    return {
                        ...feat,
                        name: feat.feature_name || feat.name,
                        code: feat.feature_code || feat.code,
                        testCasesCount: featureTestCases.length,
                        testCases: featureTestCases,
                    };
                });
                return {
                    ...mod,
                    name: mod.module_name || mod.name,
                    featuresCount: enrichedFeatures.length,
                    testCasesCount: enrichedFeatures.reduce((a, f) => a + f.testCasesCount, 0),
                    features: enrichedFeatures,
                    icon: "fa-puzzle-piece",
                    iconColor: "text-blue-500",
                    iconBg: "bg-blue-500",
                    status: "Active",
                };
            });

            setModules(enriched);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load features");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .order("full_name", { ascending: true });
            if (fetchError) throw fetchError;
            // Normalise to { id, name } so the rest of the component works unchanged
            setUsers((data || []).map(u => ({ id: u.id, name: u.full_name || u.email || u.id })));
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchModulesWithFeatures(), fetchUsers()]);
    }, [fetchModulesWithFeatures, fetchUsers]);

    const totalFeatures = useMemo(() => modules.reduce((a, m) => a + m.featuresCount, 0), [modules]);
    const totalTestCases = useMemo(() => modules.reduce((a, m) => a + m.testCasesCount, 0), [modules]);

    const userOptions = useMemo(() => [
        { id: "", name: "Select Assignee" },
        ...users.map(u => ({ id: u.id, name: u.name })),
    ], [users]);

    const testerOptions = useMemo(() => [
        { id: "", name: "Select Tester" },
        ...users.map(u => ({ id: u.name, name: u.name })),
    ], [users]);

    const moduleOptions = useMemo(() => [
        { id: "", name: "Choose a Module" },
        ...modules.map(m => ({ id: m.id, name: m.name })),
    ], [modules]);

    const filteredModules = useMemo(() => {
        if (!searchQuery && !filterStatus) return modules;
        const q = searchQuery.toLowerCase();
        return modules.map((mod) => ({
            ...mod,
            features: mod.features.filter(
                (f) => !q ||
                    f.name.toLowerCase().includes(q) ||
                    f.code.toLowerCase().includes(q) ||
                    mod.name.toLowerCase().includes(q) ||
                    f.testCases.some((tc) => tc.id.toLowerCase().includes(q))
            ),
        })).filter((mod) => !q || mod.features.length > 0 || mod.name.toLowerCase().includes(q));
    }, [modules, searchQuery, filterStatus]);

    const stats = useMemo(() => [
        { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue" },
        { label: "Total Features", value: totalFeatures, icon: "fa-list-check", color: "green" },
        { label: "Total Test Cases", value: totalTestCases.toLocaleString(), icon: "fa-vial", color: "purple" },
        { label: "Active Features", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "amber" },
        { label: "Team Members", value: users.length, icon: "fa-users", color: "red" },
    ], [modules, totalFeatures, totalTestCases, users.length]);

    const toggleModule = useCallback((id) => setOpenModules(prev => ({ ...prev, [id]: !prev[id] })), []);
    const toggleFeature = useCallback((id) => setOpenFeatures(prev => ({ ...prev, [id]: !prev[id] })), []);

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
        setEditFeatureForm({
            id: feat.id,
            moduleId,
            name: feat.feature_name || feat.name || "",
            code: feat.feature_code || feat.code || "",
            user_story: feat.user_story || "",
            description: feat.description || "",
            assign_to: feat.assign_to || "",
        });
        setEditFeatureModal(true);
    }, []);

    const openDeleteFeatureModal = useCallback((e, feat) => {
        e.stopPropagation();
        setDeleteFeatureTarget(feat);
        setDeleteFeatureModal(true);
    }, []);

    const handleAddTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Test Case Name and Priority are required"); return; }
        if (!form.id) { alert("Test Case ID is required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("You must be logged in to add a test case."); return; }

            // Check if test_case_id already exists to prevent duplicate key error
            const { data: existing } = await supabase
                .from("test_cases")
                .select("id")
                .eq("test_case_id", form.id)
                .maybeSingle();

            if (existing) {
                alert(`Test Case ID "${form.id}" already exists. Please use a different ID.`);
                return;
            }

            const { error } = await supabase.from("test_cases").insert([{
                id: generateUUID(),
                test_case_id: form.id,
                name: form.name,
                description: form.description,
                module_id: null,
                feature_id: addModal.featureId || null,
                user_story_id: null,
                expected_result: null,
                actual_result: null,
                test_type: null,
                priority: form.priority,
                status: form.status,
                created_by: user.id,
                assigned_to: form.assignee || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);
            if (error) throw error;
            alert("Test case added successfully! ✅");
            setAddModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, addModal.featureId, fetchModulesWithFeatures]);

    const handleEditTestCase = useCallback(async () => {
        if (!form.name || !form.priority) { alert("Name and Priority are required"); return; }
        try {
            const { error } = await supabase.from("test_cases").update({
                name: form.name,
                description: form.description,
                priority: form.priority,
                status: form.status,
                updated_at: new Date().toISOString()
            }).eq("id", editModal.tc.id);
            if (error) throw error;
            alert("Test case updated successfully! ✅");
            setEditModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [form, editModal.tc, fetchModulesWithFeatures]);

    const handleDeleteTestCase = useCallback(async () => {
        try {
            const { error } = await supabase.from("test_cases").delete().eq("id", deleteModal.tc.id);
            if (error) throw error;
            alert("Test case deleted successfully! ✅");
            setDeleteModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [deleteModal.tc, fetchModulesWithFeatures]);

    const handleAddFeature = useCallback(async () => {
        if (!featureForm.moduleId || !featureForm.name || !featureForm.code) { alert("Module, Feature Name, and Feature Code are required"); return; }
        try {
            const insertData = {
                module_id: featureForm.moduleId,
                feature_name: featureForm.name,
                feature_code: featureForm.code,
                description: featureForm.description,
                created_at: new Date().toISOString()
            };
            if (featureForm.user_story) insertData.user_story = featureForm.user_story;
            if (featureForm.assign_to) insertData.assign_to = featureForm.assign_to;
            const { error } = await supabase.from("features").insert([insertData]);
            if (error) throw error;
            alert("Feature added successfully! ✅");
            setAddFeatureModal(false); setFeatureForm(emptyFeatureForm); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [featureForm, fetchModulesWithFeatures]);

    const handleEditFeature = useCallback(async () => {
        if (!editFeatureForm.name || !editFeatureForm.code) { alert("Feature Name and Feature Code are required"); return; }
        try {
            const { error } = await supabase.from("features").update({
                feature_name: editFeatureForm.name,
                feature_code: editFeatureForm.code,
                description: editFeatureForm.description,
                user_story: editFeatureForm.user_story || null,
                assign_to: editFeatureForm.assign_to || null,
                module_id: editFeatureForm.moduleId,
            }).eq("id", editFeatureForm.id);
            if (error) throw error;
            alert("Feature updated successfully! ✅");
            setEditFeatureModal(false); setEditFeatureForm(emptyEditFeatureForm); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [editFeatureForm, fetchModulesWithFeatures]);

    const handleDeleteFeature = useCallback(async () => {
        if (!deleteFeatureTarget) return;
        try {
            const { error: tcError } = await supabase.from("test_cases").delete().eq("feature_id", deleteFeatureTarget.id);
            if (tcError) throw tcError;
            const { error } = await supabase.from("features").delete().eq("id", deleteFeatureTarget.id);
            if (error) throw error;
            alert("Feature deleted successfully! ✅");
            setDeleteFeatureModal(false); setDeleteFeatureTarget(null); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    }, [deleteFeatureTarget, fetchModulesWithFeatures]);

    const exportToCSV = useCallback(() => {
        if (modules.length === 0) { alert("No data to export"); return; }
        const exportData = [];
        modules.forEach((mod) => {
            exportData.push({ "Module Name": mod.name, "Module Code": mod.module_code, "Module Status": mod.status, "Features Count": mod.featuresCount, "Test Cases Count": mod.testCasesCount, "Type": "MODULE" });
            mod.features.forEach((feat) => {
                exportData.push({ "Module Name": "", "Module Code": "", "Module Status": "", "Features Count": "", "Test Cases Count": "", "Type": "FEATURE", "Feature Name": feat.name, "Feature Code": feat.code, "User Story": feat.user_story || "N/A", "Feature Description": feat.description || "N/A" });
                feat.testCases.forEach((tc) => {
                    exportData.push({ "Module Name": "", "Module Code": "", "Module Status": "", "Features Count": "", "Test Cases Count": "", "Type": "TEST_CASE", "Test Case ID": tc.id, "Test Case Name": tc.name, "Priority": tc.priority, "Test Status": tc.status, "Test Description": tc.description || "N/A", "Last Updated": tc.updated });
                });
            });
        });
        const headers = ["Module Name", "Module Code", "Module Status", "Features Count", "Test Cases Count", "Type", "Feature Name", "Feature Code", "User Story", "Feature Description", "Test Case ID", "Test Case Name", "Priority", "Test Status", "Test Description", "Last Updated"];
        const csvContent = [headers.join(","), ...exportData.map(row => headers.map(h => { const v = String(row[h] || "").replace(/"/g, '""'); return v.includes(",") ? `"${v}"` : v; }).join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" })));
        link.setAttribute("download", `features_library_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        alert("Features Library exported successfully! ✅");
    }, [modules]);

    const addTCHandler = useCallback((e, moduleId, featureId) => openAddModal(e, moduleId, featureId), [openAddModal]);
    addTCHandler.__editTC = openEditModal;
    addTCHandler.__deleteTC = openDeleteModal;

    if (loading) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#6B7280", marginBottom: 16, fontSize: "13px" }}>Loading Features Library...</p>
                    <div className="animate-spin"><i className="fa-solid fa-spinner" style={{ color: "#9CA3AF", fontSize: "32px" }}></i></div>
                </div>
            </div>
        );
    }

    // ── Shared modal wrapper styles ────────────────────────────────────────────
    const modalOverlay = {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)",
        zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    };
    const modalBox = (maxW = "640px") => ({
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
        width: "100%",
        maxWidth: maxW,
        maxHeight: "90vh",
        overflowY: "auto",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    });
    const modalHeader = {
        padding: "20px 24px",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky", top: 0, background: "#FFFFFF", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
    };
    const modalFooter = {
        padding: "16px 24px",
        borderTop: "1px solid #E5E7EB",
        position: "sticky", bottom: 0, background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
    };
    const btnCancel = {
        padding: "10px 24px", background: "#FFFFFF", border: "1px solid #E5E7EB",
        color: "#374151", borderRadius: "8px", fontWeight: 500, fontSize: "13px",
        cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    };
    const btnPrimary = {
        padding: "10px 24px", background: "#1B5E3B", border: "none",
        color: "#FFFFFF", borderRadius: "8px", fontWeight: 600, fontSize: "13px",
        cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    };
    const btnDanger = {
        padding: "10px 24px", background: "#E53E3E", border: "none",
        color: "#FFFFFF", borderRadius: "8px", fontWeight: 600, fontSize: "13px",
        cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    };

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

            {/* Header */}
            <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", zIndex: 40 }}>
                <div style={{ padding: "16px 32px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.2 }}>Features Library</h2>
                            <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0", lineHeight: 1.5 }}>Manage features and test cases across all modules</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={exportToCSV} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 16px", background: "#FFFFFF",
                                border: "1px solid #E5E7EB", color: "#374151",
                                borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                                cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                            }}>
                                <i className="fa-solid fa-download"></i>
                                <span>Export</span>
                            </button>
                            <button onClick={() => setAddFeatureModal(true)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 18px", background: "#1B5E3B",
                                border: "none", color: "#FFFFFF",
                                borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                                cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                            }}>
                                <i className="fa-solid fa-plus"></i>
                                <span>Add Feature</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "32px" }}>

                    {error && (
                        <div style={{ background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.30)", color: "#E53E3E", padding: "14px 18px", borderRadius: "8px", marginBottom: 24, fontSize: "13px" }}>
                            <p style={{ margin: 0 }}>Error: {error}</p>
                            <button onClick={fetchModulesWithFeatures} style={{ fontSize: "12px", marginTop: 6, textDecoration: "underline", background: "none", border: "none", color: "#E53E3E", cursor: "pointer" }}>Try again</button>
                        </div>
                    )}

                    {/* Stats — rectangle cards, icon top-right, label top-left, number below */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
                        {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
                    </div>

                    {/* Filters */}
                    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", marginBottom: 24 }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        placeholder="Search by Module, Feature, Test Case ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ ...inputStyle, paddingLeft: 38 }}
                                        onFocus={e => e.target.style.borderColor = "#1B5E3B"}
                                        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                                    />
                                    <i className="fa-solid fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "13px" }}></i>
                                </div>
                                <SingleDropdown
                                    options={FILTER_STATUS_OPTIONS}
                                    selected={filterStatus}
                                    onChange={setFilterStatus}
                                    placeholder="All Status"
                                />
                                <button
                                    onClick={() => { setSearchQuery(""); setFilterStatus(""); }}
                                    style={{ padding: "10px 16px", background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#374151", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredModules.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <i className="fa-solid fa-inbox" style={{ color: "#E5E7EB", fontSize: "48px", display: "block", marginBottom: 16 }}></i>
                            <p style={{ color: "#6B7280", fontSize: "13px" }}>No modules found. Create features to get started!</p>
                        </div>
                    )}

                    {/* Modules Accordion */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {filteredModules.map((mod) => (
                            <div key={mod.id} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px" }}>
                                <div
                                    style={{ padding: "20px 24px", borderBottom: openModules[mod.id] ? "1px solid #E5E7EB" : "none", cursor: "pointer", transition: "background 0.15s", borderRadius: openModules[mod.id] ? "12px 12px 0 0" : "12px" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#F8F8F7"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
                                    onClick={() => toggleModule(mod.id)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div style={{ width: 40, height: 40, background: "rgba(59,130,246,0.10)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <i className={`fa-solid ${mod.icon}`} style={{ color: "#3B82F6", fontSize: "16px" }}></i>
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                                    <h3 style={{ fontWeight: 700, color: "#111827", fontSize: "15px", margin: 0 }}>{mod.name}</h3>
                                                    <Badge label={mod.module_code} style={{ background: "rgba(59,130,246,0.10)", color: "#3B82F6" }} />
                                                </div>
                                                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{mod.featuresCount} Features • {mod.testCasesCount} Test Cases</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <Badge label={mod.status} style={statusBadge[mod.status] || statusBadge["Active"]} />
                                            <i className="fa-solid fa-chevron-down" style={{ color: "#9CA3AF", fontSize: "13px", transform: openModules[mod.id] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}></i>
                                        </div>
                                    </div>
                                </div>

                                {openModules[mod.id] && (
                                    <div>
                                        {mod.features.length === 0 ? (
                                            <div style={{ padding: 24, textAlign: "center" }}>
                                                <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>No features in this module yet</p>
                                            </div>
                                        ) : (
                                            mod.features.map((feat) => (
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
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* ── Add Feature Modal ──────────────────────────────────────────────── */}
            {addFeatureModal && (
                <div style={modalOverlay} onClick={() => setAddFeatureModal(false)}>
                    <div style={modalBox()} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeader}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Add New Feature</h3>
                            <button onClick={() => setAddFeatureModal(false)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "18px" }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <label style={labelStyle}>Select Module <span style={{ color: "#E53E3E" }}>*</span></label>
                                <SingleDropdown options={moduleOptions} selected={featureForm.moduleId} onChange={(v) => setFeatureForm(f => ({ ...f, moduleId: v }))} placeholder="Choose a Module" />
                            </div>
                            <div>
                                <label style={labelStyle}>Feature Name <span style={{ color: "#E53E3E" }}>*</span></label>
                                <input type="text" placeholder="e.g., Two-Factor Authentication" value={featureForm.name} onChange={(e) => setFeatureForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Feature Code <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <input type="text" placeholder="e.g., FEAT-004" value={featureForm.code} onChange={(e) => setFeatureForm(f => ({ ...f, code: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                                </div>
                                <div>
                                    <label style={labelStyle}>User Story</label>
                                    <input type="text" placeholder="e.g., US-015" value={featureForm.user_story} onChange={(e) => setFeatureForm(f => ({ ...f, user_story: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea rows="4" placeholder="Brief description of the feature..." value={featureForm.description} onChange={(e) => setFeatureForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div>
                                <label style={labelStyle}>Assign To</label>
                                <SingleDropdown options={userOptions} selected={featureForm.assign_to} onChange={(v) => setFeatureForm(f => ({ ...f, assign_to: v }))} placeholder="Select Assignee" />
                            </div>
                        </div>
                        <div style={modalFooter}>
                            <button onClick={() => setAddFeatureModal(false)} style={btnCancel}>Cancel</button>
                            <button onClick={handleAddFeature} style={btnPrimary}>Add Feature</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Feature Modal ─────────────────────────────────────────────── */}
            {editFeatureModal && (
                <div style={modalOverlay} onClick={() => setEditFeatureModal(false)}>
                    <div style={modalBox()} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 36, height: 36, background: "rgba(59,130,246,0.10)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className="fa-solid fa-pen-to-square" style={{ color: "#3B82F6", fontSize: "15px" }}></i>
                                </div>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Edit Feature</h3>
                            </div>
                            <button onClick={() => setEditFeatureModal(false)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "18px" }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <label style={labelStyle}>Module <span style={{ color: "#E53E3E" }}>*</span></label>
                                <SingleDropdown options={moduleOptions} selected={editFeatureForm.moduleId} onChange={(v) => setEditFeatureForm(f => ({ ...f, moduleId: v }))} placeholder="Choose a Module" />
                            </div>
                            <div>
                                <label style={labelStyle}>Feature Name <span style={{ color: "#E53E3E" }}>*</span></label>
                                <input type="text" placeholder="e.g., Two-Factor Authentication" value={editFeatureForm.name} onChange={(e) => setEditFeatureForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Feature Code <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <input type="text" placeholder="e.g., FEAT-004" value={editFeatureForm.code} onChange={(e) => setEditFeatureForm(f => ({ ...f, code: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                                </div>
                                <div>
                                    <label style={labelStyle}>User Story</label>
                                    <input type="text" placeholder="e.g., US-015" value={editFeatureForm.user_story} onChange={(e) => setEditFeatureForm(f => ({ ...f, user_story: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea rows="4" placeholder="Brief description of the feature..." value={editFeatureForm.description} onChange={(e) => setEditFeatureForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div>
                                <label style={labelStyle}>Assign To</label>
                                <SingleDropdown options={userOptions} selected={editFeatureForm.assign_to} onChange={(v) => setEditFeatureForm(f => ({ ...f, assign_to: v }))} placeholder="Select Assignee" />
                            </div>
                        </div>
                        <div style={modalFooter}>
                            <button onClick={() => setEditFeatureModal(false)} style={btnCancel}>Cancel</button>
                            <button onClick={handleEditFeature} style={btnPrimary}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Feature Modal ───────────────────────────────────────────── */}
            {deleteFeatureModal && (
                <div style={modalOverlay} onClick={() => setDeleteFeatureModal(false)}>
                    <div style={{ ...modalBox("480px"), maxHeight: "none" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: "24px" }}>
                            {/* Rectangle card: icon top-right, text top-left, info below */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Delete Feature</h3>
                                    <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>This action cannot be undone.</p>
                                </div>
                                <div style={{ width: 44, height: 44, background: "rgba(229,62,62,0.10)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 16 }}>
                                    <i className="fa-solid fa-triangle-exclamation" style={{ color: "#E53E3E", fontSize: "18px" }}></i>
                                </div>
                            </div>
                            <div style={{ background: "#F8F8F7", border: "1px solid #E5E7EB", borderRadius: "8px", padding: 16, marginBottom: 16 }}>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>{deleteFeatureTarget?.feature_name || deleteFeatureTarget?.name}</p>
                                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{deleteFeatureTarget?.feature_code || deleteFeatureTarget?.code}</p>
                            </div>
                            {deleteFeatureTarget?.testCasesCount > 0 && (
                                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: 14, marginBottom: 20 }}>
                                    <p style={{ fontSize: "13px", color: "#92400E", margin: 0 }}>
                                        <i className="fa-solid fa-warning" style={{ marginRight: 8 }}></i>
                                        This feature has <strong>{deleteFeatureTarget.testCasesCount} test case(s)</strong> that will also be deleted.
                                    </p>
                                </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                <button onClick={() => setDeleteFeatureModal(false)} style={btnCancel}>Cancel</button>
                                <button onClick={handleDeleteFeature} style={btnDanger}>Delete Feature</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Test Case Modal ────────────────────────────────────────────── */}
            {addModal.open && (
                <div style={modalOverlay} onClick={() => setAddModal({ open: false })}>
                    <div style={modalBox("720px")} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeader}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Add New Test Case</h3>
                            <button onClick={() => setAddModal({ open: false })} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "18px" }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Test Case ID <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <input type="text" placeholder="e.g., TC-001" value={form.id} onChange={(e) => setForm(f => ({ ...f, id: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Priority <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <SingleDropdown options={PRIORITY_OPTIONS_WITH_PLACEHOLDER} selected={form.priority} onChange={(v) => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Test Case Name <span style={{ color: "#E53E3E" }}>*</span></label>
                                <input type="text" placeholder="e.g., Valid login with correct credentials" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div>
                                <label style={labelStyle}>Description <span style={{ color: "#E53E3E" }}>*</span></label>
                                <textarea rows="3" placeholder="Brief description..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Assigned To</label>
                                    <SingleDropdown options={testerOptions} selected={form.assignee} onChange={(v) => setForm(f => ({ ...f, assignee: v }))} placeholder="Select Tester" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Status <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <SingleDropdown options={STATUS_OPTIONS} selected={form.status} onChange={(v) => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                                </div>
                            </div>
                        </div>
                        <div style={modalFooter}>
                            <button onClick={() => setAddModal({ open: false })} style={btnCancel}>Cancel</button>
                            <button onClick={handleAddTestCase} style={btnPrimary}>Add Test Case</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Test Case Modal ───────────────────────────────────────────── */}
            {editModal.open && (
                <div style={modalOverlay} onClick={() => setEditModal({ open: false })}>
                    <div style={modalBox("720px")} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeader}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Edit Test Case</h3>
                            <button onClick={() => setEditModal({ open: false })} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "18px" }}><i className="fa-solid fa-times"></i></button>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Test Case ID</label>
                                    <input type="text" value={form.id} readOnly style={{ ...inputStyle, background: "#F8F8F7", color: "#6B7280" }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Priority <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <SingleDropdown options={PRIORITY_OPTIONS} selected={form.priority} onChange={(v) => setForm(f => ({ ...f, priority: v }))} placeholder="Select Priority" />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Test Case Name <span style={{ color: "#E53E3E" }}>*</span></label>
                                <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea rows="3" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#1B5E3B"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Status <span style={{ color: "#E53E3E" }}>*</span></label>
                                    <SingleDropdown options={STATUS_OPTIONS} selected={form.status} onChange={(v) => setForm(f => ({ ...f, status: v }))} placeholder="Select Status" />
                                </div>
                            </div>
                        </div>
                        <div style={modalFooter}>
                            <button onClick={() => setEditModal({ open: false })} style={btnCancel}>Cancel</button>
                            <button onClick={handleEditTestCase} style={btnPrimary}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Test Case Modal ─────────────────────────────────────────── */}
            {deleteModal.open && (
                <div style={modalOverlay} onClick={() => setDeleteModal({ open: false })}>
                    <div style={{ ...modalBox("480px"), maxHeight: "none" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: "24px" }}>
                            {/* Rectangle card: icon top-right, text top-left, id/name below */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Delete Test Case</h3>
                                    <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Are you sure you want to delete this test case?</p>
                                </div>
                                <div style={{ width: 44, height: 44, background: "rgba(229,62,62,0.10)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 16 }}>
                                    <i className="fa-solid fa-trash" style={{ color: "#E53E3E", fontSize: "18px" }}></i>
                                </div>
                            </div>
                            <div style={{ background: "#F8F8F7", border: "1px solid #E5E7EB", borderRadius: "8px", padding: 16, marginBottom: 24 }}>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>{deleteModal.tc?.id}</p>
                                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{deleteModal.tc?.name}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                <button onClick={() => setDeleteModal({ open: false })} style={btnCancel}>Cancel</button>
                                <button onClick={handleDeleteTestCase} style={btnDanger}>Delete Test Case</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}