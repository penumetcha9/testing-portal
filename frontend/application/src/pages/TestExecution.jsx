import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function TestExecution() {
    const [seconds, setSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showSavedNotification, setShowSavedNotification] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // DB data
    const [testCases, setTestCases] = useState([]);
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [currentTest, setCurrentTest] = useState(null);
    const [module, setModule] = useState(null);
    const [feature, setFeature] = useState(null);
    const [version, setVersion] = useState(null);
    const [tester, setTester] = useState(null);
    const [linkedIssue, setLinkedIssue] = useState(null);
    const [stats, setStats] = useState({
        total: 0, passed: 0, failed: 0, blocked: 0, retest: 0, not_tested: 0,
    });

    // Form state
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

    // ─── Timer ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [isPaused]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    // ─── Load tester profile ─────────────────────────────────────────────────
    useEffect(() => {
        async function loadTester() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("profiles")
                .select("full_name, avatar_url, email")
                .eq("id", user.id)
                .single();
            setTester({
                id: user.id,
                email: data?.email || user.email,
                full_name: data?.full_name || user.email,
                avatar_url: data?.avatar_url || null,
            });
        }
        loadTester();
    }, []);

    // ─── Load all test cases ─────────────────────────────────────────────────
    useEffect(() => {
        async function loadTestCases() {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("test_cases")
                    .select("*")
                    .order("created_at", { ascending: true });
                if (error) throw error;
                setTestCases(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadTestCases();
    }, []);

    // ─── Set current test + fetch related data ───────────────────────────────
    useEffect(() => {
        if (!testCases.length) return;
        const test = testCases[currentTestIndex];
        setCurrentTest(test);
        setExpectedResult(test.expected_result || "");
        setActualResult(test.actual_result || "");
        setSelectedStatus("not-tested");
        setFailureNotes("");
        setIssueType("");
        setAffectedField("");
        setAdditionalNotes("");
        setLinkedBugId("");
        setUploadedFiles([]);
        setLinkedIssue(null);
        setSeconds(0);
        setModule(null);
        setFeature(null);
        setVersion(null);

        async function fetchRelated() {
            // Module
            if (test.module_id) {
                const { data } = await supabase
                    .from("modules")
                    .select("*")
                    .eq("id", test.module_id)
                    .single();
                setModule(data || null);
            }

            // Feature
            if (test.feature_id) {
                const { data } = await supabase
                    .from("features")
                    .select("*")
                    .eq("id", test.feature_id)
                    .single();
                setFeature(data || null);
            }

            // Version
            if (test.version_id) {
                const { data } = await supabase
                    .from("versions")
                    .select("*")
                    .eq("id", test.version_id)
                    .single();
                setVersion(data || null);

                if (data) {
                    setStats({
                        total: data.total_tests || 0,
                        passed: data.passed_tests || 0,
                        failed: data.failed_tests || 0,
                        blocked: 0,
                        retest: 0,
                        not_tested: data.pending_tests || 0,
                    });
                }
            }

            // Linked issue
            const { data: issue } = await supabase
                .from("issues")
                .select("id, bug_id, status, priority, issue_type, affected_component")
                .eq("test_case_id", test.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (issue) {
                setLinkedIssue(issue);
                setLinkedBugId(issue.bug_id || "");
            }
        }

        fetchRelated();
    }, [currentTestIndex, testCases]);

    // ─── Status config ───────────────────────────────────────────────────────
    const statusOptions = [
        { key: "pass", label: "Pass", icon: "fa-check-circle", color: "text-green-500", activeBorder: "border-green-500", activeBg: "bg-green-50" },
        { key: "fail", label: "Fail", icon: "fa-times-circle", color: "text-red-500", activeBorder: "border-red-500", activeBg: "bg-red-50" },
        { key: "blocked", label: "Blocked", icon: "fa-ban", color: "text-amber-500", activeBorder: "border-amber-500", activeBg: "bg-amber-50" },
        { key: "retest", label: "Retest", icon: "fa-rotate", color: "text-blue-500", activeBorder: "border-blue-500", activeBg: "bg-blue-50" },
        { key: "not-tested", label: "Not Tested", icon: "fa-circle", color: "text-gray-400", activeBorder: "border-gray-400", activeBg: "bg-gray-50" },
    ];

    const getStatusInfo = (status) => {
        switch (status) {
            case "pass": return { icon: "fa-check-circle", color: "text-green-500", bg: "bg-green-500", bgLight: "bg-green-50", border: "border-green-200" };
            case "fail": return { icon: "fa-times-circle", color: "text-red-500", bg: "bg-red-500", bgLight: "bg-red-50", border: "border-red-200" };
            case "blocked": return { icon: "fa-ban", color: "text-amber-500", bg: "bg-amber-500", bgLight: "bg-amber-50", border: "border-amber-200" };
            case "retest": return { icon: "fa-rotate", color: "text-blue-500", bg: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-200" };
            default: return { icon: "fa-circle", color: "text-gray-400", bg: "bg-gray-400", bgLight: "bg-gray-50", border: "border-gray-200" };
        }
    };
    const statusInfo = getStatusInfo(selectedStatus);

    // ─── Actions ─────────────────────────────────────────────────────────────
    const handleSaveProgress = async () => {
        if (!currentTest || !tester) return;
        const { error } = await supabase.from("test_executions").insert({
            test_case_id: currentTest.id,
            version_id: currentTest.version_id || null,
            executed_by: tester.id,
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
            executed_at: new Date().toISOString(),
        });
        if (error) { alert("Error saving: " + error.message); return; }
        setShowSavedNotification(true);
        setTimeout(() => setShowSavedNotification(false), 3000);
    };

    const handleSubmitResult = () => {
        if (selectedStatus === "fail") {
            if (!expectedResult.trim() || !actualResult.trim() || !failureNotes.trim()) {
                alert("Please fill in Expected Result, Actual Result, and Failure Notes");
                return;
            }
        }
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Insert execution record
            const { data: execution, error: execError } = await supabase
                .from("test_executions")
                .insert({
                    test_case_id: currentTest.id,
                    version_id: currentTest.version_id || null,
                    executed_by: tester.id,
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
                    executed_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (execError) throw execError;

            // Auto-create issue if failed
            if (selectedStatus === "fail") {
                await supabase.from("issues").insert({
                    test_case_id: currentTest.id,
                    test_execution_id: execution.id,
                    version_id: currentTest.version_id || null,
                    module_id: currentTest.module_id || null,
                    feature_id: currentTest.feature_id || null,
                    issue_type: issueType || null,
                    priority: currentTest.priority || "medium",
                    status: "open",
                    failure_comment: failureNotes,
                    expected_behavior: expectedResult,
                    actual_behavior: actualResult,
                    affected_component: affectedField,
                    environment,
                    browser,
                    reported_by: tester.id,
                    reported_date: new Date().toISOString(),
                });
            }

            // Update test case status
            await supabase
                .from("test_cases")
                .update({ status: selectedStatus, actual_result: actualResult })
                .eq("id", currentTest.id);

            setShowSubmitModal(false);
            alert(`✓ Submitted! Status: ${selectedStatus.toUpperCase()}`);

            // Auto-advance to next test
            if (currentTestIndex < testCases.length - 1) {
                setCurrentTestIndex((i) => i + 1);
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e) => {
        Array.from(e.target.files || []).forEach((file) => {
            setUploadedFiles((prev) => [...prev, {
                id: Math.random(),
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(1) + " MB",
            }]);
        });
    };

    // ─── Loading / error / empty states ─────────────────────────────────────
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading test cases...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <i className="fa-solid fa-circle-exclamation text-red-400 text-4xl mb-4 block"></i>
                    <p className="text-red-500 font-medium mb-2">Failed to load test cases</p>
                    <p className="text-sm text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!currentTest) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <i className="fa-solid fa-vial text-gray-300 text-4xl mb-4 block"></i>
                    <p className="text-gray-500 font-medium">No test cases found</p>
                    <p className="text-sm text-gray-400 mt-1">Add test cases to your database to get started</p>
                </div>
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">

            {/* Save notification */}
            {showSavedNotification && (
                <div className="fixed top-6 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <i className="fa-solid fa-check-circle"></i>
                    <span>Progress saved successfully!</span>
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitModal && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => !isSubmitting && setShowSubmitModal(false)}
                >
                    <div
                        className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
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
                            <button
                                onClick={() => !isSubmitting && setShowSubmitModal(false)}
                                className="text-gray-400 hover:text-gray-700 p-2 rounded-lg"
                                disabled={isSubmitting}
                            >
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
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
                                    { icon: "fa-server", label: "Environment", value: environment },
                                    { icon: "fa-globe", label: "Browser", value: browser },
                                    { icon: "fa-clock", label: "Time", value: formatTime(seconds) },
                                ].map((item) => (
                                    <div key={item.label} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <i className={`fa-solid ${item.icon} text-green-700`}></i>
                                            <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 capitalize">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedStatus === "fail" && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                                    <i className="fa-solid fa-bug text-amber-600"></i>
                                    <span className="text-sm font-medium text-amber-900">
                                        A bug will be auto-created in your issues table
                                    </span>
                                </div>
                            )}

                            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex gap-3">
                                <i className="fa-solid fa-triangle-exclamation text-yellow-600 flex-shrink-0 mt-0.5"></i>
                                <p className="text-xs text-yellow-800">
                                    This will save to your database and update the test case status. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 bg-gray-50 border-t flex gap-3 rounded-b-2xl">
                            <button
                                onClick={() => !isSubmitting && setShowSubmitModal(false)}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                <i className="fa-solid fa-arrow-left"></i> Go Back
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                                    : <><i className="fa-solid fa-paper-plane"></i> Submit Result</>}
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
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Test Execution</h2>
                                {version && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                                        v{version.version_number} · Build {version.build_number}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                {module?.module_name || "—"} › {feature?.feature_name || currentTest.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <i className="fa-solid fa-clock text-gray-500"></i>
                                <span className={`text-sm font-medium text-gray-900 ${!isPaused ? "animate-pulse" : ""}`}>
                                    {formatTime(seconds)}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsPaused((p) => !p)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <i className={`fa-solid ${isPaused ? "fa-play" : "fa-pause"}`}></i>
                                <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
                            </button>
                            <button
                                onClick={handleSaveProgress}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
                            >
                                <i className="fa-solid fa-save"></i>
                                <span>Save Progress</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-6">

                    {/* ── Test Context Card ── */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Version */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Version &amp; Build</label>
                                    {version ? (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-code-branch text-blue-500 text-lg"></i>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900 text-lg">v{version.version_number}</p>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                                                        Build {version.build_number}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {version.created_date
                                                        ? `Created: ${new Date(version.created_date).toLocaleDateString()}`
                                                        : version.version_type}
                                                </p>
                                                <span className="mt-1 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded capitalize">
                                                    {version.status}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-400">No version linked to this test case</p>
                                        </div>
                                    )}
                                </div>

                                {/* Test Case */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Test Case</label>
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg h-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-vial text-purple-500 text-sm"></i>
                                            </div>
                                            <p className="font-bold text-gray-900">{currentTest.test_case_id}</p>
                                            <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded capitalize ${currentTest.priority === "high" ? "bg-red-100 text-red-600" :
                                                    currentTest.priority === "medium" ? "bg-amber-100 text-amber-600" :
                                                        "bg-gray-100 text-gray-600"
                                                }`}>
                                                {currentTest.priority || "—"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{currentTest.name}</p>
                                        {currentTest.test_type && (
                                            <p className="text-xs text-gray-400 mt-1 capitalize">{currentTest.test_type}</p>
                                        )}
                                        {currentTest.assign_to && (
                                            <p className="text-xs text-gray-400 mt-1">Assigned: {currentTest.assign_to}</p>
                                        )}
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
                                                <p className="font-semibold text-gray-900">{module.module_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    MOD-{module.module_code} · {module.status}
                                                </p>
                                                {module.module_owner && (
                                                    <p className="text-xs text-gray-400">Owner: {module.module_owner}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {feature.feature_code} · {feature.total_test_cases || 0} Test Cases
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 text-right">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${feature.priority === "high" ? "bg-red-100 text-red-600" :
                                                        feature.priority === "medium" ? "bg-amber-100 text-amber-600" :
                                                            "bg-gray-100 text-gray-600"
                                                    }`}>{feature.priority}</span>
                                                {(feature.failed_tests || 0) > 0 && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                                                        {feature.failed_tests} Failed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-400">No feature linked</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-6 border-t border-gray-200">
                                {[
                                    { label: "Total", value: stats.total, color: "text-gray-900" },
                                    { label: "Passed", value: stats.passed, color: "text-green-600" },
                                    { label: "Failed", value: stats.failed, color: "text-red-600" },
                                    { label: "Blocked", value: stats.blocked, color: "text-amber-600" },
                                    { label: "Retest", value: stats.retest, color: "text-blue-600" },
                                    { label: "Not Tested", value: stats.not_tested, color: "text-gray-400" },
                                ].map((s) => (
                                    <div key={s.label} className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Test Case Details ── */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Test Case Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {currentTest.description && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Description</label>
                                    <p className="text-sm text-gray-500 leading-relaxed">{currentTest.description}</p>
                                </div>
                            )}
                            {currentTest.preconditions && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Preconditions</label>
                                    <p className="text-sm text-gray-500 leading-relaxed">{currentTest.preconditions}</p>
                                </div>
                            )}
                            {currentTest.test_steps?.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-3 block">Test Steps</label>
                                    <div className="space-y-3">
                                        {currentTest.test_steps.map((step, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-gray-500 pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {currentTest.expected_result && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Expected Result</label>
                                    <p className="text-sm text-gray-500 leading-relaxed p-3 bg-green-50 border border-green-200 rounded-lg">
                                        {currentTest.expected_result}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Test Execution Results ── */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Test Execution Results</h3>
                        </div>
                        <div className="p-6 space-y-6">

                            {/* Status selector */}
                            <div>
                                <label className="text-sm font-semibold text-gray-900 mb-3 block">
                                    Test Status <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {statusOptions.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => setSelectedStatus(s.key)}
                                            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                                ${selectedStatus === s.key
                                                    ? `${s.activeBorder} ${s.activeBg}`
                                                    : "border-gray-200 hover:border-green-700"}`}
                                        >
                                            <i className={`fa-solid ${s.icon} ${s.color}`}></i>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Failure details */}
                            {selectedStatus === "fail" && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-6">
                                    {[
                                        { label: "Expected Result", value: expectedResult, setter: setExpectedResult, rows: 3 },
                                        { label: "Actual Result", value: actualResult, setter: setActualResult, rows: 3 },
                                        { label: "Failure Comment / Tester Notes", value: failureNotes, setter: setFailureNotes, rows: 4 },
                                    ].map(({ label, value, setter, rows }) => (
                                        <div key={label}>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 block">
                                                {label} <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={rows}
                                                value={value}
                                                onChange={(e) => setter(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                                            />
                                        </div>
                                    ))}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 block">
                                                Issue Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={issueType}
                                                onChange={(e) => setIssueType(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                            >
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
                                            <label className="text-sm font-semibold text-gray-900 mb-2 block">
                                                Affected Component <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={affectedField}
                                                onChange={(e) => setAffectedField(e.target.value)}
                                                placeholder="e.g., Login button, Email field..."
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                            />
                                        </div>
                                    </div>

                                    {/* File upload */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Screenshots / Attachments</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-green-600 transition-colors">
                                            <input
                                                type="file" id="file-upload" className="hidden"
                                                accept="image/*,.pdf" multiple onChange={handleFileUpload}
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-300 mb-3 block"></i>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload</p>
                                                <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                                            </label>
                                        </div>
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {uploadedFiles.map((file) => (
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
                                                        <button
                                                            onClick={() => setUploadedFiles((p) => p.filter((f) => f.id !== file.id))}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Linked bug */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Linked Bug ID</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={linkedBugId}
                                                onChange={(e) => setLinkedBugId(e.target.value)}
                                                placeholder="e.g. BUG-1234"
                                                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                            />
                                            <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                                <i className="fa-solid fa-link mr-2"></i>Link
                                            </button>
                                        </div>
                                        {linkedIssue && (
                                            <div className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <i className="fa-solid fa-bug text-amber-600"></i>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{linkedIssue.bug_id}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Status: {linkedIssue.status} · Priority: {linkedIssue.priority}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setLinkedIssue(null)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <i className="fa-solid fa-times"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Additional notes */}
                            <div>
                                <label className="text-sm font-semibold text-gray-900 mb-2 block">Additional Notes (Optional)</label>
                                <textarea
                                    rows="3"
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Any additional observations or context..."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Execution Metadata ── */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Execution Metadata</h3>
                        </div>
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
                                        <span className="text-sm font-medium text-gray-900">
                                            {tester?.full_name || tester?.email || "Loading..."}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Execution Time</label>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-clock text-gray-400"></i>
                                        <span className="text-sm font-medium text-gray-900">{formatTime(seconds)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Environment</label>
                                    <select
                                        value={environment}
                                        onChange={(e) => setEnvironment(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                    >
                                        <option value="staging">Staging</option>
                                        <option value="production">Production</option>
                                        <option value="dev">Development</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Browser</label>
                                    <select
                                        value={browser}
                                        onChange={(e) => setBrowser(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                    >
                                        <option value="chrome">Chrome</option>
                                        <option value="firefox">Firefox</option>
                                        <option value="safari">Safari</option>
                                        <option value="edge">Edge</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Navigation + Submit ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setCurrentTestIndex((i) => Math.max(0, i - 1))}
                                disabled={currentTestIndex === 0}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-arrow-left mr-2"></i>Previous
                            </button>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                {currentTestIndex + 1} / {testCases.length}
                            </span>
                            <button
                                onClick={() => setCurrentTestIndex((i) => Math.min(testCases.length - 1, i + 1))}
                                disabled={currentTestIndex === testCases.length - 1}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next<i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleSaveProgress}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Save as Draft
                            </button>
                            <button
                                onClick={handleSubmitResult}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-all flex items-center justify-center gap-2"
                            >
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