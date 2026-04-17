import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import supabase from "../services/supabaseClient";

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
    blue: { hex: "#3B82F6", tint: "rgba(59,130,246,0.10)" },
    green: { hex: "#1B5E3B", tint: "#E8F5EF" },
    purple: { hex: "#8B5CF6", tint: "rgba(139,92,246,0.10)" },
    red: { hex: "#E53E3E", tint: "rgba(229,62,62,0.10)" },
    indigo: { hex: "#6366F1", tint: "rgba(99,102,241,0.10)" },
    pink: { hex: "#EC4899", tint: "rgba(236,72,153,0.10)" },
    gray: { hex: "#6B7280", tint: "rgba(107,114,128,0.10)" },
    teal: { hex: "#14B8A6", tint: "rgba(20,184,166,0.10)" },
    orange: { hex: "#F97316", tint: "rgba(249,115,22,0.10)" },
};

const priorityBadge = {
    High: { bg: "bg-red-50", text: "text-red-600" },
    Medium: { bg: "bg-yellow-50", text: "text-yellow-600" },
    Low: { bg: "bg-gray-100", text: "text-gray-500" },
};

const statusBadge = {
    Active: { bg: "bg-green-50", text: "text-green-600" },
    Inactive: { bg: "bg-yellow-50", text: "text-yellow-600" },
    Archived: { bg: "bg-gray-100", text: "text-gray-500" },
};

const moduleIcons = {
    "User Management": "fa-user-circle",
    "Reporting & Analytics": "fa-chart-line",
    "Notifications": "fa-bell",
    "Security & Compliance": "fa-shield-halved",
    "Data Management": "fa-database",
    "UI/UX Components": "fa-palette",
    "API & Integrations": "fa-plug",
    "Mobile Application": "fa-mobile-screen",
};

