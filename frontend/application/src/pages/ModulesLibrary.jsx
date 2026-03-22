import { useState, useEffect, useRef } from "react";
import supabase from "../services/supabaseClient";

/* ---------------------- GLOBAL STYLES ---------------------- */
const globalStyles = `
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] {
        -moz-appearance: textfield;
    }
`;

/* ---------------------- CUSTOM DROPDOWN COMPONENT ---------------------- */
const CustomDropdown = ({ options, selected, onChange, placeholder = "Select option..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.id === selected)?.name || placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            <style>{`
                .dropdown-trigger {
                    padding: 10px 14px;
                    background: linear-gradient(135deg, #fafbff 0%, #f4f6fb 100%);
                    border: 1.5px solid #e2e6f0;
                    border-radius: 10px;
                    font-size: 13.5px;
                    font-weight: 500;
                    letter-spacing: 0.01em;
                    color: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    transition: all 0.18s ease;
                    width: 100%;
                    text-align: left;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }
                .dropdown-trigger:hover {
                    background: linear-gradient(135deg, #f0f6ff 0%, #f4f9ff 100%);
                    border-color: #cbd5e1;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                }
                .dropdown-trigger.open {
                    background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%);
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99,102,241,.12), 0 2px 8px rgba(99,102,241,.08);
                }
                .dropdown-trigger-placeholder {
                    color: #94a3b8;
                    font-weight: 400;
                }
                .dropdown-panel {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    border: 1.5px solid #e8eaf6;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(99,102,241,.13), 0 2px 8px rgba(0,0,0,.08);
                    padding: 6px;
                    margin-top: 8px;
                    z-index: 9999;
                    max-height: 300px;
                    overflow-y: auto;
                    animation: dropdownIn 0.18s cubic-bezier(.4,0,.2,1);
                }
                .dropdown-option {
                    padding: 9px 12px;
                    border-radius: 8px;
                    font-size: 13.5px;
                    color: #374151;
                    transition: all 0.12s ease;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    letter-spacing: 0.01em;
                }
                .dropdown-option:hover {
                    background: #f8fafc;
                    color: #1e293b;
                }
                .dropdown-option.selected {
                    background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%);
                    color: #4f46e5;
                    font-weight: 600;
                }
                @keyframes dropdownIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .dropdown-panel::-webkit-scrollbar { width: 6px; }
                .dropdown-panel::-webkit-scrollbar-track { background: transparent; }
                .dropdown-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .dropdown-panel::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
            >
                <span className={`truncate ${!selected ? 'dropdown-trigger-placeholder' : ''}`}>
                    {selectedLabel}
                </span>
                <span style={{
                    marginLeft: 8,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: isOpen ? '#6366f1' : '#94a3b8',
                    flexShrink: 0,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="dropdown-panel">
                    {options.map((option) => (
                        <div
                            key={option.id}
                            onClick={() => { onChange(option.id); setIsOpen(false); }}
                            className={`dropdown-option ${selected === option.id ? 'selected' : ''}`}
                        >
                            <span>{option.name}</span>
                            {selected === option.id && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ---------------------- DROPDOWN OPTION LISTS ---------------------- */
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

/* ---------------------- COLOR MAP ---------------------- */
const colorMap = {
    blue: { bg: "bg-blue-500", text: "text-blue-500", badge: "bg-blue-500 bg-opacity-10 text-blue-600" },
    green: { bg: "bg-green-500", text: "text-green-500", badge: "bg-green-500 bg-opacity-10 text-green-600" },
    purple: { bg: "bg-purple-500", text: "text-purple-500", badge: "bg-purple-500 bg-opacity-10 text-purple-600" },
    red: { bg: "bg-red-500", text: "text-red-500", badge: "bg-red-500 bg-opacity-10 text-red-600" },
    indigo: { bg: "bg-indigo-500", text: "text-indigo-500", badge: "bg-indigo-500 bg-opacity-10 text-indigo-600" },
    pink: { bg: "bg-pink-500", text: "text-pink-500", badge: "bg-pink-500 bg-opacity-10 text-pink-600" },
    gray: { bg: "bg-gray-500", text: "text-gray-500", badge: "bg-gray-500 bg-opacity-10 text-gray-600" },
    teal: { bg: "bg-teal-500", text: "text-teal-500", badge: "bg-teal-500 bg-opacity-10 text-teal-600" },
    orange: { bg: "bg-orange-500", text: "text-orange-500", badge: "bg-orange-500 bg-opacity-10 text-orange-600" },
};

const priorityMap = {
    High: "bg-red-500 bg-opacity-10 text-red-500",
    Medium: "bg-amber-500 bg-opacity-10 text-amber-600",
    Low: "bg-gray-500 bg-opacity-10 text-gray-600",
};

/* ---------------------- EXPORT TO CSV ---------------------- */
const exportToCSV = (data) => {
    if (!data || data.length === 0) { alert("No data to export"); return; }
    const headers = ["Module Code", "Module Name", "Description", "Owner", "Priority", "Status", "Color"];
    const rows = data.map(module => [
        module.module_code, module.module_name, module.description || "",
        module.module_owner || "—", module.priority, module.status, module.color,
    ]);
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `modules_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/* ---------------------- GENERATE MODULE CODE ---------------------- */
const generateModuleCode = (existingCodes = []) => {
    const numericCodes = existingCodes
        .map(code => parseInt(code, 10))
        .filter(code => !isNaN(code))
        .sort((a, b) => a - b);
    let nextCode = 1001;
    for (const code of numericCodes) {
        if (code >= nextCode) nextCode = code + 1;
    }
    return nextCode;
};

/* ---------------------- MODULE CARD ---------------------- */
function ModuleCard({ mod, onEdit, onDelete }) {
    const c = colorMap[mod.color || "blue"];
    const isArchived = mod.status === "Archived";
    const icons = {
        "User Management": "fa-user-circle",
        "Reporting & Analytics": "fa-chart-line",
        "Notifications": "fa-bell",
        "Security & Compliance": "fa-shield-halved",
        "Data Management": "fa-database",
        "UI/UX Components": "fa-palette",
        "API & Integrations": "fa-plug",
        "Mobile Application": "fa-mobile-screen",
    };
    const icon = icons[mod.module_name] || "fa-cube";
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${isArchived ? "border-amber-300" : "border-gray-200"}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${c.bg} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${icon} ${c.text} text-2xl`}></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{mod.module_name}</h3>
                            <p className="text-xs text-gray-500">{mod.module_code}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded"
                        >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <button
                                    onClick={() => { onEdit(mod); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                                >
                                    <i className="fa-solid fa-pen-to-square text-blue-500"></i> Edit
                                </button>
                                <button
                                    onClick={() => { onDelete(mod.id, mod.module_name); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-trash text-red-500"></i> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{mod.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${isArchived ? "bg-amber-500 bg-opacity-10 text-amber-600" : "bg-green-500 bg-opacity-10 text-green-600"}`}>
                        {mod.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${priorityMap[mod.priority] || priorityMap.Low}`}>
                        {mod.priority} Priority
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-lg font-bold text-gray-900">{mod.status}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <p className="text-lg font-bold text-gray-900">{mod.priority}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Owner</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{mod.module_owner || "—"}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ID: {mod.id}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <button className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${isArchived ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-green-700 text-white hover:opacity-90"}`}>
                        <i className="fa-solid fa-eye mr-2"></i>View Details
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- EDIT MODULE MODAL ---------------------- */
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
        const { error } = await supabase
            .from("modules")
            .update({
                module_code: parseInt(form.module_code) || 0,
                module_name: form.module_name,
                description: form.description || "",
                module_owner: form.module_owner || null,
                priority: form.priority,
                status: form.status,
                color: selectedColor,
            })
            .eq("id", module.id);
        setLoading(false);

        if (error) { console.error("Update error:", error); alert(`Error: ${error.message}`); }
        else { alert("Module updated ✅"); onSuccess(); onClose(); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Edit Module</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Module Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Module Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" name="module_name" placeholder="e.g., User Management"
                            value={form.module_name} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                        />
                    </div>

                    {/* Module Code — read-only display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Module Code
                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                Auto-generated
                            </span>
                        </label>
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                            <i className="fa-solid fa-lock text-gray-400 text-xs"></i>
                            <span className="text-sm text-gray-600 font-medium">{form.module_code}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <i className="fa-solid fa-circle-info"></i>
                            Module code is fixed and cannot be changed after creation.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                        <textarea
                            rows="3" name="description" placeholder="Brief description of the module..."
                            value={form.description} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                        />
                    </div>

                    {/* Owner + Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Module Owner</label>
                            <CustomDropdown
                                options={users}
                                selected={form.module_owner}
                                onChange={value => setForm({ ...form, module_owner: value })}
                                placeholder="Select Owner"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <CustomDropdown
                                options={PRIORITY_OPTIONS}
                                selected={form.priority}
                                onChange={value => setForm({ ...form, priority: value })}
                                placeholder="Select Priority"
                            />
                        </div>
                    </div>

                    {/* Icon Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Icon Color</label>
                        <div className="flex gap-3">
                            {colors.map(c => (
                                <button key={c} onClick={() => setSelectedColor(c)}
                                    className={`w-10 h-10 rounded-lg ${colorMap[c].bg} border-2 ${selectedColor === c ? "border-blue-700" : "border-transparent hover:border-blue-400"}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status — now CustomDropdown, same as all others */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                            options={STATUS_OPTIONS}
                            selected={form.status}
                            onChange={value => setForm({ ...form, status: value })}
                            placeholder="Select Status"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button onClick={onClose} disabled={loading}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={loading}
                        className="px-6 py-2.5 bg-blue-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {loading ? "Updating..." : "Update Module"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- CREATE MODULE MODAL ---------------------- */
function CreateModuleModal({ onClose, onSuccess, users, existingModuleCodes }) {
    const colors = ["blue", "green", "purple", "red", "indigo", "pink", "teal", "orange"];
    const [selectedColor, setSelectedColor] = useState("blue");
    const [loading, setLoading] = useState(false);

    const autoCode = generateModuleCode(existingModuleCodes);

    const [form, setForm] = useState({
        module_name: "",
        description: "",
        module_owner: "",
        priority: "",
        status: "Active",
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async () => {
        if (!form.module_name) { alert("Module Name required"); return; }
        if (!form.priority) { alert("Priority required"); return; }
        if (!form.status) { alert("Status required"); return; }

        setLoading(true);
        const { error } = await supabase
            .from("modules")
            .insert([{
                module_code: autoCode,
                module_name: form.module_name,
                description: form.description || "",
                module_owner: form.module_owner || null,
                priority: form.priority,
                status: form.status,
                color: selectedColor,
            }]);
        setLoading(false);

        if (error) { console.error("Insert error:", error); alert(`Error: ${error.message}`); }
        else { alert("Module created ✅"); onSuccess(); onClose(); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Create New Module</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Module Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Module Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" name="module_name" placeholder="e.g., User Management"
                            value={form.module_name} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                        />
                    </div>

                    {/* Module Code — locked display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Module Code
                            <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full border border-green-200">
                                Auto-generated
                            </span>
                        </label>
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                            <i className="fa-solid fa-lock text-gray-400 text-xs"></i>
                            <span className="text-sm text-gray-600 font-medium">{autoCode}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <i className="fa-solid fa-circle-info"></i>
                            Automatically assigned in sequence. Cannot be edited.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows="3" name="description" placeholder="Brief description of the module..."
                            value={form.description} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                        />
                    </div>

                    {/* Owner + Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Module Owner</label>
                            <CustomDropdown
                                options={users}
                                selected={form.module_owner}
                                onChange={value => setForm({ ...form, module_owner: value })}
                                placeholder="Select Owner"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <CustomDropdown
                                options={PRIORITY_OPTIONS}
                                selected={form.priority}
                                onChange={value => setForm({ ...form, priority: value })}
                                placeholder="Select Priority"
                            />
                        </div>
                    </div>

                    {/* Icon Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Icon Color</label>
                        <div className="flex gap-3">
                            {colors.map(c => (
                                <button key={c} onClick={() => setSelectedColor(c)}
                                    className={`w-10 h-10 rounded-lg ${colorMap[c].bg} border-2 ${selectedColor === c ? "border-green-700" : "border-transparent hover:border-green-400"}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status — now CustomDropdown, same as all others */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                            options={STATUS_OPTIONS}
                            selected={form.status}
                            onChange={value => setForm({ ...form, status: value })}
                            placeholder="Select Status"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button onClick={onClose} disabled={loading}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={loading}
                        className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {loading ? "Creating..." : "Create Module"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------- MAIN COMPONENT ---------------------- */
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
            const { data, error: fetchError } = await supabase.from("modules").select("*").order("module_code", { ascending: false });
            if (fetchError) { setError(fetchError.message); setModules([]); }
            else setModules(data || []);
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

    return (
        <div className="flex-1 flex flex-col min-w-0">
            <style>{globalStyles}</style>

            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Modules Library</h2>
                            <p className="text-sm text-gray-500">Manage all modules for NexTech RMS</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => exportToCSV(modules)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                <i className="fa-solid fa-download"></i>
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                                <i className="fa-solid fa-plus"></i>
                                <span>Create Module</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8">

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue", badge: "Total" },
                            { label: "Active Modules", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "green", badge: "Active" },
                            { label: "In Progress", value: modules.filter(m => m.status === "Inactive").length, icon: "fa-hourglass-end", color: "amber", badge: "In Progress" },
                            { label: "Archived Modules", value: modules.filter(m => m.status === "Archived").length, icon: "fa-archive", color: "gray", badge: "Archived" },
                        ].map(({ label, value, icon, color, badge }) => (
                            <div key={label} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-12 h-12 bg-${color}-500 bg-opacity-10 rounded-lg flex items-center justify-center`}>
                                        <i className={`fa-solid ${icon} text-${color}-500 text-xl`}></i>
                                    </div>
                                    <span className={`px-2 py-1 bg-${color}-500 bg-opacity-10 text-${color}-600 text-xs font-medium rounded`}>{badge}</span>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        ))}
                    </div>

                    {usersError && (
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                            <p>⚠️ Warning: Error loading users — {usersError}</p>
                            <button onClick={fetchUsers} className="text-sm mt-2 underline hover:no-underline">Try again</button>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            <p>Error: {error}</p>
                            <button onClick={fetchModules} className="text-sm mt-2 underline hover:no-underline">Try again</button>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <input type="text" placeholder="Search modules..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                                />
                                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <CustomDropdown
                                options={[
                                    { id: "All Status", name: "All Status" },
                                    { id: "Active", name: "Active" },
                                    { id: "Inactive", name: "Inactive" },
                                    { id: "Archived", name: "Archived" },
                                ]}
                                selected={filterStatus}
                                onChange={value => setFilterStatus(value)}
                                placeholder="All Status"
                            />
                            <CustomDropdown
                                options={uniqueOwners.map(o => ({ id: o, name: o }))}
                                selected={filterOwner}
                                onChange={value => setFilterOwner(value)}
                                placeholder="All Owners"
                            />
                            <button
                                onClick={() => { setSearchTerm(""); setFilterStatus("All Status"); setFilterOwner("All Owners"); }}
                                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {loading && <p className="text-gray-500 text-center py-8">Loading modules...</p>}

                    {!loading && filteredModules.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No modules found. Create one to get started!</p>
                        </div>
                    )}

                    {!loading && filteredModules.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                            {filteredModules.map(mod => (
                                <ModuleCard key={mod.id} mod={mod} onEdit={handleEditModule} onDelete={handleDeleteModule} />
                            ))}
                        </div>
                    )}

                    {!loading && filteredModules.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <p className="text-sm text-gray-500">Showing {filteredModules.length} of {modules.length} modules</p>
                        </div>
                    )}
                </div>
            </main>

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
        </div>
    );
}