import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const STATUS_META = {
    pass: { icon: "fa-check-circle", color: "text-emerald-500", bg: "bg-emerald-600", bgLight: "bg-emerald-50", border: "border-emerald-200", label: "Pass" },
    fail: { icon: "fa-times-circle", color: "text-red-500", bg: "bg-red-600", bgLight: "bg-red-50", border: "border-red-200", label: "Fail" },
    blocked: { icon: "fa-ban", color: "text-amber-500", bg: "bg-amber-500", bgLight: "bg-amber-50", border: "border-amber-200", label: "Blocked" },
    "not-tested": { icon: "fa-circle", color: "text-slate-400", bg: "bg-slate-500", bgLight: "bg-slate-50", border: "border-slate-200", label: "Not Tested" },
};
const getSM = (s) => STATUS_META[s] || STATUS_META["not-tested"];

const VERSION_BADGE = {
    active: "bg-emerald-100 text-emerald-700",
    testing: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-600",
    archived: "bg-slate-100 text-slate-400",
    planning: "bg-purple-100 text-purple-700",
};
const getVB = (s) => VERSION_BADGE[s] || "bg-slate-100 text-slate-500";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ show, message }) {
    if (!show) return null;
    return (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl animate-bounce">
            <i className="fa-solid fa-check-circle" />
            {message}
        </div>
    );
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ show, onClose, onConfirm, submitting, currentTest, selectedStatus, version, environment, browser, seconds, tester }) {
    if (!show) return null;
    const sm = getSM(selectedStatus);
    return (
        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center" onClick={() => !submitting && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-7 py-5 border-b flex items-center justify-between rounded-t-2xl ${sm.bgLight} ${sm.border}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${sm.bgLight}`}>
                            <i className={`fa-solid ${sm.icon} ${sm.color} text-2xl`} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Confirm Submission</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Review before saving to database</p>
                        </div>
                    </div>
                    <button onClick={() => !submitting && onClose()} disabled={submitting} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                    <div className={`p-3.5 rounded-xl border-2 flex items-center justify-between ${sm.bgLight} ${sm.border}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Test Status</span>
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold text-white ${sm.bg} flex items-center gap-1.5`}>
                            <i className={`fa-solid ${sm.icon}`} />
                            {selectedStatus.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "fa-vial", label: "Test Case", value: currentTest?.test_case_id },
                            { icon: "fa-code-branch", label: "Version", value: version ? `v${version.version_number}` : "—" },
                            { icon: "fa-server", label: "Environment", value: environment },
                            { icon: "fa-globe", label: "Browser", value: browser },
                            { icon: "fa-clock", label: "Time", value: formatTime(seconds) },
                            { icon: "fa-user", label: "Tester", value: tester?.full_name || tester?.email || "—" },
                        ].map((item) => (
                            <div key={item.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between" style={{ minHeight: 68 }}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <i className={`fa-solid ${item.icon} text-emerald-600`} style={{ fontSize: 10, flexShrink: 0 }} />
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide leading-none whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</p>
                                </div>
                                <p className="text-sm font-bold text-slate-900 capitalize truncate leading-snug">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    {selectedStatus === "fail" && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500" />
                            A bug record will be created automatically in the issues table.
                        </div>
                    )}
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex gap-2.5 text-xs text-yellow-800">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5 flex-shrink-0" />
                        This updates the test case status in your database and cannot be undone.
                    </div>
                </div>
                {/* Footer */}
                <div className="px-7 py-4 bg-slate-50 border-t flex gap-3 rounded-b-2xl">
                    <button onClick={() => !submitting && onClose()} disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2">
                        <i className="fa-solid fa-arrow-left" /> Go Back
                    </button>
                    <button onClick={onConfirm} disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
                        {submitting ? <><i className="fa-solid fa-spinner fa-spin" /> Submitting…</> : <><i className="fa-solid fa-paper-plane" /> Submit Result</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TestExecution() {
    // Core state
    const [testCases, setTestCases] = useState([]);
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [currentTest, setCurrentTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Related data
    const [module, setModule] = useState(null);
    const [feature, setFeature] = useState(null);
    const [version, setVersion] = useState(null);
    const [tester, setTester] = useState(null);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, blocked: 0, not_tested: 0 });

    // Version selector
    const [allVersions, setAllVersions] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [manualVersionOverride, setManualVersionOverride] = useState(null);

    // Execution form
    const [selectedStatus, setSelectedStatus] = useState("not-tested");
    const [expectedResult, setExpectedResult] = useState("");
    const [actualResult, setActualResult] = useState("");
    const [failureNotes, setFailureNotes] = useState("");
    const [issueType, setIssueType] = useState("");
    const [affectedField, setAffectedField] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [environment, setEnvironment] = useState("staging");
    const [browser, setBrowser] = useState("chrome");
    const [linkedBugId, setLinkedBugId] = useState("");
    const [linkedIssue, setLinkedIssue] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // UI
    const [seconds, setSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTestList, setShowTestList] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const showNotif = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3500); };

    // ── Timer ──
    useEffect(() => {
        if (isPaused) return;
        const t = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [isPaused]);

    // ── Load versions ──
    useEffect(() => {
        (async () => {
            setVersionsLoading(true);
            try {
                const { data } = await supabase
                    .from("versions")
                    .select("id, version_number, build_number, status, version_type, release_date, created_at, total_tests, passed_tests, failed_tests, pending_tests, completion_percentage")
                    .order("created_at", { ascending: false });
                setAllVersions(data || []);
            } catch (e) { console.warn(e); }
            finally { setVersionsLoading(false); }
        })();
    }, []);

    // ── Close version dropdown on outside click ──
    useEffect(() => {
        const h = (e) => { if (!e.target.closest("#ver-sel")) setShowVersionDropdown(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    // ── Load tester ──
    useEffect(() => {
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data } = await supabase.from("profiles").select("full_name, avatar_url, email").eq("id", user.id).single();
                setTester({ id: user.id, email: data?.email || user.email, full_name: data?.full_name || user.email, avatar_url: data?.avatar_url || null });
            } catch (e) { console.warn(e); }
        })();
    }, []);

    // ── Load test cases ──
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("test_cases")
                    .select("*")
                    .order("created_at", { ascending: true });
                if (error) throw error;
                const all = data || [];
                setTestCases(all);
                setStats({
                    total: all.length,
                    passed: all.filter((t) => t.status === "pass").length,
                    failed: all.filter((t) => t.status === "fail").length,
                    blocked: all.filter((t) => t.status === "blocked").length,
                    not_tested: all.filter((t) => !t.status || t.status === "not-tested" || t.status === "not_run").length,
                });
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        })();
    }, []);

    // ── Load related data when test index changes ──
    useEffect(() => {
        if (!testCases.length) return;
        const test = testCases[currentTestIndex];
        setCurrentTest(test);
        setExpectedResult(test.expected_result || "");
        setActualResult(test.actual_result || "");
        setSelectedStatus(test.status && test.status !== "not_run" ? test.status : "not-tested");
        setFailureNotes(""); setIssueType(""); setAffectedField(""); setStepsToReproduce("");
        setAdditionalNotes(""); setLinkedBugId(""); setUploadedFiles([]);
        setLinkedIssue(null); setExecutionHistory([]); setSeconds(0);
        setModule(null); setFeature(null);
        if (!manualVersionOverride) setVersion(null);

        (async () => {
            let resolvedFeature = null, resolvedModule = null, resolvedVersion = manualVersionOverride || null;

            // Feature
            if (test.feature_id) {
                try { const { data } = await supabase.from("features").select("*").eq("id", test.feature_id).single(); if (data) resolvedFeature = data; } catch { }
            }
            if (!resolvedFeature && test.feature_name) {
                try { const { data } = await supabase.from("features").select("*").ilike("feature_name", test.feature_name).limit(1).maybeSingle(); if (data) resolvedFeature = data; } catch { }
            }
            setFeature(resolvedFeature);

            // Module
            if (test.module_id) {
                try { const { data } = await supabase.from("modules").select("*").eq("id", test.module_id).single(); if (data) resolvedModule = data; } catch { }
            }
            if (!resolvedModule && resolvedFeature?.module_id) {
                try { const { data } = await supabase.from("modules").select("*").eq("id", resolvedFeature.module_id).single(); if (data) resolvedModule = data; } catch { }
            }
            setModule(resolvedModule);

            // Version (auto-detect if no manual override)
            if (!manualVersionOverride) {
                if (test.version_id) {
                    try { const { data } = await supabase.from("versions").select("*").eq("id", test.version_id).single(); if (data) resolvedVersion = data; } catch { }
                }
                if (!resolvedVersion && resolvedFeature?.version_id) {
                    try { const { data } = await supabase.from("versions").select("*").eq("id", resolvedFeature.version_id).single(); if (data) resolvedVersion = data; } catch { }
                }
                if (!resolvedVersion) {
                    try { const { data } = await supabase.from("versions").select("*").in("status", ["active", "in_progress", "testing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (data) resolvedVersion = data; } catch { }
                }
                if (!resolvedVersion) {
                    try { const { data } = await supabase.from("versions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(); if (data) resolvedVersion = data; } catch { }
                }
                setVersion(resolvedVersion);
            }

            if (resolvedVersion) {
                setStats((prev) => ({
                    ...prev,
                    total: resolvedVersion.total_tests || prev.total,
                    passed: resolvedVersion.passed_tests || prev.passed,
                    failed: resolvedVersion.failed_tests || prev.failed,
                    not_tested: resolvedVersion.pending_tests || prev.not_tested,
                }));
            }

            // Linked issue
            try {
                const { data } = await supabase.from("issues").select("id, bug_id, status, priority, issue_type, affected_component").eq("test_case_id", test.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                if (data) { setLinkedIssue(data); setLinkedBugId(data.bug_id || ""); }
            } catch { }

            // Execution history
            try {
                const { data } = await supabase.from("test_executions").select("id, execution_status, executed_at, environment, browser, execution_time").eq("test_case_id", test.id).order("executed_at", { ascending: false }).limit(5);
                setExecutionHistory(data || []);
            } catch { setExecutionHistory([]); }
        })();
    }, [currentTestIndex, testCases, manualVersionOverride]);

    // ── Build execution payload ──
    const buildPayload = () => ({
        test_case_id: currentTest.id,
        version_id: currentTest.version_id || version?.id || null,
        executed_by: tester?.id || null,
        execution_status: selectedStatus,
        environment,
        browser,
        execution_time: seconds,
        expected_result: expectedResult,
        actual_result: actualResult,
        failure_notes: failureNotes,
        issue_type: issueType || null,
        affected_component: affectedField,
        additional_notes: additionalNotes,
        steps_to_reproduce: stepsToReproduce || null,
        executed_at: new Date().toISOString(),
    });

    // ── Save progress (draft) ──
    const handleSave = async () => {
        if (!currentTest) return;
        try {
            const { error } = await supabase.from("test_executions").insert(buildPayload());
            if (error) throw error;
            await supabase.from("test_cases").update({ status: selectedStatus }).eq("id", currentTest.id);
            showNotif("Progress saved!");
            const { data } = await supabase.from("test_executions").select("id, execution_status, executed_at, environment, browser, execution_time").eq("test_case_id", currentTest.id).order("executed_at", { ascending: false }).limit(5);
            setExecutionHistory(data || []);
        } catch (e) { alert("Error saving: " + e.message); }
    };

    // ── Validate before submit ──
    const handleSubmitClick = () => {
        if (selectedStatus === "fail") {
            if (!expectedResult.trim()) return alert("Expected Result is required for failures.");
            if (!actualResult.trim()) return alert("Actual Result is required for failures.");
            if (!failureNotes.trim()) return alert("Failure Notes are required for failures.");
            if (!issueType) return alert("Issue Type is required for failures.");
        }
        setShowSubmitModal(true);
    };

    // ── Confirm submit ──
    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: exec, error: execErr } = await supabase.from("test_executions").insert(buildPayload()).select().single();
            if (execErr) throw execErr;

            if (selectedStatus === "fail") {
                await supabase.from("issues").insert({
                    test_case_id: currentTest.id,
                    test_execution_id: exec.id,
                    version_id: currentTest.version_id || version?.id || null,
                    module_id: currentTest.module_id || module?.id || null,
                    feature_id: currentTest.feature_id || feature?.id || null,
                    issue_type: issueType || null,
                    priority: currentTest.priority || "medium",
                    status: "open",
                    failure_comment: failureNotes,
                    expected_behavior: expectedResult,
                    actual_behavior: actualResult,
                    steps_to_reproduce: stepsToReproduce || null,
                    affected_component: affectedField,
                    environment,
                    browser,
                    reported_by: tester?.id || null,
                    assigned_to: currentTest.assigned_to || null,
                    reported_date: new Date().toISOString(),
                });
            }

            await supabase.from("test_cases").update({ status: selectedStatus, actual_result: actualResult || null }).eq("id", currentTest.id);

            const { data: updated } = await supabase.from("test_cases").select("*").order("created_at", { ascending: true });
            if (updated) {
                setTestCases(updated);
                setStats({
                    total: updated.length,
                    passed: updated.filter((t) => t.status === "pass").length,
                    failed: updated.filter((t) => t.status === "fail").length,
                    blocked: updated.filter((t) => t.status === "blocked").length,
                    not_tested: updated.filter((t) => !t.status || t.status === "not-tested" || t.status === "not_run").length,
                });
            }

            setShowSubmitModal(false);
            showNotif(`✓ ${selectedStatus.toUpperCase()} — result submitted!`);

            // Auto-advance to next untested case
            if (updated) {
                const next = updated.findIndex((t, i) => i > currentTestIndex && (!t.status || t.status === "not-tested" || t.status === "not_run"));
                if (next !== -1) setCurrentTestIndex(next);
                else if (currentTestIndex < updated.length - 1) setCurrentTestIndex((i) => i + 1);
            }
        } catch (e) { alert("Submission error: " + e.message); }
        finally { setIsSubmitting(false); }
    };

    // ── Link bug ──
    const handleLinkBug = async () => {
        if (!linkedBugId.trim()) return;
        const { data, error } = await supabase.from("issues").select("id, bug_id, status, priority, issue_type, affected_component").eq("bug_id", linkedBugId.trim()).maybeSingle();
        if (error || !data) { alert(`No issue found with ID "${linkedBugId}"`); return; }
        setLinkedIssue(data);
    };

    // ── File upload ──
    const handleFileUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            const path = `test-evidence/${currentTest?.id || "misc"}/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from("test-attachments").upload(path, file);
            if (error) {
                setUploadedFiles((p) => [...p, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: null }]);
            } else {
                const { data: { publicUrl } } = supabase.storage.from("test-attachments").getPublicUrl(path);
                setUploadedFiles((p) => [...p, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: publicUrl }]);
            }
        }
    }, [currentTest]);

    const filteredTests = testCases.filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !searchQuery || t.name?.toLowerCase().includes(q) || t.test_case_id?.toLowerCase().includes(q);
        const matchFilter = filterStatus === "all" || t.status === filterStatus || (!t.status && filterStatus === "not-tested");
        return matchSearch && matchFilter;
    });

    // ── Loading / Error / Empty ──
    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Loading test cases…</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <i className="fa-solid fa-circle-exclamation text-red-400 text-4xl mb-4 block" />
                <p className="text-red-500 font-semibold mb-1">Failed to load test cases</p>
                <p className="text-sm text-slate-500">{error}</p>
            </div>
        </div>
    );
    if (!currentTest) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <i className="fa-solid fa-vial text-slate-300 text-4xl mb-4 block" />
                <p className="text-slate-500 font-semibold">No test cases found</p>
                <p className="text-sm text-slate-400 mt-1">Add test cases to get started</p>
            </div>
        </div>
    );

    const sm = getSM(selectedStatus);

    // ── Render ──
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <Toast show={showToast} message={toastMsg} />

            <SubmitModal
                show={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={confirmSubmit}
                submitting={isSubmitting}
                currentTest={currentTest}
                selectedStatus={selectedStatus}
                version={version}
                environment={environment}
                browser={browser}
                seconds={seconds}
                tester={tester}
            />

            {/* ── Header ── */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-900">Test Execution</h2>

                                {/* Version selector */}
                                <div id="ver-sel" className="relative">
                                    <button
                                        onClick={() => setShowVersionDropdown((p) => !p)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${showVersionDropdown ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400"}`}
                                    >
                                        <i className="fa-solid fa-code-branch" />
                                        {versionsLoading ? (
                                            <span className="flex items-center gap-1"><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />Loading…</span>
                                        ) : version ? (
                                            <span>v{version.version_number} · Build {version.build_number}</span>
                                        ) : (
                                            <span>Select Version</span>
                                        )}
                                        {manualVersionOverride && <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-bold">Manual</span>}
                                        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${showVersionDropdown ? "rotate-180" : ""}`} />
                                    </button>

                                    {showVersionDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Select Version</p>
                                                    <p className="text-xs text-slate-500">{allVersions.length} version{allVersions.length !== 1 ? "s" : ""} available</p>
                                                </div>
                                                {manualVersionOverride && (
                                                    <button onClick={() => { setManualVersionOverride(null); setShowVersionDropdown(false); }}
                                                        className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100">
                                                        <i className="fa-solid fa-rotate-left text-xs" /> Reset
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {versionsLoading ? (
                                                    <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                                                ) : allVersions.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-400 text-sm">No versions found</div>
                                                ) : allVersions.map((v) => {
                                                    const isSelected = version?.id === v.id;
                                                    const pct = v.completion_percentage || 0;
                                                    return (
                                                        <button key={v.id} onClick={() => { setManualVersionOverride(v); setVersion(v); setShowVersionDropdown(false); }}
                                                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 ${isSelected ? "bg-blue-50" : ""}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        <span className="font-bold text-slate-900 text-sm">v{v.version_number}</span>
                                                                        <span className="text-xs text-slate-400">Build {v.build_number}</span>
                                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getVB(v.status)}`}>{v.status}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                        <span className="text-xs text-slate-400">{pct}%</span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-check text-white" style={{ fontSize: 9 }} /></div>}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <i className="fa-solid fa-circle-info" />
                                                    {manualVersionOverride ? "Manual override active" : "Auto-detecting from test case"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getSM(currentTest.status || "not-tested").bgLight} ${getSM(currentTest.status || "not-tested").color}`}>
                                    {currentTestIndex + 1}/{testCases.length}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">{module?.module_name || "—"} › {feature?.feature_name || currentTest.name}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => setShowTestList((p) => !p)} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                                <i className="fa-solid fa-list" /><span className="hidden sm:inline">Test List</span>
                            </button>
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-lg">
                                <i className={`fa-solid fa-clock text-slate-500 ${!isPaused ? "animate-pulse" : ""}`} />
                                <span className="text-sm font-mono font-semibold text-slate-900">{formatTime(seconds)}</span>
                            </div>
                            <button onClick={() => setIsPaused((p) => !p)} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                                <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`} /><span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                                <i className="fa-solid fa-save" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-5">

                    {/* ── Test List Drawer ── */}
                    {showTestList && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">All Test Cases</h3>
                                <button onClick={() => setShowTestList(false)} className="text-slate-400 hover:text-slate-700"><i className="fa-solid fa-xmark" /></button>
                            </div>
                            <div className="p-4 border-b border-slate-100 flex gap-3">
                                <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="all">All</option>
                                    <option value="not-tested">Not Tested</option>
                                    <option value="pass">Pass</option>
                                    <option value="fail">Fail</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                {filteredTests.map((t) => {
                                    const si = getSM(t.status || "not-tested");
                                    const ri = testCases.findIndex((tc) => tc.id === t.id);
                                    return (
                                        <button key={t.id} onClick={() => { setCurrentTestIndex(ri); setShowTestList(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors ${ri === currentTestIndex ? "bg-emerald-50 border-l-2 border-emerald-600" : ""}`}>
                                            <i className={`fa-solid ${si.icon} ${si.color} text-sm flex-shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                                                <p className="text-xs text-slate-400">{t.test_case_id}</p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${si.bgLight} ${si.color}`}>{t.status || "Not Tested"}</span>
                                        </button>
                                    );
                                })}
                                {filteredTests.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No matches</p>}
                            </div>
                        </div>
                    )}

                    {/* ── Context Card ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-stretch">
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">Version &amp; Build</label>
                                    {version ? (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg flex-1">
                                            <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-code-branch text-blue-500 text-lg" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-bold text-slate-900 text-lg">v{version.version_number}</p>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded">Build {version.build_number}</span>
                                                    {manualVersionOverride && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">Manual</span>}
                                                </div>
                                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${getVB(version.status)}`}>{version.status}</span>
                                            </div>
                                            <button id="ver-sel" onClick={() => setShowVersionDropdown((p) => !p)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                                <i className="fa-solid fa-pen-to-square text-sm" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-slate-400"><i className="fa-solid fa-code-branch text-slate-300" />No version linked</div>
                                            <button id="ver-sel" onClick={() => setShowVersionDropdown(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"><i className="fa-solid fa-plus" /> Select</button>
                                        </div>
                                    )}
                                </div>

                                {/* Test Case info */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">Test Case</label>
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-vial text-purple-500 text-sm" /></div>
                                            <p className="font-bold text-slate-900">{currentTest.test_case_id}</p>
                                            <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded capitalize ${currentTest.priority === "high" || currentTest.priority === "High" ? "bg-red-100 text-red-600" : currentTest.priority === "medium" || currentTest.priority === "Medium" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}`}>
                                                {currentTest.priority || "—"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">{currentTest.name}</p>
                                        {currentTest.test_type && <p className="text-xs text-slate-400 mt-1 capitalize">{currentTest.test_type}</p>}
                                        {currentTest.assigned_to && <p className="text-xs text-slate-400 mt-1"><i className="fa-solid fa-user mr-1" />Assigned: {currentTest.assigned_to}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Module & Feature */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-stretch">
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">Module</label>
                                    {module ? (
                                        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg flex-1">
                                            <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-puzzle-piece text-teal-500" /></div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{module.module_name}</p>
                                                <p className="text-xs text-slate-500">MOD-{module.module_code} · {module.status}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-sm text-slate-400 flex-1"><i className="fa-solid fa-puzzle-piece text-slate-300" />No module linked</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">Feature</label>
                                    {feature ? (
                                        <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-list-check text-indigo-500" /></div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{feature.feature_name}</p>
                                                    <p className="text-xs text-slate-500">{feature.feature_code} · {feature.total_test_cases || 0} Tests</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-sm text-slate-400 flex-1"><i className="fa-solid fa-list-check text-slate-300" />No feature linked</div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 border-t border-slate-100">
                                {[
                                    { label: "Total", value: stats.total, color: "text-slate-900" },
                                    { label: "Passed", value: stats.passed, color: "text-emerald-600" },
                                    { label: "Failed", value: stats.failed, color: "text-red-600" },
                                    { label: "Blocked", value: stats.blocked, color: "text-amber-600" },
                                    { label: "Not Tested", value: stats.not_tested, color: "text-slate-400" },
                                ].map((s) => (
                                    <div key={s.label} className="text-center p-3 bg-slate-50 rounded-lg">
                                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Test Case Details ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Test Case Details</h3>
                            {executionHistory.length > 0 && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <i className="fa-solid fa-history" />
                                    Last run: {new Date(executionHistory[0].executed_at).toLocaleDateString()} —
                                    <span className={`font-semibold ${getSM(executionHistory[0].execution_status).color}`}>{executionHistory[0].execution_status}</span>
                                </span>
                            )}
                        </div>
                        <div className="p-6 space-y-5">
                            {currentTest.description && (
                                <div><label className="text-sm font-semibold text-slate-800 mb-2 block">Description</label><p className="text-sm text-slate-500 leading-relaxed">{currentTest.description}</p></div>
                            )}
                            {currentTest.preconditions && (
                                <div><label className="text-sm font-semibold text-slate-800 mb-2 block">Preconditions</label><p className="text-sm text-slate-500 p-3 bg-yellow-50 border border-yellow-200 rounded-lg leading-relaxed">{currentTest.preconditions}</p></div>
                            )}
                            {currentTest.test_steps && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-800 mb-3 block">Test Steps</label>
                                    <div className="space-y-2.5">
                                        {(Array.isArray(currentTest.test_steps) ? currentTest.test_steps : currentTest.test_steps.split("\n").filter(Boolean)).map((step, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</div>
                                                <p className="text-sm text-slate-500 pt-0.5">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {currentTest.expected_result && (
                                <div><label className="text-sm font-semibold text-slate-800 mb-2 block">Expected Result</label><p className="text-sm text-slate-500 p-3 bg-emerald-50 border border-emerald-200 rounded-lg leading-relaxed">{currentTest.expected_result}</p></div>
                            )}
                        </div>
                    </div>

                    {/* ── Execution Results ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Execution Results</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status selector */}
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-3 block">Test Status <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { key: "pass", label: "Pass", icon: "fa-check-circle", color: "text-emerald-500", active: "border-emerald-500 bg-emerald-50" },
                                        { key: "fail", label: "Fail", icon: "fa-times-circle", color: "text-red-500", active: "border-red-500 bg-red-50" },
                                        { key: "blocked", label: "Blocked", icon: "fa-ban", color: "text-amber-500", active: "border-amber-500 bg-amber-50" },
                                        { key: "not-tested", label: "Not Tested", icon: "fa-circle", color: "text-slate-400", active: "border-slate-400 bg-slate-50" },
                                    ].map((s) => (
                                        <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                                            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedStatus === s.key ? s.active : "border-slate-200 hover:border-emerald-500"}`}>
                                            <i className={`fa-solid ${s.icon} ${s.color}`} />{s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Expected / Actual */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-semibold text-slate-800 mb-2 block">Expected Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} placeholder="What should happen…"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-800 mb-2 block">Actual Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={actualResult} onChange={(e) => setActualResult(e.target.value)} placeholder="What actually happened…"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" />
                                </div>
                            </div>

                            {/* Failure / Blocked details */}
                            {(selectedStatus === "fail" || selectedStatus === "blocked") && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-5">
                                    <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                                        <i className="fa-solid fa-bug" />{selectedStatus === "fail" ? "Failure Details" : "Blocker Details"}
                                    </h4>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">{selectedStatus === "fail" ? "Failure Notes" : "Blocker Description"} <span className="text-red-500">*</span></label>
                                        <textarea rows={4} value={failureNotes} onChange={(e) => setFailureNotes(e.target.value)} placeholder="Describe what went wrong…"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">Steps to Reproduce</label>
                                        <textarea rows={4} value={stepsToReproduce} onChange={(e) => setStepsToReproduce(e.target.value)} placeholder={"1. Go to…\n2. Click on…\n3. Observe…"}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-xs" />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-800 mb-2 block">Issue Type {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                            <select value={issueType} onChange={(e) => setIssueType(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="">Select Issue Type</option>
                                                <option value="ui">UI Issue</option>
                                                <option value="functional">Functional Issue</option>
                                                <option value="performance">Performance Issue</option>
                                                <option value="security">Security Issue</option>
                                                <option value="data">Data Issue</option>
                                                <option value="integration">Integration Issue</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-slate-800 mb-2 block">Affected Component</label>
                                            <input type="text" value={affectedField} onChange={(e) => setAffectedField(e.target.value)} placeholder="e.g., Login button, Email field…"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                    </div>

                                    {/* File upload */}
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">Screenshots / Attachments</label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-emerald-500 transition-colors">
                                            <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 mb-2 block" />
                                                <p className="text-sm font-medium text-slate-600 mb-1">Click to upload screenshots</p>
                                                <p className="text-xs text-slate-400">PNG, JPG, PDF up to 10MB</p>
                                            </label>
                                        </div>
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {uploadedFiles.map((f) => (
                                                    <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-blue-100 rounded flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-image text-blue-500" /></div>
                                                            <div><p className="text-sm font-medium text-slate-900">{f.name}</p><p className="text-xs text-slate-400">{f.size}</p></div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600"><i className="fa-solid fa-external-link-alt" /></a>}
                                                            <button onClick={() => setUploadedFiles((p) => p.filter((x) => x.id !== f.id))} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-trash" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Link bug */}
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">Linked Bug ID</label>
                                        <div className="flex gap-3">
                                            <input type="text" value={linkedBugId} onChange={(e) => setLinkedBugId(e.target.value)} placeholder="e.g. BUG-0001"
                                                onKeyDown={(e) => e.key === "Enter" && handleLinkBug()}
                                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <button onClick={handleLinkBug} className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                                                <i className="fa-solid fa-link mr-2" />Link
                                            </button>
                                        </div>
                                        {linkedIssue && (
                                            <div className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <i className="fa-solid fa-bug text-amber-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{linkedIssue.bug_id}</p>
                                                        <p className="text-xs text-slate-500">Status: {linkedIssue.status} · Priority: {linkedIssue.priority}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => { setLinkedIssue(null); setLinkedBugId(""); }} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-times" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block">Additional Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <textarea rows={3} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Any additional observations or context…"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* ── Execution History ── */}
                    {executionHistory.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="p-5 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900">Previous Executions</h3></div>
                            <div className="divide-y divide-slate-100">
                                {executionHistory.map((ex) => {
                                    const si = getSM(ex.execution_status);
                                    return (
                                        <div key={ex.id} className="px-5 py-4 flex items-center gap-4">
                                            <i className={`fa-solid ${si.icon} ${si.color}`} />
                                            <div className="flex-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${si.bgLight} ${si.color}`}>{ex.execution_status?.toUpperCase()}</span>
                                                <span className="text-xs text-slate-400 ml-2">{ex.environment} · {ex.browser}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono">{formatTime(ex.execution_time || 0)}</span>
                                            <span className="text-xs text-slate-400">{new Date(ex.executed_at).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Metadata ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-5 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900">Execution Metadata</h3></div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tester</label>
                                    <div className="flex items-center gap-2.5">
                                        {tester?.avatar_url ? (
                                            <img src={tester.avatar_url} alt="Tester" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                                                {tester?.full_name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-slate-900">{tester?.full_name || tester?.email || "Loading…"}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Execution Time</label>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-clock text-slate-400" />
                                        <span className="text-sm font-mono font-semibold text-slate-900">{formatTime(seconds)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Environment</label>
                                    <select value={environment} onChange={(e) => setEnvironment(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="staging">Staging</option>
                                        <option value="production">Production</option>
                                        <option value="dev">Development</option>
                                        <option value="uat">UAT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Browser</label>
                                    <select value={browser} onChange={(e) => setBrowser(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="chrome">Chrome</option>
                                        <option value="firefox">Firefox</option>
                                        <option value="safari">Safari</option>
                                        <option value="edge">Edge</option>
                                        <option value="mobile">Mobile</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Navigation + Submit ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={() => setCurrentTestIndex((i) => Math.max(0, i - 1))} disabled={currentTestIndex === 0}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                                <i className="fa-solid fa-arrow-left" />Previous
                            </button>
                            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{currentTestIndex + 1} / {testCases.length}</span>
                            <button onClick={() => setCurrentTestIndex((i) => Math.min(testCases.length - 1, i + 1))} disabled={currentTestIndex === testCases.length - 1}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                                Next<i className="fa-solid fa-arrow-right" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={handleSave} className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                                <i className="fa-solid fa-floppy-disk" />Save as Draft
                            </button>
                            <button onClick={handleSubmitClick} className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                                <i className="fa-solid fa-paper-plane" />Submit Result
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}