import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import React from "react";

// ── Toast Notification ──────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white pointer-events-auto transition-all
                        ${t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}
                >
                    <i className={`fa-solid ${t.type === "success" ? "fa-check-circle" : t.type === "error" ? "fa-times-circle" : "fa-info-circle"}`}></i>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Issue Details Panel ──────────────────────────────────────────────────────
function IssueDetailsPanel({ issue, users, onAssign, onLinkBug, onAddComment, onExport, onDownload }) {
    const details = issue.details;
    return (
        <div className="p-6 bg-red-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Failure Comment */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-comment-dots text-red-500"></i> Failure Comment
                        </h4>
                        <p className="text-sm text-foreground leading-relaxed">{details.failureComment || issue.actual_result || "—"}</p>
                    </div>
                    {/* Actual Behavior */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-times-circle text-red-500"></i> Actual Behavior
                        </h4>
                        <p className="text-sm text-foreground leading-relaxed">{issue.actual_result || "—"}</p>
                    </div>
                    {/* Expected Behavior */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-check-circle text-green-500"></i> Expected Behavior
                        </h4>
                        <p className="text-sm text-foreground leading-relaxed">{issue.expected_result || "—"}</p>
                    </div>
                    {/* Steps */}
                    {Array.isArray(issue.test_steps) && issue.test_steps.length > 0 && (
                        <div className="bg-white border border-red-200 rounded-lg p-5">
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-list-ol text-blue-500"></i> Steps to Reproduce
                            </h4>
                            <div className="space-y-3">
                                {issue.test_steps.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-7 h-7 bg-primary bg-opacity-10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">{i + 1}</div>
                                        <p className="text-sm text-foreground pt-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Assigned To (live) */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-user-check text-indigo-500"></i> Currently Assigned
                        </h4>
                        <p className="text-sm text-foreground font-medium">
                            {issue.assigned_to
                                ? (users.find(u => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to)
                                : <span className="text-muted-foreground italic">Unassigned</span>}
                        </p>
                    </div>
                    {/* Comments Section */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-comments text-blue-500"></i> Comments
                            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">{issue.comments?.length || 0}</span>
                        </h4>
                        {issue.comments && issue.comments.length > 0 ? (
                            <div className="space-y-3">
                                {issue.comments.map((c) => (
                                    <div key={c.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                            {c.users?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-foreground">{c.users?.name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-foreground">{c.comment_text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No comments yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-4">
                    {/* Execution Context */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-info-circle text-blue-500"></i> Execution Context
                        </h4>
                        <div className="space-y-3">
                            {[
                                ["Test Case ID", issue.test_case_id],
                                ["Type", issue.test_type],
                                ["Priority", issue.priority],
                                ["Status", issue.status],
                                ["Preconditions", issue.preconditions],
                                ["Created At", issue.created_at ? new Date(issue.created_at).toLocaleString() : "—"],
                            ].map(([label, value]) => value ? (
                                <div key={label}>
                                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                    <p className="text-sm font-medium text-foreground">{value}</p>
                                </div>
                            ) : null)}
                            {issue.creator && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Reported By</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                            {issue.creator.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{issue.creator.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Priority badge */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-flag text-purple-500"></i> Priority
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded
                            ${issue.priority === "Critical" ? "bg-purple-100 text-purple-700"
                                : issue.priority === "High" ? "bg-red-100 text-red-700"
                                    : issue.priority === "Medium" ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-700"}`}>
                            <i className="fa-solid fa-exclamation-triangle"></i> {issue.priority || "—"}
                        </span>
                    </div>
                    {/* Actions */}
                    <div className="bg-white border border-red-200 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-tasks text-green-500"></i> Actions
                        </h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => onAssign(issue)}
                                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-95"
                            >
                                <i className="fa-solid fa-user-plus mr-2"></i>Assign to Developer
                            </button>
                            <button
                                onClick={() => onLinkBug(issue)}
                                className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95"
                            >
                                <i className="fa-solid fa-link mr-2"></i>Link to Bug Tracker
                            </button>
                            <button
                                onClick={() => onAddComment(issue)}
                                className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95"
                            >
                                <i className="fa-solid fa-comment mr-2"></i>Add Comment
                            </button>
                            <button
                                onClick={() => onExport(issue)}
                                className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95"
                            >
                                <i className="fa-solid fa-file-pdf mr-2"></i>Export Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function FailedIssues() {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [expandedIssue, setExpandedIssue] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ version: "", issueType: "", priority: "" });

    // Dialogs
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showCommentDialog, setShowCommentDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [assignedTo, setAssignedTo] = useState("");
    const [comment, setComment] = useState("");
    const [bugTrackerUrl, setBugTrackerUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const itemsPerPage = 5;

    // ── Fetch issues (failed = status 'Failed') with comments + creator ──
    const fetchIssues = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("test_cases")
            .select(`
                *,
                creator:users!created_by ( id, name, email ),
                comments (
                    id, comment_text, created_at,
                    users ( id, name )
                )
            `)
            .eq("status", "Failed")
            .order("created_at", { ascending: false });

        if (error) {
            addToast("Failed to load issues: " + error.message, "error");
        } else {
            // Attach empty details shape so IssueDetailsPanel works
            const shaped = (data || []).map(tc => ({
                ...tc,
                details: { failureComment: tc.actual_result }
            }));
            setIssues(shaped);
            setFilteredIssues(shaped);
        }
        setLoading(false);
    }, [addToast]);

    // ── Fetch users for assign dropdown ──
    const fetchUsers = useCallback(async () => {
        const { data } = await supabase
            .from("users")
            .select("id, name, email, role")
            .order("name");
        setUsers(data || []);
    }, []);

    useEffect(() => { fetchIssues(); fetchUsers(); }, [fetchIssues, fetchUsers]);

    // ── Search + filter ──
    useEffect(() => {
        let result = [...issues];
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.test_case_id?.toLowerCase().includes(q) ||
                i.name?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q)
            );
        }
        if (filters.priority) result = result.filter(i => i.priority === filters.priority);
        if (filters.issueType) result = result.filter(i => i.test_type === filters.issueType);
        setFilteredIssues(result);
        setCurrentPage(1);
    }, [issues, searchTerm, filters]);

    const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
    const paginatedIssues = filteredIssues.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleIssue = (id) => setExpandedIssue(prev => prev === id ? null : id);

    // ── Assign to Developer → updates assigned_to on test_cases ──
    const submitAssignment = async () => {
        if (!assignedTo.trim()) return addToast("Please select a developer", "error");
        setSubmitting(true);
        const { error } = await supabase
            .from("test_cases")
            .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
            .eq("id", selectedIssue.id);

        if (error) {
            addToast("Assignment failed: " + error.message, "error");
        } else {
            addToast(`✓ ${selectedIssue.test_case_id} assigned to ${assignedTo}`);
            setShowAssignDialog(false);
            setAssignedTo("");
            fetchIssues();
        }
        setSubmitting(false);
    };

    // ── Add Comment → inserts into comments table ──
    const submitComment = async () => {
        if (!comment.trim()) return addToast("Please enter a comment", "error");
        setSubmitting(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return addToast("You must be logged in to comment", "error");

        const { error } = await supabase.from("comments").insert({
            issue_id: selectedIssue.id,
            test_case_id: selectedIssue.id,
            user_id: session.user.id,
            comment_text: comment.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        if (error) {
            addToast("Comment failed: " + error.message, "error");
        } else {
            addToast("✓ Comment added");
            setShowCommentDialog(false);
            setComment("");
            fetchIssues();
        }
        setSubmitting(false);
    };

    // ── Link Bug Tracker → stores URL in description suffix or a dedicated field ──
    const submitBugLink = async () => {
        if (!bugTrackerUrl.trim()) return addToast("Please enter a tracker URL or ID", "error");
        setSubmitting(true);

        // We store the bug tracker reference in the preconditions field prefixed with [BUG_TRACKER]
        // If you add a dedicated column later, swap this update
        const currentPre = selectedIssue.preconditions || "";
        const trackerLine = `[BUG_TRACKER]: ${bugTrackerUrl.trim()}`;
        const newPre = currentPre.includes("[BUG_TRACKER]")
            ? currentPre.replace(/\[BUG_TRACKER\]:.*/, trackerLine)
            : [currentPre, trackerLine].filter(Boolean).join("\n");

        const { error } = await supabase
            .from("test_cases")
            .update({ preconditions: newPre, updated_at: new Date().toISOString() })
            .eq("id", selectedIssue.id);

        if (error) {
            addToast("Link failed: " + error.message, "error");
        } else {
            addToast("✓ Bug tracker linked");
            setShowLinkDialog(false);
            setBugTrackerUrl("");
            fetchIssues();
        }
        setSubmitting(false);
    };

    // ── Export all filtered issues as CSV ──
    const handleExportAll = () => {
        const rows = [
            ["Test Case ID", "Name", "Priority", "Status", "Type", "Assigned To", "Created At"],
            ...filteredIssues.map(i => [
                i.test_case_id, i.name, i.priority, i.status,
                i.test_type, i.assigned_to || "Unassigned",
                i.created_at ? new Date(i.created_at).toLocaleDateString() : ""
            ])
        ].map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");

        const blob = new Blob([rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `failed-issues-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`✓ Exported ${filteredIssues.length} issues as CSV`);
    };

    // ── Export single issue as TXT report ──
    const handleExportReport = (issue) => {
        const content = `
FAILED ISSUE REPORT
===================
Test Case ID : ${issue.test_case_id}
Name         : ${issue.name}
Priority     : ${issue.priority}
Status       : ${issue.status}
Type         : ${issue.test_type}
Assigned To  : ${issue.assigned_to || "Unassigned"}
Created At   : ${issue.created_at ? new Date(issue.created_at).toLocaleString() : ""}

EXPECTED RESULT
---------------
${issue.expected_result || "—"}

ACTUAL RESULT
-------------
${issue.actual_result || "—"}

STEPS
-----
${(issue.test_steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}

COMMENTS (${issue.comments?.length || 0})
--------
${(issue.comments || []).map(c => `[${new Date(c.created_at).toLocaleString()}] ${c.users?.name || "Unknown"}: ${c.comment_text}`).join("\n")}

Generated: ${new Date().toLocaleString()}
        `.trim();

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${issue.test_case_id}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`✓ Report exported for ${issue.test_case_id}`);
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setFilters({ version: "", issueType: "", priority: "" });
        addToast("Filters cleared", "info");
    };

    // ── Stats ──
    const stats = [
        { label: "Failed Issues", value: issues.length, badge: "Total", icon: "fa-bug", color: "red" },
        { label: "Critical", value: issues.filter(i => i.priority === "Critical").length, badge: "Critical", icon: "fa-exclamation-triangle", color: "purple" },
        { label: "High Priority", value: issues.filter(i => i.priority === "High").length, badge: "High", icon: "fa-arrow-up", color: "red" },
        { label: "Unassigned", value: issues.filter(i => !i.assigned_to).length, badge: "Open", icon: "fa-user-slash", color: "amber" },
        { label: "Total Comments", value: issues.reduce((acc, i) => acc + (i.comments?.length || 0), 0), badge: "Comments", icon: "fa-comments", color: "blue" },
    ];

    const priorityColors = {
        Critical: "bg-purple-100 text-purple-700",
        High: "bg-red-100 text-red-700",
        Medium: "bg-amber-100 text-amber-700",
        Low: "bg-gray-100 text-gray-700",
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background">
            <Toast toasts={toasts} />

            {/* Header */}
            <header className="bg-card border-b border-border relative z-30 flex-shrink-0">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Failed Issues Review</h2>
                            <p className="text-sm text-muted-foreground mt-1">Review and manage failed test cases — live from database</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchIssues}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
                                title="Refresh data"
                            >
                                <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}></i>
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button
                                onClick={handleExportAll}
                                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95"
                                title="Export as CSV"
                            >
                                <i className="fa-solid fa-file-export"></i>
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8">

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 bg-${s.color}-500 bg-opacity-10 rounded-lg flex items-center justify-center`}>
                                        <i className={`fa-solid ${s.icon} text-${s.color}-500 text-lg`}></i>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 bg-${s.color}-500 bg-opacity-10 text-${s.color}-600 rounded`}>{s.badge}</span>
                                </div>
                                <p className="text-3xl font-bold text-foreground mb-1">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-card border border-border rounded-lg shadow-sm mb-6 p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Search</label>
                                <div className="relative">
                                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                                    <input
                                        type="text"
                                        placeholder="TC ID, name, description..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Priority</label>
                                <select
                                    value={filters.priority}
                                    onChange={e => setFilters({ ...filters, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Test Type</label>
                                <select
                                    value={filters.issueType}
                                    onChange={e => setFilters({ ...filters, issueType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Types</option>
                                    <option value="Functional">Functional</option>
                                    <option value="UI">UI</option>
                                    <option value="Performance">Performance</option>
                                    <option value="Security">Security</option>
                                    <option value="Regression">Regression</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-95"
                            >
                                <i className="fa-solid fa-rotate-left mr-2"></i>Reset
                            </button>
                            <div className="flex-1" />
                            <span className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{filteredIssues.length}</span> issues
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border rounded-lg shadow-sm">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                                <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                                <span className="text-sm">Loading failed issues from database...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            {["Test Case", "Name", "Priority", "Type", "Assigned To", "Comments", "Date", ""].map(h => (
                                                <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedIssues.length > 0 ? paginatedIssues.map(issue => (
                                            <React.Fragment key={issue.id}>
                                                <tr
                                                    onClick={() => toggleIssue(issue.id)}
                                                    className={`cursor-pointer transition-colors ${expandedIssue === issue.id ? "bg-red-50" : "hover:bg-muted"}`}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                                                <i className="fa-solid fa-bug text-red-500 text-sm"></i>
                                                            </div>
                                                            <span className="text-sm font-semibold text-foreground">{issue.test_case_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-[200px]">
                                                        <p className="text-sm font-medium text-foreground truncate">{issue.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded ${priorityColors[issue.priority] || "bg-gray-100 text-gray-700"}`}>
                                                            {issue.priority || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                            {issue.test_type || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {issue.assigned_to ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                                    {(users.find(u => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to)[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="text-sm text-foreground truncate max-w-[100px]">
                                                                    {users.find(u => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            <i className="fa-solid fa-comment"></i> {issue.comments?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <p className="text-sm text-foreground">{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "—"}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); toggleIssue(issue.id); }}
                                                            className="text-primary hover:opacity-80 transition-opacity"
                                                        >
                                                            <i className={`fa-solid ${expandedIssue === issue.id ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                                                        </button>
                                                    </td>
                                                </tr>

                                                {expandedIssue === issue.id && (
                                                    <tr>
                                                        <td colSpan={8} className="p-0">
                                                            <IssueDetailsPanel
                                                                issue={issue}
                                                                users={users}
                                                                onAssign={i => { setSelectedIssue(i); setAssignedTo(i.assigned_to || ""); setShowAssignDialog(true); }}
                                                                onLinkBug={i => { setSelectedIssue(i); setBugTrackerUrl(""); setShowLinkDialog(true); }}
                                                                onAddComment={i => { setSelectedIssue(i); setComment(""); setShowCommentDialog(true); }}
                                                                onExport={handleExportReport}
                                                                onDownload={name => addToast(`Download triggered: ${name}`, "info")}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-16 text-center">
                                                    <i className="fa-solid fa-circle-check text-green-400 text-3xl mb-3 block"></i>
                                                    <p className="text-muted-foreground font-medium">No failed issues found</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or refreshing</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-muted-foreground">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length} issues
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium active:scale-95 ${currentPage === p ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Assign Dialog ── */}
            {showAssignDialog && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowAssignDialog(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">Assign to Developer</h3>
                                <p className="text-sm text-muted-foreground mt-1">{selectedIssue?.test_case_id} — {selectedIssue?.name}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Select from team</label>
                                    <select
                                        value={assignedTo}
                                        onChange={e => setAssignedTo(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Choose a developer...</option>
                                        {users.filter(u => u.role === "developer" || u.role === "Developer" || !u.role).map(u => (
                                            <option key={u.id} value={u.name}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Or type a name</label>
                                    <input
                                        type="text"
                                        placeholder="Developer name..."
                                        value={assignedTo}
                                        onChange={e => setAssignedTo(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-border flex gap-3">
                                <button onClick={() => setShowAssignDialog(false)}
                                    className="flex-1 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={submitAssignment} disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 disabled:opacity-60">
                                    {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : null}
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Link Bug Tracker Dialog ── */}
            {showLinkDialog && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowLinkDialog(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">Link to Bug Tracker</h3>
                                <p className="text-sm text-muted-foreground mt-1">{selectedIssue?.test_case_id}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Bug Tracker URL or Ticket ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. https://jira.company.com/BUG-123 or BUG-123"
                                        value={bugTrackerUrl}
                                        onChange={e => setBugTrackerUrl(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">This will be saved as a reference on the test case record.</p>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-border flex gap-3">
                                <button onClick={() => setShowLinkDialog(false)}
                                    className="flex-1 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={submitBugLink} disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 disabled:opacity-60">
                                    {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : null}
                                    Save Link
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Comment Dialog ── */}
            {showCommentDialog && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCommentDialog(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">Add Comment</h3>
                                <p className="text-sm text-muted-foreground mt-1">{selectedIssue?.test_case_id} — {selectedIssue?.name}</p>
                            </div>
                            <div className="p-6">
                                <label className="text-sm font-medium text-foreground mb-2 block">Your Comment</label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe the issue, steps tried, or any notes..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                            <div className="px-6 py-4 border-t border-border flex gap-3">
                                <button onClick={() => setShowCommentDialog(false)}
                                    className="flex-1 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={submitComment} disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 disabled:opacity-60">
                                    {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : null}
                                    Add Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}