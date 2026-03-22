import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   MULTI-SELECT CUSTOM DROPDOWN  (used for Assign Testers)
───────────────────────────────────────────────────────────── */
const CustomDropdown = ({ options, selected, onChange, placeholder = "Select options..." }) => {
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

    const handleSelect = (optionId) => {
        const newSelected = selected.includes(optionId)
            ? selected.filter(id => id !== optionId)
            : [...selected, optionId];
        onChange(newSelected);
    };

    const selectedLabels = options
        .filter(opt => selected.includes(opt.id))
        .map(opt => opt.name)
        .join(", ");

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isOpen
                        ? 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 100%)'
                        : 'linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)',
                    border: isOpen ? '1.5px solid #6366f1' : '1.5px solid #e2e6f0',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    color: selected.length > 0 ? '#1e293b' : '#94a3b8',
                    fontWeight: selected.length > 0 ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isOpen
                        ? '0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    outline: 'none',
                    letterSpacing: '0.01em',
                }}
            >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabels || placeholder}
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
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: '#ffffff',
                    border: '1.5px solid #e8eaf6',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    animation: 'ddIn 0.18s cubic-bezier(.4,0,.2,1)',
                }}>
                    <style>{`
                        @keyframes ddIn {
                            from { opacity:0; transform:translateY(-6px) scale(0.98); }
                            to   { opacity:1; transform:translateY(0) scale(1); }
                        }
                    `}</style>
                    <div style={{ padding: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                        {options.map((option) => {
                            const isSel = selected.includes(option.id);
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13.5px',
                                        fontWeight: isSel ? 600 : 400,
                                        color: isSel ? '#4f46e5' : '#374151',
                                        background: isSel
                                            ? 'linear-gradient(135deg,#eef2ff 0%,#f0f4ff 100%)'
                                            : 'transparent',
                                        transition: 'all 0.12s ease',
                                        letterSpacing: '0.01em',
                                    }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {/* Checkbox */}
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: isSel ? 'none' : '1.5px solid #cbd5e1',
                                        background: isSel
                                            ? 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)'
                                            : '#ffffff',
                                        transition: 'all 0.12s ease',
                                    }}>
                                        {isSel && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <span style={{ flex: 1 }}>{option.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   SINGLE-SELECT CUSTOM DROPDOWN  (used for Status, Version Type, Filter)
───────────────────────────────────────────────────────────── */
const SingleDropdown = ({ options, selected, onChange, placeholder = "Select..." }) => {
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

    const selectedLabel = options.find(o => o.id === selected)?.name || null;

    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isOpen
                        ? 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 100%)'
                        : 'linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)',
                    border: isOpen ? '1.5px solid #6366f1' : '1.5px solid #e2e6f0',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    color: selected ? '#1e293b' : '#94a3b8',
                    fontWeight: selected ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isOpen
                        ? '0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    outline: 'none',
                    letterSpacing: '0.01em',
                }}
            >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabel || placeholder}
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
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: '#ffffff',
                    border: '1.5px solid #e8eaf6',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    animation: 'ddIn 0.18s cubic-bezier(.4,0,.2,1)',
                }}>
                    <div style={{ padding: '6px', maxHeight: '300px', overflowY: 'auto' }}>
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13.5px',
                                        fontWeight: isSel ? 600 : 400,
                                        color: isSel ? '#4f46e5' : isHov ? '#1e293b' : '#374151',
                                        background: isSel
                                            ? 'linear-gradient(135deg,#eef2ff 0%,#f0f4ff 100%)'
                                            : isHov ? '#f8fafc' : 'transparent',
                                        transition: 'all 0.12s ease',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {isSel && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
};

/* ─────────────────────────────────────────────────────────────
   OPTION LISTS
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   STATUS / PROGRESS CONFIG
───────────────────────────────────────────────────────────── */
const statusConfig = {
    active: { label: "Active", className: "bg-green-500 text-white" },
    testing: { label: "In Testing", className: "bg-blue-500 text-white" },
    completed: { label: "Completed", className: "bg-gray-500 text-white" },
    archived: { label: "Archived", className: "bg-gray-400 text-white" },
    planning: { label: "Planning", className: "bg-purple-500 text-white" },
};

