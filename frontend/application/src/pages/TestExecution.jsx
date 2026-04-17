import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";

// Force all Supabase REST fetches to bypass the browser HTTP cache.
if (typeof window !== "undefined") {
    const _origFetch = window.fetch;
    window.fetch = (input, init = {}) => {
        const url = typeof input === "string" ? input
            : input instanceof Request ? input.url
                : input?.url ?? "";
        if (url.includes("/rest/v1/")) {
            init = { ...init, cache: "no-store" };
        }
        return _origFetch(input, init);
    };
}

// ── Session-persisted pending updates ────────────────────────────────────────
// Keeps pass/fail colors alive across page switches for the entire browser session.
const STORAGE_KEY = "te_pending_updates";
function loadPendingUpdates() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function savePendingUpdates(map) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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
    active: "bg-emerald-100 text-emerald-700", testing: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-600", archived: "bg-slate-100 text-slate-400",
    planning: "bg-purple-100 text-purple-700",
};
const getVB = (s) => VERSION_BADGE[s] || "bg-slate-100 text-slate-500";

const isUntested = (status) =>
    !status ||
    status === "not-tested" ||
    status === "not_run" ||
    status === "Pending" ||
    status === "pending" ||
    status === "Not Tested" ||
    status === "not_tested";

const normaliseStatus = (s) => {
    if (!s) return "not-tested";
    const l = s.toLowerCase();
    if (l === "pass" || l === "passed") return "pass";
    if (l === "fail" || l === "failed") return "fail";
    if (l === "blocked") return "blocked";
    return "not-tested";
};

