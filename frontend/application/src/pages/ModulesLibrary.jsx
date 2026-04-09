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

// ─── CustomDropdown ────────────────────────────────────────────────────────────
const CustomDropdown = ({ options, selected, onChange, placeholder = "Select option..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.id === selected)?.name || placeholder;

    return (
        <div style={{ position: "relative", userSelect: "none" }} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 14px",
                    background: DS.white,
                    border: isOpen ? `1.5px solid ${DS.green}` : `1px solid ${DS.border}`,
                    borderRadius: DS.btnRadius, fontSize: "13px",
                    color: selected ? DS.textPrimary : DS.textHint,
                    fontWeight: selected ? 500 : 400, cursor: "pointer",
                    boxShadow: isOpen ? `0 0 0 3px rgba(27,94,59,0.10)` : "none",
                    outline: "none", transition: "all 0.18s ease",
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
                    color: isOpen ? DS.green : DS.textHint, flexShrink: 0,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    zIndex: 9999, background: DS.white, border: `1px solid ${DS.border}`,
                    borderRadius: DS.cardRadius, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    padding: 6, maxHeight: 300, overflowY: "auto",
                    animation: "ddIn 0.18s cubic-bezier(.4,0,.2,1)",
                }}>
                    <style>{`@keyframes ddIn { from{opacity:0;transform:translateY(-6px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
                    {options.map((option) => {
                        const isSel = selected === option.id;
                        return (
                            <div
                                key={option.id}
                                onClick={() => { onChange(option.id); setIsOpen(false); }}
                                style={{
                                    padding: "9px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
                                    fontWeight: isSel ? 600 : 400,
                                    color: isSel ? DS.green : DS.textSecondary,
                                    background: isSel ? DS.greenTint : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    transition: "all 0.12s ease",
                                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = DS.pageBg; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span>{option.name}</span>
                                {isSel && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                        <path d="M2.5 7l3.5 3.5 5.5-6" stroke={DS.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
    blue: { hex: DS.info, tint: DS.infoTint },
    green: { hex: DS.green, tint: DS.greenTint },
    purple: { hex: DS.security, tint: DS.securityTint },
    red: { hex: DS.critical, tint: DS.criticalTint },
    indigo: { hex: "#6366F1", tint: "rgba(99,102,241,0.10)" },
    pink: { hex: "#EC4899", tint: "rgba(236,72,153,0.10)" },
    gray: { hex: DS.textMuted, tint: "rgba(107,114,128,0.10)" },
    teal: { hex: "#14B8A6", tint: "rgba(20,184,166,0.10)" },
    orange: { hex: "#F97316", tint: "rgba(249,115,22,0.10)" },
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

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModuleModal({ module, onClose, onConfirm, loading }) {
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)",
            zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={onClose}>
            <div style={{
                background: DS.white, borderRadius: DS.cardRadius,
                boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
                width: "100%", maxWidth: 440,
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                animation: "fadeUp 0.2s cubic-bezier(.4,0,.2,1)",
            }} onClick={e => e.stopPropagation()}>
                <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

                <div style={{ padding: "24px" }}>
                    {/* Icon + title row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: "10px",
                                background: DS.criticalTint,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <i className="fa-solid fa-trash" style={{ color: DS.critical, fontSize: "18px" }}></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: DS.textPrimary, margin: "0 0 2px" }}>Delete Module</h3>
                                <p style={{ fontSize: "12px", color: DS.textMuted, margin: 0 }}>This action cannot be undone.</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.textMuted, cursor: "pointer", fontSize: "16px", padding: 4 }}>
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/* Module info card */}
                    <div style={{
                        background: DS.pageBg, border: `1px solid ${DS.border}`,
                        borderRadius: "10px", padding: "14px 16px", marginBottom: 14,
                    }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: DS.textPrimary, margin: "0 0 4px" }}>{module?.module_name}</p>
                        <p style={{ fontSize: "12px", color: DS.textMuted, margin: "0 0 6px", fontFamily: "monospace" }}>Code: {module?.module_code}</p>
                        {module?.description && (
                            <p style={{ fontSize: "12px", color: DS.textMuted, margin: 0, lineHeight: 1.5 }}>{module.description}</p>
                        )}
                    </div>

                    {/* Warning */}
                    <div style={{
                        background: DS.criticalTint, border: `1px solid rgba(229,62,62,0.25)`,
                        borderRadius: "8px", padding: "12px 14px", marginBottom: 20,
                        display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: DS.critical, fontSize: "14px", marginTop: 1, flexShrink: 0 }}></i>
                        <p style={{ fontSize: "12px", color: DS.critical, margin: 0, lineHeight: 1.5 }}>
                            Deleting this module will permanently remove it and all associated data including features and test cases linked to it.
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button onClick={onClose} disabled={loading} style={btnCancel}>Cancel</button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            style={{ ...btnDanger, opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}
                        >
                            <i className="fa-solid fa-trash"></i>
                            {loading ? "Deleting..." : "Delete Module"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod, onEdit, onDelete, onViewDetails }) {
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
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, background: c.tint, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <i className={`fa-solid ${icon}`} style={{ color: c.hex, fontSize: "18px" }}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 2 }}>
                                <h3 style={{ fontWeight: 700, color: DS.textPrimary, fontSize: "15px", margin: 0, lineHeight: 1.3, whiteSpace: "nowrap" }}>{mod.module_name}</h3>
                                {mod.linkedVersions && mod.linkedVersions.slice(0, 2).map(v => (
                                    <span key={v.id} style={{
                                        padding: "1px 8px", background: DS.infoTint,
                                        border: `1px solid rgba(59,130,246,0.25)`, color: DS.info,
                                        fontSize: "11px", borderRadius: "20px", fontWeight: 600,
                                        whiteSpace: "nowrap", lineHeight: 1.6,
                                    }}>{v.version_number}</span>
                                ))}
                                {mod.linkedVersions && mod.linkedVersions.length > 2 && (
                                    <span style={{ padding: "1px 7px", background: DS.pageBg, color: DS.textMuted, fontSize: "11px", borderRadius: "20px", fontWeight: 500, lineHeight: 1.6 }}>
                                        +{mod.linkedVersions.length - 2}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: "12px", color: DS.textMuted, margin: 0 }}>{mod.module_code}</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 10 }}>
                        <button
                            onClick={() => onEdit(mod)}
                            title="Edit"
                            style={{
                                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                                background: DS.infoTint, border: "none", borderRadius: "7px",
                                color: DS.info, cursor: "pointer", fontSize: "12px", transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.20)"}
                            onMouseLeave={e => e.currentTarget.style.background = DS.infoTint}
                        >
                            <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                            onClick={() => onDelete(mod)}
                            title="Delete"
                            style={{
                                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                                background: DS.criticalTint, border: "none", borderRadius: "7px",
                                color: DS.critical, cursor: "pointer", fontSize: "12px", transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(229,62,62,0.20)"}
                            onMouseLeave={e => e.currentTarget.style.background = DS.criticalTint}
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                <p style={{ fontSize: "13px", color: DS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>{mod.description}</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    <Badge label={mod.status} bg={sb.bg} color={sb.color} />
                    <Badge label={`${mod.priority} Priority`} bg={pb.bg} color={pb.color} />
                </div>

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
                    onClick={onViewDetails}
                >
                    <i className="fa-solid fa-eye"></i>View Details
                </button>
            </div>
        </div>
    );
}

// ─── Modal primitives ──────────────────────────────────────────────────────────
const modalOverlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)",
    zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};

const modalBox = {
    background: DS.white, borderRadius: DS.cardRadius,
    boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
    width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
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
                    cursor: "pointer", transition: "border 0.15s", outline: "none",
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
        else { onSuccess(); onClose(); }
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
                        <input type="text" name="module_name" value={form.module_name} onChange={handleChange}
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
                        <textarea rows="3" name="description" value={form.description} onChange={handleChange}
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
        else { onSuccess(); onClose(); }
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const statIconMap = {
    blue: { hex: DS.info, tint: DS.infoTint },
    green: { hex: DS.green, tint: DS.greenTint },
    amber: { hex: DS.warning, tint: DS.warningTint },
    gray: { hex: DS.textMuted, tint: "rgba(107,114,128,0.10)" },
};

function StatCard({ label, value, icon, color }) {
    const ic = statIconMap[color] || statIconMap.blue;
    return (
        <div style={{
            background: DS.white, border: `1px solid ${DS.border}`,
            borderRadius: DS.cardRadius, padding: "20px 24px",
            display: "flex", flexDirection: "column", minHeight: "110px",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: "13px", color: DS.textMuted, fontWeight: 400, margin: 0, lineHeight: 1.5 }}>{label}</p>
                <div style={{ width: 40, height: 40, borderRadius: "10px", background: ic.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
                    <i className={`fa-solid ${icon}`} style={{ color: ic.hex, fontSize: "16px" }}></i>
                </div>
            </div>
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
    const [viewingModule, setViewingModule] = useState(null);
    const [moduleFeatures, setModuleFeatures] = useState([]);
    const [featuresLoading, setFeaturesLoading] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersError, setUsersError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [filterOwner, setFilterOwner] = useState("All Owners");
    const [searchTerm, setSearchTerm] = useState("");

    // ── Delete modal state ──
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const fetchModuleFeatures = async (moduleId) => {
        setFeaturesLoading(true);
        try {
            const { data, error } = await supabase
                .from("features")
                .select("id, feature_name, feature_code, status, priority, total_test_cases")
                .eq("module_id", moduleId)
                .order("feature_code", { ascending: true });
            if (error) throw error;
            setModuleFeatures(data || []);
        } catch (err) { console.error(err); setModuleFeatures([]); }
        finally { setFeaturesLoading(false); }
    };

    // ── Open delete modal instead of window.confirm ──
    const handleDeleteClick = (mod) => {
        setDeleteTarget(mod);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const { error } = await supabase.from("modules").delete().eq("id", deleteTarget.id);
            if (error) { alert(`Error: ${error.message}`); }
            else { fetchModules(); setDeleteTarget(null); }
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setDeleteLoading(false); }
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
        { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue" },
        { label: "Active Modules", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "green" },
        { label: "In Progress", value: modules.filter(m => m.status === "Inactive").length, icon: "fa-hourglass-end", color: "amber" },
        { label: "Archived Modules", value: modules.filter(m => m.status === "Archived").length, icon: "fa-archive", color: "gray" },
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

                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                        {statsConfig.map(s => <StatCard key={s.label} {...s} />)}
                    </div>

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
                                <ModuleCard
                                    key={mod.id}
                                    mod={mod}
                                    onEdit={handleEditModule}
                                    onDelete={handleDeleteClick}
                                    onViewDetails={() => { setViewingModule(mod); fetchModuleFeatures(mod.id); }}
                                />
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

            {/* ── Modals ── */}
            {showModal && (
                <CreateModuleModal onClose={() => setShowModal(false)} onSuccess={fetchModules} users={users} existingModuleCodes={existingModuleCodes} />
            )}
            {showEditModal && editingModule && (
                <EditModuleModal module={editingModule} onClose={() => { setShowEditModal(false); setEditingModule(null); }} onSuccess={fetchModules} users={users} />
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <DeleteModuleModal
                    module={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    loading={deleteLoading}
                />
            )}

            {/* ── View Details Modal ── */}
            {viewingModule && (() => {
                const c = colorMap[viewingModule.color || "blue"];
                const pb = priorityBadge[viewingModule.priority] || priorityBadge.Low;
                const sb = statusBadge[viewingModule.status] || statusBadge.Active;
                const icons = {
                    "User Management": "fa-user-circle", "Reporting & Analytics": "fa-chart-line",
                    "Notifications": "fa-bell", "Security & Compliance": "fa-shield-halved",
                    "Data Management": "fa-database", "UI/UX Components": "fa-palette",
                    "API & Integrations": "fa-plug", "Mobile Application": "fa-mobile-screen",
                };
                const icon = icons[viewingModule.module_name] || "fa-cube";
                const featurePriorityBadge = { High: { bg: DS.criticalTint, color: DS.critical }, Medium: { bg: DS.warningTint, color: DS.warning }, Low: { bg: "rgba(107,114,128,0.10)", color: DS.textMuted } };
                const featureStatusBadge = { Active: { bg: DS.passedTint, color: DS.passed }, Inactive: { bg: DS.warningTint, color: DS.warning }, Archived: { bg: "rgba(107,114,128,0.10)", color: DS.textMuted }, Draft: { bg: DS.infoTint, color: DS.info } };
                return (
                    <div style={modalOverlay} onClick={() => setViewingModule(null)}>
                        <div style={modalBox} onClick={e => e.stopPropagation()}>
                            <div style={modalHeader}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 44, height: 44, background: c.tint, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <i className={`fa-solid ${icon}`} style={{ color: c.hex, fontSize: "20px" }}></i>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: DS.textPrimary, margin: 0, lineHeight: 1.2 }}>{viewingModule.module_name}</h3>
                                        <p style={{ fontSize: "12px", color: DS.textMuted, margin: "2px 0 0" }}>Code: {viewingModule.module_code}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingModule(null)} style={{ background: "none", border: "none", color: DS.textMuted, cursor: "pointer", fontSize: "18px" }}>
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>

                            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                    {[
                                        { label: "Status", value: viewingModule.status, bg: sb.bg, color: sb.color },
                                        { label: "Priority", value: `${viewingModule.priority} Priority`, bg: pb.bg, color: pb.color },
                                        { label: "Owner", value: viewingModule.module_owner || "—", bg: DS.infoTint, color: DS.info },
                                    ].map(item => (
                                        <div key={item.label} style={{ padding: "12px 16px", background: item.bg, borderRadius: "10px" }}>
                                            <p style={{ fontSize: "11px", fontWeight: 500, color: DS.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                                            <p style={{ fontSize: "13px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {viewingModule.description && (
                                    <div style={{ padding: "14px 16px", background: DS.pageBg, borderRadius: "10px", border: `1px solid ${DS.border}` }}>
                                        <p style={{ fontSize: "11px", fontWeight: 500, color: DS.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</p>
                                        <p style={{ fontSize: "13px", color: DS.textSecondary, margin: 0, lineHeight: 1.6 }}>{viewingModule.description}</p>
                                    </div>
                                )}

                                {viewingModule.linkedVersions && viewingModule.linkedVersions.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: "11px", fontWeight: 600, color: DS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                                            Linked Versions <span style={{ marginLeft: 6, padding: "1px 8px", background: DS.infoTint, color: DS.info, borderRadius: 20, fontWeight: 700 }}>{viewingModule.linkedVersions.length}</span>
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            {viewingModule.linkedVersions.map(v => (
                                                <span key={v.id} style={{ padding: "3px 12px", background: DS.infoTint, border: `1px solid rgba(59,130,246,0.25)`, color: DS.info, fontSize: "12px", borderRadius: "20px", fontWeight: 500 }}>
                                                    {v.version_number}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
                                    <div style={{ padding: "14px 18px", background: DS.pageBg, borderBottom: `1px solid ${DS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, background: DS.securityTint, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <i className="fa-solid fa-list-check" style={{ color: DS.security, fontSize: "14px" }}></i>
                                        </div>
                                        <p style={{ fontSize: "14px", fontWeight: 600, color: DS.textPrimary, margin: 0 }}>Connected Features</p>
                                        {!featuresLoading && (
                                            <span style={{ padding: "2px 10px", background: DS.securityTint, color: DS.security, fontSize: "12px", borderRadius: 20, fontWeight: 700 }}>
                                                {moduleFeatures.length}
                                            </span>
                                        )}
                                    </div>

                                    {featuresLoading ? (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10 }}>
                                            <div style={{ width: 18, height: 18, border: `2px solid ${DS.security}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}></div>
                                            <span style={{ fontSize: "13px", color: DS.textMuted }}>Loading features…</span>
                                        </div>
                                    ) : moduleFeatures.length === 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 0", gap: 10 }}>
                                            <div style={{ width: 44, height: 44, background: DS.pageBg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="fa-solid fa-list-check" style={{ color: DS.textHint, fontSize: "18px" }}></i>
                                            </div>
                                            <p style={{ fontSize: "13px", color: DS.textMuted, margin: 0 }}>No features connected to this module</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {moduleFeatures.map((f, idx) => {
                                                const fp = featurePriorityBadge[f.priority] || featurePriorityBadge.Low;
                                                const fs = featureStatusBadge[f.status] || featureStatusBadge.Active;
                                                return (
                                                    <div key={f.id} style={{
                                                        display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
                                                        borderBottom: idx < moduleFeatures.length - 1 ? `1px solid ${DS.border}` : "none",
                                                        background: DS.white, transition: "background 0.12s",
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = DS.pageBg}
                                                        onMouseLeave={e => e.currentTarget.style.background = DS.white}
                                                    >
                                                        <div style={{ width: 32, height: 32, background: DS.securityTint, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            <i className="fa-solid fa-list-check" style={{ color: DS.security, fontSize: "13px" }}></i>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: "13px", fontWeight: 600, color: DS.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.feature_name}</p>
                                                            <p style={{ fontSize: "12px", color: DS.textMuted, margin: 0 }}>{f.feature_code} · {f.total_test_cases ?? 0} test cases</p>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                                            {f.priority && <span style={{ padding: "2px 10px", background: fp.bg, color: fp.color, fontSize: "11px", borderRadius: "6px", fontWeight: 500 }}>{f.priority}</span>}
                                                            {f.status && <span style={{ padding: "2px 10px", background: fs.bg, color: fs.color, fontSize: "11px", borderRadius: "6px", fontWeight: 500 }}>{f.status}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={modalFooter}>
                                <button onClick={() => setViewingModule(null)} style={btnCancel}>Close</button>
                                <button onClick={() => { setViewingModule(null); handleEditModule(viewingModule); }} style={btnPrimary}>
                                    <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }}></i> Edit Module
                                </button>
                            </div>

                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}