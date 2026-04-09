import { useState, useEffect } from "react";
import supabase from "../services/supabaseClient";

export default function CreateVersion() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);

    const [versionForm, setVersionForm] = useState({
        version_number: "",
        build_number: "",
        release_date: "",
        testing_start_date: "",
        testing_end_date: "",
        status: "Draft",
        qa_owner_id: "",
        release_owner_id: "",
        description: "",
        notes: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: modulesData, error: modulesError } = await supabase
                .from("modules")
                .select("*")
                .eq("status", "Active");

            if (modulesError) throw modulesError;
            setModules(modulesData || []);

            const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("*");

            if (usersError) throw usersError;
            setUsers(usersData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Error loading data");
        }
    };

    const handleVersionChange = (e) => {
        const { name, value } = e.target;
        setVersionForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleModule = (moduleId) => {
        setSelectedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleCreateVersion = async () => {
        if (!versionForm.version_number || !versionForm.build_number) {
            alert("Version Number and Build Number are required");
            return;
        }

        setLoading(true);

        try {
            const { data: versionData, error: versionError } = await supabase
                .from("versions")
                .insert([versionForm])
                .select()
                .single();

            if (versionError) throw versionError;

            if (selectedModules.length > 0) {
                const versionModules = selectedModules.map(moduleId => ({
                    version_id: versionData.id,
                    module_id: moduleId,
                    include: true,
                }));

                const { error: linkError } = await supabase
                    .from("version_modules")
                    .insert(versionModules);

                if (linkError) throw linkError;
            }

            alert("Version created successfully! ✅");
            setVersionForm({
                version_number: "",
                build_number: "",
                release_date: "",
                testing_start_date: "",
                testing_end_date: "",
                status: "Draft",
                qa_owner_id: "",
                release_owner_id: "",
                description: "",
                notes: "",
            });
            setSelectedModules([]);
            setStep(1);
        } catch (error) {
            console.error("Error creating version:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Shared input classes
    const inputClass =
        "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]";

    return (
        <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                                Create NexTech RMS Version
                            </h2>
                            <p className="text-sm text-gray-500">
                                Define version details, select modules and features
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500 bg-opacity-10 text-yellow-600 text-sm font-medium rounded-full">
                            Draft Auto-saved
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 max-w-4xl mx-auto">

                    {/* Step 1: Version Information */}
                    {step === 1 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
                            <div className="flex items-start gap-3">
                                {/* Step indicator uses #27500A */}
                                <div
                                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                                    style={{ backgroundColor: "#27500A" }}
                                >
                                    1
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Version Information</h3>
                                    <p className="text-sm text-gray-500">Basic details about this version</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Version Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="version_number"
                                        placeholder="e.g., 5.2.1"
                                        value={versionForm.version_number}
                                        onChange={handleVersionChange}
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Semantic versioning format</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Build Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="build_number"
                                        placeholder="e.g., 2024.12.001"
                                        value={versionForm.build_number}
                                        onChange={handleVersionChange}
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Unique build identifier</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Release Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="release_date"
                                        value={versionForm.release_date}
                                        onChange={handleVersionChange}
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Target release date</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Testing Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="testing_start_date"
                                        value={versionForm.testing_start_date}
                                        onChange={handleVersionChange}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Testing End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="testing_end_date"
                                        value={versionForm.testing_end_date}
                                        onChange={handleVersionChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        QA Owner <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="qa_owner_id"
                                        value={versionForm.qa_owner_id}
                                        onChange={handleVersionChange}
                                        className={`${inputClass} appearance-none`}
                                    >
                                        <option value="">Select QA Owner</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Release Owner <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="release_owner_id"
                                        value={versionForm.release_owner_id}
                                        onChange={handleVersionChange}
                                        className={`${inputClass} appearance-none`}
                                    >
                                        <option value="">Select Release Owner</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={versionForm.status}
                                    onChange={handleVersionChange}
                                    className={`${inputClass} appearance-none`}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Testing">Testing</option>
                                    <option value="Released">Released</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Describe the changes in this version..."
                                    value={versionForm.description}
                                    onChange={handleVersionChange}
                                    rows="4"
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
                                <textarea
                                    name="notes"
                                    placeholder="Additional notes..."
                                    value={versionForm.notes}
                                    onChange={handleVersionChange}
                                    rows="3"
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-2.5 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: "#27500A" }}
                                >
                                    Next: Select Modules →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Modules Selection */}
                    {step === 2 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                                        style={{ backgroundColor: "#27500A" }}
                                    >
                                        2
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Modules Selection</h3>
                                        <p className="text-sm text-gray-500">
                                            Choose which modules to include in this version
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="px-4 py-2.5 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: "#27500A" }}
                                >
                                    + Add New Module
                                </button>
                            </div>

                            {/* Modules Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedModules.length === modules.length && modules.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedModules(modules.map(m => m.id));
                                                        } else {
                                                            setSelectedModules([]);
                                                        }
                                                    }}
                                                    className="rounded"
                                                    style={{ accentColor: "#27500A" }}
                                                />
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">MODULE NAME</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">FEATURES</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">PRIORITY</th>
                                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-900">INCLUDE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modules.map(module => (
                                            <tr key={module.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModules.includes(module.id)}
                                                        onChange={() => toggleModule(module.id)}
                                                        className="rounded"
                                                        style={{ accentColor: "#27500A" }}
                                                    />
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                                                    {module.module_name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-500">0</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${module.priority === "High"
                                                            ? "bg-red-500 bg-opacity-10 text-red-600"
                                                            : module.priority === "Medium"
                                                                ? "bg-amber-500 bg-opacity-10 text-amber-600"
                                                                : "bg-gray-500 bg-opacity-10 text-gray-600"
                                                        }`}>
                                                        {module.priority}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModules.includes(module.id)}
                                                        onChange={() => toggleModule(module.id)}
                                                        className="rounded"
                                                        style={{ accentColor: "#27500A" }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Auto-save notice */}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <i className="fa-solid fa-check" style={{ color: "#27500A" }}></i>
                                All changes are auto-saved
                            </div>

                            <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    ← Back
                                </button>
                                <div className="flex gap-3">
                                    <button className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                        💾 Save Draft
                                    </button>
                                    <button
                                        onClick={handleCreateVersion}
                                        disabled={loading}
                                        className="px-6 py-2.5 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                        style={{ backgroundColor: "#27500A" }}
                                    >
                                        {loading ? "Creating..." : "✓ Create Version"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}