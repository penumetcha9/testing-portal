import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabaseClient";

const STATUS_OPTIONS = [
    { id: "planning", name: "Planning" },
    { id: "testing", name: "In Testing" },
    { id: "active", name: "Active" },
    { id: "completed", name: "Completed" },
];

const STATUS_FILTER_OPTIONS = [
    { id: "", name: "All Statuses" },
    { id: "active", name: "Active" },
    { id: "testing", name: "In Testing" },
    { id: "completed", name: "Completed" },
    { id: "archived", name: "Archived" },
    { id: "planning", name: "Planning" },
];

const VERSION_TYPE_OPTIONS = [
    { id: "major", name: "Major Release" },
    { id: "minor", name: "Minor Release" },
    { id: "patch", name: "Patch / Hotfix" },
    { id: "beta", name: "Beta" },
    { id: "rc", name: "Release Candidate" },
];

const STATUS_CONFIG = {
    active: { label: "Active", className: "bg-green-500 text-white" },
    testing: { label: "In Testing", className: "bg-blue-500 text-white" },
    completed: { label: "Completed", className: "bg-gray-500 text-white" },
    archived: { label: "Archived", className: "bg-gray-400 text-white" },
    planning: { label: "Planning", className: "bg-purple-500 text-white" },
};

const PROGRESS_COLOR = {
    active: "bg-green-500",
    testing: "bg-blue-500",
    completed: "bg-green-500",
    archived: "bg-gray-500",
    planning: "bg-yellow-500",
};

const EMPTY_FORM = {
    version_number: "", build_number: "", release_date: "",
    status: "planning", version_type: "", description: "", selectedTesters: [],
};

const TOAST_STYLES = {
    wrapper: { position: "fixed", top: 24, right: 24, zIndex: 99999, display: "flex", flexDirection: "column", gap: 10 },
    base: { display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 260, maxWidth: 380 },
    success: { background: "#16a34a" },
    error: { background: "#ef4444" },
    warning: { background: "#f59e0b" },
};