const progressColor = {
    active: "bg-green-500",
    testing: "bg-blue-500",
    completed: "bg-green-500",
    archived: "bg-gray-500",
    planning: "bg-yellow-500",
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function VersionManagement() {
    const [versions, setVersions] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        version_number: "",
        build_number: "",
        release_date: "",
        status: "planning",
        version_type: "",
        description: "",
        selectedTesters: [],
    });

    const navigate = useNavigate();

    /* ── version / build generators ── */
    const generateVersionNumber = (versionType) => {
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
    };

    const generateBuildNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
        return `${year}.${month}.${sequence}`;
    };

    const handleVersionTypeChange = (value) => {
        setFormData({ ...formData, version_type: value, version_number: value ? generateVersionNumber(value) : "" });
    };

    const handleGenerateVersion = () => {
        if (!formData.version_type) { alert("Please select a version type first"); return; }
        setFormData({ ...formData, version_number: generateVersionNumber(formData.version_type) });
    };

    const handleGenerateBuild = () => {
        setFormData({ ...formData, build_number: generateBuildNumber() });
    };

    /* ── fetch ── */
    const fetchVersions = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from("versions").select("*").order("created_date", { ascending: false });
            if (fetchError) throw fetchError;
            setVersions(data || []);
        } catch (err) { console.error(err); setError(err.message); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("users").select("id, name").order("name", { ascending: true });
            if (fetchError) throw fetchError;
            setUsers(data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchVersions(); fetchUsers(); }, []);

    const tabs = [
        { key: "all", label: "All Versions", count: versions.length },
        { key: "active", label: "Active", count: versions.filter(v => v.status === "active").length },
        { key: "testing", label: "In Testing", count: versions.filter(v => v.status === "testing").length },
        { key: "completed", label: "Completed", count: versions.filter(v => v.status === "completed").length },
        { key: "archived", label: "Archived", count: versions.filter(v => v.status === "archived").length },
    ];

    const filtered = versions.filter((v) => {
        const matchesTab = activeTab === "all" || v.status === activeTab;
        const matchesSearch = v.version_number.toLowerCase().includes(search.toLowerCase()) ||
            v.build_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "" || v.status === statusFilter;
        return matchesTab && matchesSearch && matchesStatus;
    });

    const resetForm = () => setFormData({
        version_number: "", build_number: "", release_date: "",
        status: "planning", version_type: "", description: "", selectedTesters: [],
    });

    /* ── CRUD handlers ── */
    const handleCreateVersion = async () => {
        if (!formData.version_number || !formData.build_number || !formData.release_date || !formData.version_type) {
            alert("Please fill all required fields"); return;
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
            alert("Version created successfully! ✅");
            setShowModal(false); resetForm(); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleViewDetails = (v) => { setSelectedVersion(v); setShowDetailsModal(true); };
    const handleAssignTests = (v) => { setSelectedVersion(v); setShowAssignModal(true); };

    const handleEditVersion = (v) => {
        setFormData({
            version_number: v.version_number, build_number: v.build_number,
            release_date: v.release_date, status: v.status,
            version_type: v.version_type, description: v.description || "",
            selectedTesters: [],
        });
        setSelectedVersion(v); setShowModal(true);
    };

    const handleUpdateVersion = async () => {
        if (!selectedVersion) return;
        try {
            const { error } = await supabase.from("versions").update({
                version_number: formData.version_number, build_number: formData.build_number,
                release_date: formData.release_date, status: formData.status,
                version_type: formData.version_type, description: formData.description,
            }).eq("id", selectedVersion.id);
            if (error) throw error;
            alert("Version updated successfully! ✅");
            setShowModal(false); setSelectedVersion(null); resetForm(); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleArchiveVersion = async (v) => {
        if (!window.confirm(`Archive ${v.version_number}?`)) return;
        try {
            const { error } = await supabase.from("versions").update({ status: "archived" }).eq("id", v.id);
            if (error) throw error;
            alert(`${v.version_number} archived! 📦`); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleRestoreVersion = async (v) => {
        if (!window.confirm(`Restore ${v.version_number}?`)) return;
        try {
            const { error } = await supabase.from("versions").update({ status: "completed" }).eq("id", v.id);
            if (error) throw error;
            alert(`${v.version_number} restored! ✅`); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleSaveAssignments = async (assignments) => {
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
            alert("Testers assigned! 👥");
            setShowAssignModal(false); setSelectedVersion(null); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleViewIssues = (v) => navigate(`/failed-issues?version=${v.id}`);

    const handleExportReport = (v) => {
        const d = {
            "Version Number": v.version_number, "Build Number": v.build_number,
            "Status": v.status, "Type": v.version_type, "Release Date": v.release_date,
            "Total Tests": v.total_tests, "Passed": v.passed_tests, "Failed": v.failed_tests,
            "Pending": v.pending_tests, "Completion %": v.completion_percentage,
            "Critical Issues": v.critical_issues, "Description": v.description || "N/A",
        };
        const csvContent = [Object.keys(d).join(","), Object.values(d).map(x => `"${x}"`).join(",")].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" })));
        link.setAttribute("download", `version_report_${v.version_number}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        alert(`Report exported: ${v.version_number} 📊`);
    };

    const handleDeleteVersion = async (v) => {
        if (!window.confirm(`DELETE ${v.version_number}? This cannot be undone!`)) return;
        try {
            const { error } = await supabase.from("versions").delete().eq("id", v.id);
            if (error) throw error;
            alert(`${v.version_number} deleted! 🗑️`); fetchVersions();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleResetFilters = () => { setSearch(""); setStatusFilter(""); setActiveTab("all"); };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-green-700 mb-4"></i>
                    <p className="text-gray-500">Loading versions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">

            {/* Header */}
            <header className="static bg-white border-b z-40 px-8 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Version Management</h2>
                    <p className="text-sm text-gray-500">Manage NexTech RMS versions and builds</p>
                </div>
                <button
                    onClick={() => { setSelectedVersion(null); resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <i className="fa-solid fa-plus"></i> Create Version
                </button>
            </header>

            <main className="p-8 space-y-6">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>Error: {error}</p>
                        <button onClick={fetchVersions} className="text-sm underline mt-2">Retry</button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: "Total Versions", value: versions.length, color: "text-green-700" },
                        { label: "Active", value: versions.filter(v => v.status === "active").length, color: "text-green-500" },
                        { label: "In Testing", value: versions.filter(v => v.status === "testing").length, color: "text-blue-500" },
                        { label: "Completed", value: versions.filter(v => v.status === "completed").length, color: "text-gray-500" },
                        { label: "Archived", value: versions.filter(v => v.status === "archived").length, color: "text-gray-400" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white border rounded-lg p-6 shadow-sm">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Filters & Search</h3>
                        <button onClick={handleResetFilters} className="text-sm text-green-700 hover:underline font-medium">
                            Reset All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Search Version</label>
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by version or build number..."
                                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            {/* ✅ was native <select> — now SingleDropdown */}
                            <SingleDropdown
                                options={STATUS_FILTER_OPTIONS}
                                selected={statusFilter}
                                onChange={setStatusFilter}
                                placeholder="All Statuses"
                            />
                        </div>
                        <div className="flex items-end">
                            <button className="w-full px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border rounded-lg shadow-sm">
                    <div className="flex overflow-x-auto border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key
                                        ? "border-green-700 text-green-700"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Version Cards */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 bg-white border rounded-lg">
                            <i className="fa-solid fa-inbox text-gray-300 text-6xl mb-4 block"></i>
                            <p className="text-gray-500">No versions found</p>
                        </div>
                    ) : (
                        filtered.map((v) => (
                            <div key={v.id} className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${v.status === "archived" ? "opacity-60" : ""}`}>
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-green-700 text-2xl">⑂</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-xl font-bold">{v.version_number}</h3>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig[v.status].className}`}>
                                                        {statusConfig[v.status].label}
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
                                            <button onClick={() => handleEditVersion(v)} className="p-2 text-gray-400 hover:text-green-700 transition-colors" title="Edit">
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button onClick={() => handleArchiveVersion(v)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="Archive">
                                                <i className="fa-solid fa-archive"></i>
                                            </button>
                                            <button onClick={() => handleDeleteVersion(v)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Total Tests</p>
                                            <p className="text-2xl font-bold">{v.total_tests}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-xs text-green-700 mb-1">Passed</p>
                                            <p className="text-2xl font-bold text-green-600">{v.passed_tests}</p>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg">
                                            <p className="text-xs text-red-700 mb-1">Failed</p>
                                            <p className="text-2xl font-bold text-red-500">{v.failed_tests}</p>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-xs text-yellow-700 mb-1">Pending</p>
                                            <p className="text-2xl font-bold text-yellow-500">{v.pending_tests}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">Overall Completion</span>
                                            <span className="text-sm font-bold">{v.completion_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div className={`h-3 rounded-full ${progressColor[v.status]}`} style={{ width: `${v.completion_percentage}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => handleViewDetails(v)} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                                            View Details
                                        </button>
                                        {v.status !== "archived" && (
                                            <>
                                                <button onClick={() => handleAssignTests(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                                    Assign Tests
                                                </button>
                                                <button onClick={() => handleViewIssues(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                                    View Issues
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => handleExportReport(v)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                            Export Report
                                        </button>
                                        {v.status === "archived" && (
                                            <button onClick={() => handleRestoreVersion(v)} className="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors">
                                                Restore
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-bold">{selectedVersion ? "Edit Version" : "Create New Version"}</h3>
                                <p className="text-sm text-gray-500 mt-1">Add or update a version/build for NexTech RMS</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Version Number + Build Number */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Version Number *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.version_number}
                                            onChange={(e) => !formData.version_number && setFormData({ ...formData, version_number: e.target.value })}
                                            placeholder="e.g., 5.2.1"
                                            readOnly={!!formData.version_number}
                                            className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${formData.version_number ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                        />
                                        <button onClick={handleGenerateVersion} title="Generate version number"
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        </button>
                                    </div>
                                    {formData.version_number && (
                                        <p className="text-xs text-gray-500 mt-1">Version number is locked after generation</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Build Number *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.build_number}
                                            onChange={(e) => setFormData({ ...formData, build_number: e.target.value })}
                                            placeholder="e.g., 2024.12.001"
                                            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                                        />
                                        <button onClick={handleGenerateBuild} title="Generate build number"
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Release Date + Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Release Date *</label>
                                    <input
                                        type="date"
                                        value={formData.release_date}
                                        onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status *</label>
                                    {/* ✅ was native <select> — now SingleDropdown */}
                                    <SingleDropdown
                                        options={STATUS_OPTIONS}
                                        selected={formData.status}
                                        onChange={(v) => setFormData({ ...formData, status: v })}
                                        placeholder="Select Status"
                                    />
                                </div>
                            </div>

                            {/* Version Type */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Version Type * <span className="text-gray-400 font-normal">(auto-generates version number)</span>
                                </label>
                                {/* ✅ was native <select> — now SingleDropdown */}
                                <SingleDropdown
                                    options={VERSION_TYPE_OPTIONS}
                                    selected={formData.version_type}
                                    onChange={handleVersionTypeChange}
                                    placeholder="Select Type"
                                />
                                <p className="text-xs text-green-600 mt-1">
                                    <i className="fa-solid fa-lightbulb"></i> Selecting a type will auto-generate a version number
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter version description and release notes..."
                                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                                />
                            </div>

                            {/* Assign Testers */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Assign Testers</label>
                                <CustomDropdown
                                    options={users}
                                    selected={formData.selectedTesters}
                                    onChange={(sel) => setFormData({ ...formData, selectedTesters: sel })}
                                    placeholder="Select testers..."
                                />
                                {formData.selectedTesters.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {users.filter(u => formData.selectedTesters.includes(u.id)).map(user => (
                                            <div key={user.id} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                                                <span>{user.name}</span>
                                                <button type="button"
                                                    onClick={() => setFormData({ ...formData, selectedTesters: formData.selectedTesters.filter(id => id !== user.id) })}
                                                    className="hover:text-blue-900 transition-colors">
                                                    <i className="fa-solid fa-times text-xs"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <button
                                    onClick={selectedVersion ? handleUpdateVersion : handleCreateVersion}
                                    className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
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

            {/* ── View Details Modal ── */}
            {showDetailsModal && selectedVersion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold">Version Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm text-gray-500">Version Number</p><p className="text-lg font-bold">{selectedVersion.version_number}</p></div>
                                <div><p className="text-sm text-gray-500">Build Number</p><p className="text-lg font-bold">{selectedVersion.build_number}</p></div>
                                <div><p className="text-sm text-gray-500">Type</p><p className="text-lg font-bold capitalize">{selectedVersion.version_type}</p></div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`text-sm font-bold inline-block px-3 py-1 rounded-full ${statusConfig[selectedVersion.status].className}`}>
                                        {statusConfig[selectedVersion.status].label}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-500 mb-2">Description</p>
                                <p className="text-gray-700">{selectedVersion.description || "No description provided"}</p>
                            </div>
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
                                    <div className={`h-4 rounded-full ${progressColor[selectedVersion.status]}`} style={{ width: `${selectedVersion.completion_percentage}%` }} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <button onClick={() => { setShowDetailsModal(false); handleEditVersion(selectedVersion); }}
                                    className="flex-1 px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                                    Edit
                                </button>
                                <button onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Tests Modal ── */}
            {showAssignModal && selectedVersion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold">Assign Testers</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Assign testers to <span className="font-semibold">{selectedVersion.version_number}</span>
                            </p>
                            <CustomDropdown
                                options={users}
                                selected={formData.selectedTesters}
                                onChange={(sel) => setFormData({ ...formData, selectedTesters: sel })}
                                placeholder="Select testers to assign..."
                            />
                            {formData.selectedTesters.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-900 mb-2">
                                        <i className="fa-solid fa-check-circle mr-2"></i>
                                        {formData.selectedTesters.length} tester{formData.selectedTesters.length !== 1 ? 's' : ''} selected
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
                                    <i className="fa-solid fa-check mr-2"></i> Save Assignments
                                </button>
                                <button onClick={() => { setShowAssignModal(false); setFormData({ ...formData, selectedTesters: [] }); }}
                                    className="flex-1 px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}