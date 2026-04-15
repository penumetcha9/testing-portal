import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import React from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
    Critical: "bg-purple-100 text-purple-700",
    High: "bg-red-100    text-red-700",
    Medium: "bg-amber-100  text-amber-700",
    Low: "bg-slate-100  text-slate-600",
};
const getPriStyle = (p) => PRIORITY_STYLES[p] || "bg-slate-100 text-slate-600";

// ── Custom Dropdown ───────────────────────────────────────────────────────────
const DROPDOWN_STYLES = `
    @keyframes dropdownIn {
        from { opacity: 0; transform: translateY(-6px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
`;

function Dropdown({ options, value, onChange, placeholder = "Select…" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const label = options.find(o => o.value === value)?.label;

    const triggerStyle = {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: open
            ? "linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)"
            : "linear-gradient(135deg, #fafbff 0%, #f4f6fb 100%)",
        border: open ? "1.5px solid #6366f1" : "1.5px solid #e2e6f0",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: label ? "#1e293b" : "#94a3b8",
        boxShadow: open
            ? "0 0 0 3px rgba(99,102,241,.12), 0 2px 8px rgba(99,102,241,.08)"
            : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "all 0.18s ease",
        outline: "none",
    };

    const panelStyle = {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#ffffff",
        border: "1.5px solid #e8eaf6",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(99,102,241,.13), 0 2px 8px rgba(0,0,0,.08)",
        padding: 6,
        animation: "dropdownIn 0.18s cubic-bezier(.4,0,.2,1)",
        maxHeight: 240,
        overflowY: "auto",
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <style>{DROPDOWN_STYLES}</style>
            <button type="button" onClick={() => setOpen(p => !p)} style={triggerStyle}>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label || placeholder}
                </span>
                <svg
                    style={{ width: 15, height: 15, marginLeft: 8, flexShrink: 0, transition: "transform 0.18s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: open ? "#6366f1" : "#94a3b8" }}
                    viewBox="0 0 14 14" fill="none"
                >
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div style={panelStyle}>
                    {options.map(opt => {
                        const sel = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: "9px 12px",
                                    borderRadius: 8,
                                    fontSize: 13.5,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.12s ease",
                                    background: sel ? "linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%)" : "transparent",
                                    color: sel ? "#4f46e5" : "#374151",
                                    fontWeight: sel ? 600 : 400,
                                }}
                                onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#1e293b"; } }}
                                onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#374151"; } }}
                            >
                                <span>{opt.label}</span>
                                {sel && (
                                    <svg style={{ width: 13, height: 13, flexShrink: 0, marginLeft: 8, color: "#4f46e5" }} viewBox="0 0 14 14" fill="none">
                                        <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto transition-all
            ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}>
                    <i className={`fa-solid ${t.type === "success" ? "fa-check-circle" : t.type === "error" ? "fa-times-circle" : "fa-info-circle"}`} />
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Issue Details Panel ───────────────────────────────────────────────────────
function IssueDetailsPanel({ issue, users, onAssign, onLinkBug, onAddComment, onExport }) {
    return (
        <div className="p-6 bg-red-50/60 border-t border-red-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — main content */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Failure Comment */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                            <i className="fa-solid fa-comment-dots text-red-400" /> Failure Comment
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{issue.actual_result || issue.failure_comment || "—"}</p>
                    </div>

                    {/* Expected vs Actual */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-red-200 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                                <i className="fa-solid fa-times-circle text-red-400" /> Actual Behavior
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{issue.actual_result || issue.actual_behavior || "—"}</p>
                        </div>
                        <div className="bg-white border border-red-200 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-emerald-500" /> Expected Behavior
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{issue.expected_result || issue.expected_behavior || "—"}</p>
                        </div>
                    </div>

                    {/* Steps to Reproduce */}
                    {(Array.isArray(issue.test_steps) ? issue.test_steps : []).length > 0 && (
                        <div className="bg-white border border-red-200 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-list-ol text-blue-400" /> Steps to Reproduce
                            </h4>
                            <div className="space-y-2.5">
                                {issue.test_steps.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</div>
                                        <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Steps to reproduce stored as text */}
                    {issue.steps_to_reproduce && (
                        <div className="bg-white border border-red-200 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                                <i className="fa-solid fa-list-ol text-blue-400" /> Steps to Reproduce
                            </h4>
                            <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">{issue.steps_to_reproduce}</pre>
                        </div>
                    )}

                    {/* Currently Assigned */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                            <i className="fa-solid fa-user-check text-indigo-400" /> Currently Assigned
                        </h4>
                        {issue.assigned_to ? (
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                    {(users.find((u) => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to)[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                    {users.find((u) => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to}
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Unassigned</p>
                        )}
                    </div>

                    {/* Comments */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-comments text-blue-400" /> Comments
                            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">{issue.comments?.length || 0}</span>
                        </h4>
                        {issue.comments && issue.comments.length > 0 ? (
                            <div className="space-y-3">
                                {issue.comments.map((c) => (
                                    <div key={c.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                            {c.users?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-slate-800">{c.users?.name || "Unknown"}</span>
                                                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{c.comment_text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No comments yet.</p>
                        )}
                    </div>
                </div>

                {/* Right — sidebar */}
                <div className="space-y-4">
                    {/* Execution Context */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-info-circle text-blue-400" /> Execution Context
                        </h4>
                        <div className="space-y-3">
                            {[
                                ["Test Case ID", issue.test_case_id],
                                ["Type", issue.test_type],
                                ["Priority", issue.priority],
                                ["Status", issue.status],
                                ["Environment", issue.environment],
                                ["Browser", issue.browser],
                                ["Created At", issue.created_at ? new Date(issue.created_at).toLocaleString() : null],
                            ].map(([label, value]) =>
                                value ? (
                                    <div key={label}>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                                        <p className="text-sm font-medium text-slate-800 capitalize">{value}</p>
                                    </div>
                                ) : null
                            )}
                            {issue.creator && (
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Reported By</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                            {issue.creator.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-800">{issue.creator.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Priority badge */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-flag text-purple-400" /> Priority
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg ${getPriStyle(issue.priority)}`}>
                            <i className="fa-solid fa-exclamation-triangle text-xs" />{issue.priority || "—"}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="bg-white border border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-bolt text-emerald-500" /> Actions
                        </h4>
                        <div className="space-y-2">
                            <button onClick={() => onAssign(issue)}
                                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors active:scale-95 flex items-center gap-2">
                                <i className="fa-solid fa-user-plus" />Assign to Developer
                            </button>
                            <button onClick={() => onLinkBug(issue)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors active:scale-95 flex items-center gap-2">
                                <i className="fa-solid fa-link" />Link to Bug Tracker
                            </button>
                            <button onClick={() => onAddComment(issue)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors active:scale-95 flex items-center gap-2">
                                <i className="fa-solid fa-comment" />Add Comment
                            </button>
                            <button onClick={() => onExport(issue)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors active:scale-95 flex items-center gap-2">
                                <i className="fa-solid fa-file-lines" />Export Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Dialog Wrapper ────────────────────────────────────────────────────────────
function Dialog({ title, subtitle, onClose, children, footer }) {
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><i className="fa-solid fa-xmark" /></button>
                    </div>
                    <div className="p-6">{children}</div>
                    {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3">{footer}</div>}
                </div>
            </div>
        </>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FailedIssues() {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [expandedIssue, setExpandedIssue] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ issueType: "", priority: "" });

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
        setToasts((p) => [...p, { id, message, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    }, []);

    const ITEMS_PER_PAGE = 8;

    // ── Fetch issues (test_cases with status = 'fail') ──
    const fetchIssues = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("test_cases")
            .select(`
        *,
        creator:profiles!created_by ( id, full_name, email ),
        comments (
          id, comment_text, created_at,
          profiles ( id, full_name )
        )
      `)
            .in("status", ["fail", "Failed", "failed"])
            .order("created_at", { ascending: false });

        if (error) {
            addToast("Failed to load issues: " + error.message, "error");
        } else {
            const shaped = (data || []).map((tc) => ({
                ...tc,
                // Normalise creator shape (profiles uses full_name not name)
                creator: tc.creator ? { ...tc.creator, name: tc.creator.full_name } : null,
                // Normalise comment users
                comments: (tc.comments || []).map((c) => ({
                    ...c,
                    users: c.profiles ? { ...c.profiles, name: c.profiles.full_name } : c.users,
                })),
            }));
            setIssues(shaped);
            setFilteredIssues(shaped);
        }
        setLoading(false);
    }, [addToast]);

    const fetchUsers = useCallback(async () => {
        // Try profiles table first (matches auth.users), fall back to users table
        const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .order("full_name");
        if (profileData && profileData.length) {
            setUsers(profileData.map((u) => ({ ...u, name: u.full_name })));
        } else {
            const { data } = await supabase.from("users").select("id, name, email, role").order("name");
            setUsers(data || []);
        }
    }, []);

    useEffect(() => { fetchIssues(); fetchUsers(); }, [fetchIssues, fetchUsers]);

    // ── Filter logic ──
    useEffect(() => {
        let result = [...issues];
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter((i) =>
                i.test_case_id?.toLowerCase().includes(q) ||
                i.name?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q)
            );
        }
        if (filters.priority) result = result.filter((i) => i.priority === filters.priority);
        if (filters.issueType) result = result.filter((i) => i.test_type === filters.issueType);
        setFilteredIssues(result);
        setCurrentPage(1);
    }, [issues, searchTerm, filters]);

    const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);
    const paginatedIssues = filteredIssues.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleIssue = (id) => setExpandedIssue((p) => (p === id ? null : id));

    // ── Assign ──
    const submitAssignment = async () => {
        if (!assignedTo.trim()) return addToast("Please select or type a developer name", "error");
        setSubmitting(true);
        const { error } = await supabase
            .from("test_cases")
            .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
            .eq("id", selectedIssue.id);
        if (error) addToast("Assignment failed: " + error.message, "error");
        else { addToast(`✓ ${selectedIssue.test_case_id} assigned to ${assignedTo}`); setShowAssignDialog(false); setAssignedTo(""); fetchIssues(); }
        setSubmitting(false);
    };

    // ── Comment ──
    const submitComment = async () => {
        if (!comment.trim()) return addToast("Please enter a comment", "error");
        setSubmitting(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSubmitting(false); return addToast("You must be logged in to comment", "error"); }
        const { error } = await supabase.from("comments").insert({
            test_case_id: selectedIssue.id,
            user_id: session.user.id,
            comment_text: comment.trim(),
            created_at: new Date().toISOString(),
        });
        if (error) addToast("Comment failed: " + error.message, "error");
        else { addToast("✓ Comment added"); setShowCommentDialog(false); setComment(""); fetchIssues(); }
        setSubmitting(false);
    };

    // ── Link bug tracker ──
    const submitBugLink = async () => {
        if (!bugTrackerUrl.trim()) return addToast("Please enter a tracker URL or ID", "error");
        setSubmitting(true);
        const trackerLine = `[BUG_TRACKER]: ${bugTrackerUrl.trim()}`;
        const current = selectedIssue.preconditions || "";
        const newPre = current.includes("[BUG_TRACKER]")
            ? current.replace(/\[BUG_TRACKER\]:.*/, trackerLine)
            : [current, trackerLine].filter(Boolean).join("\n");
        const { error } = await supabase
            .from("test_cases")
            .update({ preconditions: newPre, updated_at: new Date().toISOString() })
            .eq("id", selectedIssue.id);
        if (error) addToast("Link failed: " + error.message, "error");
        else { addToast("✓ Bug tracker linked"); setShowLinkDialog(false); setBugTrackerUrl(""); fetchIssues(); }
        setSubmitting(false);
    };

    // ── Export all as CSV ──
    const handleExportAll = () => {
        const rows = [
            ["Test Case ID", "Name", "Priority", "Status", "Type", "Assigned To", "Created At"],
            ...filteredIssues.map((i) => [
                i.test_case_id, i.name, i.priority, i.status,
                i.test_type, i.assigned_to || "Unassigned",
                i.created_at ? new Date(i.created_at).toLocaleDateString() : "",
            ]),
        ].map((r) => r.map((c) => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `failed-issues-${new Date().toISOString().split("T")[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
        addToast(`✓ Exported ${filteredIssues.length} issues`);
    };

    // ── Export single ──
    const handleExportReport = (issue) => {
        const content = `FAILED ISSUE REPORT\n${"=".repeat(40)}\nTest Case ID : ${issue.test_case_id}\nName         : ${issue.name}\nPriority     : ${issue.priority}\nStatus       : ${issue.status}\nType         : ${issue.test_type}\nAssigned To  : ${issue.assigned_to || "Unassigned"}\nCreated At   : ${issue.created_at ? new Date(issue.created_at).toLocaleString() : ""}\n\nEXPECTED RESULT\n${"-".repeat(20)}\n${issue.expected_result || "—"}\n\nACTUAL RESULT\n${"-".repeat(20)}\n${issue.actual_result || "—"}\n\nCOMMENTS (${issue.comments?.length || 0})\n${"-".repeat(20)}\n${(issue.comments || []).map((c) => `[${new Date(c.created_at).toLocaleString()}] ${c.users?.name || "Unknown"}: ${c.comment_text}`).join("\n")}\n\nGenerated: ${new Date().toLocaleString()}`.trim();
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `report-${issue.test_case_id}-${Date.now()}.txt`; a.click();
        URL.revokeObjectURL(url);
        addToast(`✓ Report exported for ${issue.test_case_id}`);
    };

    // ── Stats ──
    const stats = [
        { label: "Total Failed", value: issues.length, icon: "fa-bug", color: "red" },
        { label: "High Priority", value: issues.filter((i) => i.priority === "High").length, icon: "fa-arrow-up", color: "red" },
        { label: "Unassigned", value: issues.filter((i) => !i.assigned_to).length, icon: "fa-user-slash", color: "amber" },
        { label: "Total Comments", value: issues.reduce((a, i) => a + (i.comments?.length || 0), 0), icon: "fa-comments", color: "blue" },
    ];

    const colorMap = { red: ["bg-red-100", "text-red-600", "text-red-500"], purple: ["bg-purple-100", "text-purple-600", "text-purple-500"], amber: ["bg-amber-100", "text-amber-600", "text-amber-500"], blue: ["bg-blue-100", "text-blue-600", "text-blue-500"] };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <Toast toasts={toasts} />

            {/* ── Header ── */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0 z-30">
                <div className="px-4 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Failed Issues Review</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Review and manage failed test cases — live from database</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button onClick={fetchIssues} disabled={loading}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 active:scale-95">
                                <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button onClick={handleExportAll}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-95">
                                <i className="fa-solid fa-file-export" /><span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8 space-y-5">

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((s) => {
                            const [bgC, textC, iconC] = colorMap[s.color];
                            return (
                                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-10 h-10 ${bgC} rounded-lg flex items-center justify-center`}>
                                            <i className={`fa-solid ${s.icon} ${iconC} text-lg`} />
                                        </div>
                                    </div>
                                    <p className={`text-2xl font-bold ${textC} mb-0.5`}>{s.value}</p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Filters ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Search</label>
                                <div className="relative">
                                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                    <input type="text" placeholder="TC ID, name, description…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                                <Dropdown
                                    value={filters.priority}
                                    onChange={(v) => setFilters({ ...filters, priority: v })}
                                    placeholder="All Priorities"
                                    options={[
                                        { value: "", label: "All Priorities" },
                                        { value: "High", label: "High" },
                                        { value: "Medium", label: "Medium" },
                                        { value: "Low", label: "Low" },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Test Type</label>
                                <Dropdown
                                    value={filters.issueType}
                                    onChange={(v) => setFilters({ ...filters, issueType: v })}
                                    placeholder="All Types"
                                    options={[
                                        { value: "", label: "All Types" },
                                        { value: "Functional", label: "Functional" },
                                        { value: "UI", label: "UI" },
                                        { value: "Performance", label: "Performance" },
                                        { value: "Security", label: "Security" },
                                        { value: "Regression", label: "Regression" },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button onClick={() => { setSearchTerm(""); setFilters({ issueType: "", priority: "" }); }}
                                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-95">
                                <i className="fa-solid fa-rotate-left mr-1.5" />Reset
                            </button>
                            <span className="ml-auto text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-800">{filteredIssues.length}</span> issue{filteredIssues.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                                <i className="fa-solid fa-spinner animate-spin text-xl" />
                                <span className="text-sm">Loading failed issues…</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {["Test Case", "Name", "Priority", "Type", "Assigned To", "Comments", "Date", ""].map((h) => (
                                                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedIssues.length > 0 ? paginatedIssues.map((issue) => (
                                            <React.Fragment key={issue.id}>
                                                <tr onClick={() => toggleIssue(issue.id)}
                                                    className={`cursor-pointer transition-colors ${expandedIssue === issue.id ? "bg-red-50" : "hover:bg-slate-50"}`}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <i className="fa-solid fa-bug text-red-500 text-sm" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-900">{issue.test_case_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-[200px]">
                                                        <p className="text-sm font-medium text-slate-900 truncate">{issue.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{issue.description}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${getPriStyle(issue.priority)}`}>
                                                            {issue.priority || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{issue.test_type || "—"}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {issue.assigned_to ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                                    {(users.find((u) => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to)[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="text-sm text-slate-800 truncate max-w-[90px]">
                                                                    {users.find((u) => u.id === issue.assigned_to || u.name === issue.assigned_to)?.name || issue.assigned_to}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                            <i className="fa-solid fa-comment text-xs" />{issue.comments?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <p className="text-sm text-slate-600">{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "—"}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button onClick={(e) => { e.stopPropagation(); toggleIssue(issue.id); }}
                                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                            <i className={`fa-solid ${expandedIssue === issue.id ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {expandedIssue === issue.id && (
                                                    <tr>
                                                        <td colSpan={8} className="p-0">
                                                            <IssueDetailsPanel
                                                                issue={issue}
                                                                users={users}
                                                                onAssign={(i) => { setSelectedIssue(i); setAssignedTo(i.assigned_to || ""); setShowAssignDialog(true); }}
                                                                onLinkBug={(i) => { setSelectedIssue(i); setBugTrackerUrl(""); setShowLinkDialog(true); }}
                                                                onAddComment={(i) => { setSelectedIssue(i); setComment(""); setShowCommentDialog(true); }}
                                                                onExport={handleExportReport}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-16 text-center">
                                                    <i className="fa-solid fa-circle-check text-emerald-400 text-3xl mb-3 block" />
                                                    <p className="text-slate-500 font-medium">No failed issues found</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or refreshing</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-500">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredIssues.length)} of {filteredIssues.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                        <i className="fa-solid fa-chevron-left" />
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`px-3.5 py-2 rounded-lg text-sm font-medium ${currentPage === p ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                        <i className="fa-solid fa-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Assign Dialog ── */}
            {showAssignDialog && (
                <Dialog title="Assign to Developer" subtitle={`${selectedIssue?.test_case_id} — ${selectedIssue?.name}`}
                    onClose={() => setShowAssignDialog(false)}
                    footer={<>
                        <button onClick={() => setShowAssignDialog(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                        <button onClick={submitAssignment} disabled={submitting} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                            {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2" /> : null}Assign
                        </button>
                    </>}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-800 mb-2 block">Select from team</label>
                            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="">Choose a developer…</option>
                                {users.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-800 mb-2 block">Or type a name</label>
                            <input type="text" placeholder="Developer name…" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </Dialog>
            )}

            {/* ── Link Bug Tracker Dialog ── */}
            {showLinkDialog && (
                <Dialog title="Link to Bug Tracker" subtitle={selectedIssue?.test_case_id}
                    onClose={() => setShowLinkDialog(false)}
                    footer={<>
                        <button onClick={() => setShowLinkDialog(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                        <button onClick={submitBugLink} disabled={submitting} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                            {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2" /> : null}Save Link
                        </button>
                    </>}>
                    <div>
                        <label className="text-sm font-medium text-slate-800 mb-2 block">Bug Tracker URL or Ticket ID</label>
                        <input type="text" placeholder="https://jira.company.com/BUG-123 or BUG-123" value={bugTrackerUrl} onChange={(e) => setBugTrackerUrl(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <p className="text-xs text-slate-400 mt-2">Saved as a reference on the test case record.</p>
                    </div>
                </Dialog>
            )}

            {/* ── Comment Dialog ── */}
            {showCommentDialog && (
                <Dialog title="Add Comment" subtitle={`${selectedIssue?.test_case_id} — ${selectedIssue?.name}`}
                    onClose={() => setShowCommentDialog(false)}
                    footer={<>
                        <button onClick={() => setShowCommentDialog(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                        <button onClick={submitComment} disabled={submitting} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                            {submitting ? <i className="fa-solid fa-spinner animate-spin mr-2" /> : null}Add Comment
                        </button>
                    </>}>
                    <div>
                        <label className="text-sm font-medium text-slate-800 mb-2 block">Your Comment</label>
                        <textarea rows={4} placeholder="Describe the issue, steps tried, or any notes…" value={comment} onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    </div>
                </Dialog>
            )}
        </div>
    );
}