const CONFIRM_STYLES = {
    overlay: { position: "fixed", inset: 0, zIndex: 99998, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    card: { background: "#fff", borderRadius: 16, padding: "28px 28px 24px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
    emoji: { fontSize: 32, marginBottom: 12, textAlign: "center" },
    title: { textAlign: "center", color: "#1e293b", fontWeight: 600, fontSize: 15, marginBottom: 8 },
    body: { textAlign: "center", color: "#64748b", fontSize: 13.5, marginBottom: 24, lineHeight: 1.5 },
    row: { display: "flex", gap: 12 },
    cancel: { flex: 1, padding: "10px 0", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" },
    confirm: { flex: 1, padding: "10px 0", border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

const DD_BTN_BASE = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", fontSize: "13.5px", cursor: "pointer", outline: "none", letterSpacing: "0.01em" };

const Toast = memo(({ toasts }) => (
    <div style={TOAST_STYLES.wrapper}>
        {toasts.map((t) => (
            <div key={t.id} style={{ ...TOAST_STYLES.base, ...(TOAST_STYLES[t.type] ?? TOAST_STYLES.success) }}>
                <span style={{ fontSize: 18 }}>
                    {t.type === "error" ? "❌" : t.type === "warning" ? "⚠️" : "✅"}
                </span>
                <span style={{ flex: 1 }}>{t.msg}</span>
            </div>
        ))}
    </div>
));
Toast.displayName = "Toast";

const ConfirmDialog = memo(({ message, onConfirm, onCancel }) => (
    <div style={CONFIRM_STYLES.overlay}>
        <div style={CONFIRM_STYLES.card}>
            <div style={CONFIRM_STYLES.emoji}>⚠️</div>
            <p style={CONFIRM_STYLES.title}>Are you sure?</p>
            <p style={CONFIRM_STYLES.body}>{message}</p>
            <div style={CONFIRM_STYLES.row}>
                <button onClick={onCancel} style={CONFIRM_STYLES.cancel}>Cancel</button>
                <button onClick={onConfirm} style={CONFIRM_STYLES.confirm}>Confirm</button>
            </div>
        </div>
    </div>
));
ConfirmDialog.displayName = "ConfirmDialog";

const ChevronIcon = memo(({ open, green = false }) => (
    <span style={{ marginLeft: 8, display: "flex", alignItems: "center", transition: "transform 0.22s cubic-bezier(.4,0,.2,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: open ? (green ? "#22c55e" : "#6366f1") : "#94a3b8", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </span>
));
ChevronIcon.displayName = "ChevronIcon";

// Finds the nearest scrollable ancestor to measure space for flip detection
function getScrollParent(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
        const { overflow, overflowY } = window.getComputedStyle(parent);
        if (/auto|scroll/.test(overflow + overflowY)) return parent;
        parent = parent.parentElement;
    }
    return null;
}

const DropdownList = memo(({ children, flipUp }) => (
    <div style={{
        position: "absolute",
        ...(flipUp ? { bottom: "calc(100% + 6px)", top: "auto" } : { top: "calc(100% + 6px)", bottom: "auto" }),
        left: 0, right: 0, zIndex: 9999,
        background: "#fff",
        border: "1.5px solid #dcfce7",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(34,197,94,0.10), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
    }}>
        <div style={{ padding: "6px", maxHeight: "300px", overflowY: "auto" }}>{children}</div>
    </div>
));
DropdownList.displayName = "DropdownList";

const MultiItem = memo(({ opt, isSel, onSelect }) => (
    <div onClick={() => onSelect(opt.id)}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px", fontWeight: isSel ? 600 : 400, color: isSel ? "#15803d" : "#374151", background: isSel ? "#dcfce7" : "transparent", transition: "background 0.12s ease" }}
        onMouseEnter={e => { e.currentTarget.style.background = isSel ? "#bbf7d0" : "#f0fdf4"; }}
        onMouseLeave={e => { e.currentTarget.style.background = isSel ? "#dcfce7" : "transparent"; }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: isSel ? "none" : "1.5px solid #cbd5e1", background: isSel ? "#16a34a" : "#fff" }}>
            {isSel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <span style={{ flex: 1 }}>{opt.name}</span>
    </div>
));
MultiItem.displayName = "MultiItem";

const SingleItem = memo(({ opt, isSel, onChange }) => (
    <div onClick={() => onChange(opt.id)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px", fontWeight: isSel ? 600 : 400, color: isSel ? "#15803d" : "#374151", background: isSel ? "#dcfce7" : "transparent", transition: "background 0.12s ease" }}
        onMouseEnter={e => { e.currentTarget.style.background = isSel ? "#bbf7d0" : "#f0fdf4"; }}
        onMouseLeave={e => { e.currentTarget.style.background = isSel ? "#dcfce7" : "transparent"; }}>
        <span>{opt.name}</span>
        {isSel && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
));
SingleItem.displayName = "SingleItem";

const CustomDropdown = memo(({ options, selected, onChange, placeholder = "Select options..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleToggle = () => {
        if (!isOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const scrollParent = getScrollParent(ref.current);
            const containerBottom = scrollParent ? scrollParent.getBoundingClientRect().bottom : window.innerHeight;
            const spaceBelow = containerBottom - rect.bottom;
            setFlipUp(spaceBelow < 260);
        }
        setIsOpen(p => !p);
    };

    const handleSelect = useCallback((id) => {
        onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    }, [selected, onChange]);

    const selectedLabels = useMemo(() =>
        options.filter(o => selected.includes(o.id)).map(o => o.name).join(", "),
        [options, selected]);

    const btnStyle = useMemo(() => ({
        ...DD_BTN_BASE,
        background: isOpen ? "#f0fdf4" : "linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)",
        border: isOpen ? "1.5px solid #22c55e" : "1.5px solid #e2e6f0",
        color: selected.length > 0 ? "#15803d" : "#94a3b8",
        fontWeight: selected.length > 0 ? 500 : 400,
        boxShadow: isOpen ? "0 0 0 3px rgba(34,197,94,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
    }), [isOpen, selected.length]);

    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={handleToggle} style={btnStyle}>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedLabels || placeholder}
                </span>
                <ChevronIcon open={isOpen} green />
            </button>
            {isOpen && (
                <DropdownList flipUp={flipUp}>
                    {options.map((opt) => (
                        <MultiItem key={opt.id} opt={opt} isSel={selected.includes(opt.id)} onSelect={handleSelect} />
                    ))}
                </DropdownList>
            )}
        </div>
    );
});
CustomDropdown.displayName = "CustomDropdown";

const SingleDropdown = memo(({ options, selected, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleToggle = () => {
        if (!isOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const scrollParent = getScrollParent(ref.current);
            const containerBottom = scrollParent ? scrollParent.getBoundingClientRect().bottom : window.innerHeight;
            const spaceBelow = containerBottom - rect.bottom;
            const dropdownHeight = Math.min(options.length * 42 + 16, 300);
            setFlipUp(spaceBelow < dropdownHeight + 8);
        }
        setIsOpen(p => !p);
    };

    const selectedLabel = useMemo(() => options.find(o => o.id === selected)?.name ?? null, [options, selected]);

    const btnStyle = useMemo(() => ({
        ...DD_BTN_BASE,
        background: isOpen ? "#f0fdf4" : "linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)",
        border: isOpen ? "1.5px solid #22c55e" : "1.5px solid #e2e6f0",
        color: selected ? "#15803d" : "#94a3b8",
        fontWeight: selected ? 500 : 400,
        boxShadow: isOpen ? "0 0 0 3px rgba(34,197,94,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
    }), [isOpen, selected]);

    const handleChange = useCallback((id) => { onChange(id); setIsOpen(false); }, [onChange]);

    return (
        <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
            <button type="button" onClick={handleToggle} style={btnStyle}>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronIcon open={isOpen} green />
            </button>
            {isOpen && (
                <DropdownList flipUp={flipUp}>
                    {options.map((opt) => (
                        <SingleItem key={opt.id} opt={opt} isSel={opt.id === selected} onChange={handleChange} />
                    ))}
                </DropdownList>
            )}
        </div>
    );
});
SingleDropdown.displayName = "SingleDropdown";

/* ── Assign Modules Modal ── */
const AssignModulesModal = memo(({ version, modules, onClose, onSuccess, showToast }) => {
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("version_modules")
                .select("module_id")
                .eq("version_id", version.id);
            setSelected(data?.map(r => r.module_id) || []);
            setLoading(false);
        }
        load();
    }, [version.id]);

    const toggle = useCallback((id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error: de } = await supabase.from("version_modules").delete().eq("version_id", version.id);
            if (de) throw de;
            if (selected.length > 0) {
                const { error: ie } = await supabase.from("version_modules").insert(
                    selected.map(mid => ({ version_id: version.id, module_id: mid }))
                );
                if (ie) throw ie;
            }
            showToast(`Modules assigned to ${version.version_number} ✅`);
            onSuccess();
            onClose();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Assign Modules</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {version.version_number} — {selected.length} module{selected.length !== 1 ? "s" : ""} selected
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">
                        <i className="fa-solid fa-times" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <p className="text-center text-gray-400 py-8">Loading modules...</p>
                    ) : modules.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No active modules found.</p>
                    ) : (
                        <div className="space-y-2">
                            {modules.map(mod => {
                                const isSel = selected.includes(mod.id);
                                return (
                                    <div key={mod.id} onClick={() => toggle(mod.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSel ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${isSel ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                                            {isSel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{mod.module_name}</p>
                                            <p className="text-xs text-gray-400">Code: {mod.module_code}</p>
                                        </div>
                                        {isSel && <span className="text-xs text-green-600 font-medium">Selected</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t flex gap-3">
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {saving ? "Saving..." : "Save Assignments"}
                    </button>
                    <button onClick={onClose}
                        className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
});
AssignModulesModal.displayName = "AssignModulesModal";

const VersionCard = memo(({ v, onEdit, onArchive, onDelete, onViewDetails, onAssignTests, onViewIssues, onExport, onRestore, onAssignModules }) => (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${v.status === "archived" ? "opacity-60" : ""}`}>
        <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 text-2xl">⑂</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold">{v.version_number}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_CONFIG[v.status].className}`}>
                                {STATUS_CONFIG[v.status].label}
                            </span>
                            {v.critical_issues > 0 && (
                                <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                    {v.critical_issues} Critical
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Build {v.build_number} • {v.version_type}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>📅 Release: {new Date(v.release_date).toLocaleDateString()}</span>
                            <span>🕐 Created: {new Date(v.created_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(v)} className="p-2 text-gray-400 hover:text-green-700 transition-colors" title="Edit"><i className="fa-solid fa-pen-to-square" /></button>
                    <button onClick={() => onArchive(v)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="Archive"><i className="fa-solid fa-archive" /></button>
                    <button onClick={() => onDelete(v)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><i className="fa-solid fa-trash" /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Total Tests</p><p className="text-2xl font-bold">{v.total_tests}</p></div>
                <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-green-700 mb-1">Passed</p><p className="text-2xl font-bold text-green-600">{v.passed_tests}</p></div>
                <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-red-700 mb-1">Failed</p><p className="text-2xl font-bold text-red-500">{v.failed_tests}</p></div>
                <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-xs text-yellow-700 mb-1">Pending</p><p className="text-2xl font-bold text-yellow-500">{v.pending_tests}</p></div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm font-bold">{v.completion_percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${PROGRESS_COLOR[v.status]}`} style={{ width: `${v.completion_percentage}%` }} />
                </div>
            </div>

            {/* Linked Modules Preview */}
            {v.linkedModules && v.linkedModules.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {v.linkedModules.slice(0, 4).map(m => (
                        <span key={m.id} className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full font-medium">
                            {m.module_name}
                        </span>
                    ))}
                    {v.linkedModules.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                            +{v.linkedModules.length - 4} more
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button onClick={() => onViewDetails(v)} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">View Details</button>
                {v.status !== "archived" && (
                    <>
                        <button onClick={() => onAssignTests(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">Assign Tests</button>
                        <button onClick={() => onAssignModules(v)} className="px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 transition-colors">
                            <i className="fa-solid fa-puzzle-piece mr-1" /> Assign Modules
                        </button>
                        <button onClick={() => onViewIssues(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">View Issues</button>
                    </>
                )}
                <button onClick={() => onExport(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">Export Report</button>
                {v.status === "archived" && (
                    <button onClick={() => onRestore(v)} className="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors">Restore</button>
                )}
            </div>
        </div>
    </div>
));
VersionCard.displayName = "VersionCard";

export default function VersionManagement() {
    const [versions, setVersions] = useState([]);
    const [users, setUsers] = useState([]);
    const [modules, setModules] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const [confirmDialog, setConfirmDialog] = useState(null);
    const showConfirm = useCallback((message) =>
        new Promise((resolve) => setConfirmDialog({ message, resolve })), []);
    const handleConfirmYes = useCallback(() => { confirmDialog?.resolve(true); setConfirmDialog(null); }, [confirmDialog]);
    const handleConfirmNo = useCallback(() => { confirmDialog?.resolve(false); setConfirmDialog(null); }, [confirmDialog]);

    const navigate = useNavigate();

    const generateVersionNumber = useCallback((versionType) => {
        const major = Math.floor(Math.random() * 10) + 1;
        const minor = Math.floor(Math.random() * 20);
        const patch = Math.floor(Math.random() * 5);
        switch (versionType) {
            case "major": return `${major}.0.0`;
            case "minor": return `${major}.${minor}.0`;
            case "patch": return `${major}.${minor}.${patch}`;
            case "beta": return `${major}.${minor}.${patch}-beta.${Math.floor(Math.random() * 10) + 1}`;
            case "rc": return `${major}.${minor}.${patch}-rc.${Math.floor(Math.random() * 5) + 1}`;
            default: return "";
        }
    }, []);

    const generateBuildNumber = useCallback(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
        return `${year}.${month}.${sequence}`;
    }, []);

    const handleVersionTypeChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, version_type: value, version_number: value ? generateVersionNumber(value) : "" }));
    }, [generateVersionNumber]);

    const handleGenerateVersion = useCallback(() => {
        setFormData(prev => {
            if (!prev.version_type) { showToast("Please select a version type first", "warning"); return prev; }
            return { ...prev, version_number: generateVersionNumber(prev.version_type) };
        });
    }, [generateVersionNumber, showToast]);

    const handleGenerateBuild = useCallback(() => {
        setFormData(prev => ({ ...prev, build_number: generateBuildNumber() }));
    }, [generateBuildNumber]);

    const fetchVersions = useCallback(async () => {
        try {
            setLoading(true);
            const { data: versionData, error: versionError } = await supabase
                .from("versions")
                .select("*")
                .order("created_date", { ascending: false });
            if (versionError) throw versionError;

            // Fetch linked modules for each version
            const { data: vmData } = await supabase
                .from("version_modules")
                .select("version_id, modules(id, module_name, module_code)");

            const modulesByVersion = {};
            (vmData || []).forEach(row => {
                if (!modulesByVersion[row.version_id]) modulesByVersion[row.version_id] = [];
                if (row.modules) modulesByVersion[row.version_id].push(row.modules);
            });

            setVersions((versionData || []).map(v => ({
                ...v,
                linkedModules: modulesByVersion[v.id] || [],
            })));
        } catch (err) { console.error(err); setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("users").select("id, name").order("name", { ascending: true });
            if (fetchError) throw fetchError;
            setUsers(data || []);
        } catch (err) { console.error(err); }
    }, []);

    const fetchModules = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("modules")
                .select("id, module_name, module_code")
                .eq("status", "Active")
                .order("module_code", { ascending: true });
            if (fetchError) throw fetchError;
            setModules(data || []);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchVersions(); fetchUsers(); fetchModules(); }, [fetchVersions, fetchUsers, fetchModules]);

    const tabs = useMemo(() => [
        { key: "all", label: "All Versions", count: versions.length },
        { key: "active", label: "Active", count: versions.filter(v => v.status === "active").length },
        { key: "testing", label: "In Testing", count: versions.filter(v => v.status === "testing").length },
        { key: "completed", label: "Completed", count: versions.filter(v => v.status === "completed").length },
        { key: "archived", label: "Archived", count: versions.filter(v => v.status === "archived").length },
    ], [versions]);

    const stats = useMemo(() => [
        { label: "Total Versions", value: versions.length, color: "text-green-700" },
        { label: "Active", value: versions.filter(v => v.status === "active").length, color: "text-green-500" },
        { label: "In Testing", value: versions.filter(v => v.status === "testing").length, color: "text-blue-500" },
        { label: "Completed", value: versions.filter(v => v.status === "completed").length, color: "text-gray-500" },
        { label: "Archived", value: versions.filter(v => v.status === "archived").length, color: "text-gray-400" },
    ], [versions]);

    const filtered = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return versions.filter((v) => {
            if (activeTab !== "all" && v.status !== activeTab) return false;
            if (statusFilter && v.status !== statusFilter) return false;
            if (lowerSearch && !v.version_number.toLowerCase().includes(lowerSearch) && !v.build_number.toLowerCase().includes(lowerSearch)) return false;
            return true;
        });
    }, [versions, activeTab, statusFilter, search]);

    const resetForm = useCallback(() => setFormData(EMPTY_FORM), []);

    const handleCreateVersion = useCallback(async () => {
        if (!formData.version_number || !formData.build_number || !formData.release_date || !formData.version_type) {
            showToast("Please fill all required fields", "warning"); return;
        }
        try {
            const { data, error } = await supabase.from("versions").insert([{
                version_number: formData.version_number, build_number: formData.build_number,
                release_date: formData.release_date, status: formData.status,
                version_type: formData.version_type, description: formData.description,
                total_tests: 0, passed_tests: 0, failed_tests: 0, pending_tests: 0,
                completion_percentage: 0, critical_issues: 0,
            }]).select();
            if (error) throw error;
            if (formData.selectedTesters.length > 0 && data?.[0]) {
                const { error: ae } = await supabase.from("version_testers").insert(
                    formData.selectedTesters.map(tid => ({ version_id: data[0].id, tester_id: tid }))
                );
                if (ae) throw ae;
            }
            setShowModal(false); resetForm(); await fetchVersions();
            showToast("Version created successfully!");
        } catch (err) { showToast(err.message, "error"); }
    }, [formData, resetForm, fetchVersions, showToast]);

    const handleViewDetails = useCallback((v) => { setSelectedVersion(v); setShowDetailsModal(true); }, []);
    const handleAssignTests = useCallback((v) => { setSelectedVersion(v); setShowAssignModal(true); }, []);
    const handleAssignModules = useCallback((v) => { setSelectedVersion(v); setShowModulesModal(true); }, []);

    const handleEditVersion = useCallback((v) => {
        setFormData({ version_number: v.version_number, build_number: v.build_number, release_date: v.release_date, status: v.status, version_type: v.version_type, description: v.description || "", selectedTesters: [] });
        setSelectedVersion(v); setShowModal(true);
    }, []);

    const handleUpdateVersion = useCallback(async () => {
        if (!selectedVersion) return;
        try {
            const { error } = await supabase.from("versions").update({
                version_number: formData.version_number, build_number: formData.build_number,
                release_date: formData.release_date, status: formData.status,
                version_type: formData.version_type, description: formData.description,
            }).eq("id", selectedVersion.id);
            if (error) throw error;
            setShowModal(false); setSelectedVersion(null); resetForm(); await fetchVersions();
            showToast("Version updated successfully!");
        } catch (err) { showToast(err.message, "error"); }
    }, [selectedVersion, formData, resetForm, fetchVersions, showToast]);

    const handleArchiveVersion = useCallback(async (v) => {
        const ok = await showConfirm(`Archive version ${v.version_number}? It will be moved to the archived tab.`);
        if (!ok) return;
        try {
            const { error } = await supabase.from("versions").update({ status: "archived" }).eq("id", v.id);
            if (error) throw error;
            await fetchVersions(); showToast(`${v.version_number} archived successfully 📦`);
        } catch (err) { showToast(err.message, "error"); }
    }, [showConfirm, fetchVersions, showToast]);

    const handleRestoreVersion = useCallback(async (v) => {
        const ok = await showConfirm(`Restore ${v.version_number} to Completed status?`);
        if (!ok) return;
        try {
            const { error } = await supabase.from("versions").update({ status: "completed" }).eq("id", v.id);
            if (error) throw error;
            await fetchVersions(); showToast(`${v.version_number} restored!`);
        } catch (err) { showToast(err.message, "error"); }
    }, [showConfirm, fetchVersions, showToast]);

    const handleSaveAssignments = useCallback(async (assignments) => {
        if (!selectedVersion) return;
        try {
            const { error: de } = await supabase.from("version_testers").delete().eq("version_id", selectedVersion.id);
            if (de) throw de;
            if (assignments.length > 0) {
                const { error: ie } = await supabase.from("version_testers").insert(
                    assignments.map(tid => ({ version_id: selectedVersion.id, tester_id: tid }))
                );
                if (ie) throw ie;
            }
            setShowAssignModal(false); setSelectedVersion(null); await fetchVersions();
            showToast("Testers assigned successfully! 👥");
        } catch (err) { showToast(err.message, "error"); }
    }, [selectedVersion, fetchVersions, showToast]);

    const handleViewIssues = useCallback((v) => navigate(`/failed-issues?version=${v.id}`), [navigate]);

    const handleExportReport = useCallback((v) => {
        const d = {
            "Version Number": v.version_number, "Build Number": v.build_number,
            Status: v.status, Type: v.version_type, "Release Date": v.release_date,
            "Total Tests": v.total_tests, Passed: v.passed_tests, Failed: v.failed_tests,
            Pending: v.pending_tests, "Completion %": v.completion_percentage,
            "Critical Issues": v.critical_issues, Description: v.description || "N/A",
            "Linked Modules": (v.linkedModules || []).map(m => m.module_name).join("; "),
        };
        const csv = [Object.keys(d).join(","), Object.values(d).map(x => `"${x}"`).join(",")].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })));
        link.setAttribute("download", `version_report_${v.version_number}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast(`Report exported: ${v.version_number} 📊`);
    }, [showToast]);

    const handleDeleteVersion = useCallback(async (v) => {
        const ok = await showConfirm(`Permanently DELETE ${v.version_number}? This cannot be undone!`);
        if (!ok) return;
        try {
            const { error } = await supabase.from("versions").delete().eq("id", v.id);
            if (error) throw error;
            await fetchVersions(); showToast(`${v.version_number} deleted 🗑️`);
        } catch (err) { showToast(err.message, "error"); }
    }, [showConfirm, fetchVersions, showToast]);

    const handleResetFilters = useCallback(() => { setSearch(""); setStatusFilter(""); setActiveTab("all"); }, []);

    const setTestersSel = useCallback((sel) => setFormData(prev => ({ ...prev, selectedTesters: sel })), []);
    const setStatus = useCallback((v) => setFormData(prev => ({ ...prev, status: v })), []);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-green-700 mb-4" />
                <p className="text-gray-500">Loading versions...</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <Toast toasts={toasts} />
            {confirmDialog && <ConfirmDialog message={confirmDialog.message} onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />}

            <header className="static bg-white border-b z-40 px-8 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Version Management</h2>
                    <p className="text-sm text-gray-500">Manage NexTech RMS versions and builds</p>
                </div>
                <button onClick={() => { setSelectedVersion(null); resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:opacity-90 transition-opacity">
                    <i className="fa-solid fa-plus" /> Create Version
                </button>
            </header>

            <main className="p-8 space-y-6">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>Error: {error}</p>
                        <button onClick={fetchVersions} className="text-sm underline mt-2">Retry</button>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white border rounded-lg p-6 shadow-sm">
                            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Filters &amp; Search</h3>
                        <button onClick={handleResetFilters} className="text-sm text-green-700 hover:underline font-medium">Reset All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Search Version</label>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by version or build number..."
                                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <SingleDropdown options={STATUS_FILTER_OPTIONS} selected={statusFilter} onChange={setStatusFilter} placeholder="All Statuses" />
                        </div>
                        <div className="flex items-end">
                            <button className="w-full px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm">
                    <div className="flex overflow-x-auto border-b">
                        {tabs.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-green-700 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 bg-white border rounded-lg">
                            <i className="fa-solid fa-inbox text-gray-300 text-6xl mb-4 block" />
                            <p className="text-gray-500">No versions found</p>
                        </div>
                    ) : (
                        filtered.map((v) => (
                            <VersionCard key={v.id} v={v}
                                onEdit={handleEditVersion} onArchive={handleArchiveVersion}
                                onDelete={handleDeleteVersion} onViewDetails={handleViewDetails}
                                onAssignTests={handleAssignTests} onViewIssues={handleViewIssues}
                                onExport={handleExportReport} onRestore={handleRestoreVersion}
                                onAssignModules={handleAssignModules}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-bold">{selectedVersion ? "Edit Version" : "Create New Version"}</h3>
                                <p className="text-sm text-gray-500 mt-1">Add or update a version/build for NexTech RMS</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Version Number *</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.version_number}
                                            onChange={(e) => !formData.version_number && setFormData(prev => ({ ...prev, version_number: e.target.value }))}
                                            placeholder="e.g., 5.2.1" readOnly={!!formData.version_number}
                                            className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${formData.version_number ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""}`} />
                                        <button onClick={handleGenerateVersion} title="Generate version number"
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                            <i className="fa-solid fa-wand-magic-sparkles" />
                                        </button>
                                    </div>
                                    {formData.version_number && <p className="text-xs text-gray-500 mt-1">Version number is locked after generation</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Build Number *</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.build_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, build_number: e.target.value }))}
                                            placeholder="e.g., 2024.12.001"
                                            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                                        <button onClick={handleGenerateBuild} title="Generate build number"
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                            <i className="fa-solid fa-wand-magic-sparkles" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Release Date *</label>
                                    <input type="date" value={formData.release_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status *</label>
                                    <SingleDropdown options={STATUS_OPTIONS} selected={formData.status} onChange={setStatus} placeholder="Select Status" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Version Type * <span className="text-gray-400 font-normal">(auto-generates version number)</span>
                                </label>
                                <SingleDropdown options={VERSION_TYPE_OPTIONS} selected={formData.version_type} onChange={handleVersionTypeChange} placeholder="Select Type" />
                                <p className="text-xs text-green-600 mt-1"><i className="fa-solid fa-lightbulb" /> Selecting a type will auto-generate a version number</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea rows={4} value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter version description and release notes..."
                                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Assign Testers</label>
                                <CustomDropdown options={users} selected={formData.selectedTesters} onChange={setTestersSel} placeholder="Select testers..." />
                                {formData.selectedTesters.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {users.filter(u => formData.selectedTesters.includes(u.id)).map(user => (
                                            <div key={user.id} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                                                <span>{user.name}</span>
                                                <button type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, selectedTesters: prev.selectedTesters.filter(id => id !== user.id) }))}
                                                    className="hover:text-blue-900 transition-colors">
                                                    <i className="fa-solid fa-times text-xs" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <button onClick={selectedVersion ? handleUpdateVersion : handleCreateVersion}
                                    className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                                    {selectedVersion ? "Update Version" : "Create Version"}
                                </button>
                                <button onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailsModal && selectedVersion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold">Version Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm text-gray-500">Version Number</p><p className="text-lg font-bold">{selectedVersion.version_number}</p></div>
                                <div><p className="text-sm text-gray-500">Build Number</p><p className="text-lg font-bold">{selectedVersion.build_number}</p></div>
                                <div><p className="text-sm text-gray-500">Type</p><p className="text-lg font-bold capitalize">{selectedVersion.version_type}</p></div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`text-sm font-bold inline-block px-3 py-1 rounded-full ${STATUS_CONFIG[selectedVersion.status].className}`}>
                                        {STATUS_CONFIG[selectedVersion.status].label}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-500 mb-2">Description</p>
                                <p className="text-gray-700">{selectedVersion.description || "No description provided"}</p>
                            </div>
                            {/* Linked Modules in Details */}
                            {selectedVersion.linkedModules?.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-500 mb-2">Linked Modules ({selectedVersion.linkedModules.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedVersion.linkedModules.map(m => (
                                            <span key={m.id} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded-full font-medium">
                                                {m.module_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div><p className="text-sm text-gray-500">Release Date</p><p className="text-lg font-bold">{new Date(selectedVersion.release_date).toLocaleDateString()}</p></div>
                                <div><p className="text-sm text-gray-500">Created Date</p><p className="text-lg font-bold">{new Date(selectedVersion.created_date).toLocaleDateString()}</p></div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 border-t pt-4">
                                <div><p className="text-xs text-gray-500 mb-1">Total Tests</p><p className="text-2xl font-bold">{selectedVersion.total_tests}</p></div>
                                <div><p className="text-xs text-green-600 mb-1">Passed</p><p className="text-2xl font-bold text-green-600">{selectedVersion.passed_tests}</p></div>
                                <div><p className="text-xs text-red-600 mb-1">Failed</p><p className="text-2xl font-bold text-red-600">{selectedVersion.failed_tests}</p></div>
                                <div><p className="text-xs text-yellow-600 mb-1">Pending</p><p className="text-2xl font-bold text-yellow-600">{selectedVersion.pending_tests}</p></div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Completion Progress</span>
                                    <span className="text-sm font-bold">{selectedVersion.completion_percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4">
                                    <div className={`h-4 rounded-full ${PROGRESS_COLOR[selectedVersion.status]}`} style={{ width: `${selectedVersion.completion_percentage}%` }} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <button onClick={() => { setShowDetailsModal(false); handleEditVersion(selectedVersion); }}
                                    className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Edit</button>
                                <button onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Tests Modal */}
            {showAssignModal && selectedVersion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold">Assign Testers</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Assign testers to <span className="font-semibold">{selectedVersion.version_number}</span>
                            </p>
                            <CustomDropdown options={users} selected={formData.selectedTesters} onChange={setTestersSel} placeholder="Select testers to assign..." />
                            {formData.selectedTesters.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-900 mb-2">
                                        <i className="fa-solid fa-check-circle mr-2" />
                                        {formData.selectedTesters.length} tester{formData.selectedTesters.length !== 1 ? "s" : ""} selected
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {users.filter(u => formData.selectedTesters.includes(u.id)).map(user => (
                                            <span key={user.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                {user.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => handleSaveAssignments(formData.selectedTesters)}
                                    className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                                    <i className="fa-solid fa-check mr-2" /> Save Assignments
                                </button>
                                <button onClick={() => { setShowAssignModal(false); setFormData(prev => ({ ...prev, selectedTesters: [] })); }}
                                    className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modules Modal */}
            {showModulesModal && selectedVersion && (
                <AssignModulesModal
                    version={selectedVersion}
                    modules={modules}
                    onClose={() => { setShowModulesModal(false); setSelectedVersion(null); }}
                    onSuccess={fetchVersions}
                    showToast={showToast}
                />
            )}
        </div>
    );
}