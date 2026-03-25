import { useState, useEffect, useRef } from "react";
import supabase from "../services/supabaseClient";

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
        <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isOpen
                        ? "linear-gradient(135deg,#f0f4ff 0%,#fafbff 100%)"
                        : "linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)",
                    border: isOpen ? "1.5px solid #6366f1" : "1.5px solid #e2e6f0",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    color: selected ? "#1e293b" : "#94a3b8",
                    fontWeight: selected ? 500 : 400,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: isOpen
                        ? "0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08)"
                        : "0 1px 3px rgba(0,0,0,0.06)",
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
                    color: isOpen ? "#6366f1" : "#94a3b8",
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
                    background: "#ffffff",
                    border: "1.5px solid #e8eaf6",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.08)",
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
                                        fontSize: "13.5px",
                                        fontWeight: isSel ? 600 : 400,
                                        color: isSel ? "#4f46e5" : isHov ? "#1e293b" : "#374151",
                                        background: isSel
                                            ? "linear-gradient(135deg,#eef2ff 0%,#f0f4ff 100%)"
                                            : isHov ? "#f8fafc" : "transparent",
                                        transition: "all 0.12s ease",
                                        letterSpacing: "0.01em",
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

const priorityStyles = {
    High: "bg-red-500 bg-opacity-10 text-red-600",
    Medium: "bg-amber-500 bg-opacity-10 text-amber-600",
    Low: "bg-green-500 bg-opacity-10 text-green-600",
};

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

    // ✅ NEW: Edit Feature modal state
    const [editFeatureModal, setEditFeatureModal] = useState(false);
    const [editFeatureForm, setEditFeatureForm] = useState(emptyEditFeatureForm);

    // ✅ NEW: Delete Feature modal state
    const [deleteFeatureModal, setDeleteFeatureModal] = useState(false);
    const [deleteFeatureTarget, setDeleteFeatureTarget] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const fetchModulesWithFeatures = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: modulesData, error: modulesError } = await supabase
                .from("modules").select("*").order("module_code", { ascending: false });
            if (modulesError) throw modulesError;

            let featuresData = [];
            const { data: featsData, error: featuresError } = await supabase.from("features").select("*");
            if (!featuresError) featuresData = featsData || [];
            else console.warn("Features table:", featuresError.message);

            let testCasesData = [];
            const { data: tcsData, error: testCasesError } = await supabase.from("test_cases").select("*");
            if (!testCasesError) testCasesData = tcsData || [];
            else console.warn("Test cases table:", testCasesError.message);

            const modulesWithFeatures = (modulesData || []).map((mod) => {
                const moduleFeatures = featuresData.filter(f => f.module_id === mod.id);
                const enrichedFeatures = moduleFeatures.map((feat) => {
                    const featureTestCases = testCasesData.filter(tc => tc.feature_id === feat.id);
                    return {
                        ...feat,
                        testCasesCount: featureTestCases.length,
                        testCases: featureTestCases.map(tc => ({
                            id: tc.id,
                            name: tc.name,
                            description: tc.description,
                            priority: tc.priority,
                            status: tc.status,
                            updated: new Date(tc.updated_at).toLocaleDateString(),
                        })),
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

            setModules(modulesWithFeatures);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load features");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("users").select("id, name").order("name", { ascending: true });
            if (fetchError) throw fetchError;
            setUsers(data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    useEffect(() => { fetchModulesWithFeatures(); fetchUsers(); }, []);

    const exportToCSV = () => {
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
    };

    const toggleModule = (id) => setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleFeature = (id) => setOpenFeatures(prev => ({ ...prev, [id]: !prev[id] }));

    const openAddModal = (e, moduleId, featureId) => {
        e.stopPropagation(); setForm(emptyForm); setAddModal({ open: true, featureId, moduleId });
    };
    const openEditModal = (e, moduleId, featureId, tc) => {
        e.stopPropagation();
        setForm({ id: tc.id, name: tc.name, description: tc.description, preconditions: "", steps: "", expected: "", assignee: tc.assignee || "", status: tc.status, priority: tc.priority, tags: "" });
        setEditModal({ open: true, tc, featureId, moduleId });
    };
    const openDeleteModal = (e, moduleId, featureId, tc) => {
        e.stopPropagation(); setDeleteModal({ open: true, tc, featureId, moduleId });
    };

    // ✅ NEW: Open Edit Feature Modal
    const openEditFeatureModal = (e, feat, moduleId) => {
        e.stopPropagation();
        setEditFeatureForm({
            id: feat.id,
            moduleId: moduleId,
            name: feat.feature_name || feat.name || "",
            code: feat.feature_code || feat.code || "",
            user_story: feat.user_story || "",
            description: feat.description || "",
            assign_to: feat.assign_to || "",
        });
        setEditFeatureModal(true);
    };

    // ✅ NEW: Open Delete Feature Modal
    const openDeleteFeatureModal = (e, feat) => {
        e.stopPropagation();
        setDeleteFeatureTarget(feat);
        setDeleteFeatureModal(true);
    };

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleAddTestCase = async () => {
        if (!form.name || !form.priority) { alert("Test Case Name and Priority are required"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("You must be logged in to add a test case."); return; }

            const { error } = await supabase.from("test_cases").insert([{
                id: generateUUID(),
                test_case_id: form.id || `TC-${Date.now()}`,
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
    };

    const handleEditTestCase = async () => {
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
    };

    const handleDeleteTestCase = async () => {
        try {
            const { error } = await supabase.from("test_cases").delete().eq("id", deleteModal.tc.id);
            if (error) throw error;
            alert("Test case deleted successfully! ✅");
            setDeleteModal({ open: false }); fetchModulesWithFeatures();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleAddFeature = async () => {
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
    };

    // ✅ NEW: Handle Edit Feature
    const handleEditFeature = async () => {
        if (!editFeatureForm.name || !editFeatureForm.code) {
            alert("Feature Name and Feature Code are required");
            return;
        }
        try {
            const updateData = {
                feature_name: editFeatureForm.name,
                feature_code: editFeatureForm.code,
                description: editFeatureForm.description,
                user_story: editFeatureForm.user_story || null,
                assign_to: editFeatureForm.assign_to || null,
                module_id: editFeatureForm.moduleId,
            };

            const { error } = await supabase
                .from("features")
                .update(updateData)
                .eq("id", editFeatureForm.id);

            if (error) throw error;
            alert("Feature updated successfully! ✅");
            setEditFeatureModal(false);
            setEditFeatureForm(emptyEditFeatureForm);
            fetchModulesWithFeatures();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // ✅ NEW: Handle Delete Feature
    const handleDeleteFeature = async () => {
        if (!deleteFeatureTarget) return;
        try {
            // First delete all test cases associated with this feature
            const { error: tcError } = await supabase
                .from("test_cases")
                .delete()
                .eq("feature_id", deleteFeatureTarget.id);
            if (tcError) throw tcError;

            // Then delete the feature itself
            const { error } = await supabase
                .from("features")
                .delete()
                .eq("id", deleteFeatureTarget.id);
            if (error) throw error;

            alert("Feature deleted successfully! ✅");
            setDeleteFeatureModal(false);
            setDeleteFeatureTarget(null);
            fetchModulesWithFeatures();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const totalFeatures = modules.reduce((a, m) => a + m.featuresCount, 0);
    const totalTestCases = modules.reduce((a, m) => a + m.testCasesCount, 0);

    const filteredModules = modules.map((mod) => ({
        ...mod,
        features: mod.features.filter(
            (f) => !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.testCases.some((tc) => tc.id.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
    })).filter((mod) => !searchQuery || mod.features.length > 0 || mod.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const userOptions = [
        { id: "", name: "Select Assignee" },
        ...users.map(u => ({ id: u.id, name: u.name })),
    ];
    const testerOptions = [
        { id: "", name: "Select Tester" },
        ...users.map(u => ({ id: u.name, name: u.name })),
    ];
    const moduleOptions = [
        { id: "", name: "Choose a Module" },
        ...modules.map(m => ({ id: m.id, name: m.name })),
    ];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Loading Features Library...</p>
                    <div className="animate-spin"><i className="fa-solid fa-spinner text-gray-400 text-4xl"></i></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <header className="static bg-white border-b border-gray-200 z-40">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Features Library</h2>
                            <p className="text-sm text-gray-500">Manage features and test cases across all modules</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                <i className="fa-solid fa-download"></i>
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button onClick={() => setAddFeatureModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                                <i className="fa-solid fa-plus"></i>
                                <span>Add Feature</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8">

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            <p>Error: {error}</p>
                            <button onClick={fetchModulesWithFeatures} className="text-sm mt-2 underline hover:no-underline">Try again</button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {[
                            { label: "Total Modules", value: modules.length, icon: "fa-puzzle-piece", color: "blue" },
                            { label: "Total Features", value: totalFeatures, icon: "fa-list-check", color: "green" },
                            { label: "Total Test Cases", value: totalTestCases.toLocaleString(), icon: "fa-vial", color: "purple" },
                            { label: "Active Features", value: modules.filter(m => m.status === "Active").length, icon: "fa-check-circle", color: "amber" },
                            { label: "Team Members", value: users.length, icon: "fa-users", color: "red" },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <div className={`w-12 h-12 bg-${stat.color}-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-3`}>
                                    <i className={`fa-solid ${stat.icon} text-${stat.color}-500 text-xl`}></i>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative lg:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Search by Module, Feature, Test Case ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                                    />
                                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                </div>
                                <SingleDropdown
                                    options={FILTER_STATUS_OPTIONS}
                                    selected={filterStatus}
                                    onChange={setFilterStatus}
                                    placeholder="All Status"
                                />
                                <button
                                    onClick={() => { setSearchQuery(""); setFilterStatus(""); }}
                                    className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredModules.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-inbox text-gray-300 text-6xl mb-4 block"></i>
                            <p className="text-gray-500">No modules found. Create features to get started!</p>
                        </div>
                    )}

                    {/* Modules Accordion */}
                    <div className="space-y-4">
                        {filteredModules.map((mod) => (
                            <div key={mod.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleModule(mod.id)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${mod.iconBg} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fa-solid ${mod.icon} ${mod.iconColor} text-xl`}></i>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-gray-900 text-lg">{mod.name}</h3>
                                                    <span className="px-2 py-1 bg-blue-500 bg-opacity-10 text-blue-600 text-xs font-medium rounded">{mod.module_code}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{mod.featuresCount} Features • {mod.testCasesCount} Test Cases</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1.5 bg-green-500 bg-opacity-10 text-green-600 text-xs font-medium rounded">{mod.status}</span>
                                            <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-200 ${openModules[mod.id] ? "rotate-180" : ""}`}></i>
                                        </div>
                                    </div>
                                </div>

                                {openModules[mod.id] && (
                                    <div>
                                        {mod.features.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500">
                                                <p>No features in this module yet</p>
                                            </div>
                                        ) : (
                                            mod.features.map((feat) => (
                                                <div key={feat.id} className="border-b border-gray-200 last:border-b-0">
                                                    <div className="p-6 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => toggleFeature(feat.id)}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <i className={`fa-solid fa-chevron-right text-gray-400 text-sm transition-transform duration-200 ${openFeatures[feat.id] ? "rotate-90" : ""}`}></i>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <h4 className="font-semibold text-gray-900">{feat.name}</h4>
                                                                        <span className="px-2 py-1 bg-purple-500 bg-opacity-10 text-purple-600 text-xs font-medium rounded">{feat.code}</span>
                                                                        {feat.user_story && (
                                                                            <span className="px-2 py-1 bg-red-500 bg-opacity-10 text-red-600 text-xs font-medium rounded">{feat.user_story}</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">{feat.description}</p>
                                                                    <div className="flex items-center gap-4 mt-2">
                                                                        <span className="text-xs text-gray-500"><i className="fa-solid fa-vial mr-1"></i>{feat.testCasesCount} Test Cases</span>
                                                                        {feat.assign_to && <span className="text-xs text-gray-500"><i className="fa-solid fa-user mr-1"></i>Assigned</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                                                                    onClick={(e) => openAddModal(e, mod.id, feat.id)}
                                                                >
                                                                    <i className="fa-solid fa-plus"></i>
                                                                    <span>Add Test Case</span>
                                                                </button>
                                                                {/* ✅ UPDATED: Edit Feature button now functional */}
                                                                <button
                                                                    className="px-3 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                                                    onClick={(e) => openEditFeatureModal(e, feat, mod.id)}
                                                                    title="Edit Feature"
                                                                >
                                                                    <i className="fa-solid fa-edit"></i>
                                                                </button>
                                                                {/* ✅ NEW: Delete Feature button */}
                                                                <button
                                                                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                                                                    onClick={(e) => openDeleteFeatureModal(e, feat)}
                                                                    title="Delete Feature"
                                                                >
                                                                    <i className="fa-solid fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {openFeatures[feat.id] && feat.testCases.length > 0 && (
                                                        <div className="bg-gray-50">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                    <thead className="bg-white border-b border-gray-200">
                                                                        <tr>
                                                                            {["Test Case ID", "Test Case Name", "Priority", "Status", "Last Updated", "Actions"].map((h) => (
                                                                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {feat.testCases.map((tc) => (
                                                                            <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tc.id}</td>
                                                                                <td className="px-6 py-4">
                                                                                    <p className="text-sm text-gray-900 font-medium">{tc.name}</p>
                                                                                    <p className="text-xs text-gray-500 mt-1">{tc.description}</p>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${priorityStyles[tc.priority] || ""}`}>{tc.priority}</span>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                    <span className="px-2 py-1 bg-green-500 bg-opacity-10 text-green-600 text-xs font-medium rounded">{tc.status}</span>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tc.updated}</td>
                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <button className="text-blue-600 hover:opacity-80" onClick={(e) => openEditModal(e, mod.id, feat.id, tc)} title="Edit">
                                                                                            <i className="fa-solid fa-edit"></i>
                                                                                        </button>
                                                                                        <button className="text-red-600 hover:opacity-80" onClick={(e) => openDeleteModal(e, mod.id, feat.id, tc)} title="Delete">
                                                                                            <i className="fa-solid fa-trash"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Add Feature Modal */}
            {addFeatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setAddFeatureModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Add New Feature</h3>
                            <button onClick={() => setAddFeatureModal(false)} className="text-gray-500 hover:text-gray-700"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Select Module <span className="text-red-500">*</span></label>
                                <SingleDropdown
                                    options={moduleOptions}
                                    selected={featureForm.moduleId}
                                    onChange={(v) => setFeatureForm({ ...featureForm, moduleId: v })}
                                    placeholder="Choose a Module"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Feature Name <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="e.g., Two-Factor Authentication"
                                    value={featureForm.name} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Feature Code <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="e.g., FEAT-004"
                                        value={featureForm.code} onChange={(e) => setFeatureForm({ ...featureForm, code: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">User Story</label>
                                    <input type="text" placeholder="e.g., US-015"
                                        value={featureForm.user_story} onChange={(e) => setFeatureForm({ ...featureForm, user_story: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                <textarea rows="4" placeholder="Brief description of the feature..."
                                    value={featureForm.description} onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Assign To</label>
                                <SingleDropdown
                                    options={userOptions}
                                    selected={featureForm.assign_to}
                                    onChange={(v) => setFeatureForm({ ...featureForm, assign_to: v })}
                                    placeholder="Select Assignee"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex items-center justify-end gap-3">
                            <button onClick={() => setAddFeatureModal(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleAddFeature} className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Add Feature</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NEW: Edit Feature Modal */}
            {editFeatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setEditFeatureModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                                    <i className="fa-solid fa-pen-to-square text-blue-600"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Edit Feature</h3>
                            </div>
                            <button onClick={() => setEditFeatureModal(false)} className="text-gray-500 hover:text-gray-700"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Module <span className="text-red-500">*</span></label>
                                <SingleDropdown
                                    options={moduleOptions}
                                    selected={editFeatureForm.moduleId}
                                    onChange={(v) => setEditFeatureForm({ ...editFeatureForm, moduleId: v })}
                                    placeholder="Choose a Module"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Feature Name <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="e.g., Two-Factor Authentication"
                                    value={editFeatureForm.name} onChange={(e) => setEditFeatureForm({ ...editFeatureForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Feature Code <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="e.g., FEAT-004"
                                        value={editFeatureForm.code} onChange={(e) => setEditFeatureForm({ ...editFeatureForm, code: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">User Story</label>
                                    <input type="text" placeholder="e.g., US-015"
                                        value={editFeatureForm.user_story} onChange={(e) => setEditFeatureForm({ ...editFeatureForm, user_story: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                <textarea rows="4" placeholder="Brief description of the feature..."
                                    value={editFeatureForm.description} onChange={(e) => setEditFeatureForm({ ...editFeatureForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Assign To</label>
                                <SingleDropdown
                                    options={userOptions}
                                    selected={editFeatureForm.assign_to}
                                    onChange={(v) => setEditFeatureForm({ ...editFeatureForm, assign_to: v })}
                                    placeholder="Select Assignee"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex items-center justify-end gap-3">
                            <button onClick={() => setEditFeatureModal(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleEditFeature} className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NEW: Delete Feature Confirmation Modal */}
            {deleteFeatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteFeatureModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className="fa-solid fa-triangle-exclamation text-red-600 text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Feature</h3>
                                    <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                <p className="text-sm font-medium text-gray-900 mb-1">{deleteFeatureTarget?.feature_name || deleteFeatureTarget?.name}</p>
                                <p className="text-sm text-gray-500">{deleteFeatureTarget?.feature_code || deleteFeatureTarget?.code}</p>
                            </div>
                            {deleteFeatureTarget?.testCasesCount > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-amber-800">
                                        <i className="fa-solid fa-warning mr-2"></i>
                                        This feature has <strong>{deleteFeatureTarget.testCasesCount} test case(s)</strong> that will also be deleted.
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setDeleteFeatureModal(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={handleDeleteFeature} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Delete Feature</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Test Case Modal */}
            {addModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setAddModal({ open: false })}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Add New Test Case</h3>
                            <button onClick={() => setAddModal({ open: false })} className="text-gray-500 hover:text-gray-700"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Test Case ID <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="e.g., TC-001"
                                        value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Priority <span className="text-red-500">*</span></label>
                                    <SingleDropdown
                                        options={[{ id: "", name: "Select Priority" }, ...PRIORITY_OPTIONS]}
                                        selected={form.priority}
                                        onChange={(v) => setForm({ ...form, priority: v })}
                                        placeholder="Select Priority"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Test Case Name <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="e.g., Valid login with correct credentials"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea rows="3" placeholder="Brief description..."
                                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Assigned To</label>
                                    <SingleDropdown
                                        options={testerOptions}
                                        selected={form.assignee}
                                        onChange={(v) => setForm({ ...form, assignee: v })}
                                        placeholder="Select Tester"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Status <span className="text-red-500">*</span></label>
                                    <SingleDropdown
                                        options={STATUS_OPTIONS}
                                        selected={form.status}
                                        onChange={(v) => setForm({ ...form, status: v })}
                                        placeholder="Select Status"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex items-center justify-end gap-3">
                            <button onClick={() => setAddModal({ open: false })} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleAddTestCase} className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Add Test Case</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Test Case Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal({ open: false })}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Edit Test Case</h3>
                            <button onClick={() => setEditModal({ open: false })} className="text-gray-500 hover:text-gray-700"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Test Case ID</label>
                                    <input type="text" value={form.id} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Priority <span className="text-red-500">*</span></label>
                                    <SingleDropdown
                                        options={PRIORITY_OPTIONS}
                                        selected={form.priority}
                                        onChange={(v) => setForm({ ...form, priority: v })}
                                        placeholder="Select Priority"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Test Case Name <span className="text-red-500">*</span></label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Status <span className="text-red-500">*</span></label>
                                    <SingleDropdown
                                        options={STATUS_OPTIONS}
                                        selected={form.status}
                                        onChange={(v) => setForm({ ...form, status: v })}
                                        placeholder="Select Status"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex items-center justify-end gap-3">
                            <button onClick={() => setEditModal({ open: false })} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleEditTestCase} className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Test Case Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModal({ open: false })}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-500 bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className="fa-solid fa-trash text-red-600 text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Test Case</h3>
                                    <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this test case?</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 mb-6">
                                <p className="text-sm font-medium text-gray-900 mb-1">{deleteModal.tc?.id}</p>
                                <p className="text-sm text-gray-500">{deleteModal.tc?.name}</p>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setDeleteModal({ open: false })} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={handleDeleteTestCase} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Delete Test Case</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}