const exportToCSV = (data) => {
    if (!data || data.length === 0) { alert("No data to export"); return; }
    const headers = ["Module Code", "Module Name", "Description", "Owner", "Priority", "Status", "Color", "Linked Versions"];
    const rows = data.map(m => [
        m.module_code, m.module_name, m.description || "",
        m.module_owner || "—", m.priority, m.status, m.color,
        (m.linkedVersions || []).map(v => v.version_number).join("; "),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })));
    link.setAttribute("download", `modules_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const generateModuleCode = (existingCodes = []) => {
    const nums = existingCodes.map(c => parseInt(c, 10)).filter(c => !isNaN(c)).sort((a, b) => a - b);
    let next = 1001;
    for (const c of nums) { if (c >= next) next = c + 1; }
    return next;
};

// ─── Simple dropdown matching Versions page style ──────────────────────────────
function SimpleDropdown({ options, value, onChange, placeholder = "Select..." }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const label = options.find(o => o.id === value)?.name;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white ${open ? "border-green-600 ring-2 ring-green-100" : "border-gray-200"} ${label ? "text-gray-900" : "text-gray-400"}`}
            >
                <span className="truncate">{label || placeholder}</span>
                <svg className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${open ? "rotate-180 text-green-700" : "text-gray-400"}`} viewBox="0 0 14 14" fill="none">
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-1.5 max-h-60 overflow-y-auto">
                        {options.map(opt => {
                            const sel = opt.id === value;
                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setOpen(false); }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${sel ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                    <span>{opt.name}</span>
                                    {sel && (
                                        <svg className="w-3.5 h-3.5 text-green-700 flex-shrink-0" viewBox="0 0 14 14" fill="none">
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
}

// ─── Color Picker ──────────────────────────────────────────────────────────────
function ColorPicker({ colors, selected, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {colors.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    title={c}
                    style={{ background: colorMap[c]?.hex }}
                    className={`w-8 h-8 rounded-lg transition-all ${selected === c ? "ring-2 ring-offset-2 ring-green-700 scale-110" : "opacity-70 hover:opacity-100"}`}
                />
            ))}
        </div>
    );
}

const COLORS = ["blue", "green", "purple", "red", "indigo", "pink", "teal", "orange"];

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
            </label>
            {children}
        </div>
    );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModuleModal({ module, onClose, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-trash text-red-500 text-lg" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Delete Module</h3>
                            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <i className="fa-solid fa-times text-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Module info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{module?.module_name}</p>
                        <p className="text-xs text-gray-400 font-mono mb-1">Code: {module?.module_code}</p>
                        {module?.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">{module.description}</p>
                        )}
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600 leading-relaxed">
                            Deleting this module will permanently remove it and all associated data including features and test cases linked to it.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} disabled={loading}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            <i className="fa-solid fa-trash text-xs" />
                            {loading ? "Deleting..." : "Delete Module"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Module Modal ─────────────────────────────────────────────────────────
function EditModuleModal({ module, onClose, onSuccess, users }) {
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

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const userOptions = [{ id: "", name: "Select Owner" }, ...users.map(u => ({ id: u.name || u.id, name: u.name }))];

    const handleUpdate = async () => {
        if (!form.module_name) { alert("Module Name required"); return; }
        if (!form.priority) { alert("Priority required"); return; }
        setLoading(true);
        const { error } = await supabase.from("modules").update({
            module_code: parseInt(form.module_code) || 0,
            module_name: form.module_name,
            description: form.description || "",
            module_owner: form.module_owner || null,
            priority: form.priority,
            status: form.status,
            color: selectedColor,
        }).eq("id", module.id);
        setLoading(false);
        if (error) { alert(`Error: ${error.message}`); }
        else { onSuccess(); onClose(); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-pen-to-square text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Edit Module</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Update module details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                        <i className="fa-solid fa-times text-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <Field label="Module Name" required>
                        <input
                            type="text" value={form.module_name}
                            onChange={e => set("module_name", e.target.value)}
                            placeholder="e.g., User Management"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500" />
                    </Field>

                    <Field label="Module Code" hint="Auto-generated · read-only">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <i className="fa-solid fa-lock text-gray-300 text-xs" />
                            <span className="text-sm text-gray-500 font-mono">{form.module_code}</span>
                        </div>
                    </Field>

                    <Field label="Description">
                        <textarea
                            rows={3} value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Brief description of this module..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500 resize-none" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Module Owner">
                            <SimpleDropdown options={userOptions} value={form.module_owner} onChange={v => set("module_owner", v)} placeholder="Select Owner" />
                        </Field>
                        <Field label="Priority" required>
                            <SimpleDropdown options={PRIORITY_OPTIONS} value={form.priority} onChange={v => set("priority", v)} placeholder="Select Priority" />
                        </Field>
                    </div>

                    <Field label="Status" required>
                        <SimpleDropdown options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} placeholder="Select Status" />
                    </Field>

                    <Field label="Icon Color">
                        <ColorPicker colors={COLORS} selected={selectedColor} onChange={setSelectedColor} />
                    </Field>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                    <button onClick={onClose} disabled={loading}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={loading}
                        className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                        {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Updating…</> : <><i className="fa-solid fa-check" /> Update Module</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Create Module Modal ───────────────────────────────────────────────────────
function CreateModuleModal({ onClose, onSuccess, users, existingModuleCodes }) {
    const [selectedColor, setSelectedColor] = useState("blue");
    const [loading, setLoading] = useState(false);
    const autoCode = generateModuleCode(existingModuleCodes);
    const [form, setForm] = useState({ module_name: "", description: "", module_owner: "", priority: "", status: "Active" });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const userOptions = [{ id: "", name: "Select Owner" }, ...users.map(u => ({ id: u.name || u.id, name: u.name }))];

    const handleCreate = async () => {
        if (!form.module_name) { alert("Module Name required"); return; }
        if (!form.priority) { alert("Priority required"); return; }
        setLoading(true);
        const { error } = await supabase.from("modules").insert([{
            module_code: autoCode,
            module_name: form.module_name,
            description: form.description || "",
            module_owner: form.module_owner || null,
            priority: form.priority,
            status: form.status,
            color: selectedColor,
        }]);
        setLoading(false);
        if (error) { alert(`Error: ${error.message}`); }
        else { onSuccess(); onClose(); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-plus text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Create New Module</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Add a new module to the library</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                        <i className="fa-solid fa-times text-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <Field label="Module Name" required>
                        <input
                            type="text" value={form.module_name}
                            onChange={e => set("module_name", e.target.value)}
                            placeholder="e.g., User Management"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500" />
                    </Field>

                    <Field label="Module Code" hint="Auto-generated">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                            <i className="fa-solid fa-lock text-green-400 text-xs" />
                            <span className="text-sm text-green-700 font-mono font-medium">{autoCode}</span>
                        </div>
                    </Field>

                    <Field label="Description" required>
                        <textarea
                            rows={3} value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Brief description of this module..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500 resize-none" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Module Owner">
                            <SimpleDropdown options={userOptions} value={form.module_owner} onChange={v => set("module_owner", v)} placeholder="Select Owner" />
                        </Field>
                        <Field label="Priority" required>
                            <SimpleDropdown options={PRIORITY_OPTIONS} value={form.priority} onChange={v => set("priority", v)} placeholder="Select Priority" />
                        </Field>
                    </div>

                    <Field label="Status" required>
                        <SimpleDropdown options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} placeholder="Select Status" />
                    </Field>

                    <Field label="Icon Color">
                        <ColorPicker colors={COLORS} selected={selectedColor} onChange={setSelectedColor} />
                    </Field>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                    <button onClick={onClose} disabled={loading}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={loading}
                        className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                        {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Creating…</> : <><i className="fa-solid fa-plus" /> Create Module</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── View Details Modal ────────────────────────────────────────────────────────
function ViewDetailsModal({ module, onClose, onEdit, moduleFeatures, featuresLoading }) {
    const c = colorMap[module.color || "blue"];
    const icon = moduleIcons[module.module_name] || "fa-cube";
    const pb = priorityBadge[module.priority] || priorityBadge.Low;
    const sb = statusBadge[module.status] || statusBadge.Active;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: c.tint }}>
                            <i className={`fa-solid ${icon} text-lg`} style={{ color: c.hex }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{module.module_name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">Code: {module.module_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <i className="fa-solid fa-times text-lg" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Info grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl ${sb.bg}`}>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Status</p>
                            <p className={`text-sm font-bold ${sb.text}`}>{module.status}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${pb.bg}`}>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Priority</p>
                            <p className={`text-sm font-bold ${pb.text}`}>{module.priority}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Owner</p>
                            <p className="text-sm font-bold text-blue-600 truncate">{module.module_owner || "—"}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {module.description && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                        </div>
                    )}

                    {/* Linked Versions */}
                    {module.linkedVersions && module.linkedVersions.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                Linked Versions
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{module.linkedVersions.length}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {module.linkedVersions.map(v => (
                                    <span key={v.id} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs rounded-full font-medium">
                                        {v.version_number}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Connected Features */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                <i className="fa-solid fa-list-check text-purple-500 text-sm" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800">Connected Features</p>
                            {!featuresLoading && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-full">{moduleFeatures.length}</span>
                            )}
                        </div>

                        {featuresLoading ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                                <i className="fa-solid fa-spinner fa-spin" /> Loading features…
                            </div>
                        ) : moduleFeatures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <i className="fa-solid fa-list-check text-gray-200 text-3xl" />
                                <p className="text-sm text-gray-400">No features connected to this module</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {moduleFeatures.map(f => {
                                    const fp = priorityBadge[f.priority] || priorityBadge.Low;
                                    const fs = statusBadge[f.status] || statusBadge.Active;
                                    return (
                                        <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-list-check text-purple-400 text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{f.feature_name}</p>
                                                <p className="text-xs text-gray-400">{f.feature_code} · {f.total_test_cases ?? 0} test cases</p>
                                            </div>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                {f.priority && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fp.bg} ${fp.text}`}>{f.priority}</span>}
                                                {f.status && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fs.bg} ${fs.text}`}>{f.status}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                    <button onClick={() => { onClose(); onEdit(module); }}
                        className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                        <i className="fa-solid fa-pen-to-square text-xs" /> Edit Module
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod, onEdit, onDelete, onViewDetails }) {
    const c = colorMap[mod.color || "blue"];
    const isArchived = mod.status === "Archived";
    const icon = moduleIcons[mod.module_name] || "fa-cube";
    const pb = priorityBadge[mod.priority] || priorityBadge.Low;
    const sb = statusBadge[mod.status] || statusBadge.Active;

    return (
        <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow ${isArchived ? "border-yellow-300 opacity-70" : "border-gray-200"}`}>
            <div className="p-6">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: c.tint }}>
                            <i className={`fa-solid ${icon} text-lg`} style={{ color: c.hex }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                                <h3 className="text-sm font-bold text-gray-900 truncate">{mod.module_name}</h3>
                                {(mod.linkedVersions || []).slice(0, 2).map(v => (
                                    <span key={v.id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">{v.version_number}</span>
                                ))}
                                {(mod.linkedVersions || []).length > 2 && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{mod.linkedVersions.length - 2}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono">{mod.module_code}</p>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => onEdit(mod)} title="Edit"
                            className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-lg transition-colors text-xs">
                            <i className="fa-solid fa-pen-to-square" />
                        </button>
                        <button onClick={() => onDelete(mod)} title="Delete"
                            className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors text-xs">
                            <i className="fa-solid fa-trash" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">{mod.description}</p>

                {/* Badges */}
                <div className="flex gap-2 mb-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sb.bg} ${sb.text}`}>{mod.status}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pb.bg} ${pb.text}`}>{mod.priority} Priority</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-100">
                    {[
                        { label: "Status", value: mod.status },
                        { label: "Priority", value: mod.priority },
                        { label: "Owner", value: mod.module_owner || "—" },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                            <p className="text-xs font-semibold text-gray-800 truncate">{value}</p>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-300 mb-3">ID: {mod.id}</p>

                {/* View Details */}
                <button
                    onClick={onViewDetails}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${isArchived ? "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50" : "bg-green-700 text-white hover:opacity-90"}`}>
                    <i className="fa-solid fa-eye text-xs" /> View Details
                </button>
            </div>
        </div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, colorClass, bgClass }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-gray-500">{label}</p>
                <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center`}>
                    <i className={`fa-solid ${icon} ${colorClass} text-base`} />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
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
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [filterOwner, setFilterOwner] = useState("All Owners");
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUsers = async () => {
        const { data } = await supabase.from("users").select("*").order("name", { ascending: true });
        setUsers(data || []);
    };

    const fetchModules = async () => {
        setLoading(true); setError(null);
        const { data: moduleData, error: fetchError } = await supabase
            .from("modules").select("*").order("module_code", { ascending: false });
        if (fetchError) { setError(fetchError.message); setModules([]); setLoading(false); return; }

        const { data: vmData } = await supabase
            .from("version_modules")
            .select("module_id, versions(id, version_number, status)");

        const versionsByModule = {};
        (vmData || []).forEach(row => {
            if (!versionsByModule[row.module_id]) versionsByModule[row.module_id] = [];
            if (row.versions) versionsByModule[row.module_id].push(row.versions);
        });

        setModules((moduleData || []).map(m => ({ ...m, linkedVersions: versionsByModule[m.id] || [] })));
        setLoading(false);
    };

    const fetchModuleFeatures = async (moduleId) => {
        setFeaturesLoading(true);
        const { data, error } = await supabase
            .from("features")
            .select("id, feature_name, feature_code, status, priority, total_test_cases")
            .eq("module_id", moduleId)
            .order("feature_code", { ascending: true });
        if (!error) setModuleFeatures(data || []);
        setFeaturesLoading(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        const { error } = await supabase.from("modules").delete().eq("id", deleteTarget.id);
        setDeleteLoading(false);
        if (error) { alert(`Error: ${error.message}`); }
        else { fetchModules(); setDeleteTarget(null); }
    };

    const handleEditModule = (module) => { setEditingModule(module); setShowEditModal(true); };

    const location = useLocation();

    useEffect(() => { fetchUsers(); fetchModules(); }, []);

    // Auto-open module detail when navigated here with a moduleId
    useEffect(() => {
        const moduleId = location.state?.moduleId;
        if (!moduleId || modules.length === 0) return;
        const target = modules.find(m => m.id === moduleId);
        if (target) {
            setViewingModule(target);
            fetchModuleFeatures(target.id);
        }
    }, [location.state?.moduleId, modules]);

    const filteredModules = modules.filter(mod => {
        const matchesSearch = mod.module_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All Status" || mod.status === filterStatus;
        const matchesOwner = filterOwner === "All Owners" || mod.module_owner === filterOwner;
        return matchesSearch && matchesStatus && matchesOwner;
    });

    const uniqueOwners = ["All Owners", ...new Set(modules.map(m => m.module_owner).filter(Boolean))];
    const existingModuleCodes = modules.map(m => m.module_code);

    const statsConfig = [
        { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", colorClass: "text-blue-500", bgClass: "bg-blue-50" },
        { label: "Active Modules", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", colorClass: "text-green-700", bgClass: "bg-green-50" },
        { label: "In Progress", value: modules.filter(m => m.status === "Inactive").length, icon: "fa-hourglass-end", colorClass: "text-yellow-500", bgClass: "bg-yellow-50" },
        { label: "Archived Modules", value: modules.filter(m => m.status === "Archived").length, icon: "fa-archive", colorClass: "text-gray-400", bgClass: "bg-gray-100" },
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">

            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
                <div className="px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Modules Library</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Manage all modules for NexTech RMS</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => exportToCSV(modules)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                            <i className="fa-solid fa-download" /> Export
                        </button>
                        <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                            <i className="fa-solid fa-plus" /> Create Module
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="p-8 space-y-6">

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsConfig.map(s => <StatCard key={s.label} {...s} />)}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                            <i className="fa-solid fa-circle-exclamation" />
                            <span>Error: {error}</span>
                            <button onClick={fetchModules} className="underline ml-auto">Retry</button>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="relative sm:col-span-2">
                                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                                <input
                                    type="text" placeholder="Search modules..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                            </div>
                            <SimpleDropdown
                                options={[{ id: "All Status", name: "All Status" }, { id: "Active", name: "Active" }, { id: "Inactive", name: "Inactive" }, { id: "Archived", name: "Archived" }]}
                                value={filterStatus} onChange={setFilterStatus} placeholder="All Status" />
                            <SimpleDropdown
                                options={uniqueOwners.map(o => ({ id: o, name: o }))}
                                value={filterOwner} onChange={setFilterOwner} placeholder="All Owners" />
                        </div>
                        {(searchTerm || filterStatus !== "All Status" || filterOwner !== "All Owners") && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-500">Showing {filteredModules.length} of {modules.length} modules</p>
                                <button onClick={() => { setSearchTerm(""); setFilterStatus("All Status"); setFilterOwner("All Owners"); }}
                                    className="text-sm text-green-700 font-medium hover:underline">Clear Filters</button>
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-16">
                            <i className="fa-solid fa-spinner fa-spin text-3xl text-green-700 mb-3 block" />
                            <p className="text-gray-500 text-sm">Loading modules...</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && filteredModules.length === 0 && (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                            <i className="fa-solid fa-inbox text-5xl text-gray-200 mb-4 block" />
                            <p className="text-gray-400 text-sm">No modules found. Create one to get started!</p>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && filteredModules.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredModules.map(mod => (
                                <ModuleCard
                                    key={mod.id}
                                    mod={mod}
                                    onEdit={handleEditModule}
                                    onDelete={setDeleteTarget}
                                    onViewDetails={() => { setViewingModule(mod); fetchModuleFeatures(mod.id); }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Footer count */}
                    {!loading && filteredModules.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl px-6 py-4">
                            <p className="text-sm text-gray-400">Showing {filteredModules.length} of {modules.length} modules</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showModal && (
                <CreateModuleModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchModules}
                    users={users}
                    existingModuleCodes={existingModuleCodes}
                />
            )}
            {showEditModal && editingModule && (
                <EditModuleModal
                    module={editingModule}
                    onClose={() => { setShowEditModal(false); setEditingModule(null); }}
                    onSuccess={fetchModules}
                    users={users}
                />
            )}
            {deleteTarget && (
                <DeleteModuleModal
                    module={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    loading={deleteLoading}
                />
            )}
            {viewingModule && (
                <ViewDetailsModal
                    module={viewingModule}
                    onClose={() => setViewingModule(null)}
                    onEdit={handleEditModule}
                    moduleFeatures={moduleFeatures}
                    featuresLoading={featuresLoading}
                />
            )}
        </div>
    );
}