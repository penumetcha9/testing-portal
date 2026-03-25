import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

export default function TestExecution() {
    const [seconds, setSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showSavedNotification, setShowSavedNotification] = useState(false);
    const [savedMessage, setSavedMessage] = useState("Progress saved!");
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [currentTest, setCurrentTest] = useState(null);
    const [module, setModule] = useState(null);
    const [feature, setFeature] = useState(null);
    const [version, setVersion] = useState(null);
    const [tester, setTester] = useState(null);
    const [linkedIssue, setLinkedIssue] = useState(null);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, blocked: 0, not_tested: 0 });

    // ── Version selector state ────────────────────────────────────────────────
    const [allVersions, setAllVersions] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [manualVersionOverride, setManualVersionOverride] = useState(null);

    const [selectedStatus, setSelectedStatus] = useState("not-tested");
    const [expectedResult, setExpectedResult] = useState("");
    const [actualResult, setActualResult] = useState("");
    const [failureNotes, setFailureNotes] = useState("");
    const [issueType, setIssueType] = useState("");
    const [affectedField, setAffectedField] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [environment, setEnvironment] = useState("staging");
    const [browser, setBrowser] = useState("chrome");
    const [linkedBugId, setLinkedBugId] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showTestList, setShowTestList] = useState(false);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [isPaused]);

    const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    // ── Fetch all versions ───────────────────────────────────────────────────
    useEffect(() => {
        async function loadAllVersions() {
            setVersionsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("versions")
                    .select("id, version_number, build_number, status, version_type, release_date, created_date, total_tests, passed_tests, failed_tests, pending_tests, completion_percentage")
                    .order("created_date", { ascending: false });
                if (error) throw error;
                setAllVersions(data || []);
            } catch (err) {
                console.warn("Could not load versions:", err.message);
            } finally {
                setVersionsLoading(false);
            }
        }
        loadAllVersions();
    }, []);

    // ── Close dropdown on outside click ─────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest("#version-selector")) setShowVersionDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Load tester ──────────────────────────────────────────────────────────
    useEffect(() => {
        async function loadTester() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data } = await supabase.from("profiles").select("full_name, avatar_url, email").eq("id", user.id).single();
                setTester({ id: user.id, email: data?.email || user.email, full_name: data?.full_name || user.email, avatar_url: data?.avatar_url || null });
            } catch (err) {
                console.warn("Could not load tester profile:", err.message);
            }
        }
        loadTester();
    }, []);

    // ── Load test cases ──────────────────────────────────────────────────────
    useEffect(() => {
        async function loadTestCases() {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase.from("test_cases").select("*").order("created_at", { ascending: true });
                if (error) throw error;
                const all = data || [];
                setTestCases(all);
                setStats({
                    total: all.length,
                    passed: all.filter(t => t.status === "pass").length,
                    failed: all.filter(t => t.status === "fail").length,
                    blocked: all.filter(t => t.status === "blocked").length,
                    not_tested: all.filter(t => !t.status || t.status === "not-tested").length,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadTestCases();
    }, []);

    // ── Fetch related data ───────────────────────────────────────────────────
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

        async function fetchRelated() {
            let resolvedFeature = null, resolvedModule = null, resolvedVersion = manualVersionOverride || null;

            if (test.feature_id) {
                try { const { data } = await supabase.from("features").select("*").eq("id", test.feature_id).single(); if (data) resolvedFeature = data; } catch (e) { }
            }
            if (!resolvedFeature && test.feature_name) {
                try { const { data } = await supabase.from("features").select("*").ilike("feature_name", test.feature_name).limit(1).maybeSingle(); if (data) resolvedFeature = data; } catch (e) { }
            }
            setFeature(resolvedFeature);

            if (test.module_id) {
                try { const { data } = await supabase.from("modules").select("*").eq("id", test.module_id).single(); if (data) resolvedModule = data; } catch (e) { }
            }
            if (!resolvedModule && resolvedFeature?.module_id) {
                try { const { data } = await supabase.from("modules").select("*").eq("id", resolvedFeature.module_id).single(); if (data) resolvedModule = data; } catch (e) { }
            }
            if (!resolvedModule && test.module_name) {
                try { const { data } = await supabase.from("modules").select("*").ilike("module_name", test.module_name).limit(1).maybeSingle(); if (data) resolvedModule = data; } catch (e) { }
            }
            setModule(resolvedModule);

            if (!manualVersionOverride) {
                if (test.version_id) {
                    try { const { data } = await supabase.from("versions").select("*").eq("id", test.version_id).single(); if (data) resolvedVersion = data; } catch (e) { }
                }
                if (!resolvedVersion && resolvedFeature?.version_id) {
                    try { const { data } = await supabase.from("versions").select("*").eq("id", resolvedFeature.version_id).single(); if (data) resolvedVersion = data; } catch (e) { }
                }
                if (!resolvedVersion && resolvedModule?.version_id) {
                    try { const { data } = await supabase.from("versions").select("*").eq("id", resolvedModule.version_id).single(); if (data) resolvedVersion = data; } catch (e) { }
                }
                if (!resolvedVersion) {
                    try { const { data } = await supabase.from("versions").select("*").in("status", ["active", "in_progress", "in-progress", "testing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (data) resolvedVersion = data; } catch (e) { }
                }
                if (!resolvedVersion) {
                    try { const { data } = await supabase.from("versions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(); if (data) resolvedVersion = data; } catch (e) { }
                }
                setVersion(resolvedVersion);
            }

            if (resolvedVersion) {
                setStats(prev => ({
                    ...prev,
                    total: resolvedVersion.total_tests || prev.total,
                    passed: resolvedVersion.passed_tests || prev.passed,
                    failed: resolvedVersion.failed_tests || prev.failed,
                    not_tested: resolvedVersion.pending_tests || prev.not_tested,
                }));
            }

            try {
                const { data } = await supabase.from("issues").select("id, bug_id, status, priority, issue_type, affected_component").eq("test_case_id", test.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                if (data) { setLinkedIssue(data); setLinkedBugId(data.bug_id || ""); }
            } catch (e) { }

            try {
                const { data } = await supabase.from("test_executions").select("id, execution_status, executed_at, environment, browser, execution_time").eq("test_case_id", test.id).order("executed_at", { ascending: false }).limit(5);
                setExecutionHistory(data || []);
            } catch (e) { setExecutionHistory([]); }
        }

        fetchRelated();
    }, [currentTestIndex, testCases, manualVersionOverride]);

    // ── Status config ────────────────────────────────────────────────────────
    const statusOptions = [
        { key: "pass", label: "Pass", icon: "fa-check-circle", color: "text-green-500", activeBorder: "border-green-500", activeBg: "bg-green-50" },
        { key: "fail", label: "Fail", icon: "fa-times-circle", color: "text-red-500", activeBorder: "border-red-500", activeBg: "bg-red-50" },
        { key: "blocked", label: "Blocked", icon: "fa-ban", color: "text-amber-500", activeBorder: "border-amber-500", activeBg: "bg-amber-50" },
        { key: "not-tested", label: "Not Tested", icon: "fa-circle", color: "text-gray-400", activeBorder: "border-gray-400", activeBg: "bg-gray-50" },
    ];

    const getStatusInfo = (status) => {
        const map = {
            "pass": { icon: "fa-check-circle", color: "text-green-500", bg: "bg-green-600", bgLight: "bg-green-50", border: "border-green-200", label: "Pass" },
            "fail": { icon: "fa-times-circle", color: "text-red-500", bg: "bg-red-600", bgLight: "bg-red-50", border: "border-red-200", label: "Fail" },
            "blocked": { icon: "fa-ban", color: "text-amber-500", bg: "bg-amber-500", bgLight: "bg-amber-50", border: "border-amber-200", label: "Blocked" },
            "not-tested": { icon: "fa-circle", color: "text-gray-400", bg: "bg-gray-500", bgLight: "bg-gray-50", border: "border-gray-200", label: "Not Tested" },
        };
        return map[status] || map["not-tested"];
    };

    const getVersionStatusBadge = (status) => {
        const map = {
            active: "bg-green-100 text-green-700",
            testing: "bg-blue-100 text-blue-700",
            completed: "bg-gray-100 text-gray-600",
            archived: "bg-gray-100 text-gray-400",
            planning: "bg-purple-100 text-purple-700",
        };
        return map[status] || "bg-gray-100 text-gray-500";
    };

    const statusInfo = getStatusInfo(selectedStatus);

    const buildExecutionPayload = () => ({
        test_case_id: currentTest.id,
        version_id: currentTest.version_id || version?.id || null,
        executed_by: tester?.id || null,
        execution_status: selectedStatus,
        environment, browser,
        execution_time: seconds,
        expected_result: expectedResult,
        actual_result: actualResult,
        failure_notes: failureNotes,
        issue_type: issueType || null,
        affected_component: affectedField,
        additional_notes: additionalNotes,
        executed_at: new Date().toISOString(),
    });

    const handleSaveProgress = async () => {
        if (!currentTest) return;
        try {
            const { error } = await supabase.from("test_executions").insert(buildExecutionPayload());
            if (error) throw error;
            await supabase.from("test_cases").update({ status: selectedStatus }).eq("id", currentTest.id);
            setSavedMessage("Progress saved successfully!");
            setShowSavedNotification(true);
            setTimeout(() => setShowSavedNotification(false), 3000);
            const { data: history } = await supabase.from("test_executions").select("id, execution_status, executed_at, environment, browser, execution_time").eq("test_case_id", currentTest.id).order("executed_at", { ascending: false }).limit(5);
            setExecutionHistory(history || []);
        } catch (err) {
            alert("Error saving: " + err.message);
        }
    };

    const handleSubmitResult = () => {
        if (selectedStatus === "fail") {
            if (!expectedResult.trim()) { alert("Expected Result is required for failures"); return; }
            if (!actualResult.trim()) { alert("Actual Result is required for failures"); return; }
            if (!failureNotes.trim()) { alert("Failure Notes are required for failures"); return; }
            if (!issueType) { alert("Issue Type is required for failures"); return; }
        }
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: execution, error: execError } = await supabase.from("test_executions").insert(buildExecutionPayload()).select().single();
            if (execError) throw execError;

            if (selectedStatus === "fail") {
                const { error: issueError } = await supabase.from("issues").insert({
                    test_case_id: currentTest.id, test_execution_id: execution.id,
                    version_id: currentTest.version_id || version?.id || null,
                    module_id: currentTest.module_id || module?.id || null,
                    feature_id: currentTest.feature_id || feature?.id || null,
                    issue_type: issueType || null, priority: currentTest.priority || "medium",
                    status: "open", failure_comment: failureNotes,
                    expected_behavior: expectedResult, actual_behavior: actualResult,
                    steps_to_reproduce: stepsToReproduce || null,
                    affected_component: affectedField, environment, browser,
                    reported_by: tester?.id || null, assigned_to: currentTest.assigned_to || null,
                    reported_date: new Date().toISOString(),
                });
                if (issueError) console.warn("Issue creation warning:", issueError.message);
            }

            await supabase.from("test_cases").update({ status: selectedStatus, actual_result: actualResult || null }).eq("id", currentTest.id);

            const { data: updatedCases } = await supabase.from("test_cases").select("*").order("created_at", { ascending: true });
            if (updatedCases) {
                setTestCases(updatedCases);
                setStats({
                    total: updatedCases.length,
                    passed: updatedCases.filter(t => t.status === "pass").length,
                    failed: updatedCases.filter(t => t.status === "fail").length,
                    blocked: updatedCases.filter(t => t.status === "blocked").length,
                    not_tested: updatedCases.filter(t => !t.status || t.status === "not-tested" || t.status === "not_run").length,
                });
            }

            setShowSubmitModal(false);
            setSavedMessage(`✓ ${selectedStatus.toUpperCase()} — result submitted!`);
            setShowSavedNotification(true);
            setTimeout(() => setShowSavedNotification(false), 4000);

            const nextIndex = updatedCases
                ? updatedCases.findIndex((t, i) => i > currentTestIndex && (!t.status || t.status === "not-tested" || t.status === "not_run"))
                : -1;
            if (nextIndex !== -1) setCurrentTestIndex(nextIndex);
            else if (currentTestIndex < testCases.length - 1) setCurrentTestIndex(i => i + 1);
        } catch (err) {
            alert("Submission error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkBug = async () => {
        if (!linkedBugId.trim()) return;
        const { data, error } = await supabase.from("issues").select("id, bug_id, status, priority, issue_type, affected_component").eq("bug_id", linkedBugId.trim()).maybeSingle();
        if (error || !data) { alert(`No issue found with ID "${linkedBugId}"`); return; }
        setLinkedIssue(data);
    };

    const handleFileUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            const filePath = `test-evidence/${currentTest?.id || "misc"}/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from("test-attachments").upload(filePath, file);
            if (error) {
                setUploadedFiles(prev => [...prev, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: null }]);
            } else {
                const { data: { publicUrl } } = supabase.storage.from("test-attachments").getPublicUrl(filePath);
                setUploadedFiles(prev => [...prev, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: publicUrl }]);
            }
        }
    }, [currentTest]);

    const filteredTests = testCases.filter(t => {
        const matchesSearch = !searchQuery || t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.test_case_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || t.status === filterStatus || (!t.status && filterStatus === "not-tested");
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading test cases...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-center">
                <i className="fa-solid fa-circle-exclamation text-red-400 text-4xl mb-4 block"></i>
                <p className="text-red-500 font-medium mb-2">Failed to load test cases</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        </div>
    );

    if (!currentTest) return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-center">
                <i className="fa-solid fa-vial text-gray-300 text-4xl mb-4 block"></i>
                <p className="text-gray-500 font-medium">No test cases found</p>
                <p className="text-sm text-gray-400 mt-1">Add test cases to get started</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Save notification */}
            {showSavedNotification && (
                <div className="fixed top-6 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
                    <i className="fa-solid fa-check-circle"></i>
                    <span className="text-sm font-medium">{savedMessage}</span>
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm flex items-center justify-center" onClick={() => !isSubmitting && setShowSubmitModal(false)}>
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className={`px-8 py-6 border-b flex items-center justify-between rounded-t-2xl ${statusInfo.bgLight} ${statusInfo.border}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo.bgLight}`}>
                                    <i className={`fa-solid ${statusInfo.icon} ${statusInfo.color} text-2xl`}></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Submit Test Result</h3>
                                    <p className="text-sm text-gray-500 mt-1">Review and confirm your test execution</p>
                                </div>
                            </div>
                            <button onClick={() => !isSubmitting && setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg" disabled={isSubmitting}>
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                            <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${statusInfo.bgLight} ${statusInfo.border}`}>
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Test Status</span>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${statusInfo.bg} flex items-center gap-2`}>
                                    <i className={`fa-solid ${statusInfo.icon}`}></i>
                                    {selectedStatus.toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: "fa-vial", label: "Test Case", value: currentTest.test_case_id },
                                    { icon: "fa-code-branch", label: "Version", value: version ? `v${version.version_number}` : "—" },
                                    { icon: "fa-server", label: "Environment", value: environment },
                                    { icon: "fa-globe", label: "Browser", value: browser },
                                    { icon: "fa-clock", label: "Time", value: formatTime(seconds) },
                                    { icon: "fa-user", label: "Tester", value: tester?.full_name || tester?.email || "—" },
                                ].map(item => (
                                    <div key={item.label} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <i className={`fa-solid ${item.icon} text-green-700`}></i>
                                            <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 capitalize truncate">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            {selectedStatus === "fail" && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                                    <i className="fa-solid fa-bug text-amber-600"></i>
                                    <span className="text-sm font-medium text-amber-900">A bug will be auto-created in your issues table</span>
                                </div>
                            )}
                            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex gap-3">
                                <i className="fa-solid fa-triangle-exclamation text-yellow-600 flex-shrink-0 mt-0.5"></i>
                                <p className="text-xs text-yellow-800">This will save to your database and update the test case status. This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t flex gap-3 rounded-b-2xl">
                            <button onClick={() => !isSubmitting && setShowSubmitModal(false)} disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                                <i className="fa-solid fa-arrow-left"></i> Go Back
                            </button>
                            <button onClick={confirmSubmit} disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-paper-plane"></i> Submit Result</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page Header ── */}
            <header className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Test Execution</h2>

                                {/* ── VERSION SELECTOR ── */}
                                <div id="version-selector" className="relative">
                                    <button
                                        onClick={() => setShowVersionDropdown(p => !p)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${showVersionDropdown
                                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                                : "bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400"
                                            }`}
                                    >
                                        <i className="fa-solid fa-code-branch"></i>
                                        {versionsLoading ? (
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                                                Loading...
                                            </span>
                                        ) : version ? (
                                            <span>v{version.version_number} · Build {version.build_number}</span>
                                        ) : (
                                            <span>Select Version</span>
                                        )}
                                        {manualVersionOverride && (
                                            <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-bold">Manual</span>
                                        )}
                                        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${showVersionDropdown ? "rotate-180" : ""}`}></i>
                                    </button>

                                    {showVersionDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                                            style={{ animation: "fadeIn 0.15s ease" }}>
                                            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Select Version</p>
                                                    <p className="text-xs text-gray-500">{allVersions.length} version{allVersions.length !== 1 ? "s" : ""} available</p>
                                                </div>
                                                {manualVersionOverride && (
                                                    <button
                                                        onClick={() => { setManualVersionOverride(null); setShowVersionDropdown(false); }}
                                                        className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <i className="fa-solid fa-rotate-left text-xs"></i> Reset to Auto
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-80 overflow-y-auto">
                                                {versionsLoading ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : allVersions.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <i className="fa-solid fa-code-branch text-gray-300 text-2xl mb-2 block"></i>
                                                        <p className="text-sm text-gray-400">No versions found</p>
                                                    </div>
                                                ) : (
                                                    allVersions.map(v => {
                                                        const isSelected = version?.id === v.id;
                                                        const completionPct = v.completion_percentage || 0;
                                                        return (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => { setManualVersionOverride(v); setVersion(v); setShowVersionDropdown(false); }}
                                                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${isSelected ? "bg-blue-50" : ""}`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                            <span className="font-bold text-gray-900 text-sm">v{v.version_number}</span>
                                                                            <span className="text-xs text-gray-400">Build {v.build_number}</span>
                                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getVersionStatusBadge(v.status)}`}>
                                                                                {v.status}
                                                                            </span>
                                                                            {v.version_type && (
                                                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{v.version_type}</span>
                                                                            )}
                                                                        </div>
                                                                        {v.release_date && (
                                                                            <p className="text-xs text-gray-400 mb-2">
                                                                                <i className="fa-solid fa-calendar mr-1"></i>
                                                                                Release: {new Date(v.release_date).toLocaleDateString()}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full ${completionPct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                                                                    style={{ width: `${completionPct}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-400 whitespace-nowrap">{completionPct}%</span>
                                                                        </div>
                                                                        {(v.total_tests > 0) && (
                                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                                <span className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{v.total_tests}</span> total</span>
                                                                                <span className="text-xs text-green-600"><span className="font-semibold">{v.passed_tests || 0}</span> passed</span>
                                                                                <span className="text-xs text-red-500"><span className="font-semibold">{v.failed_tests || 0}</span> failed</span>
                                                                                <span className="text-xs text-gray-400"><span className="font-semibold">{v.pending_tests || 0}</span> pending</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                            <i className="fa-solid fa-check text-white" style={{ fontSize: 9 }}></i>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <i className="fa-solid fa-circle-info"></i>
                                                    {manualVersionOverride ? "Manual override active — click Reset to auto-detect" : "Auto-detecting version from test case"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(currentTest.status || "not-tested").bgLight} ${getStatusInfo(currentTest.status || "not-tested").color}`}>
                                    {currentTestIndex + 1}/{testCases.length}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                {module?.module_name || "—"} › {feature?.feature_name || currentTest.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button onClick={() => setShowTestList(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                                <i className="fa-solid fa-list"></i>
                                <span className="hidden sm:inline">Test List</span>
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <i className={`fa-solid fa-clock text-gray-500 ${!isPaused ? "animate-pulse" : ""}`}></i>
                                <span className="text-sm font-mono font-medium text-gray-900">{formatTime(seconds)}</span>
                            </div>
                            <button onClick={() => setIsPaused(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                                <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
                                <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
                            </button>
                            <button onClick={handleSaveProgress} className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
                                <i className="fa-solid fa-save"></i>
                                <span>Save Progress</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-6">

                    {/* Test List Drawer */}
                    {showTestList && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">All Test Cases</h3>
                                <button onClick={() => setShowTestList(false)} className="text-gray-400 hover:text-gray-700"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                            <div className="p-4 border-b border-gray-100 flex gap-3">
                                <input type="text" placeholder="Search test cases..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                                    <option value="all">All</option>
                                    <option value="not-tested">Not Tested</option>
                                    <option value="pass">Pass</option>
                                    <option value="fail">Fail</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                {filteredTests.map((t) => {
                                    const si = getStatusInfo(t.status || "not-tested");
                                    const realIndex = testCases.findIndex(tc => tc.id === t.id);
                                    return (
                                        <button key={t.id} onClick={() => { setCurrentTestIndex(realIndex); setShowTestList(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${realIndex === currentTestIndex ? "bg-green-50 border-l-2 border-green-600" : ""}`}>
                                            <i className={`fa-solid ${si.icon} ${si.color} text-sm flex-shrink-0`}></i>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                                                <p className="text-xs text-gray-400">{t.test_case_id}</p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${si.bgLight} ${si.color}`}>{t.status || "Not Tested"}</span>
                                        </button>
                                    );
                                })}
                                {filteredTests.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No test cases match your filter</p>}
                            </div>
                        </div>
                    )}

                    {/* Test Context Card */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Version Card */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Version &amp; Build</label>
                                    {version ? (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-code-branch text-blue-500 text-lg"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-bold text-gray-900 text-lg">v{version.version_number}</p>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded">Build {version.build_number}</span>
                                                    {manualVersionOverride && (
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded flex items-center gap-1">
                                                            <i className="fa-solid fa-hand-pointer" style={{ fontSize: 9 }}></i> Manual
                                                        </span>
                                                    )}
                                                    {!currentTest.version_id && !manualVersionOverride && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">Auto</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {version.release_date ? `Release: ${new Date(version.release_date).toLocaleDateString()}` : version.version_type}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${getVersionStatusBadge(version.status)}`}>{version.status}</span>
                                                    {version.completion_percentage > 0 && (
                                                        <span className="text-xs text-gray-400">{version.completion_percentage}% complete</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowVersionDropdown(p => !p)}
                                                className="flex-shrink-0 p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Change version"
                                                id="version-selector"
                                            >
                                                <i className="fa-solid fa-pen-to-square text-sm"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-code-branch text-gray-300"></i>
                                                <p className="text-sm text-gray-400">No version linked</p>
                                            </div>
                                            <button onClick={() => setShowVersionDropdown(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1" id="version-selector">
                                                <i className="fa-solid fa-plus"></i> Select
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Test Case info */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Test Case</label>
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg h-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-vial text-purple-500 text-sm"></i>
                                            </div>
                                            <p className="font-bold text-gray-900">{currentTest.test_case_id}</p>
                                            <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded capitalize ${currentTest.priority === "high" || currentTest.priority === "High" ? "bg-red-100 text-red-600" : currentTest.priority === "medium" || currentTest.priority === "Medium" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                                                {currentTest.priority || "—"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{currentTest.name}</p>
                                        {currentTest.test_type && <p className="text-xs text-gray-400 mt-1 capitalize">{currentTest.test_type}</p>}
                                        {currentTest.assigned_to && <p className="text-xs text-gray-400 mt-1"><i className="fa-solid fa-user mr-1"></i>Assigned: {currentTest.assigned_to}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Module & Feature */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Module</label>
                                    {module ? (
                                        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-puzzle-piece text-teal-500"></i>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{module.module_name}</p>
                                                    {!currentTest.module_id && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">via Feature</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">MOD-{module.module_code} · {module.status}</p>
                                                {module.module_owner && <p className="text-xs text-gray-400">Owner: {module.module_owner}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                                            <i className="fa-solid fa-puzzle-piece text-gray-300"></i>
                                            <p className="text-sm text-gray-400">No module linked</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Feature</label>
                                    {feature ? (
                                        <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <i className="fa-solid fa-list-check text-indigo-500"></i>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{feature.feature_name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{feature.feature_code} · {feature.total_test_cases || 0} Test Cases</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 text-right">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${feature.priority === "high" ? "bg-red-100 text-red-600" : feature.priority === "medium" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>{feature.priority}</span>
                                                {(feature.failed_tests || 0) > 0 && <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">{feature.failed_tests} Failed</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                                            <i className="fa-solid fa-list-check text-gray-300"></i>
                                            <p className="text-sm text-gray-400">No feature linked</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-gray-200">
                                {[
                                    { label: "Total", value: stats.total, color: "text-gray-900" },
                                    { label: "Passed", value: stats.passed, color: "text-green-600" },
                                    { label: "Failed", value: stats.failed, color: "text-red-600" },
                                    { label: "Blocked", value: stats.blocked, color: "text-amber-600" },
                                    { label: "Not Tested", value: stats.not_tested, color: "text-gray-400" },
                                ].map(s => (
                                    <div key={s.label} className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Test Case Details */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Test Case Details</h3>
                            {executionHistory.length > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <i className="fa-solid fa-history"></i>
                                    Last run: {new Date(executionHistory[0].executed_at).toLocaleDateString()} —
                                    <span className={`font-semibold ${getStatusInfo(executionHistory[0].execution_status).color}`}>{executionHistory[0].execution_status}</span>
                                </span>
                            )}
                        </div>
                        <div className="p-6 space-y-6">
                            {currentTest.description && (
                                <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Description</label><p className="text-sm text-gray-500 leading-relaxed">{currentTest.description}</p></div>
                            )}
                            {currentTest.preconditions && (
                                <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Preconditions</label><p className="text-sm text-gray-500 leading-relaxed p-3 bg-yellow-50 border border-yellow-200 rounded-lg">{currentTest.preconditions}</p></div>
                            )}
                            {currentTest.test_steps && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-3 block">Test Steps</label>
                                    <div className="space-y-3">
                                        {(Array.isArray(currentTest.test_steps) ? currentTest.test_steps : currentTest.test_steps.split('\n').filter(Boolean)).map((step, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">{i + 1}</div>
                                                <p className="text-sm text-gray-500 pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {currentTest.expected_result && (
                                <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Expected Result</label><p className="text-sm text-gray-500 leading-relaxed p-3 bg-green-50 border border-green-200 rounded-lg">{currentTest.expected_result}</p></div>
                            )}
                        </div>
                    </div>

                    {/* Test Execution Results */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Test Execution Results</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-900 mb-3 block">Test Status <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {statusOptions.map(s => (
                                        <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                                            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedStatus === s.key ? `${s.activeBorder} ${s.activeBg}` : "border-gray-200 hover:border-green-700"}`}>
                                            <i className={`fa-solid ${s.icon} ${s.color}`}></i>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Expected Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={expectedResult} onChange={e => setExpectedResult(e.target.value)} placeholder="What should happen..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Actual Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={actualResult} onChange={e => setActualResult(e.target.value)} placeholder="What actually happened..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                                </div>
                            </div>

                            {(selectedStatus === "fail" || selectedStatus === "blocked") && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-6">
                                    <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                                        <i className="fa-solid fa-bug"></i>
                                        {selectedStatus === "fail" ? "Failure Details" : "Blocker Details"}
                                    </h4>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">{selectedStatus === "fail" ? "Failure Notes" : "Blocker Description"} <span className="text-red-500">*</span></label>
                                        <textarea rows={4} value={failureNotes} onChange={e => setFailureNotes(e.target.value)} placeholder="Describe what went wrong..."
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Steps to Reproduce</label>
                                        <textarea rows={4} value={stepsToReproduce} onChange={e => setStepsToReproduce(e.target.value)} placeholder={"1. Go to...\n2. Click on...\n3. Observe..."}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none font-mono text-xs" />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 block">Issue Type {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                            <select value={issueType} onChange={e => setIssueType(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
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
                                            <label className="text-sm font-semibold text-gray-900 mb-2 block">Affected Component</label>
                                            <input type="text" value={affectedField} onChange={e => setAffectedField(e.target.value)} placeholder="e.g., Login button, Email field..."
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Screenshots / Attachments</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-green-600 transition-colors">
                                            <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-300 mb-3 block"></i>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload screenshots</p>
                                                <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                                            </label>
                                        </div>
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {uploadedFiles.map(file => (
                                                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                                                <i className="fa-solid fa-image text-blue-500"></i>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                                <p className="text-xs text-gray-400">{file.size}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600"><i className="fa-solid fa-external-link-alt"></i></a>}
                                                            <button onClick={() => setUploadedFiles(p => p.filter(f => f.id !== file.id))} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Linked Bug ID</label>
                                        <div className="flex gap-3">
                                            <input type="text" value={linkedBugId} onChange={e => setLinkedBugId(e.target.value)} placeholder="e.g. BUG-0001"
                                                onKeyDown={e => e.key === "Enter" && handleLinkBug()}
                                                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                                            <button onClick={handleLinkBug} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                                                <i className="fa-solid fa-link mr-2"></i>Link
                                            </button>
                                        </div>
                                        {linkedIssue && (
                                            <div className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <i className="fa-solid fa-bug text-amber-600"></i>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{linkedIssue.bug_id}</p>
                                                        <p className="text-xs text-gray-500">Status: {linkedIssue.status} · Priority: {linkedIssue.priority}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => { setLinkedIssue(null); setLinkedBugId(""); }} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-times"></i></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-semibold text-gray-900 mb-2 block">Additional Notes (Optional)</label>
                                <textarea rows={3} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any additional observations or context..."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Execution History */}
                    {executionHistory.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="p-6 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-900">Previous Executions</h3></div>
                            <div className="divide-y divide-gray-100">
                                {executionHistory.map(ex => {
                                    const si = getStatusInfo(ex.execution_status);
                                    return (
                                        <div key={ex.id} className="px-6 py-4 flex items-center gap-4">
                                            <i className={`fa-solid ${si.icon} ${si.color}`}></i>
                                            <div className="flex-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${si.bgLight} ${si.color}`}>{ex.execution_status?.toUpperCase()}</span>
                                                <span className="text-xs text-gray-400 ml-3">{ex.environment} · {ex.browser}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{formatTime(ex.execution_time || 0)}</span>
                                            <span className="text-xs text-gray-400">{new Date(ex.executed_at).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Execution Metadata */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-900">Execution Metadata</h3></div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Tester</label>
                                    <div className="flex items-center gap-3">
                                        {tester?.avatar_url ? (
                                            <img src={tester.avatar_url} alt="Tester" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                                                {tester?.full_name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{tester?.full_name || tester?.email || "Loading..."}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Execution Time</label>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-clock text-gray-400"></i>
                                        <span className="text-sm font-mono font-medium text-gray-900">{formatTime(seconds)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Environment</label>
                                    <select value={environment} onChange={e => setEnvironment(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                                        <option value="staging">Staging</option>
                                        <option value="production">Production</option>
                                        <option value="dev">Development</option>
                                        <option value="uat">UAT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Browser</label>
                                    <select value={browser} onChange={e => setBrowser(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
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

                    {/* Navigation + Submit */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={() => setCurrentTestIndex(i => Math.max(0, i - 1))} disabled={currentTestIndex === 0}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                <i className="fa-solid fa-arrow-left mr-2"></i>Previous
                            </button>
                            <span className="text-sm text-gray-500 whitespace-nowrap font-medium">{currentTestIndex + 1} / {testCases.length}</span>
                            <button onClick={() => setCurrentTestIndex(i => Math.min(testCases.length - 1, i + 1))} disabled={currentTestIndex === testCases.length - 1}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                Next<i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={handleSaveProgress} className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                <i className="fa-solid fa-floppy-disk mr-2"></i>Save as Draft
                            </button>
                            <button onClick={handleSubmitResult} className="flex-1 sm:flex-initial px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 flex items-center justify-center gap-2">
                                <i className="fa-solid fa-paper-plane"></i>
                                <span>Submit Result</span>
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}