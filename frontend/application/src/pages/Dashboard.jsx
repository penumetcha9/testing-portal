import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import Header from "../components/Header";
import StatusChart from "../components/StatusChart";
import TrendsChart from "../components/TrendsChart";

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
    return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, value, sub, subColor, loading }) {
    return (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
                    <i className={`fa-solid ${icon} ${iconColor} text-xl`} />
                </div>
            </div>
            {loading ? (
                <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </>
            ) : (
                <>
                    <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
                </>
            )}
        </div>
    );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white pointer-events-auto
                    ${t.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
                    <i className={`fa-solid ${t.type === "error" ? "fa-times-circle" : "fa-check-circle"}`} />
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Assignment Badge ─────────────────────────────────────────────────────────
function AssignmentBadge({ status }) {
    const map = {
        Passed: "bg-green-500/10 text-green-600",
        Failed: "bg-red-500/10 text-red-600",
        Pending: "bg-yellow-500/10 text-yellow-600",
        "In Progress": "bg-blue-500/10 text-blue-600",
        Active: "bg-emerald-500/10 text-emerald-600",
        Inactive: "bg-gray-200 text-gray-500",
        active: "bg-emerald-500/10 text-emerald-600",
        testing: "bg-blue-500/10 text-blue-600",
        planning: "bg-purple-500/10 text-purple-600",
        completed: "bg-gray-200 text-gray-600",
        archived: "bg-gray-100 text-gray-400",
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>
            {status}
        </span>
    );
}

// ── My Assignments Section ───────────────────────────────────────────────────
function MyAssignments({ userId }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myModules, setMyModules] = useState([]);
    const [myVersions, setMyVersions] = useState([]);
    const [myFeatures, setMyFeatures] = useState([]);
    const [myTestCases, setMyTestCases] = useState([]);
    const [activeTab, setActiveTab] = useState("testcases");

    useEffect(() => {
        if (!userId) return;
        fetchMyAssignments();
    }, [userId]); // eslint-disable-line

    async function fetchMyAssignments() {
        setLoading(true);
        await Promise.all([
            fetchMyTestCases(),
            fetchMyModules(),
            fetchMyVersions(),
            fetchMyFeatures(),
        ]);
        setLoading(false);
    }

    async function fetchMyTestCases() {
        const { data, error } = await supabase
            .from("test_cases")
            .select(`
                id, name, test_case_id, status, priority,
                modules ( module_name ),
                versions ( version_number )
            `)
            .eq("assigned_to", userId.toString())
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) console.error("fetchMyTestCases error:", error);
        if (!error && data) setMyTestCases(data);
    }

    async function fetchMyModules() {
        const { data: tcData, error: tcError } = await supabase
            .from("test_cases")
            .select("module_id")
            .eq("assigned_to", userId.toString());

        if (tcError || !tcData) return;

        const moduleIds = [...new Set(tcData.map(tc => tc.module_id).filter(Boolean))];
        if (moduleIds.length === 0) { setMyModules([]); return; }

        const { data, error } = await supabase
            .from("modules")
            .select("id, module_name, status, description")
            .in("id", moduleIds)
            .order("module_name");

        if (error) console.error("fetchMyModules error:", error);
        if (!error && data) setMyModules(data);
    }

    async function fetchMyVersions() {
        const { data: tcData, error: tcError } = await supabase
            .from("test_cases")
            .select("version_id")
            .eq("assigned_to", userId.toString());

        if (tcError || !tcData) return;

        const versionIds = [...new Set(tcData.map(tc => tc.version_id).filter(Boolean))];
        if (versionIds.length === 0) { setMyVersions([]); return; }

        const { data, error } = await supabase
            .from("versions")
            .select("id, version_number, status, release_date, description")
            .in("id", versionIds)
            .order("created_date", { ascending: false });

        if (error) console.error("fetchMyVersions error:", error);
        if (!error && data) setMyVersions(data);
    }

    async function fetchMyFeatures() {
        const { data: tcData, error: tcError } = await supabase
            .from("test_cases")
            .select("feature_id")
            .eq("assigned_to", userId.toString());

        if (tcError || !tcData) return;

        const featureIds = [...new Set(tcData.map(tc => tc.feature_id).filter(Boolean))];

        const queries = [
            supabase
                .from("features")
                .select("id, feature_name, status, priority, modules ( module_name )")
                .eq("assign_to", userId.toString())
                .order("feature_name"),
        ];

        if (featureIds.length > 0) {
            queries.push(
                supabase
                    .from("features")
                    .select("id, feature_name, status, priority, modules ( module_name )")
                    .in("id", featureIds)
                    .order("feature_name")
            );
        }

        const results = await Promise.all(queries);
        const allFeatures = results.flatMap(r => r.data || []);
        const unique = Array.from(new Map(allFeatures.map(f => [f.id, f])).values());
        setMyFeatures(unique);
    }

    const tabs = [
        { key: "testcases", label: "Test Cases", icon: "fa-vials", count: myTestCases.length },
        { key: "modules", label: "Modules", icon: "fa-cubes", count: myModules.length },
        { key: "versions", label: "Versions", icon: "fa-code-branch", count: myVersions.length },
        { key: "features", label: "Features", icon: "fa-list-check", count: myFeatures.length },
    ];

    const isEmpty = {
        testcases: myTestCases.length === 0,
        modules: myModules.length === 0,
        versions: myVersions.length === 0,
        features: myFeatures.length === 0,
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-user-check text-primary" />
                    My Assignments
                </h3>
                <p className="text-sm text-muted-foreground">Items assigned to you across the project</p>
            </div>

            <div className="grid grid-cols-4 border-b border-border divide-x divide-border">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`p-4 text-center transition-colors hover:bg-muted/50 ${activeTab === tab.key ? "bg-primary/5 border-b-2 border-primary" : ""}`}
                    >
                        <div className={`text-2xl font-bold mb-1 ${activeTab === tab.key ? "text-primary" : "text-foreground"}`}>
                            {loading ? <Skeleton className="h-7 w-8 mx-auto" /> : tab.count}
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                            <i className={`fa-solid ${tab.icon} text-xs ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-medium ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}>{tab.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                    </div>
                ) : isEmpty[activeTab] ? (
                    <div className="text-center py-10">
                        <i className={`fa-solid ${tabs.find(t => t.key === activeTab)?.icon} text-3xl text-muted-foreground/30 mb-3 block`} />
                        <p className="text-sm text-muted-foreground font-medium">
                            No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} assigned to you
                        </p>
                    </div>
                ) : activeTab === "testcases" ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {myTestCases.map(tc => (
                            <div key={tc.id}
                                onClick={() => { sessionStorage.setItem("te_direct_open", tc.id); navigate("/test-execution"); }}
                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary hover:bg-muted/30 cursor-pointer transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-flask text-primary text-xs" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{tc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {tc.test_case_id}
                                            {tc.modules?.module_name && ` · ${tc.modules.module_name}`}
                                            {tc.versions?.version_number && ` · ${tc.versions.version_number}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    {tc.priority && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.priority === "High" || tc.priority === "Critical"
                                            ? "bg-red-100 text-red-600"
                                            : tc.priority === "Medium"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : "bg-gray-100 text-gray-500"
                                            }`}>{tc.priority}</span>
                                    )}
                                    <AssignmentBadge status={tc.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === "modules" ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {myModules.map(m => (
                            <div key={m.id}
                                onClick={() => { sessionStorage.setItem("modules_open_id", m.id); navigate("/modules"); }}
                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary hover:bg-muted/30 cursor-pointer transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-cube text-blue-500 text-xs" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{m.module_name}</p>
                                        {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                                    </div>
                                </div>
                                {m.status && <AssignmentBadge status={m.status} />}
                            </div>
                        ))}
                    </div>
                ) : activeTab === "versions" ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {myVersions.map(v => (
                            <div key={v.id}
                                onClick={() => { sessionStorage.setItem("versions_open_id", v.id); navigate("/versions"); }}
                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary hover:bg-muted/30 cursor-pointer transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-code-branch text-emerald-500 text-xs" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{v.version_number}</p>
                                        {v.release_date && (
                                            <p className="text-xs text-muted-foreground">
                                                Release: {new Date(v.release_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {v.status && <AssignmentBadge status={v.status} />}
                            </div>
                        ))}
                    </div>
                ) : activeTab === "features" ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {myFeatures.map(f => (
                            <div key={f.id}
                                onClick={() => { sessionStorage.setItem("features_open_id", f.id); navigate("/features"); }}
                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary hover:bg-muted/30 cursor-pointer transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-list-check text-purple-500 text-xs" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{f.feature_name}</p>
                                        {f.modules?.module_name && (
                                            <p className="text-xs text-muted-foreground">{f.modules.module_name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    {f.priority && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.priority === "High" || f.priority === "Critical"
                                            ? "bg-red-100 text-red-600"
                                            : f.priority === "Medium"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : "bg-gray-100 text-gray-500"
                                            }`}>{f.priority}</span>
                                    )}
                                    {f.status && <AssignmentBadge status={f.status} />}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [stats, setStats] = useState({
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        executions: 0,
    });

    const [versions, setVersions] = useState([]);
    const [modules, setModules] = useState([]);
    const [failedIssues, setFailedIssues] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [trends, setTrends] = useState({ labels: [], passed: [], failed: [], pending: [] });
    const [teamPeriod, setTeamPeriod] = useState("Last 7 days");

    const addToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id);
        });
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchVersionStats(),
                fetchModules(),
                fetchFailedIssues(),
                fetchTeamPerformance(),
                fetchRecentExecutions(),
                fetchTrends(),
            ]);
        } catch (e) {
            addToast("Error loading dashboard data", "error");
        }
        setLoading(false);
    }, []); // eslint-disable-line

    useEffect(() => { fetchAll(); }, [fetchAll]);

    async function fetchStats() {
        const [
            { count: total },
            { count: passed },
            { count: failed },
            { count: executions },
        ] = await Promise.all([
            supabase.from("test_cases").select("*", { count: "exact", head: true }),
            supabase.from("test_executions").select("*", { count: "exact", head: true }).eq("execution_status", "pass"),
            supabase.from("test_executions").select("*", { count: "exact", head: true }).eq("execution_status", "fail"),
            supabase.from("test_executions").select("*", { count: "exact", head: true }),
        ]);

        const t = total || 0;
        const p = passed || 0;
        const f = failed || 0;
        const exec = executions || 0;
        const passRate = exec > 0 ? Math.round((p / exec) * 100) : 0;

        setStats({
            total: t,
            passed: p,
            failed: f,
            passRate,
            executions: exec,
        });
    }

    async function fetchVersionStats() {
        const { data: versionsData, error: vErr } = await supabase
            .from("versions")
            .select(`
                id, version_number, status,
                test_cases ( status )
            `)
            .order("created_date", { ascending: false })
            .limit(3);

        if (vErr || !versionsData) return;

        const colorOptions = [
            { text: "text-primary", iconBg: "bg-primary/10", bar: "bg-primary" },
            { text: "text-secondary", iconBg: "bg-secondary/10", bar: "bg-secondary" },
            { text: "text-accent", iconBg: "bg-accent/10", bar: "bg-accent" },
        ];

        const shaped = versionsData.map((v, i) => {
            const tcs = v.test_cases || [];
            const total = tcs.length;
            const passed = tcs.filter(t => t.status === "Passed").length;
            const failed = tcs.filter(t => t.status === "Failed").length;
            const pending = tcs.filter(t => t.status === "Pending").length;
            const completion = total > 0 ? Math.round(((passed + failed) / total) * 100) : 0;
            return {
                version_id: v.id,
                label: v.version_number,
                status: v.status,
                total,
                passed,
                failed,
                pending,
                completion,
                colors: colorOptions[i] || colorOptions[0],
            };
        });

        setVersions(shaped);
    }

    async function fetchModules() {
        const { data, error } = await supabase
            .from("modules")
            .select("id, module_name, test_cases(status)")
            .order("module_name");

        if (error || !data) return;

        const shaped = data.map(m => {
            const tcs = m.test_cases || [];
            const total = tcs.length;
            const passed = tcs.filter(t => t.status === "Passed").length;
            const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
            return {
                id: m.id,
                name: m.module_name,
                pct,
                total,
                passed,
                color: pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-accent" : "bg-destructive",
            };
        }).sort((a, b) => b.pct - a.pct);

        setModules(shaped);
    }

    async function fetchFailedIssues() {
        const { data, error } = await supabase
            .from("issues")
            .select(`
                id, bug_id, priority, issue_type, failure_comment,
                affected_component, created_at,
                reporter:profiles!reported_by ( full_name, avatar_url ),
                modules ( module_name ),
                features ( feature_name )
            `)
            .order("created_at", { ascending: false })
            .limit(4);

        if (error || !data) return;

        const priorityMap = {
            Critical: { iconBg: "bg-destructive/10", iconColor: "text-destructive", icon: "fa-bug", severityBg: "bg-destructive/10", severityColor: "text-destructive" },
            High: { iconBg: "bg-accent/10", iconColor: "text-accent", icon: "fa-exclamation-triangle", severityBg: "bg-accent/10", severityColor: "text-accent" },
            Medium: { iconBg: "bg-accent/10", iconColor: "text-accent", icon: "fa-exclamation-triangle", severityBg: "bg-accent/10", severityColor: "text-accent" },
            Low: { iconBg: "bg-muted", iconColor: "text-muted-foreground", icon: "fa-circle-info", severityBg: "bg-muted", severityColor: "text-muted-foreground" },
        };

        setFailedIssues(data.map(issue => ({
            ...issue,
            style: priorityMap[issue.priority] || priorityMap.Low,
            timeAgo: timeAgo(issue.created_at),
        })));
    }

    async function fetchTeamPerformance() {
        const { data: execData, error } = await supabase
            .from("test_executions")
            .select(`
                executed_by, execution_status,
                executor:profiles!executed_by ( id, full_name, avatar_url, email )
            `);

        if (error || !execData) return;

        const memberMap = {};
        execData.forEach(e => {
            const profile = e.executor;
            if (!profile) return;
            const id = profile.id;
            if (!memberMap[id]) {
                memberMap[id] = {
                    id,
                    name: profile.full_name || profile.email || "Unknown",
                    avatar: profile.avatar_url,
                    assigned: 0,
                    completed: 0,
                };
            }
            memberMap[id].assigned++;
            if (e.execution_status === "Passed") memberMap[id].completed++;
        });

        const shaped = Object.values(memberMap)
            .map(m => {
                const passRate = m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0;
                return {
                    ...m,
                    passRate,
                    barColor: passRate >= 80 ? "bg-green-500" : passRate >= 50 ? "bg-accent" : "bg-destructive",
                };
            })
            .sort((a, b) => b.assigned - a.assigned);

        setTeamMembers(shaped);
    }

    async function fetchRecentExecutions() {
        const { data, error } = await supabase
            .from("test_executions")
            .select(`
                id, execution_status, created_at, environment, browser,
                executor:profiles!executed_by ( full_name, avatar_url ),
                test_cases ( name, test_case_id )
            `)
            .order("created_at", { ascending: false })
            .limit(8);

        if (error || !data) return;
        setRecentExecutions(data.map(e => ({ ...e, timeAgo: timeAgo(e.created_at) })));
    }

    async function fetchTrends() {
        const days = 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from("test_executions")
            .select("execution_status, created_at")
            .gte("created_at", since.toISOString())
            .order("created_at");

        if (error || !data) return;

        const labels = [];
        const buckets = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
            buckets[key] = { passed: 0, failed: 0, pending: 0 };
        }

        data.forEach(e => {
            const key = e.created_at.split("T")[0];
            if (!buckets[key]) return;
            if (e.execution_status === "Passed") buckets[key].passed++;
            else if (e.execution_status === "Failed") buckets[key].failed++;
            else buckets[key].pending++;
        });

        const vals = Object.values(buckets);
        setTrends({
            labels,
            passed: vals.map(v => v.passed),
            failed: vals.map(v => v.failed),
            pending: vals.map(v => v.pending),
        });
    }

    function timeAgo(ts) {
        if (!ts) return "";
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    const execIcon = (status) => {
        if (status === "Passed") return { bg: "bg-green-500/10", color: "text-green-500", icon: "fa-check" };
        if (status === "Failed") return { bg: "bg-destructive/10", color: "text-destructive", icon: "fa-times" };
        return { bg: "bg-accent/10", color: "text-accent", icon: "fa-clock" };
    };

    return (
        <div className="flex-1 flex flex-col">
            <Toast toasts={toasts} />
            <Header />

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">

                    {/* ── KPI Cards: Total | Passed | Failed | Pass Rate | Executions ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <StatCard
                            loading={loading}
                            icon="fa-vials"
                            iconBg="bg-primary/10"
                            iconColor="text-primary"
                            label="Total Test Cases"
                            value={stats.total}
                            sub="All versions"
                            subColor="text-muted-foreground"
                        />
                        <StatCard
                            loading={loading}
                            icon="fa-circle-check"
                            iconBg="bg-green-500/10"
                            iconColor="text-green-500"
                            label="Passed Attempts"
                            value={stats.passed}
                            sub={`${stats.passRate}% pass rate`}
                            subColor="text-green-500"
                        />
                        <StatCard
                            loading={loading}
                            icon="fa-circle-xmark"
                            iconBg="bg-destructive/10"
                            iconColor="text-destructive"
                            label="Failed Attempts"
                            value={stats.failed}
                            sub="Needs attention"
                            subColor="text-destructive"
                        />
                        <StatCard
                            loading={loading}
                            icon="fa-gauge-high"
                            iconBg="bg-muted"
                            iconColor="text-muted-foreground"
                            label="Pass Rate"
                            value={`${stats.passRate}%`}
                            sub="Overall quality"
                            subColor={stats.passRate >= 80 ? "text-green-500" : "text-destructive"}
                        />
                        <StatCard
                            loading={loading}
                            icon="fa-play-circle"
                            iconBg="bg-secondary/10"
                            iconColor="text-secondary"
                            label="Executions"
                            value={stats.executions}
                            sub="Total runs"
                            subColor="text-muted-foreground"
                        />
                    </div>

                    {/* ── MY ASSIGNMENTS ── */}
                    <MyAssignments userId={currentUserId} loading={loading} />

                    {/* ── Active Versions + Status Chart ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Active Versions</h3>
                                    <p className="text-sm text-muted-foreground">Test case distribution by version</p>
                                </div>
                                <button onClick={() => navigate("/versions")}
                                    className="self-start sm:self-auto text-primary font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    View All <i className="fa-solid fa-arrow-right" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {loading ? [1, 2, 3].map(i => (
                                    <div key={i} className="p-4 border border-border rounded-lg">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                                            <div className="flex-1">
                                                <Skeleton className="h-5 w-24 mb-2" />
                                                <Skeleton className="h-4 w-40 mb-3" />
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-6 w-20 rounded-full" />
                                                    <Skeleton className="h-6 w-20 rounded-full" />
                                                    <Skeleton className="h-6 w-20 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : versions.length > 0 ? versions.map((v) => (
                                    <div key={v.version_id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                                        onClick={() => navigate("/versions")}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 ${v.colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fa-solid fa-code-branch ${v.colors.text} text-lg`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-foreground">{v.label}</h4>
                                                    {v.status && <AssignmentBadge status={v.status} />}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{v.total} total test cases</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">{v.passed} Passed</span>
                                                    <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full">{v.failed} Failed</span>
                                                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">{v.pending} Pending</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sm:text-right flex-shrink-0">
                                            <div className="text-2xl font-bold text-foreground mb-1">{v.completion}%</div>
                                            <p className="text-xs text-muted-foreground mb-2">Executed</p>
                                            <div className="w-24 bg-muted rounded-full h-2 ml-auto">
                                                <div className={`${v.colors.bar} h-2 rounded-full`} style={{ width: `${v.completion}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <i className="fa-solid fa-code-branch text-2xl mb-2 block opacity-30" />
                                        No version data found
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground mb-1">Test Status Distribution</h3>
                                <p className="text-sm text-muted-foreground">Overall test results</p>
                            </div>
                            <div className="p-6">
                                {!loading && stats.total > 0 ? (
                                    <div className="space-y-4">
                                        {[
                                            { label: "Passed Attempts", value: stats.passed, color: "bg-green-500", textColor: "text-green-600" },
                                            { label: "Failed Attempts", value: stats.failed, color: "bg-destructive", textColor: "text-destructive" },
                                        ].map(s => {
                                            const base = stats.executions > 0 ? stats.executions : 1;
                                            const pct = Math.min(Math.round((s.value / base) * 100), 100);
                                            return (
                                                <div key={s.label}>
                                                    <div className="flex justify-between mb-1.5 text-sm">
                                                        <span className="font-medium text-foreground">{s.label}</span>
                                                        <span className={`font-semibold ${s.textColor}`}>
                                                            {s.value} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                                        <div className={`${s.color} h-3 rounded-full transition-all duration-700`}
                                                            style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-4 border-t border-border">
                                            <div className="text-center">
                                                <p className="text-4xl font-bold text-foreground">{stats.passRate}%</p>
                                                <p className="text-sm text-muted-foreground mt-1">Overall Pass Rate</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : loading ? (
                                    <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
                                ) : (
                                    <StatusChart />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Module Coverage + Failed Issues ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Module Coverage</h3>
                                    <p className="text-sm text-muted-foreground">Pass rate by module</p>
                                </div>
                                <button onClick={() => navigate("/modules")}
                                    className="text-primary font-medium text-sm hover:opacity-80 transition-opacity">View All</button>
                            </div>
                            <div className="p-6 space-y-4">
                                {loading ? [1, 2, 3, 4, 5].map(i => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-10" /></div>
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                )) : modules.length > 0 ? modules.slice(0, 6).map(m => (
                                    <div key={m.id}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-foreground truncate mr-4">{m.name}</span>
                                            <span className="text-sm font-semibold text-foreground flex-shrink-0">{m.pct}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div className={`${m.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${m.pct}%` }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{m.passed} / {m.total} passed</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">No module data found</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Recent Failed Issues</h3>
                                    <p className="text-sm text-muted-foreground">Latest issues requiring attention</p>
                                </div>
                                <button onClick={() => navigate("/failed-issues")}
                                    className="text-primary font-medium text-sm hover:opacity-80 transition-opacity">View All</button>
                            </div>
                            <div className="p-6 space-y-4">
                                {loading ? [1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-3 p-3 border border-border rounded-lg">
                                        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                                        <div className="flex-1"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                                    </div>
                                )) : failedIssues.length > 0 ? failedIssues.map(issue => (
                                    <div key={issue.id}
                                        className="flex items-start gap-3 p-3 border border-border rounded-lg hover:border-destructive transition-colors cursor-pointer"
                                        onClick={() => navigate("/failed-issues")}>
                                        <div className={`w-10 h-10 ${issue.style.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <i className={`fa-solid ${issue.style.icon} ${issue.style.iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-foreground truncate">{issue.bug_id}</h4>
                                                {issue.issue_type && (
                                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{issue.issue_type}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{issue.failure_comment || issue.affected_component}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-xs px-2 py-1 ${issue.style.severityBg} ${issue.style.severityColor} rounded-full`}>{issue.priority}</span>
                                                {issue.modules?.module_name && <span className="text-xs text-muted-foreground">{issue.modules.module_name}</span>}
                                                <span className="text-xs text-muted-foreground ml-auto">{issue.timeAgo}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <i className="fa-solid fa-circle-check text-green-400 text-3xl mb-2 block" />
                                        <p className="text-sm text-muted-foreground font-medium">No failed issues!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Team Performance + Recent Activity ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Team Performance</h3>
                                    <p className="text-sm text-muted-foreground">Execution stats by team member</p>
                                </div>
                                <select value={teamPeriod} onChange={e => setTeamPeriod(e.target.value)}
                                    className="px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                    <option>Last 7 days</option>
                                    <option>Last 30 days</option>
                                    <option>Last 90 days</option>
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                                ) : teamMembers.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="bg-muted border-b border-border">
                                            <tr>
                                                {["Tester", "Executions", "Passed", "Pass Rate"].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {teamMembers.map(m => (
                                                <tr key={m.id} className="hover:bg-muted transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {m.avatar ? (
                                                                <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                    {m.name[0]?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-foreground">{m.assigned}</td>
                                                    <td className="px-6 py-4 text-sm text-foreground">{m.completed}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                                                <div className={`${m.barColor} h-2 rounded-full`} style={{ width: `${m.passRate}%` }} />
                                                            </div>
                                                            <span className="text-sm font-medium text-foreground">{m.passRate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        <i className="fa-solid fa-users text-2xl mb-2 block opacity-30" />
                                        No execution data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Recent Activity</h3>
                                    <p className="text-sm text-muted-foreground">Latest test executions</p>
                                </div>
                                <button onClick={fetchAll} title="Refresh" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <i className={`fa-solid fa-rotate-right text-sm ${loading ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                {loading ? [1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div className="flex-1"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></div>
                                    </div>
                                )) : recentExecutions.length > 0 ? recentExecutions.map(e => {
                                    const style = execIcon(e.execution_status);
                                    return (
                                        <div key={e.id} className="flex gap-3">
                                            <div className={`w-8 h-8 ${style.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fa-solid ${style.icon} ${style.color} text-xs`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground mb-0.5">
                                                    <span className="font-semibold">{e.executor?.full_name || "Unknown"}</span>
                                                    {" ran "}
                                                    <span className={`font-medium ${style.color}`}>{e.execution_status}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{e.test_cases?.name || "Test case"}</p>
                                                {e.environment && <p className="text-xs text-muted-foreground">{e.environment} · {e.browser}</p>}
                                                <p className="text-xs text-muted-foreground mt-0.5">{e.timeAgo}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Testing Trends ── */}
                    <div className="bg-card border border-border rounded-lg shadow-sm">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-bold text-foreground mb-1">Testing Trends</h3>
                            <p className="text-sm text-muted-foreground">Execution results over the last 7 days</p>
                        </div>
                        <div className="p-6">
                            {!loading && trends.labels.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {[
                                            { label: "Passed", values: trends.passed, color: "text-green-500" },
                                            { label: "Failed", values: trends.failed, color: "text-red-500" },
                                            { label: "Pending", values: trends.pending, color: "text-orange-400" },
                                        ].map(s => (
                                            <div key={s.label} className="text-center p-3 bg-muted rounded-lg">
                                                <p className={`text-2xl font-bold ${s.color}`}>{s.values.reduce((a, b) => a + b, 0)}</p>
                                                <p className="text-xs text-muted-foreground">{s.label} (7d)</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-end gap-2 h-40">
                                        {trends.labels.map((label, i) => {
                                            const total = (trends.passed[i] || 0) + (trends.failed[i] || 0) + (trends.pending[i] || 0);
                                            const maxTotal = Math.max(...trends.labels.map((_, j) =>
                                                (trends.passed[j] || 0) + (trends.failed[j] || 0) + (trends.pending[j] || 0)
                                            ), 1);
                                            const height = Math.round((total / maxTotal) * 100);
                                            return (
                                                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="w-full flex flex-col justify-end rounded overflow-hidden" style={{ height: "120px" }}>
                                                        <div title={`Passed: ${trends.passed[i]}`} style={{ height: `${total > 0 ? Math.round((trends.passed[i] / total) * height) : 0}%` }} className="bg-green-500 w-full transition-all" />
                                                        <div title={`Failed: ${trends.failed[i]}`} style={{ height: `${total > 0 ? Math.round((trends.failed[i] / total) * height) : 0}%` }} className="bg-red-500 w-full transition-all" />
                                                        <div title={`Pending: ${trends.pending[i]}`} style={{ height: `${total > 0 ? Math.round((trends.pending[i] / total) * height) : 0}%` }} className="bg-orange-400 w-full transition-all" />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-6 justify-center pt-2">
                                        {[["bg-green-500", "Passed"], ["bg-red-500", "Failed"], ["bg-orange-400", "Pending"]].map(([color, label]) => (
                                            <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className={`w-3 h-3 rounded-sm ${color}`} />{label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : loading ? (
                                <Skeleton className="h-40 w-full" />
                            ) : (
                                <TrendsChart />
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}