// ── Small dropdown for filters ────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, icon, accent = "slate" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const selected = options.find(o => o.value === value);
    const active = value !== "";
    const colors = {
        slate: { btn: active ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500", opt: "text-slate-700", check: "text-slate-600", sel: "bg-slate-50" },
        teal: { btn: active ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-slate-200 text-slate-500", opt: "text-teal-700", check: "text-teal-500", sel: "bg-teal-50" },
        indigo: { btn: active ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-500", opt: "text-indigo-700", check: "text-indigo-500", sel: "bg-indigo-50" },
        blue: { btn: active ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-500", opt: "text-blue-700", check: "text-blue-500", sel: "bg-blue-50" },
    };
    const c = colors[accent] || colors.slate;
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(p => !p)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all w-full ${c.btn}`}>
                <i className={`fa-solid ${icon} text-xs flex-shrink-0`} />
                <span className="truncate flex-1 text-left">{selected?.label || placeholder}</span>
                {active
                    ? <span onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
                        className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-300 hover:bg-red-300 text-slate-600 hover:text-red-700 flex items-center justify-center transition-colors" style={{ fontSize: 9 }}>✕</span>
                    : <i className={`fa-solid fa-chevron-down text-xs flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto py-1">
                        {options.map(opt => (
                            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:${c.sel} ${opt.value === value ? c.sel : ""}`}>
                                {opt.value === value
                                    ? <i className={`fa-solid fa-check ${c.check} text-xs flex-shrink-0`} />
                                    : <span className="w-4 flex-shrink-0" />}
                                <span className={`${opt.value === value ? `font-semibold ${c.opt}` : "text-slate-600"}`}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ show, message }) {
    if (!show) return null;
    return (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl animate-bounce">
            <i className="fa-solid fa-check-circle" />{message}
        </div>
    );
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ show, onClose, onConfirm, submitting, currentTest, selectedStatus, version, environment, browser, seconds, tester }) {
    if (!show) return null;
    const sm = getSM(selectedStatus);
    return (
        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center" onClick={() => !submitting && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
                <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                    <div className={`p-3.5 rounded-xl border-2 flex items-center justify-between ${sm.bgLight} ${sm.border}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Test Status</span>
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold text-white ${sm.bg} flex items-center gap-1.5`}>
                            <i className={`fa-solid ${sm.icon}`} />{selectedStatus.toUpperCase()}
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
                        ].map(item => (
                            <div key={item.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between" style={{ minHeight: 68 }}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <i className={`fa-solid ${item.icon} text-emerald-600`} style={{ fontSize: 10 }} />
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

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 1 — TEST CASE LIST
// ═════════════════════════════════════════════════════════════════════════════
function TestCaseListView({ onSelect, pendingUpdates }) {
    const [testCases, setTestCases] = useState([]);
    const [allVersions, setAllVersions] = useState([]);
    const [allModules, setAllModules] = useState([]);
    const [allFeatures, setAllFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metaReady, setMetaReady] = useState(false);

    const mapsRef = useRef({ mod: {}, feat: {}, ver: {} });

    const [filterVersion, setFilterVersion] = useState("");
    const [filterModule, setFilterModule] = useState("");
    const [filterFeature, setFilterFeature] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [vRes, mRes, fRes] = await Promise.all([
                    supabase.from("versions").select("id,version_number,build_number,status").order("created_at", { ascending: false }),
                    supabase.from("modules").select("id,module_name").order("module_name", { ascending: true }),
                    supabase.from("features").select("id,feature_name,module_id").order("feature_name", { ascending: true }),
                ]);
                const versions = vRes.data || [];
                const modules = mRes.data || [];
                const features = fRes.data || [];
                setAllVersions(versions);
                setAllModules(modules);
                setAllFeatures(features);
                mapsRef.current = {
                    mod: Object.fromEntries(modules.map(m => [m.id, m.module_name])),
                    feat: Object.fromEntries(features.map(f => [f.id, f.feature_name])),
                    ver: Object.fromEntries(versions.map(v => [v.id, v.version_number])),
                };
                setMetaReady(true);
            } catch (e) { setError(e.message); setLoading(false); }
        })();
    }, []);

    useEffect(() => {
        if (!metaReady) return;
        let cancelled = false;
        (async () => {
            setLoading(true); setError(null);
            try {
                let q = supabase.from("test_cases").select("*").order("created_at", { ascending: true });

                if (filterFeature) {
                    q = q.eq("feature_id", filterFeature);
                } else if (filterModule) {
                    const { data: featRows } = await supabase
                        .from("features").select("id").eq("module_id", filterModule);
                    const ids = (featRows || []).map(f => f.id);
                    if (ids.length === 0) {
                        if (!cancelled) { setTestCases([]); setLoading(false); }
                        return;
                    }
                    q = q.in("feature_id", ids);
                } else if (filterVersion) {
                    const [vmRes, tcDirectRes, featVerRes] = await Promise.all([
                        supabase.from("version_modules").select("module_id").eq("version_id", filterVersion),
                        supabase.from("test_cases").select("id", { count: "exact", head: true }).eq("version_id", filterVersion),
                        supabase.from("features").select("id").eq("version_id", filterVersion),
                    ]);

                    const moduleIds = (vmRes.data || []).map(r => r.module_id);
                    let featureIds = [];

                    if (moduleIds.length > 0) {
                        const { data: featFromMod } = await supabase
                            .from("features").select("id").in("module_id", moduleIds);
                        featureIds = [...featureIds, ...(featFromMod || []).map(f => f.id)];
                    }

                    featureIds = [...featureIds, ...(featVerRes.data || []).map(f => f.id)];
                    featureIds = [...new Set(featureIds)];

                    if (featureIds.length > 0) {
                        q = q.in("feature_id", featureIds);
                    } else if ((tcDirectRes.count || 0) > 0) {
                        q = q.eq("version_id", filterVersion);
                    } else {
                        if (!cancelled) { setTestCases([]); setLoading(false); }
                        return;
                    }
                }

                if (filterStatus === "untested") {
                    q = q.or(
                        "status.is.null,status.eq.not-tested,status.eq.not_run,status.eq.not_tested,status.eq.Pending,status.eq.pending,status.eq.Not Tested"
                    );
                } else if (filterStatus) {
                    q = q.eq("status", filterStatus);
                }

                const { data, error: err } = await q;
                if (!cancelled) {
                    // Load latest pendingUpdates from sessionStorage at mapping time
                    // so even a full re-fetch gets the correct overrides applied.
                    const latestPending = loadPendingUpdates();
                    const { mod, feat, ver } = mapsRef.current;
                    setTestCases((data || []).map(t => {
                        const featureRow = allFeatures.find(f => f.id === t.feature_id);
                        const resolvedModuleId = t.module_id || featureRow?.module_id || null;
                        const overrideStatus = latestPending[t.id] || pendingUpdates[t.id];
                        return {
                            ...t,
                            status: overrideStatus || t.status,
                            _moduleName: mod[resolvedModuleId] || null,
                            _featureName: feat[t.feature_id] || null,
                            _versionNumber: ver[t.version_id] || null,
                        };
                    }));
                }
            } catch (e) { if (!cancelled) setError(e.message); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [metaReady, filterVersion, filterModule, filterFeature, filterStatus, allFeatures]);

    // Patch test cases in-place when pendingUpdates changes (instant visual feedback
    // after returning from ExecuteView, no re-fetch needed).
    useEffect(() => {
        const allPending = { ...loadPendingUpdates(), ...pendingUpdates };
        if (Object.keys(allPending).length === 0) return;
        setTestCases(prev => prev.map(t => {
            const overrideStatus = allPending[t.id];
            if (overrideStatus && t.status !== overrideStatus) {
                return { ...t, status: overrideStatus };
            }
            return t;
        }));
    }, [pendingUpdates]);

    const handleModuleChange = (v) => { setFilterModule(v); setFilterFeature(""); };

    const featureOpts = [
        { value: "", label: "All Features" },
        ...allFeatures
            .filter(f => !filterModule || f.module_id === filterModule)
            .map(f => ({ value: f.id, label: f.feature_name })),
    ];

    const visible = testCases.filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.name?.toLowerCase().includes(q) || t.test_case_id?.toLowerCase().includes(q);
    });

    const passCount = visible.filter(t => normaliseStatus(t.status) === "pass").length;
    const failCount = visible.filter(t => normaliseStatus(t.status) === "fail").length;
    const blockedCount = visible.filter(t => normaliseStatus(t.status) === "blocked").length;
    const statusStats = { pass: passCount, fail: failCount, blocked: blockedCount, untested: visible.length - passCount - failCount - blockedCount };

    const anyFilter = filterVersion || filterModule || filterFeature || filterStatus || search;
    const clearAll = () => { setFilterVersion(""); setFilterModule(""); setFilterFeature(""); setFilterStatus(""); setSearch(""); };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Test Execution</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Select a test case to begin execution</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold">{visible.length} test cases</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-5">

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="fa-solid fa-filter text-emerald-600 text-xs" /> Filters
                        </h3>
                        {anyFilter && (
                            <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                                <i className="fa-solid fa-xmark text-xs" /> Clear all
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <FilterSelect
                            value={filterVersion}
                            onChange={setFilterVersion}
                            options={[{ value: "", label: "All Versions" }, ...allVersions.map(v => ({ value: v.id, label: `v${v.version_number} · ${v.build_number}` }))]}
                            placeholder="All Versions"
                            icon="fa-code-branch"
                            accent="blue"
                        />
                        <FilterSelect
                            value={filterModule}
                            onChange={handleModuleChange}
                            options={[{ value: "", label: "All Modules" }, ...allModules.map(m => ({ value: m.id, label: m.module_name }))]}
                            placeholder="All Modules"
                            icon="fa-puzzle-piece"
                            accent="teal"
                        />
                        <FilterSelect
                            value={filterFeature}
                            onChange={setFilterFeature}
                            options={featureOpts}
                            placeholder="All Features"
                            icon="fa-list-check"
                            accent="indigo"
                        />
                        <FilterSelect
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={[
                                { value: "", label: "All Statuses" },
                                { value: "untested", label: "Not Tested" },
                                { value: "pass", label: "Pass" },
                                { value: "fail", label: "Fail" },
                                { value: "blocked", label: "Blocked" },
                            ]}
                            placeholder="All Statuses"
                            icon="fa-circle-dot"
                            accent="slate"
                        />
                    </div>
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by test case name or ID…"
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-xmark text-xs" />
                            </button>
                        )}
                    </div>
                </div>

                {!loading && visible.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: "Total", value: visible.length, color: "text-slate-700", bg: "bg-white", icon: "fa-list-check" },
                            { label: "Not Tested", value: statusStats.untested, color: "text-slate-500", bg: "bg-white", icon: "fa-circle" },
                            { label: "Pass", value: statusStats.pass, color: "text-emerald-600", bg: "bg-emerald-50", icon: "fa-check-circle" },
                            { label: "Fail", value: statusStats.fail, color: "text-red-600", bg: "bg-red-50", icon: "fa-times-circle" },
                            { label: "Blocked", value: statusStats.blocked, color: "text-amber-600", bg: "bg-amber-50", icon: "fa-ban" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} border border-slate-200 rounded-xl p-4 flex items-center gap-3`}>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
                                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                </div>
                                <i className={`fa-solid ${s.icon} ${s.color} text-xl opacity-40`} />
                            </div>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">Loading test cases…</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                        <i className="fa-solid fa-circle-exclamation text-red-400 text-2xl mb-2 block" />
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                        <i className="fa-solid fa-vial text-slate-300 text-4xl mb-3 block" />
                        <p className="text-slate-500 font-medium mb-1">No test cases found</p>
                        <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        {anyFilter && <button onClick={clearAll} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Clear all filters</button>}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                                {visible.length === testCases.length ? `${visible.length} test cases` : `${visible.length} of ${testCases.length} test cases`}
                            </p>
                            <p className="text-xs text-slate-400">Click a row to start executing</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {visible.map(t => {
                                const normStatus = normaliseStatus(t.status);
                                const sm = getSM(normStatus);
                                const rowBg =
                                    normStatus === "pass" ? "hover:bg-emerald-50 hover:border-l-4 hover:border-emerald-500" :
                                        normStatus === "fail" ? "hover:bg-red-50 hover:border-l-4 hover:border-red-400" :
                                            normStatus === "blocked" ? "hover:bg-amber-50 hover:border-l-4 hover:border-amber-400" :
                                                "hover:bg-slate-50 hover:border-l-4 hover:border-slate-300";

                                const leftBorder =
                                    normStatus === "pass" ? "border-l-4 border-emerald-500 bg-emerald-50/40" :
                                        normStatus === "fail" ? "border-l-4 border-red-400 bg-red-50/40" :
                                            normStatus === "blocked" ? "border-l-4 border-amber-400 bg-amber-50/40" :
                                                "border-l-4 border-transparent";

                                return (
                                    <button key={t.id} onClick={() => onSelect(t, visible)}
                                        className={`w-full text-left px-5 py-4 ${leftBorder} ${rowBg} transition-all group`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sm.bgLight}`}>
                                                <i className={`fa-solid ${sm.icon} ${sm.color} text-sm`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className="font-mono text-xs font-bold text-slate-400">{t.test_case_id}</span>
                                                    {t.priority && (
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${t.priority?.toLowerCase() === "high" ? "bg-red-100 text-red-600" :
                                                            t.priority?.toLowerCase() === "medium" ? "bg-amber-100 text-amber-600" :
                                                                "bg-slate-100 text-slate-500"
                                                            }`}>{t.priority}</span>
                                                    )}
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sm.bgLight} ${sm.color}`}>{sm.label}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-slate-900">{t.name}</p>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {t._versionNumber && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                                                            <i className="fa-solid fa-code-branch text-[9px]" />v{t._versionNumber}
                                                        </span>
                                                    )}
                                                    {t._moduleName && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-[10px] font-medium">
                                                            <i className="fa-solid fa-puzzle-piece text-[9px]" />{t._moduleName}
                                                        </span>
                                                    )}
                                                    {t._featureName && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium">
                                                            <i className="fa-solid fa-list-check text-[9px]" />{t._featureName}
                                                        </span>
                                                    )}
                                                    {t.test_type && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium capitalize">
                                                            {t.test_type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                                <i className={`fa-solid fa-arrow-right ${sm.color} text-xs transition-colors`} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Multi-select dropdown for team assignment ──────────────────────────────────
function MultiAssign({ label, icon, values, onChange, color = "emerald", profiles = [] }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const ref = useRef(null);
    const btnRef = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        if (open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [open]);

    const filtered = profiles.filter(p =>
        (p.full_name || p.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const COLORS = {
        emerald: { pill: "bg-emerald-100 text-emerald-700", sel: "bg-emerald-50", check: "text-emerald-500" },
        blue: { pill: "bg-blue-100 text-blue-700", sel: "bg-blue-50", check: "text-blue-500" },
    };
    const c = COLORS[color] || COLORS.emerald;

    return (
        <div ref={ref} className="relative">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <i className={`fa-solid ${icon} text-[9px]`} />{label}
            </label>
            {values.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                    {values.map(id => {
                        const p = profiles.find(x => x.id === id);
                        const name = p?.full_name || p?.email || id;
                        return (
                            <span key={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.pill}`}>
                                {name.split(" ")[0]}
                                <button type="button" onClick={() => onChange(values.filter(v => v !== id))} className="hover:opacity-70 leading-none ml-0.5">×</button>
                            </span>
                        );
                    })}
                </div>
            )}
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(p => !p)}
                className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-xs transition-all ${open ? "border-emerald-400 ring-2 ring-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
            >
                <span className="text-slate-500">{values.length > 0 ? `${values.length} assigned` : "Select people…"}</span>
                <i className={`fa-solid fa-chevron-down text-slate-400 text-[9px] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 9999,
                    }}
                    className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                >
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            autoFocus
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                    </div>
                    <div className="max-h-44 overflow-y-auto py-1">
                        {filtered.length === 0
                            ? <p className="text-center text-xs text-slate-400 py-3">No profiles found</p>
                            : filtered.map(p => {
                                const isSel = values.includes(p.id);
                                const name = p.full_name || p.email || "?";
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => onChange(isSel ? values.filter(v => v !== p.id) : [...values, p.id])}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${isSel ? c.sel : ""}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px] ${isSel ? "bg-emerald-500" : "bg-slate-300"}`}>
                                            {name[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={`font-medium truncate ${isSel ? "text-slate-900" : "text-slate-600"}`}>{name}</p>
                                            {p.role && <p className="text-slate-400 text-[10px] capitalize">{p.role}</p>}
                                        </div>
                                        {isSel && <i className={`fa-solid fa-check ${c.check} text-[10px] flex-shrink-0`} />}
                                    </button>
                                );
                            })}
                    </div>
                    {values.length > 0 && (
                        <div className="p-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="w-full py-1.5 text-[10px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 2 — EXECUTE A TEST CASE
// ═════════════════════════════════════════════════════════════════════════════
function ExecuteView({ testCase, onBack, onNext, currentIdx, total }) {
    const [module, setModule] = useState(null);
    const [feature, setFeature] = useState(null);
    const [version, setVersion] = useState(null);
    const [tester, setTester] = useState(null);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [assignedTesters, setAssignedTesters] = useState(
        testCase.assigned_to ? [testCase.assigned_to] : []
    );
    const [assignedDevs, setAssignedDevs] = useState([]);
    const [savingAssign, setSavingAssign] = useState(false);

    const [allVersions, setAllVersions] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [manualVersion, setManualVersion] = useState(null);

    const [selectedStatus, setSelectedStatus] = useState("not-tested");
    const [expectedResult, setExpectedResult] = useState(testCase.expected_result || "");
    const [actualResult, setActualResult] = useState(testCase.actual_result || "");
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

    const [seconds, setSeconds] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showNotif = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3500); };

    useEffect(() => {
        const h = (e) => { if (!e.target.closest("#ver-sel")) setShowVersionDropdown(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const authUserIdRef = useRef(null);

    useEffect(() => {
        (async () => {
            setVersionsLoading(true);
            try {
                const { data } = await supabase.from("versions").select("id,version_number,build_number,status,version_type,release_date,created_at,total_tests,passed_tests,failed_tests,pending_tests,completion_percentage").order("created_at", { ascending: false });
                setAllVersions(data || []);
            } catch (e) { console.warn(e); } finally { setVersionsLoading(false); }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                authUserIdRef.current = user.id;
                let { data: profile } = await supabase.from("profiles").select("id,full_name,avatar_url,email").eq("id", user.id).single();
                if (!profile) {
                    const { data: created } = await supabase.from("profiles")
                        .upsert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.email }, { onConflict: "id" })
                        .select("id,full_name,avatar_url,email").single();
                    profile = created;
                }
                setTester({ id: user.id, email: profile?.email || user.email, full_name: profile?.full_name || user.email, avatar_url: profile?.avatar_url || null });
            } catch (e) { console.warn(e); }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.from("profiles").select("id,full_name,email,role").order("full_name", { ascending: true });
                setAllProfiles(data || []);
            } catch (e) { console.warn(e); }
        })();
    }, []);

    useEffect(() => {
        const normalised = isUntested(testCase.status) ? "not-tested" : (testCase.status || "not-tested");
        setSelectedStatus(normalised);
        setExpectedResult(testCase.expected_result || "");
        setActualResult(testCase.actual_result || "");
        setFailureNotes(""); setIssueType(""); setAffectedField("");
        setStepsToReproduce(""); setAdditionalNotes("");
        setLinkedBugId(""); setLinkedIssue(null); setUploadedFiles([]);
        setExecutionHistory([]);
        setAssignedTesters(testCase.assigned_to ? [testCase.assigned_to] : []);
        setAssignedDevs([]);
        setModule(null); setFeature(null);
        if (!manualVersion) setVersion(null);
    }, [testCase.id]);

    useEffect(() => {
        (async () => {
            let resolvedFeature = null, resolvedModule = null, resolvedVersion = manualVersion || null;

            if (testCase.feature_id) { try { const { data } = await supabase.from("features").select("*").eq("id", testCase.feature_id).single(); if (data) resolvedFeature = data; } catch { } }
            setFeature(resolvedFeature);
            if (testCase.module_id) { try { const { data } = await supabase.from("modules").select("*").eq("id", testCase.module_id).single(); if (data) resolvedModule = data; } catch { } }
            if (!resolvedModule && resolvedFeature?.module_id) { try { const { data } = await supabase.from("modules").select("*").eq("id", resolvedFeature.module_id).single(); if (data) resolvedModule = data; } catch { } }
            setModule(resolvedModule);
            if (!manualVersion) {
                if (testCase.version_id) { try { const { data } = await supabase.from("versions").select("*").eq("id", testCase.version_id).single(); if (data) resolvedVersion = data; } catch { } }
                if (!resolvedVersion && resolvedFeature?.version_id) { try { const { data } = await supabase.from("versions").select("*").eq("id", resolvedFeature.version_id).single(); if (data) resolvedVersion = data; } catch { } }
                setVersion(resolvedVersion);
            }
            try { const { data } = await supabase.from("issues").select("id,bug_id,status,priority,issue_type,affected_component").eq("test_case_id", testCase.id).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (data) { setLinkedIssue(data); setLinkedBugId(data.bug_id || ""); } } catch { }
            try { const { data } = await supabase.from("test_executions").select("id,execution_status,executed_at,environment,browser,execution_time").eq("test_case_id", testCase.id).order("executed_at", { ascending: false }).limit(5); setExecutionHistory(data || []); } catch { setExecutionHistory([]); }
        })();
    }, [testCase, manualVersion]);

    const buildPayload = () => ({
        test_case_id: testCase.id, version_id: testCase.version_id || version?.id || null,
        executed_by: authUserIdRef.current || tester?.id || null,
        execution_status: selectedStatus, environment, browser,
        execution_time: 0, expected_result: expectedResult, actual_result: actualResult,
        failure_notes: failureNotes, issue_type: issueType || null, affected_component: affectedField,
        additional_notes: additionalNotes, steps_to_reproduce: stepsToReproduce || null,
        executed_at: new Date().toISOString(),
    });

    const handleSave = async () => {
        if (!authUserIdRef.current) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) authUserIdRef.current = user.id;
            } catch { }
        }
        if (!authUserIdRef.current) return alert("Unable to identify the current user. Please refresh and try again.");
        try {
            const { error } = await supabase.from("test_executions").insert(buildPayload());
            if (error) throw error;
            await supabase.from("test_cases").update({ status: selectedStatus }).eq("id", testCase.id);
            showNotif("Progress saved!");
            const { data } = await supabase.from("test_executions").select("id,execution_status,executed_at,environment,browser,execution_time").eq("test_case_id", testCase.id).order("executed_at", { ascending: false }).limit(5);
            setExecutionHistory(data || []);
        } catch (e) { alert("Error saving: " + e.message); }
    };

    const handleSubmitClick = () => {
        if (selectedStatus === "fail") {
            if (!expectedResult.trim()) return alert("Expected Result is required for failures.");
            if (!actualResult.trim()) return alert("Actual Result is required for failures.");
            if (!failureNotes.trim()) return alert("Failure Notes are required for failures.");
            if (!issueType) return alert("Issue Type is required for failures.");
        }
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        if (!authUserIdRef.current) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) authUserIdRef.current = user.id;
            } catch { }
        }
        if (!authUserIdRef.current) {
            setIsSubmitting(false);
            return alert("Unable to identify the current user. Please refresh and try again.");
        }
        setIsSubmitting(true);
        try {
            const { data: exec, error: execErr } = await supabase.from("test_executions").insert(buildPayload()).select().single();
            if (execErr) throw execErr;

            if (selectedStatus === "fail") {
                await supabase.from("issues").insert({
                    test_case_id: testCase.id, test_execution_id: exec.id,
                    version_id: testCase.version_id || version?.id || null,
                    module_id: testCase.module_id || module?.id || null,
                    feature_id: testCase.feature_id || feature?.id || null,
                    issue_type: issueType || null, priority: testCase.priority || "medium",
                    status: "open", failure_comment: failureNotes, expected_behavior: expectedResult,
                    actual_behavior: actualResult, steps_to_reproduce: stepsToReproduce || null,
                    affected_component: affectedField, environment, browser,
                    reported_by: authUserIdRef.current || tester?.id || null, assigned_to: testCase.assigned_to || null,
                    reported_date: new Date().toISOString(),
                });
            }

            const { data: updatedRow } = await supabase
                .from("test_cases")
                .update({ status: selectedStatus, actual_result: actualResult || null })
                .eq("id", testCase.id)
                .select("id,status")
                .single();

            const confirmedStatus = updatedRow?.status || selectedStatus;

            setShowSubmitModal(false);
            showNotif(`✓ ${selectedStatus.toUpperCase()} — result submitted!`);
            onBack(testCase.id, confirmedStatus);
        } catch (e) { alert("Submission error: " + e.message); } finally { setIsSubmitting(false); }
    };

    const handleLinkBug = async () => {
        if (!linkedBugId.trim()) return;
        const { data, error } = await supabase.from("issues").select("id,bug_id,status,priority,issue_type,affected_component").eq("bug_id", linkedBugId.trim()).maybeSingle();
        if (error || !data) { alert(`No issue found with ID "${linkedBugId}"`); return; }
        setLinkedIssue(data);
    };

    const handleFileUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            const path = `test-evidence/${testCase?.id || "misc"}/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from("test-attachments").upload(path, file);
            if (error) { setUploadedFiles(p => [...p, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: null }]); }
            else { const { data: { publicUrl } } = supabase.storage.from("test-attachments").getPublicUrl(path); setUploadedFiles(p => [...p, { id: Math.random(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB", url: publicUrl }]); }
        }
    }, [testCase]);

    const handleSaveAssignments = async () => {
        setSavingAssign(true);
        try {
            const updates = {};
            if (assignedTesters.length > 0) updates.assigned_to = assignedTesters[0];
            await supabase.from("test_cases").update(updates).eq("id", testCase.id);
            showNotif("Assignments saved!");
        } catch (e) { alert("Error: " + e.message); }
        finally { setSavingAssign(false); }
    };

    const sm = getSM(selectedStatus);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <Toast show={showToast} message={toastMsg} />
            <SubmitModal show={showSubmitModal} onClose={() => setShowSubmitModal(false)} onConfirm={confirmSubmit} submitting={isSubmitting} currentTest={testCase} selectedStatus={selectedStatus} version={version} environment={environment} browser={browser} seconds={0} tester={tester} />

            {/* Header */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0">
                <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onBack(null, null)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <i className="fa-solid fa-arrow-left text-xs" /> Back
                        </button>
                        <div className="w-px h-6 bg-slate-200" />
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-400">{testCase.test_case_id}</span>
                            <span className="text-slate-300">—</span>
                            <span className="text-sm font-bold text-slate-900 truncate max-w-xs">{testCase.name}</span>
                            {testCase.priority && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${testCase.priority?.toLowerCase() === "high" ? "bg-red-100 text-red-600" :
                                    testCase.priority?.toLowerCase() === "medium" ? "bg-amber-100 text-amber-600" :
                                        "bg-slate-100 text-slate-500"}`}>{testCase.priority}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div id="ver-sel" className="relative">
                            <button onClick={() => setShowVersionDropdown(p => !p)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${showVersionDropdown ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400"}`}>
                                <i className="fa-solid fa-code-branch" />
                                {versionsLoading ? <span>Loading…</span> : version ? <span>v{version.version_number}</span> : <span>No version</span>}
                                {manualVersion && <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-[10px] font-bold">Manual</span>}
                                <i className={`fa-solid fa-chevron-down text-xs transition-transform ${showVersionDropdown ? "rotate-180" : ""}`} />
                            </button>
                            {showVersionDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900">Select Version</p>
                                        {manualVersion && <button onClick={() => { setManualVersion(null); setVersion(null); setShowVersionDropdown(false); }} className="text-xs text-slate-500 hover:text-red-500 font-medium">Reset</button>}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {allVersions.map(v => {
                                            const isSel = version?.id === v.id;
                                            return (
                                                <button key={v.id} onClick={() => { setManualVersion(v); setVersion(v); setShowVersionDropdown(false); }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 ${isSel ? "bg-blue-50" : ""}`}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div><span className="font-bold text-sm">v{v.version_number}</span><span className="text-xs text-slate-400 ml-2">Build {v.build_number}</span></div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getVB(v.status)}`}>{v.status}</span>
                                                            {isSel && <i className="fa-solid fa-check text-blue-500 text-xs" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        {total > 0 && (
                            <span className="text-xs text-slate-400 font-medium">{currentIdx + 1} / {total}</span>
                        )}
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50">
                            <i className="fa-solid fa-save text-xs" /> Save
                        </button>
                        {onNext && (
                            <button onClick={onNext} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-800">
                                Next <i className="fa-solid fa-arrow-right text-xs" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Body ── */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-4 max-w-3xl mx-auto">

                    {/* Context + Team Card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                            {[
                                { label: "Version", icon: "fa-code-branch", value: version ? `v${version.version_number}` : "—", sub: version?.build_number || "", color: "text-blue-400", bg: "bg-blue-50" },
                                { label: "Module", icon: "fa-puzzle-piece", value: module?.module_name || "—", sub: "", color: "text-teal-400", bg: "bg-teal-50" },
                                { label: "Feature", icon: "fa-list-check", value: feature?.feature_name || "—", sub: feature?.feature_code || "", color: "text-indigo-400", bg: "bg-indigo-50" },
                                { label: "Tester", icon: "fa-user", value: tester?.full_name || tester?.email || "—", sub: "Executing", color: "text-emerald-500", bg: "bg-emerald-50" },
                            ].map(item => (
                                <div key={item.label} className={`flex items-center gap-2.5 px-4 py-3 ${item.bg}`}>
                                    <i className={`fa-solid ${item.icon} ${item.color} text-xs flex-shrink-0`} />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                                        <p className="text-xs font-semibold text-slate-800 truncate">{item.value}</p>
                                        {item.sub && <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-5 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ overflow: "visible" }}>
                                <MultiAssign label="Assign Testers" icon="fa-flask" values={assignedTesters} onChange={setAssignedTesters} color="emerald" profiles={allProfiles} />
                                <MultiAssign label="Assign Developers" icon="fa-code" values={assignedDevs} onChange={setAssignedDevs} color="blue" profiles={allProfiles} />
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                {executionHistory.length > 0 ? (
                                    <span className={`text-xs flex items-center gap-1.5 ${getSM(executionHistory[0].execution_status).color}`}>
                                        <i className="fa-solid fa-history text-slate-400 text-xs" />
                                        Last run: {new Date(executionHistory[0].executed_at).toLocaleDateString()} —
                                        <span className="font-semibold">{executionHistory[0].execution_status}</span>
                                    </span>
                                ) : <span />}
                                <button onClick={handleSaveAssignments} disabled={savingAssign}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                                    {savingAssign ? <><i className="fa-solid fa-spinner fa-spin text-xs" />Saving…</> : <><i className="fa-solid fa-check text-xs" />Save Assignments</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Test Case Details */}
                    {(testCase.description || testCase.preconditions || testCase.test_steps || testCase.expected_result) && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Test Case Details</h3></div>
                            <div className="p-5 space-y-4">
                                {testCase.description && <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><p className="text-sm text-slate-500 leading-relaxed">{testCase.description}</p></div>}
                                {testCase.preconditions && <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Preconditions</label><p className="text-sm text-slate-500 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">{testCase.preconditions}</p></div>}
                                {testCase.test_steps && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-2 block">Test Steps</label>
                                        <div className="space-y-2">
                                            {(Array.isArray(testCase.test_steps) ? testCase.test_steps : testCase.test_steps.split("\n").filter(Boolean)).map((step, i) => (
                                                <div key={i} className="flex gap-2.5">
                                                    <div className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</div>
                                                    <p className="text-sm text-slate-500 pt-0.5">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {testCase.expected_result && <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Expected Result</label><p className="text-sm text-slate-500 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">{testCase.expected_result}</p></div>}
                            </div>
                        </div>
                    )}

                    {/* Execution Results */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Execution Results</h3></div>
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-2 block">Test Status <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { key: "pass", label: "Pass", icon: "fa-check-circle", color: "text-emerald-500", active: "border-emerald-500 bg-emerald-50" },
                                        { key: "fail", label: "Fail", icon: "fa-times-circle", color: "text-red-500", active: "border-red-500 bg-red-50" },
                                        { key: "blocked", label: "Blocked", icon: "fa-ban", color: "text-amber-500", active: "border-amber-500 bg-amber-50" },
                                        { key: "not-tested", label: "Not Tested", icon: "fa-circle", color: "text-slate-400", active: "border-slate-400 bg-slate-50" },
                                    ].map(s => (
                                        <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                                            className={`py-2.5 border-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${selectedStatus === s.key ? s.active : "border-slate-200 hover:border-slate-300"}`}>
                                            <i className={`fa-solid ${s.icon} ${s.color} text-xs`} />{s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Expected Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={expectedResult} onChange={e => setExpectedResult(e.target.value)} placeholder="What should happen…" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Actual Result {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label>
                                    <textarea rows={3} value={actualResult} onChange={e => setActualResult(e.target.value)} placeholder="What actually happened…" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" />
                                </div>
                            </div>
                            {(selectedStatus === "fail" || selectedStatus === "blocked") && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                                    <h4 className="text-xs font-bold text-red-700 flex items-center gap-2"><i className="fa-solid fa-bug" />{selectedStatus === "fail" ? "Failure Details" : "Blocker Details"}</h4>
                                    <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">{selectedStatus === "fail" ? "Failure Notes" : "Blocker Description"} <span className="text-red-500">*</span></label><textarea rows={3} value={failureNotes} onChange={e => setFailureNotes(e.target.value)} placeholder="Describe what went wrong…" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" /></div>
                                    <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">Steps to Reproduce</label><textarea rows={3} value={stepsToReproduce} onChange={e => setStepsToReproduce(e.target.value)} placeholder={"1. Go to…\n2. Click on…\n3. Observe…"} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-xs" /></div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">Issue Type {selectedStatus === "fail" && <span className="text-red-500">*</span>}</label><select value={issueType} onChange={e => setIssueType(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Select Issue Type</option><option value="ui">UI Issue</option><option value="functional">Functional Issue</option><option value="performance">Performance Issue</option><option value="security">Security Issue</option><option value="data">Data Issue</option><option value="integration">Integration Issue</option></select></div>
                                        <div><label className="text-xs font-semibold text-slate-700 mb-1.5 block">Affected Component</label><input type="text" value={affectedField} onChange={e => setAffectedField(e.target.value)} placeholder="e.g., Login button…" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Screenshots / Attachments</label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
                                            <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
                                            <label htmlFor="file-upload" className="cursor-pointer"><i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300 mb-1 block" /><p className="text-xs font-medium text-slate-600">Click to upload</p><p className="text-[10px] text-slate-400">PNG, JPG, PDF up to 10MB</p></label>
                                        </div>
                                        {uploadedFiles.length > 0 && <div className="mt-2 space-y-1.5">{uploadedFiles.map(f => (<div key={f.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center"><i className="fa-solid fa-image text-blue-500 text-xs" /></div><div><p className="text-xs font-medium">{f.name}</p><p className="text-[10px] text-slate-400">{f.size}</p></div></div><div className="flex items-center gap-2">{f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600"><i className="fa-solid fa-external-link-alt text-xs" /></a>}<button onClick={() => setUploadedFiles(p => p.filter(x => x.id !== f.id))} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-trash text-xs" /></button></div></div>))}</div>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Linked Bug ID</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={linkedBugId} onChange={e => setLinkedBugId(e.target.value)} placeholder="e.g. BUG-0001" onKeyDown={e => e.key === "Enter" && handleLinkBug()} className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <button onClick={handleLinkBug} className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"><i className="fa-solid fa-link mr-1" />Link</button>
                                        </div>
                                        {linkedIssue && (<div className="mt-2 flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg"><div className="flex items-center gap-2"><i className="fa-solid fa-bug text-amber-600 text-xs" /><div><p className="text-xs font-medium">{linkedIssue.bug_id}</p><p className="text-[10px] text-slate-500">Status: {linkedIssue.status} · Priority: {linkedIssue.priority}</p></div></div><button onClick={() => { setLinkedIssue(null); setLinkedBugId(""); }} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-times text-xs" /></button></div>)}
                                    </div>
                                </div>
                            )}
                            <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Additional Notes <span className="text-slate-400 font-normal">(Optional)</span></label><textarea rows={2} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any additional observations…" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white" /></div>
                        </div>
                    </div>

                    {/* Execution Metadata */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Execution Metadata</h3></div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Environment</label><select value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="staging">Staging</option><option value="production">Production</option><option value="dev">Development</option><option value="uat">UAT</option></select></div>
                            <div><label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Browser</label><select value={browser} onChange={e => setBrowser(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="chrome">Chrome</option><option value="firefox">Firefox</option><option value="safari">Safari</option><option value="edge">Edge</option><option value="mobile">Mobile</option></select></div>
                        </div>
                    </div>

                    {/* Execution History */}
                    {executionHistory.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Previous Executions</h3></div>
                            <div className="divide-y divide-slate-100">
                                {executionHistory.map(ex => {
                                    const si = getSM(ex.execution_status); return (
                                        <div key={ex.id} className="px-5 py-3 flex items-center gap-3">
                                            <i className={`fa-solid ${si.icon} ${si.color} text-sm`} />
                                            <div className="flex-1"><span className={`text-xs font-bold px-2 py-0.5 rounded ${si.bgLight} ${si.color}`}>{ex.execution_status?.toUpperCase()}</span><span className="text-xs text-slate-400 ml-2">{ex.environment} · {ex.browser}</span></div>
                                            <span className="text-xs text-slate-400 font-mono">{formatTime(ex.execution_time || 0)}</span>
                                            <span className="text-xs text-slate-400">{new Date(ex.executed_at).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Submit bar */}
                    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <button onClick={() => onBack(null, null)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                            <i className="fa-solid fa-arrow-left text-xs" /> Back to List
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSave} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5">
                                <i className="fa-solid fa-floppy-disk text-xs" /> Save Draft
                            </button>
                            <button onClick={handleSubmitClick} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5">
                                <i className="fa-solid fa-paper-plane text-xs" /> Submit Result
                            </button>
                            {onNext && (
                                <button onClick={onNext} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1.5">
                                    Next <i className="fa-solid fa-arrow-right text-xs" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function TestExecution() {
    const [selectedTest, setSelectedTest] = useState(null);
    const [testList, setTestList] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(-1);

    // Initialise from sessionStorage so colors survive page switches.
    const [pendingUpdates, setPendingUpdates] = useState(() => loadPendingUpdates());

    // ── Direct-open: navigate here from another page with a specific test case ──
    useEffect(() => {
        const tcId = sessionStorage.getItem("te_direct_open");
        if (!tcId) return;
        sessionStorage.removeItem("te_direct_open");
        (async () => {
            const { data } = await supabase
                .from("test_cases")
                .select("*")
                .eq("id", tcId)
                .single();
            if (data) {
                setTestList([data]);
                setSelectedIdx(0);
                setSelectedTest(data);
            }
        })();
    }, []);

    const handleSelect = (test, list = []) => {
        const idx = list.findIndex(t => t.id === test.id);
        setTestList(list);
        setSelectedIdx(idx);
        setSelectedTest(test);
    };

    const handleBack = (updatedId, updatedStatus) => {
        if (updatedId && updatedStatus) {
            setPendingUpdates(prev => {
                const next = { ...prev, [updatedId]: updatedStatus };
                // Persist to sessionStorage so the map survives if this component
                // unmounts when the user navigates to another page and comes back.
                savePendingUpdates(next);
                return next;
            });
        }
        setSelectedTest(null);
    };

    const handleNext = () => {
        const next = selectedIdx + 1;
        if (next < testList.length) {
            setSelectedIdx(next);
            setSelectedTest(testList[next]);
        }
    };

    if (selectedTest) {
        return (
            <ExecuteView
                testCase={selectedTest}
                onBack={handleBack}
                onNext={selectedIdx < testList.length - 1 ? handleNext : null}
                currentIdx={selectedIdx}
                total={testList.length}
            />
        );
    }
    return (
        <TestCaseListView
            pendingUpdates={pendingUpdates}
            onSelect={(test, list) => handleSelect(test, list)}
        />
    );
}