import { useState, useEffect, useRef } from "react";
import supabase from "../services/supabaseClient";

const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="number"] { -moz-appearance: textfield; }
    * { font-family: Inter, system-ui, -apple-system, sans-serif; }
`;

// ─── Design system tokens ──────────────────────────────────────────────────────
const DS = {
    green: "#1B5E3B",
    greenHover: "#2D7A50",
    greenTint: "#E8F5EF",
    white: "#FFFFFF",
    pageBg: "#F8F8F7",
    textPrimary: "#111827",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    textHint: "#9CA3AF",
    border: "#E5E7EB",
    cardRadius: "12px",
    btnRadius: "8px",
    // Semantic
    critical: "#E53E3E",
    criticalTint: "rgba(229,62,62,0.10)",
    warning: "#F59E0B",
    warningTint: "rgba(245,158,11,0.10)",
    passed: "#22C55E",
    passedTint: "rgba(34,197,94,0.10)",
    info: "#3B82F6",
    infoTint: "rgba(59,130,246,0.10)",
    security: "#8B5CF6",
    securityTint: "rgba(139,92,246,0.10)",
};

// ─── Shared style helpers ──────────────────────────────────────────────────────
const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: DS.white,
    border: `1px solid ${DS.border}`,
    borderRadius: DS.btnRadius,
    fontSize: "13px",
    color: DS.textPrimary,
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.5,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: DS.textPrimary,
    marginBottom: 6,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

const btnPrimary = {
    padding: "10px 24px",
    background: DS.green,
    border: "none",
    color: DS.white,
    borderRadius: DS.btnRadius,
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

const btnCancel = {
    padding: "10px 24px",
    background: DS.white,
    border: `1px solid ${DS.border}`,
    color: DS.textSecondary,
    borderRadius: DS.btnRadius,
    fontWeight: 500,
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

const btnDanger = {
    padding: "10px 24px",
    background: DS.critical,
    border: "none",
    color: DS.white,
    borderRadius: DS.btnRadius,
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

// ─── Badge component ───────────────────────────────────────────────────────────
const Badge = ({ label, bg, color }) => (
    <span style={{
        padding: "2px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        background: bg,
        color,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        letterSpacing: "0.01em",
        display: "inline-block",
    }}>{label}</span>
);

// ─── CustomDropdown (design-system styled, flip-up aware) ────────────────────
function getScrollParent(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
        const { overflow, overflowY } = window.getComputedStyle(parent);
        if (/auto|scroll/.test(overflow + overflowY)) return parent;
        parent = parent.parentElement;
    }
    return null;
}

const CustomDropdown = ({ options, selected, onChange, placeholder = "Select option..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const scrollParent = getScrollParent(dropdownRef.current);
            const containerBottom = scrollParent ? scrollParent.getBoundingClientRect().bottom : window.innerHeight;
            const spaceBelow = containerBottom - rect.bottom;
            const dropdownHeight = Math.min(options.length * 42 + 16, 300);
            setFlipUp(spaceBelow < dropdownHeight + 8);
        }
        setIsOpen(p => !p);
    };

    const selectedLabel = options.find(opt => opt.id === selected)?.name || placeholder;

    return (
        <div style={{ position: "relative", userSelect: "none" }} ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isOpen ? "#f0fdf4" : DS.white,
                    border: isOpen ? `1.5px solid #22c55e` : `1px solid ${DS.border}`,
                    borderRadius: DS.btnRadius,
                    fontSize: "13px",
                    color: selected ? DS.textPrimary : DS.textHint,
                    fontWeight: selected ? 500 : 400,
                    cursor: "pointer",
                    boxShadow: isOpen ? `0 0 0 3px rgba(34,197,94,0.12)` : "none",
                    outline: "none",
                    transition: "all 0.18s ease",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                }}
            >
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedLabel}
                </span>
                <span style={{
                    marginLeft: 8, display: "flex", alignItems: "center",
                    transition: "transform 0.22s cubic-bezier(.4,0,.2,1)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: isOpen ? "#22c55e" : DS.textHint, flexShrink: 0,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    ...(flipUp ? { bottom: "calc(100% + 6px)", top: "auto" } : { top: "calc(100% + 6px)", bottom: "auto" }),
                    left: 0, right: 0,
                    zIndex: 9999, background: DS.white,
                    border: `1.5px solid #dcfce7`,
                    borderRadius: DS.cardRadius,
                    boxShadow: "0 8px 24px rgba(34,197,94,0.10), 0 2px 8px rgba(0,0,0,0.08)",
                    padding: 6, maxHeight: 300, overflowY: "auto",
                    animation: `${flipUp ? "ddUp" : "ddIn"} 0.18s cubic-bezier(.4,0,.2,1)`,
                }}>
                    <style>{`
                        @keyframes ddIn { from{opacity:0;transform:translateY(-6px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
                        @keyframes ddUp { from{opacity:0;transform:translateY(6px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
                    `}</style>
                    {options.map((option) => {
                        const isSel = selected === option.id;
                        return (
                            <div
                                key={option.id}
                                onClick={() => { onChange(option.id); setIsOpen(false); }}
                                style={{
                                    padding: "9px 12px", borderRadius: "8px",
                                    fontSize: "13px", cursor: "pointer",
                                    fontWeight: isSel ? 600 : 400,
                                    color: isSel ? "#15803d" : DS.textSecondary,
                                    background: isSel ? "#dcfce7" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    transition: "all 0.12s ease",
                                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = isSel ? "#bbf7d0" : "#f0fdf4"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isSel ? "#dcfce7" : "transparent"; }}
                            >
                                <span>{option.name}</span>
                                {isSel && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                        <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
    { id: "High", name: "High" },
    { id: "Medium", name: "Medium" },
    { id: "Low", name: "Low" },
];

const STATUS_OPTIONS = [
    { id: "Active", name: "Active" },
    { id: "Inactive", name: "Inactive" },
    { id: "Archived", name: "Archived" },
];

const colorMap = {
    blue: { bg: "bg-blue-500", text: "text-blue-500", hex: DS.info, tint: DS.infoTint },
    green: { bg: "bg-green-500", text: "text-green-500", hex: DS.green, tint: DS.greenTint },
    purple: { bg: "bg-purple-500", text: "text-purple-500", hex: DS.security, tint: DS.securityTint },
    red: { bg: "bg-red-500", text: "text-red-500", hex: DS.critical, tint: DS.criticalTint },
    indigo: { bg: "bg-indigo-500", text: "text-indigo-500", hex: "#6366F1", tint: "rgba(99,102,241,0.10)" },
    pink: { bg: "bg-pink-500", text: "text-pink-500", hex: "#EC4899", tint: "rgba(236,72,153,0.10)" },
    gray: { bg: "bg-gray-500", text: "text-gray-500", hex: DS.textMuted, tint: "rgba(107,114,128,0.10)" },
    teal: { bg: "bg-teal-500", text: "text-teal-500", hex: "#14B8A6", tint: "rgba(20,184,166,0.10)" },
    orange: { bg: "bg-orange-500", text: "text-orange-500", hex: "#F97316", tint: "rgba(249,115,22,0.10)" },
};

const priorityBadge = {
    High: { bg: DS.criticalTint, color: DS.critical },
    Medium: { bg: DS.warningTint, color: DS.warning },
    Low: { bg: "rgba(107,114,128,0.10)", color: DS.textMuted },
};

const statusBadge = {
    Active: { bg: DS.passedTint, color: DS.passed },
    Inactive: { bg: DS.warningTint, color: DS.warning },
    Archived: { bg: "rgba(107,114,128,0.10)", color: DS.textMuted },
};

const exportToCSV = (data) => {
    if (!data || data.length === 0) { alert("No data to export"); return; }
    const headers = ["Module Code", "Module Name", "Description", "Owner", "Priority", "Status", "Color", "Linked Versions"];
    const rows = data.map(module => [
        module.module_code, module.module_name, module.description || "",
        module.module_owner || "—", module.priority, module.status, module.color,
        (module.linkedVersions || []).map(v => v.version_number).join("; "),
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `modules_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const generateModuleCode = (existingCodes = []) => {
    const numericCodes = existingCodes.map(code => parseInt(code, 10)).filter(code => !isNaN(code)).sort((a, b) => a - b);
    let nextCode = 1001;
    for (const code of numericCodes) { if (code >= nextCode) nextCode = code + 1; }
    return nextCode;
};

// ─── Module Card ───────────────────────────────────────────────────────────────
// Rectangle card: text/label top-left, icon top-right, number below label
function ModuleCard({ mod, onEdit, onDelete }) {
    const c = colorMap[mod.color || "blue"];
    const isArchived = mod.status === "Archived";
    const icons = {
        "User Management": "fa-user-circle", "Reporting & Analytics": "fa-chart-line",
        "Notifications": "fa-bell", "Security & Compliance": "fa-shield-halved",
        "Data Management": "fa-database", "UI/UX Components": "fa-palette",
        "API & Integrations": "fa-plug", "Mobile Application": "fa-mobile-screen",
    };
    const icon = icons[mod.module_name] || "fa-cube";
    const pb = priorityBadge[mod.priority] || priorityBadge.Low;
    const sb = statusBadge[mod.status] || statusBadge.Active;

    return (
        <div style={{
            background: DS.white,
            border: `1px solid ${isArchived ? "#F59E0B" : DS.border}`,
            borderRadius: DS.cardRadius,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            transition: "box-shadow 0.18s",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}
        >
            <div style={{ padding: "24px" }}>

                {/* Top row: name+code left, icon right */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, color: DS.textPrimary, fontSize: "15px", margin: "0 0 2px", lineHeight: 1.3 }}>{mod.module_name}</h3>
                        <p style={{ fontSize: "12px", color: DS.textMuted, margin: 0 }}>{mod.module_code}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        {/* Module icon */}
                        <div style={{ width: 40, height: 40, background: c.tint, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className={`fa-solid ${icon}`} style={{ color: c.hex, fontSize: "17px" }}></i>
                        </div>
                        {/* Edit button */}
                        <button
                            onClick={() => onEdit(mod)}
                            title="Edit"
                            style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: DS.infoTint, border: "none", borderRadius: "7px", cursor: "pointer", color: DS.info, fontSize: "13px", transition: "background 0.15s", flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.20)"}
                            onMouseLeave={e => e.currentTarget.style.background = DS.infoTint}
                        >
                            <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        {/* Delete button */}
                        <button
                            onClick={() => onDelete(mod.id, mod.module_name)}
                            title="Delete"
                            style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: DS.criticalTint, border: "none", borderRadius: "7px", cursor: "pointer", color: DS.critical, fontSize: "13px", transition: "background 0.15s", flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(229,62,62,0.20)"}
                            onMouseLeave={e => e.currentTarget.style.background = DS.criticalTint}
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: "13px", color: DS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>{mod.description}</p>

                {/* Status + Priority badges + Linked Versions all on one row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
                    <Badge label={mod.status} bg={sb.bg} color={sb.color} />
                    <Badge label={`${mod.priority} Priority`} bg={pb.bg} color={pb.color} />
                    {mod.linkedVersions && mod.linkedVersions.length > 0 && (
                        <>
                            {mod.linkedVersions.slice(0, 3).map(v => (
                                <span key={v.id} style={{ padding: "2px 10px", background: DS.infoTint, border: `1px solid rgba(59,130,246,0.25)`, color: DS.info, fontSize: "12px", borderRadius: "20px", fontWeight: 500 }}>
                                    {v.version_number}
                                </span>
                            ))}
                            {mod.linkedVersions.length > 3 && (
                                <span style={{ padding: "2px 10px", background: DS.pageBg, color: DS.textMuted, fontSize: "12px", borderRadius: "20px", fontWeight: 500 }}>
                                    +{mod.linkedVersions.length - 3} more
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Stats row — label top-left, number below (rectangle sub-cards) */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12, marginBottom: 16,
                    paddingBottom: 16, borderBottom: `1px solid ${DS.border}`,
                }}>
                    {[
                        { label: "Status", value: mod.status },
                        { label: "Priority", value: mod.priority },
                        { label: "Owner", value: mod.module_owner || "—" },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p style={{ fontSize: "12px", color: DS.textMuted, margin: "0 0 2px", lineHeight: 1.5 }}>{label}</p>
                            <p style={{ fontSize: label === "Owner" ? "12px" : "15px", fontWeight: 700, color: DS.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: "12px", color: DS.textHint }}>ID: {mod.id}</span>
                </div>

                <button
                    style={{
                        width: "100%", padding: "10px 16px",
                        background: isArchived ? DS.white : DS.green,
                        border: isArchived ? `1px solid ${DS.border}` : "none",
                        color: isArchived ? DS.textSecondary : DS.white,
                        borderRadius: DS.btnRadius, fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background 0.15s",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                    onMouseEnter={e => { if (!isArchived) e.currentTarget.style.background = DS.greenHover; }}
                    onMouseLeave={e => { if (!isArchived) e.currentTarget.style.background = DS.green; }}
                >
                    <i className="fa-solid fa-eye"></i>View Details
                </button>
            </div>
        </div>
    );
}

// ─── Shared Modal shell ────────────────────────────────────────────────────────
const modalOverlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)",
    zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const modalBox = {
    background: DS.white, borderRadius: DS.cardRadius,
    boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
    width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};
const modalHeader = {
    padding: "20px 24px", borderBottom: `1px solid ${DS.border}`,
    position: "sticky", top: 0, background: DS.white, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
};
const modalFooter = {
    padding: "16px 24px", borderTop: `1px solid ${DS.border}`,
    position: "sticky", bottom: 0, background: DS.white,
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
};

const ColorPicker = ({ colors, selectedColor, setSelectedColor, accentColor }) => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {colors.map(c => (
            <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                    width: 36, height: 36, borderRadius: "8px",
                    background: colorMap[c]?.hex || "#6B7280",
                    border: selectedColor === c ? `2.5px solid ${accentColor || DS.green}` : "2.5px solid transparent",
                    cursor: "pointer", transition: "border 0.15s",
                    outline: "none",
                }}
            />
        ))}
    </div>
);

// ─── Edit Module Modal ─────────────────────────────────────────────────────────
function EditModuleModal({ module, onClose, onSuccess, users }) {
    const colors = ["blue", "green", "purple", "red", "indigo", "pink", "teal", "orange"];
    const [selectedColor, setSelectedColor] = useState(module?.color || "blue");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        module_code: module?.module_code || "",
        module_name: module?.module_name || "",
        description: module?.description || "",
        module_owner: module?.module_owner || "",
        priority: module?.priority || "",
        status: module?.status || "Active",
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleUpdate = async () => {
        if (!form.module_name) { alert("Module Name required"); return; }
        if (!form.priority) { alert("Priority required"); return; }
        if (!form.status) { alert("Status required"); return; }
        setLoading(true);
        const { error } = await supabase.from("modules").update({
            module_code: parseInt(form.module_code) || 0,
            module_name: form.module_name, description: form.description || "",
            module_owner: form.module_owner || null, priority: form.priority,
            status: form.status, color: selectedColor,
        }).eq("id", module.id);
        setLoading(false);
        if (error) { alert(`Error: ${error.message}`); }
        else { alert("Module updated ✅"); onSuccess(); onClose(); }
    };

    const userOptions = [{ id: "", name: "Select Owner" }, ...users.map(u => ({ id: u.name || u.id, name: u.name }))];

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: DS.infoTint, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="fa-solid fa-pen-to-square" style={{ color: DS.info, fontSize: "15px" }}></i>
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: DS.textPrimary, margin: 0 }}>Edit Module</h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: DS.textMuted, cursor: "pointer", fontSize: "18px" }}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Module Name <span style={{ color: DS.critical }}>*</span></label>
                        <input type="text" name="module_name" placeholder="e.g., User Management" value={form.module_name} onChange={handleChange}
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = DS.green}
                            onBlur={e => e.target.style.borderColor = DS.border} />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Module Code
                            <span style={{ marginLeft: 8, padding: "2px 8px", background: DS.pageBg, color: DS.textMuted, fontSize: "11px", fontWeight: 500, borderRadius: "20px", letterSpacing: "0.03em" }}>Auto-generated</span>
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: DS.pageBg, border: `1px solid ${DS.border}`, borderRadius: DS.btnRadius }}>
                            <i className="fa-solid fa-lock" style={{ color: DS.textHint, fontSize: "12px" }}></i>
                            <span style={{ fontSize: "13px", color: DS.textMuted, fontWeight: 500 }}>{form.module_code}</span>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea rows="3" name="description" placeholder="Brief description..." value={form.description} onChange={handleChange}
                            style={{ ...inputStyle, resize: "none" }}
                            onFocus={e => e.target.style.borderColor = DS.green}
                            onBlur={e => e.target.style.borderColor = DS.border} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Module Owner</label>
                            <CustomDropdown options={userOptions} selected={form.module_owner} onChange={value => setForm({ ...form, module_owner: value })} placeholder="Select Owner" />
                        </div>
                        <div>
                            <label style={labelStyle}>Priority <span style={{ color: DS.critical }}>*</span></label>
                            <CustomDropdown options={PRIORITY_OPTIONS} selected={form.priority} onChange={value => setForm({ ...form, priority: value })} placeholder="Select Priority" />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Icon Color</label>
                        <ColorPicker colors={colors} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
                    </div>
                    <div>
                        <label style={labelStyle}>Status <span style={{ color: DS.critical }}>*</span></label>
                        <CustomDropdown options={STATUS_OPTIONS} selected={form.status} onChange={value => setForm({ ...form, status: value })} placeholder="Select Status" />
                    </div>
                </div>

                <div style={modalFooter}>
                    <button onClick={onClose} disabled={loading} style={btnCancel}>Cancel</button>
                    <button onClick={handleUpdate} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                        {loading ? "Updating..." : "Update Module"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Create Module Modal ───────────────────────────────────────────────────────
function CreateModuleModal({ onClose, onSuccess, users, existingModuleCodes }) {
    const colors = ["blue", "green", "purple", "red", "indigo", "pink", "teal", "orange"];
    const [selectedColor, setSelectedColor] = useState("blue");
    const [loading, setLoading] = useState(false);
    const autoCode = generateModuleCode(existingModuleCodes);
    const [form, setForm] = useState({ module_name: "", description: "", module_owner: "", priority: "", status: "Active" });
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async () => {
        if (!form.module_name) { alert("Module Name required"); return; }
        if (!form.priority) { alert("Priority required"); return; }
        if (!form.status) { alert("Status required"); return; }
        setLoading(true);
        const { error } = await supabase.from("modules").insert([{
            module_code: autoCode, module_name: form.module_name,
            description: form.description || "", module_owner: form.module_owner || null,
            priority: form.priority, status: form.status, color: selectedColor,
        }]);
        setLoading(false);
        if (error) { alert(`Error: ${error.message}`); }
        else { alert("Module created ✅"); onSuccess(); onClose(); }
    };

    const userOptions = [{ id: "", name: "Select Owner" }, ...users.map(u => ({ id: u.name || u.id, name: u.name }))];

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: DS.textPrimary, margin: 0 }}>Create New Module</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: DS.textMuted, cursor: "pointer", fontSize: "18px" }}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Module Name <span style={{ color: DS.critical }}>*</span></label>
                        <input type="text" name="module_name" placeholder="e.g., User Management" value={form.module_name} onChange={handleChange}
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = DS.green}
                            onBlur={e => e.target.style.borderColor = DS.border} />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Module Code
                            <span style={{ marginLeft: 8, padding: "2px 8px", background: DS.greenTint, color: DS.green, fontSize: "11px", fontWeight: 500, borderRadius: "20px", border: `1px solid rgba(27,94,59,0.20)`, letterSpacing: "0.03em" }}>Auto-generated</span>
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: DS.pageBg, border: `1px solid ${DS.border}`, borderRadius: DS.btnRadius }}>
                            <i className="fa-solid fa-lock" style={{ color: DS.textHint, fontSize: "12px" }}></i>
                            <span style={{ fontSize: "13px", color: DS.textMuted, fontWeight: 500 }}>{autoCode}</span>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Description <span style={{ color: DS.critical }}>*</span></label>
                        <textarea rows="3" name="description" placeholder="Brief description..." value={form.description} onChange={handleChange}
                            style={{ ...inputStyle, resize: "none" }}
                            onFocus={e => e.target.style.borderColor = DS.green}
                            onBlur={e => e.target.style.borderColor = DS.border} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Module Owner</label>
                            <CustomDropdown options={userOptions} selected={form.module_owner} onChange={value => setForm({ ...form, module_owner: value })} placeholder="Select Owner" />
                        </div>
                        <div>
                            <label style={labelStyle}>Priority <span style={{ color: DS.critical }}>*</span></label>
                            <CustomDropdown options={PRIORITY_OPTIONS} selected={form.priority} onChange={value => setForm({ ...form, priority: value })} placeholder="Select Priority" />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Icon Color</label>
                        <ColorPicker colors={colors} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
                    </div>
                    <div>
                        <label style={labelStyle}>Status <span style={{ color: DS.critical }}>*</span></label>
                        <CustomDropdown options={STATUS_OPTIONS} selected={form.status} onChange={value => setForm({ ...form, status: value })} placeholder="Select Status" />
                    </div>
                </div>

                <div style={modalFooter}>
                    <button onClick={onClose} disabled={loading} style={btnCancel}>Cancel</button>
                    <button onClick={handleCreate} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                        {loading ? "Creating..." : "Create Module"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card — rectangle, label top-left, icon top-right, number below ───────
const statIconMap = {
    blue: { hex: DS.info, tint: DS.infoTint },
    green: { hex: DS.green, tint: DS.greenTint },
    amber: { hex: DS.warning, tint: DS.warningTint },
    gray: { hex: DS.textMuted, tint: "rgba(107,114,128,0.10)" },
};

function StatCard({ label, value, icon, color, badge, badgeBg, badgeColor }) {
    const ic = statIconMap[color] || statIconMap.blue;
    return (
        <div style={{
            background: DS.white,
            border: `1px solid ${DS.border}`,
            borderRadius: DS.cardRadius,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            minHeight: "110px",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}>
            {/* Top row: label left, icon right */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: "13px", color: DS.textMuted, fontWeight: 400, margin: 0, lineHeight: 1.5 }}>{label}</p>
                <div style={{ width: 40, height: 40, borderRadius: "10px", background: ic.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
                    <i className={`fa-solid ${icon}`} style={{ color: ic.hex, fontSize: "16px" }}></i>
                </div>
            </div>
            {/* Number below label */}
            <h3 style={{ fontSize: "32px", fontWeight: 700, color: DS.textPrimary, margin: 0, lineHeight: 1.0 }}>{value}</h3>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ModulesLibrary() {
    const [modules, setModules] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersError, setUsersError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [filterOwner, setFilterOwner] = useState("All Owners");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        try {
            setUsersLoading(true); setUsersError(null);
            const { data, error: fetchError } = await supabase.from("users").select("*").order("name", { ascending: true });
            if (fetchError) { setUsersError(fetchError.message); setUsers([]); }
            else setUsers(data || []);
        } catch (err) { setUsersError(err.message); setUsers([]); }
        finally { setUsersLoading(false); }
    };

    const fetchModules = async () => {
        try {
            setLoading(true); setError(null);
            const { data: moduleData, error: fetchError } = await supabase
                .from("modules").select("*").order("module_code", { ascending: false });
            if (fetchError) { setError(fetchError.message); setModules([]); return; }

            const { data: vmData } = await supabase
                .from("version_modules")
                .select("module_id, versions(id, version_number, status)");

            const versionsByModule = {};
            (vmData || []).forEach(row => {
                if (!versionsByModule[row.module_id]) versionsByModule[row.module_id] = [];
                if (row.versions) versionsByModule[row.module_id].push(row.versions);
            });

            setModules((moduleData || []).map(m => ({
                ...m,
                linkedVersions: versionsByModule[m.id] || [],
            })));
        } catch (err) { setError(err.message); setModules([]); }
        finally { setLoading(false); }
    };

    const handleDeleteModule = async (moduleId, moduleName) => {
        if (!window.confirm(`Are you sure you want to delete "${moduleName}"?`)) return;
        try {
            const { error } = await supabase.from("modules").delete().eq("id", moduleId);
            if (error) alert(`Error: ${error.message}`);
            else { alert("Module deleted ✅"); fetchModules(); }
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleEditModule = (module) => { setEditingModule(module); setShowEditModal(true); };

    useEffect(() => { fetchUsers(); fetchModules(); }, []);

    const filteredModules = modules.filter(mod => {
        const matchesSearch = mod.module_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All Status" || mod.status === filterStatus;
        const matchesOwner = filterOwner === "All Owners" || mod.module_owner === filterOwner;
        return matchesSearch && matchesStatus && matchesOwner;
    });

    const uniqueOwners = ["All Owners", ...new Set(modules.map(m => m.module_owner).filter(Boolean))];
    const existingModuleCodes = modules.map(m => m.module_code);

    const statsConfig = [
        { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue", badge: "Total" },
        { label: "Active Modules", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "green", badge: "Active" },
        { label: "In Progress", value: modules.filter(m => m.status === "Inactive").length, icon: "fa-hourglass-end", color: "amber", badge: "In Progress" },
        { label: "Archived Modules", value: modules.filter(m => m.status === "Archived").length, icon: "fa-archive", color: "gray", badge: "Archived" },
    ];

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
            <style>{globalStyles}</style>

            {/* Header */}
            <header style={{ position: "sticky", top: 0, background: DS.white, borderBottom: `1px solid ${DS.border}`, zIndex: 40 }}>
                <div style={{ padding: "16px 32px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: DS.textPrimary, margin: 0, lineHeight: 1.2 }}>Modules Library</h2>
                            <p style={{ fontSize: "13px", color: DS.textMuted, margin: "4px 0 0", lineHeight: 1.5 }}>Manage all modules for NexTech RMS</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={() => exportToCSV(modules)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 16px", background: DS.white,
                                border: `1px solid ${DS.border}`, color: DS.textSecondary,
                                borderRadius: DS.btnRadius, fontSize: "13px", fontWeight: 500,
                                cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                            }}>
                                <i className="fa-solid fa-download"></i>
                                <span>Export</span>
                            </button>
                            <button onClick={() => setShowModal(true)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 18px", background: DS.green,
                                border: "none", color: DS.white,
                                borderRadius: DS.btnRadius, fontSize: "13px", fontWeight: 600,
                                cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                transition: "background 0.15s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = DS.greenHover}
                                onMouseLeave={e => e.currentTarget.style.background = DS.green}
                            >
                                <i className="fa-solid fa-plus"></i>
                                <span>Create Module</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "32px" }}>

                    {/* Stat Cards — rectangle, label top-left, icon top-right, number below */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                        {statsConfig.map(s => <StatCard key={s.label} {...s} />)}
                    </div>

                    {/* Error banners */}
                    {usersError && (
                        <div style={{ background: DS.warningTint, border: `1px solid rgba(245,158,11,0.30)`, color: "#92400E", padding: "14px 18px", borderRadius: "8px", marginBottom: 24, fontSize: "13px" }}>
                            <p style={{ margin: 0 }}>⚠️ Warning: Error loading users — {usersError}</p>
                            <button onClick={fetchUsers} style={{ fontSize: "12px", marginTop: 6, textDecoration: "underline", background: "none", border: "none", color: "#92400E", cursor: "pointer" }}>Try again</button>
                        </div>
                    )}
                    {error && (
                        <div style={{ background: DS.criticalTint, border: `1px solid rgba(229,62,62,0.30)`, color: DS.critical, padding: "14px 18px", borderRadius: "8px", marginBottom: 24, fontSize: "13px" }}>
                            <p style={{ margin: 0 }}>Error: {error}</p>
                            <button onClick={fetchModules} style={{ fontSize: "12px", marginTop: 6, textDecoration: "underline", background: "none", border: "none", color: DS.critical, cursor: "pointer" }}>Try again</button>
                        </div>
                    )}

                    {/* Filters */}
                    <div style={{ background: DS.white, border: `1px solid ${DS.border}`, borderRadius: DS.cardRadius, marginBottom: 24 }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16 }}>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text" placeholder="Search modules..."
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        style={{ ...inputStyle, paddingLeft: 38 }}
                                        onFocus={e => e.target.style.borderColor = DS.green}
                                        onBlur={e => e.target.style.borderColor = DS.border}
                                    />
                                    <i className="fa-solid fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.textHint, fontSize: "13px" }}></i>
                                </div>
                                <CustomDropdown
                                    options={[{ id: "All Status", name: "All Status" }, { id: "Active", name: "Active" }, { id: "Inactive", name: "Inactive" }, { id: "Archived", name: "Archived" }]}
                                    selected={filterStatus} onChange={value => setFilterStatus(value)} placeholder="All Status" />
                                <CustomDropdown
                                    options={uniqueOwners.map(o => ({ id: o, name: o }))}
                                    selected={filterOwner} onChange={value => setFilterOwner(value)} placeholder="All Owners" />
                                <button
                                    onClick={() => { setSearchTerm(""); setFilterStatus("All Status"); setFilterOwner("All Owners"); }}
                                    style={{ padding: "10px 16px", background: DS.white, border: `1px solid ${DS.border}`, color: DS.textSecondary, borderRadius: DS.btnRadius, fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <p style={{ color: DS.textMuted, textAlign: "center", padding: "32px 0", fontSize: "13px" }}>Loading modules...</p>
                    )}

                    {!loading && filteredModules.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <i className="fa-solid fa-inbox" style={{ color: DS.border, fontSize: "48px", display: "block", marginBottom: 16 }}></i>
                            <p style={{ color: DS.textMuted, fontSize: "13px" }}>No modules found. Create one to get started!</p>
                        </div>
                    )}

                    {!loading && filteredModules.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
                            {filteredModules.map(mod => (
                                <ModuleCard key={mod.id} mod={mod} onEdit={handleEditModule} onDelete={handleDeleteModule} />
                            ))}
                        </div>
                    )}

                    {!loading && filteredModules.length > 0 && (
                        <div style={{ background: DS.white, border: `1px solid ${DS.border}`, borderRadius: DS.cardRadius, padding: "16px 24px" }}>
                            <p style={{ fontSize: "13px", color: DS.textMuted, margin: 0 }}>Showing {filteredModules.length} of {modules.length} modules</p>
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <CreateModuleModal onClose={() => setShowModal(false)} onSuccess={fetchModules} users={users} existingModuleCodes={existingModuleCodes} />
            )}
            {showEditModal && editingModule && (
                <EditModuleModal module={editingModule} onClose={() => { setShowEditModal(false); setEditingModule(null); }} onSuccess={fetchModules} users={users} />
            )}
        </div>
    );
}