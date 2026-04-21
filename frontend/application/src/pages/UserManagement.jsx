import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_STYLES = {
    admin: { badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
    tester: { badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    developer: { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};
const getRoleStyle = (r) => ROLE_STYLES[r] || { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };

function getInitials(name, email) {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email?.[0]?.toUpperCase() ?? "?";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto
                        ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}>
                    <i className={`fa-solid ${t.type === "success" ? "fa-check-circle" : t.type === "error" ? "fa-times-circle" : "fa-info-circle"}`} />
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ show, title, message, onConfirm, onCancel, danger }) {
    if (!show) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onCancel} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
                        <i className={`fa-solid ${danger ? "fa-trash" : "fa-triangle-exclamation"} ${danger ? "text-red-600" : "text-amber-600"} text-xl`} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 text-center mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 text-center mb-6">{message}</p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                        <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>Confirm</button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Multi-Select Dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange, placeholder = "Select…", valueKey = "id", labelKey = "name" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const toggle = (val) => {
        onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
    };

    const selectedLabels = options.filter((o) => selected.includes(o[valueKey])).map((o) => o[labelKey]);

    return (
        <div ref={ref} className="relative">
            {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{label}</label>}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-left flex items-center justify-between gap-2 transition-all
                    ${open ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
                <span className={`truncate ${selectedLabels.length === 0 ? "text-slate-400" : "text-slate-800"}`}>
                    {selectedLabels.length === 0
                        ? placeholder
                        : selectedLabels.length === 1
                            ? selectedLabels[0]
                            : `${selectedLabels.length} selected`}
                </span>
                <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="max-h-52 overflow-y-auto p-1.5">
                        {options.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No options available</p>
                        ) : (
                            options.map((opt) => {
                                const isSel = selected.includes(opt[valueKey]);
                                return (
                                    <button
                                        key={opt[valueKey]}
                                        type="button"
                                        onClick={() => toggle(opt[valueKey])}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors
                                            ${isSel ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50 text-slate-700"}`}>
                                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all
                                            ${isSel ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                                            {isSel && <i className="fa-solid fa-check text-white text-[9px]" />}
                                        </div>
                                        <span className="truncate">{opt[labelKey]}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {selected.length > 0 && (
                        <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">{selected.length} selected</span>
                            <button type="button" onClick={() => onChange([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear all</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── User Detail Drawer ────────────────────────────────────────────────────────
function UserDrawer({ user, allUsers, onClose, onRoleChange, onStatusChange, addToast, refreshUsers, preloadedTestCases = [] }) {
    const [currentRole, setCurrentRole] = useState(user.role);
    const [newRole, setNewRole] = useState(user.role);
    const [isActive, setIsActive] = useState(user.is_active !== false);
    const [savingRole, setSavingRole] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const [reassigning, setReassigning] = useState(false);

    const [reassignTo, setReassignTo] = useState("");
    const [modules, setModules] = useState([]);
    const [features, setFeatures] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [selectedTests, setSelectedTests] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [reassignSuccess, setReassignSuccess] = useState(false);

    // Use preloaded data directly for stats/display — more accurate matching
    const userTests = preloadedTestCases.map(t => ({
        ...t,
        displayName: `${t.test_case_id} — ${t.name}`,
    }));
    const userStats = {
        total: userTests.length,
        passed: userTests.filter(t => t.status === "pass" || t.status === "Passed").length,
        failed: userTests.filter(t => t.status === "fail" || t.status === "Failed").length,
        pending: userTests.filter(t => !t.status || t.status === "not-tested" || t.status === "Pending" || t.status === "Active").length,
    };

    const rs = getRoleStyle(currentRole);

    useEffect(() => {
        (async () => {
            setLoadingData(true);
            try {
                const [modRes, featRes, tcRes] = await Promise.all([
                    supabase.from("modules").select("id, module_name").order("module_name"),
                    supabase.from("features").select("id, feature_name, module_id").order("feature_name"),
                    supabase.from("test_cases").select("id, test_case_id, name, status, assigned_to, module_id, feature_id").order("name"),
                ]);

                setModules((modRes.data || []).map((m) => ({ id: m.id, name: m.module_name })));
                setFeatures((featRes.data || []).map((f) => ({ id: f.id, name: f.feature_name, module_id: f.module_id })));

                const all = tcRes.data || [];
                setTestCases(all.map((t) => ({
                    id: t.id,
                    name: `${t.test_case_id} — ${t.name}`,
                    status: t.status,
                    assigned_to: t.assigned_to,
                    module_id: t.module_id,
                    feature_id: t.feature_id,
                })));
            } catch (e) {
                console.error("Drawer load error:", e);
            }
            setLoadingData(false);
        })();
    }, [user.id, user.full_name]);

    const filteredFeatures = selectedModules.length > 0
        ? features.filter((f) => selectedModules.includes(f.module_id))
        : features;

    const filteredTests = testCases.filter((t) => {
        const modOk = selectedModules.length === 0 || selectedModules.includes(t.module_id);
        const featOk = selectedFeatures.length === 0 || selectedFeatures.includes(t.feature_id);
        return modOk && featOk;
    });

    const handleRoleSave = async () => {
        if (newRole === currentRole) return;
        setSavingRole(true);
        setSaveSuccess(false);
        try {
            const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
            if (error) { addToast("Role save failed: " + error.message, "error"); }
            else {
                setCurrentRole(newRole);
                setSaveSuccess(true);
                addToast(`Role updated to ${newRole}`);
                onRoleChange(user.id, newRole);
                setTimeout(() => setSaveSuccess(false), 2000);
            }
        } catch (e) { addToast("Unexpected error: " + e.message, "error"); }
        setSavingRole(false);
    };

    const handleStatusToggle = async () => {
        setSavingStatus(true);
        const newStatus = !isActive;
        try {
            const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", user.id);
            if (error) { addToast("Status update failed: " + error.message, "error"); }
            else {
                setIsActive(newStatus);
                onStatusChange(user.id, newStatus);
                addToast(`User ${newStatus ? "activated" : "deactivated"}`);
            }
        } catch (e) { addToast("Unexpected error: " + e.message, "error"); }
        setSavingStatus(false);
    };

    const handleReassign = async () => {
        if (!reassignTo) { addToast("Please select a target user", "error"); return; }
        if (selectedTests.length === 0) { addToast("Please select at least one test case", "error"); return; }

        setReassigning(true);
        setReassignSuccess(false);
        try {
            const toUser = allUsers.find((u) => u.id === reassignTo);
            const { error } = await supabase.from("test_cases").update({ assigned_to: reassignTo }).in("id", selectedTests);
            if (error) {
                addToast("Reassign failed: " + error.message, "error");
            } else {
                setReassignSuccess(true);
                addToast(`${selectedTests.length} test case(s) reassigned to ${toUser?.full_name || toUser?.email}`);
                setSelectedTests([]);
                setSelectedModules([]);
                setSelectedFeatures([]);
                setReassignTo("");

                // Refresh parent data so preloadedTestCases and the table update correctly
                if (refreshUsers) refreshUsers();
                setTimeout(() => setReassignSuccess(false), 2000);
            }
        } catch (e) {
            addToast("Unexpected error: " + e.message, "error");
        }
        setReassigning(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                    <h3 className="font-bold text-slate-900">User Details</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {getInitials(user.full_name, user.email)}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-slate-900 text-base">{user.full_name || "—"}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                            <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rs.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />{currentRole}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Test Case Stats</p>
                        {loadingData ? (
                            <div className="flex items-center justify-center py-4"><i className="fa-solid fa-spinner animate-spin text-slate-400" /></div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {[{ label: "Total", value: userStats.total, color: "text-slate-900" }, { label: "Passed", value: userStats.passed, color: "text-emerald-600" }, { label: "Failed", value: userStats.failed, color: "text-red-600" }, { label: "Pending", value: userStats.pending, color: "text-amber-600" }].map((s) => (
                                    <div key={s.label} className="text-center bg-slate-50 rounded-lg p-3">
                                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Change Role</p>
                        <div className="flex gap-2">
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="tester">Tester</option>
                                <option value="developer">Developer</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button type="button" onClick={handleRoleSave} disabled={savingRole || newRole === currentRole}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${saveSuccess ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"}`}>
                                {savingRole ? <><i className="fa-solid fa-spinner animate-spin" />Saving…</> : saveSuccess ? <><i className="fa-solid fa-check-double" />Saved!</> : <><i className="fa-solid fa-check" />Save</>}
                            </button>
                        </div>
                        {newRole !== currentRole && !saveSuccess && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><i className="fa-solid fa-triangle-exclamation" />Role changed to <strong>{newRole}</strong> — click Save to apply</p>}
                        {saveSuccess && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><i className="fa-solid fa-check-circle" />Role successfully updated to <strong>{currentRole}</strong></p>}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Account Status</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${!isActive ? "bg-red-400" : "bg-emerald-500"}`} />
                                    <p className="text-sm font-semibold text-slate-800">{!isActive ? "Deactivated" : "Active"}</p>
                                </div>
                                <p className="text-xs text-slate-400">{!isActive ? "User cannot log in" : "User has full access"}</p>
                            </div>
                            <button type="button" onClick={handleStatusToggle} disabled={savingStatus}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${!isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                {savingStatus ? <i className="fa-solid fa-spinner animate-spin" /> : <><i className={`fa-solid ${!isActive ? "fa-user-check" : "fa-user-slash"} mr-1.5`} />{!isActive ? "Activate" : "Deactivate"}</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reassign Work</p>
                            <p className="text-xs text-slate-400 mt-0.5">Filter by module / feature, pick test cases, then assign to another user</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Assign To</label>
                            <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}
                                className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${reassignTo ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}>
                                <option value="">Select target user…</option>
                                {allUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>)}
                            </select>
                        </div>
                        <MultiSelect label="Filter by Module" options={modules} selected={selectedModules} onChange={(vals) => { setSelectedModules(vals); setSelectedFeatures([]); setSelectedTests([]); }} placeholder="All modules…" />
                        <MultiSelect label="Filter by Feature" options={filteredFeatures} selected={selectedFeatures} onChange={(vals) => { setSelectedFeatures(vals); setSelectedTests([]); }} placeholder="All features…" />
                        <MultiSelect label={`Assign Test Cases${filteredTests.length > 0 ? ` (${filteredTests.length} available)` : ""}`} options={filteredTests} selected={selectedTests} onChange={setSelectedTests} placeholder="Select test cases to reassign…" />
                        {filteredTests.length > 0 && (
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedTests(filteredTests.map((t) => t.id))} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"><i className="fa-solid fa-check-double mr-1" />Select All ({filteredTests.length})</button>
                                <button type="button" onClick={() => setSelectedTests([])} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"><i className="fa-solid fa-xmark mr-1" />Clear</button>
                            </div>
                        )}
                        <div className="space-y-1">
                            <div className={`flex items-center gap-2 text-xs ${reassignTo ? "text-emerald-600" : "text-slate-400"}`}>
                                <i className={`fa-solid ${reassignTo ? "fa-check-circle" : "fa-circle"} text-sm`} />
                                {reassignTo ? `Target: ${allUsers.find((u) => u.id === reassignTo)?.full_name || "Selected"}` : "Select a target user above"}
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${selectedTests.length > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                <i className={`fa-solid ${selectedTests.length > 0 ? "fa-check-circle" : "fa-circle"} text-sm`} />
                                {selectedTests.length > 0 ? `${selectedTests.length} test case(s) selected` : "Select test cases above"}
                            </div>
                        </div>
                        <button type="button" onClick={handleReassign} disabled={reassigning || !reassignTo || selectedTests.length === 0}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${reassignSuccess ? "bg-emerald-100 text-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"}`}>
                            {reassigning ? <><i className="fa-solid fa-spinner animate-spin" />Reassigning…</> : reassignSuccess ? <><i className="fa-solid fa-check-double" />Reassigned!</> : <><i className="fa-solid fa-arrows-rotate" />Reassign {selectedTests.length > 0 ? `${selectedTests.length} Test Case(s)` : "Test Cases"}</>}
                        </button>
                    </div>

                    {userTests.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Currently Assigned <span className="font-normal text-slate-400">({userTests.length})</span></p>
                            <div className="space-y-1.5 max-h-52 overflow-y-auto">
                                {userTests.slice(0, 15).map((t) => {
                                    const sc = t.status === "pass" ? "text-emerald-600 bg-emerald-50" : t.status === "fail" ? "text-red-600 bg-red-50" : "text-slate-400 bg-slate-100";
                                    return (
                                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                                            <p className="text-xs font-medium text-slate-700 truncate pr-2">{t.displayName}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${sc}`}>{t.status || "pending"}</span>
                                        </div>
                                    );
                                })}
                                {userTests.length > 15 && <p className="text-xs text-slate-400 text-center pt-1">+{userTests.length - 15} more</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [testCasesByUser, setTestCasesByUser] = useState({});

    const [confirmDialog, setConfirmDialog] = useState({
        show: false, title: "", message: "", onConfirm: null, danger: false,
    });

    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts((p) => [...p, { id, message, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data: profilesData, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, avatar_url, updated_at, is_active")
            .order("full_name");
        if (error) { addToast("Failed to load users: " + error.message, "error"); setLoading(false); return; }

        const profiles = profilesData || [];
        setUsers(profiles);

        // Fetch all test cases and map them to users by id, email, or full_name
        const { data: tcData } = await supabase
            .from("test_cases")
            .select("id, test_case_id, name, status, priority, assigned_to");

        const allTCs = tcData || [];
        const map = {};

        profiles.forEach(p => {
            const matches = allTCs.filter(tc =>
                tc.assigned_to === p.id ||
                (p.email && tc.assigned_to === p.email) ||
                (p.full_name && tc.assigned_to === p.full_name)
            );
            map[p.id] = matches;
        });

        setTestCasesByUser(map);

        // Keep selectedUser in sync after refresh so the drawer reflects new data
        setSelectedUser(prev => prev ? (profiles.find(p => p.id === prev.id) || null) : null);

        setLoading(false);
    }, [addToast]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = useCallback((userId, newRole) => {
        setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        setSelectedUser((prev) => prev?.id === userId ? { ...prev, role: newRole } : prev);
    }, []);

    const handleStatusChange = useCallback((userId, newStatus) => {
        setUsers((p) => p.map((u) => u.id === userId ? { ...u, is_active: newStatus } : u));
        setSelectedUser((prev) => prev?.id === userId ? { ...prev, is_active: newStatus } : prev);
    }, []);

    const handleDelete = useCallback((userId) => {
        const user = users.find((u) => u.id === userId);
        setConfirmDialog({
            show: true,
            title: "Delete user?",
            message: `Permanently delete ${user?.full_name || user?.email}? This cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                setConfirmDialog((p) => ({ ...p, show: false }));
                try {
                    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
                    if (profileError) { addToast("Failed to delete profile: " + profileError.message, "error"); return; }

                    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
                    if (authError) {
                        console.warn("Auth user delete failed (may need service role):", authError.message);
                        addToast("Profile deleted. Note: auth account may still exist.", "info");
                    } else {
                        addToast("User fully deleted");
                    }

                    setUsers((p) => p.filter((u) => u.id !== userId));
                    if (selectedUser?.id === userId) setSelectedUser(null);
                } catch (e) {
                    addToast("Unexpected error: " + e.message, "error");
                }
            },
        });
    }, [users, addToast, selectedUser]);

    const handleQuickRoleChange = useCallback(async (userId, newRole) => {
        try {
            const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
            if (error) { addToast("Role update failed: " + error.message, "error"); return; }
            addToast("Role updated to " + newRole);
            setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: newRole } : u));
            setSelectedUser((prev) => prev?.id === userId ? { ...prev, role: newRole } : prev);
        } catch (e) { addToast("Unexpected error: " + e.message, "error"); }
    }, [addToast]);

    const handleExport = useCallback(() => {
        const rows = [
            ["Name", "Email", "Role", "Status"],
            ...filteredUsers.map((u) => [u.full_name || "", u.email, u.role, u.is_active === false ? "Inactive" : "Active"]),
        ].map((r) => r.map((c) => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `users-${new Date().toISOString().split("T")[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
        addToast(`Exported ${filteredUsers.length} users`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users, addToast]);

    const filteredUsers = users.filter((u) => {
        const q = searchTerm.toLowerCase();
        const matchSearch = !searchTerm || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchRole = filterRole === "all" || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const stats = [
        { label: "Total Users", value: users.length, icon: "fa-users", color: "emerald" },
        { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: "fa-shield-halved", color: "purple" },
        { label: "Testers", value: users.filter((u) => u.role === "tester").length, icon: "fa-vial", color: "blue" },
        { label: "Developers", value: users.filter((u) => u.role === "developer").length, icon: "fa-code", color: "amber" },
        { label: "Inactive", value: users.filter((u) => u.is_active === false).length, icon: "fa-user-slash", color: "red" },
    ];

    const colorMap = {
        emerald: ["bg-emerald-100", "text-emerald-600"],
        purple: ["bg-purple-100", "text-purple-600"],
        blue: ["bg-blue-100", "text-blue-600"],
        amber: ["bg-amber-100", "text-amber-600"],
        red: ["bg-red-100", "text-red-600"],
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <Toast toasts={toasts} />

            <ConfirmDialog
                show={confirmDialog.show}
                title={confirmDialog.title}
                message={confirmDialog.message}
                danger={confirmDialog.danger}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((p) => ({ ...p, show: false }))}
            />

            {selectedUser && (
                <UserDrawer
                    user={selectedUser}
                    allUsers={users}
                    onClose={() => setSelectedUser(null)}
                    onRoleChange={handleRoleChange}
                    onStatusChange={handleStatusChange}
                    addToast={addToast}
                    refreshUsers={fetchUsers}
                    preloadedTestCases={testCasesByUser[selectedUser.id] || []}
                />
            )}

            <header className="bg-white border-b border-slate-200 flex-shrink-0">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Manage users, roles and test case assignments</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button type="button" onClick={fetchUsers} disabled={loading}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                                <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button type="button" onClick={handleExport}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                                <i className="fa-solid fa-file-export" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {stats.map((s) => {
                            const [bgC, textC] = colorMap[s.color];
                            return (
                                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`w-10 h-10 ${bgC} rounded-lg flex items-center justify-center mb-3`}>
                                        <i className={`fa-solid ${s.icon} ${textC} text-lg`} />
                                    </div>
                                    <p className={`text-2xl font-bold ${textC} mb-0.5`}>{s.value}</p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <input type="text" placeholder="Search by name or email…" value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="tester">Tester</option>
                                <option value="developer">Developer</option>
                            </select>
                            <button type="button" onClick={() => { setSearchTerm(""); setFilterRole("all"); }}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                                <i className="fa-solid fa-rotate-left mr-1.5" />Reset
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                            Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> of {users.length} users
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                                <i className="fa-solid fa-spinner animate-spin text-xl" />
                                <span className="text-sm">Loading users…</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {["User", "Role", "Status", "Test Cases", "Actions"].map((h) => (
                                                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                            const rs = getRoleStyle(user.role);
                                            const inactive = user.is_active === false;
                                            return (
                                                <tr key={user.id} onClick={() => setSelectedUser(user)}
                                                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${inactive ? "opacity-60" : ""}`}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                    {getInitials(user.full_name, user.email)}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name || "—"}</p>
                                                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${rs.badge}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />{user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${inactive ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                                                            {inactive ? "Inactive" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {(() => {
                                                            const tcs = testCasesByUser[user.id] || [];
                                                            const passed = tcs.filter(t => t.status === "pass" || t.status === "Passed").length;
                                                            const failed = tcs.filter(t => t.status === "fail" || t.status === "Failed").length;
                                                            const pending = tcs.filter(t => !t.status || t.status === "not-tested" || t.status === "Pending" || t.status === "Active").length;
                                                            return tcs.length === 0 ? (
                                                                <span className="text-xs text-slate-400">—</span>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-xs font-bold text-slate-700">{tcs.length}</span>
                                                                    {passed > 0 && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">{passed}P</span>}
                                                                    {failed > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded-full">{failed}F</span>}
                                                                    {pending > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-semibold rounded-full">{pending}Pnd</span>}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <select value={user.role} onChange={(e) => handleQuickRoleChange(user.id, e.target.value)}
                                                                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                                <option value="tester">Tester</option>
                                                                <option value="developer">Developer</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <button type="button" onClick={() => handleDelete(user.id)} title="Delete user"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                                                <i className="fa-solid fa-trash text-sm" />
                                                            </button>
                                                            <button type="button" onClick={() => setSelectedUser(user)} title="View details"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                                                                <i className="fa-solid fa-chevron-right text-sm" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center">
                                                    <i className="fa-solid fa-users text-slate-300 text-3xl mb-3 block" />
                                                    <p className="text-slate-500 font-medium">No users found</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}