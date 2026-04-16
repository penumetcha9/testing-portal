import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from "../services/supabaseClient";

// ── Status / Criticality meta ─────────────────────────────────────────────────
const STATUS_META = {
    'Draft': { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    'Submitted': { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
    'In Progress': { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
    'Completed': { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
    'On Hold': { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
    'Cancelled': { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
};
const CRIT_META = {
    'Critical': { bg: '#fef2f2', color: '#b91c1c' },
    'High': { bg: '#fff7ed', color: '#c2410c' },
    'Medium': { bg: '#fefce8', color: '#854d0e' },
    'Low': { bg: '#f0fdf4', color: '#15803d' },
};

const Badge = ({ text, meta }) => {
    if (!text || !meta) return <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99,
            background: meta.bg, color: meta.color,
            fontSize: 11.5, fontWeight: 600,
        }}>
            {meta.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />}
            {text}
        </span>
    );
};

// ── Filter Pill ───────────────────────────────────────────────────────────────
// PILL_W  — every trigger button is exactly this wide (never shifts on selection)
// DROP_W  — every dropdown panel is exactly this wide (never grows with content)
const PILL_W = 148;
const DROP_W = 220;

const FilterPill = ({ label, icon, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const active = !!value;
    // Truncate to prevent button from overflowing its fixed width
    const displayLabel = active
        ? (value.length > 14 ? value.slice(0, 13) + '…' : value)
        : label;

    return (
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            {/* Trigger button — fixed width always */}
            <button
                onClick={() => setOpen(p => !p)}
                style={{
                    width: PILL_W,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                    padding: '7px 12px',
                    background: active ? '#f0fdf4' : '#fff',
                    border: `1.5px solid ${active ? '#22c55e' : '#e2e8f0'}`,
                    borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? '#15803d' : '#374151',
                    cursor: 'pointer', overflow: 'hidden',
                    boxShadow: active ? '0 0 0 3px rgba(34,197,94,0.10)' : 'none',
                    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    <i className={`fa-solid ${icon}`} style={{ fontSize: 11, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayLabel}
                    </span>
                </span>
                {active ? (
                    <span
                        onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', color: '#16a34a', flexShrink: 0, cursor: 'pointer' }}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </span>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {/* Dropdown panel — fixed width always */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                    width: DROP_W,
                    padding: 6,
                    animation: 'pillDrop 0.15s ease',
                }}>
                    {/* Reset row */}
                    <div
                        onClick={() => { onChange(''); setOpen(false); }}
                        style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        All {label}
                    </div>

                    {/* Options — text truncated so panel never widens */}
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            style={{
                                padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                color: value === opt ? '#15803d' : '#1e293b',
                                fontWeight: value === opt ? 600 : 400,
                                background: value === opt ? '#f0fdf4' : 'transparent',
                            }}
                            onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = value === opt ? '#f0fdf4' : 'transparent'; }}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                                {opt}
                            </span>
                            {value === opt && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                    <path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Story Card (Grid view) ────────────────────────────────────────────────────
const StoryCard = ({ story, onClick, onEdit, onDelete }) => {
    const [hov, setHov] = useState(false);
    const sm = STATUS_META[story.current_status] || STATUS_META['Draft'];
    const cm = CRIT_META[story.criticality];
    return (
        <div
            onClick={() => onClick(story)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                width: '100%', height: '100%',
                background: '#fff', border: `1.5px solid ${hov ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                boxShadow: hov ? '0 8px 24px rgba(34,197,94,0.13), 0 2px 8px rgba(0,0,0,0.05)' : '0 1px 4px rgba(0,0,0,0.05)',
                transform: hov ? 'translateY(-2px)' : 'translateY(0)',
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#22c55e,#16a34a)', opacity: hov ? 1 : 0, transition: 'opacity 0.18s', borderRadius: '14px 14px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Mono', 'Fira Mono', monospace", fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}>
                        {story.story_id}
                    </span>
                    {story.story_type && (
                        <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                            {story.story_type}
                        </span>
                    )}
                </div>
                {/* Action buttons — stop propagation so card click doesn't fire */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={e => onEdit(e, story)} title="Edit story"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 7, background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: 12, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                        <i className="fa-solid fa-pen-to-square" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(story); }} title="Delete story"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 7, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                        <i className="fa-solid fa-trash" />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                <Badge text={story.current_status || 'Draft'} meta={sm} />
                {story.criticality && <Badge text={story.criticality} meta={cm} />}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {story.story_title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled story</span>}
            </h3>

            {story.story_summary && (
                <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {story.story_summary}
                </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                {story.module && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-cube" style={{ color: '#a78bfa', fontSize: 10 }} />{story.module}</span>}
                {story.feature && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-puzzle-piece" style={{ color: '#34d399', fontSize: 10 }} />{story.feature}</span>}
                {story.planned_release && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-tag" style={{ color: '#60a5fa', fontSize: 10 }} />{story.planned_release}</span>}
                {story.story_points && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-circle-dot" style={{ color: '#fb923c', fontSize: 10 }} />{story.story_points} pts</span>}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                    {story.updated_at ? new Date(story.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                    { label: 'Dev', val: story.development_status, c: { 'Completed': '#22c55e', 'In Progress': '#f97316', 'Not Started': null, 'On Hold': '#eab308' } },
                    { label: 'QA', val: story.qa_status, c: { 'Pass': '#22c55e', 'Fail': '#ef4444', 'In Progress': '#f97316', 'Not Started': null, 'Blocked': '#f97316' } },
                    { label: 'Release', val: story.release_status, c: { 'Released': '#22c55e', 'Scheduled': '#3b82f6', 'Not Released': null, 'Rolled Back': '#ef4444' } },
                ].map(({ label, val, c }) => {
                    const clr = c[val];
                    return clr ? (
                        <span key={label} style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: `${clr}18`, color: clr, border: `1px solid ${clr}30` }}>
                            {label}: {val}
                        </span>
                    ) : null;
                })}
            </div>
        </div>
    );
};

// ── Stats row ─────────────────────────────────────────────────────────────────
const StatsRow = ({ stories }) => {
    const counts = stories.reduce((a, s) => { const st = s.current_status || 'Draft'; a[st] = (a[st] || 0) + 1; return a; }, {});
    const stats = [
        { label: 'Total', val: stories.length, color: '#6366f1', icon: 'fa-layer-group' },
        { label: 'In Progress', val: counts['In Progress'] || 0, color: '#f97316', icon: 'fa-spinner' },
        { label: 'Submitted', val: counts['Submitted'] || 0, color: '#2563eb', icon: 'fa-paper-plane' },
    ];
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
            width: '100%',
        }}>
            {stats.map(s => (
                <div key={s.label} style={{
                    height: 72,
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}>
                    <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 15 }} />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const UserStoriesList = () => {
    const navigate = useNavigate();

    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [filterFeature, setFilterFeature] = useState('');
    const [filterVersion, setFilterVersion] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCrit, setFilterCrit] = useState('');
    const [sortBy, setSortBy] = useState('updated_at');
    const [viewMode, setViewMode] = useState('grid');

    const [moduleOpts, setModuleOpts] = useState([]);
    const [featureOpts, setFeatureOpts] = useState([]);
    const [versionOpts, setVersionOpts] = useState([]);

    // ── Edit / Delete state ──
    const [editingStory, setEditingStory] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true); setError(null);
            try {
                const { data, error } = await supabase
                    .from('user_stories')
                    .select('id,story_id,story_type,story_title,story_summary,module,feature,planned_release,version_build,current_status,criticality,story_points,development_status,qa_status,release_status,approval_status,created_at,updated_at,created_by')
                    .order('updated_at', { ascending: false });
                if (error) throw error;
                const rows = data || [];
                setStories(rows);
                setModuleOpts([...new Set(rows.map(r => r.module).filter(Boolean))].sort());
                setFeatureOpts([...new Set(rows.map(r => r.feature).filter(Boolean))].sort());
                setVersionOpts([...new Set(rows.map(r => r.planned_release || r.version_build).filter(Boolean))].sort());
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        })();
    }, []);

    const handleSelectStory = (story) => navigate(`/stories/${story.story_id}`);
    const handleNewStory = () => navigate('/stories/new');

    const fetchStories = async () => {
        const { data, error } = await supabase
            .from('user_stories')
            .select('id,story_id,story_type,story_title,story_summary,module,feature,planned_release,version_build,current_status,criticality,story_points,development_status,qa_status,release_status,approval_status,created_at,updated_at,created_by')
            .order('updated_at', { ascending: false });
        if (error) return;
        const rows = data || [];
        setStories(rows);
        setModuleOpts([...new Set(rows.map(r => r.module).filter(Boolean))].sort());
        setFeatureOpts([...new Set(rows.map(r => r.feature).filter(Boolean))].sort());
        setVersionOpts([...new Set(rows.map(r => r.planned_release || r.version_build).filter(Boolean))].sort());
    };

    const openEditModal = (e, story) => {
        e.stopPropagation();
        setEditForm({
            story_title: story.story_title || '',
            story_summary: story.story_summary || '',
            story_type: story.story_type || '',
            current_status: story.current_status || 'Draft',
            criticality: story.criticality || '',
            module: story.module || '',
            feature: story.feature || '',
            planned_release: story.planned_release || '',
            story_points: story.story_points || '',
            development_status: story.development_status || '',
            qa_status: story.qa_status || '',
            release_status: story.release_status || '',
        });
        setEditingStory(story);
    };

    const handleUpdateStory = async () => {
        if (!editForm.story_title) { alert('Story title is required'); return; }
        setEditLoading(true);
        const { data: updated, error } = await supabase
            .from('user_stories')
            .update({
                story_title: editForm.story_title,
                story_summary: editForm.story_summary || null,
                story_type: editForm.story_type || null,
                current_status: editForm.current_status || 'Draft',
                criticality: editForm.criticality || null,
                module: editForm.module || null,
                feature: editForm.feature || null,
                planned_release: editForm.planned_release || null,
                story_points: editForm.story_points ? parseInt(editForm.story_points) : null,
                development_status: editForm.development_status || null,
                qa_status: editForm.qa_status || null,
                release_status: editForm.release_status || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', editingStory.id)
            .select();
        setEditLoading(false);
        if (error) { alert(`Error: ${error.message}`); return; }
        if (!updated || updated.length === 0) { alert('Update blocked — check RLS policies on user_stories table.'); return; }
        setEditingStory(null);
        fetchStories();
    };

    const handleDeleteStory = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        const { error } = await supabase.from('user_stories').delete().eq('id', deleteTarget.id);
        setDeleteLoading(false);
        if (error) { alert(`Error: ${error.message}`); return; }
        setDeleteTarget(null);
        fetchStories();
    };

    const filtered = stories
        .filter(s => {
            const q = search.toLowerCase();
            return (
                (!q || (s.story_id || '').toLowerCase().includes(q) || (s.story_title || '').toLowerCase().includes(q) || (s.story_summary || '').toLowerCase().includes(q))
                && (!filterModule || s.module === filterModule)
                && (!filterFeature || s.feature === filterFeature)
                && (!filterVersion || s.planned_release === filterVersion || s.version_build === filterVersion)
                && (!filterStatus || s.current_status === filterStatus)
                && (!filterCrit || s.criticality === filterCrit)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'story_id') return (a.story_id || '').localeCompare(b.story_id || '');
            if (sortBy === 'title') return (a.story_title || '').localeCompare(b.story_title || '');
            if (sortBy === 'criticality') { const o = ['Critical', 'High', 'Medium', 'Low']; return (o.indexOf(a.criticality) + 1 || 99) - (o.indexOf(b.criticality) + 1 || 99); }
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        });

    const activeFCount = [filterModule, filterFeature, filterVersion, filterStatus, filterCrit].filter(Boolean).length;
    const clearAll = () => { setFilterModule(''); setFilterFeature(''); setFilterVersion(''); setFilterStatus(''); setFilterCrit(''); setSearch(''); };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 5px; height: 5px; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pillDrop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .s-input:focus { outline: none; border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.12) !important; }
                .list-row:hover { border-color: #22c55e !important; box-shadow: 0 4px 14px rgba(34,197,94,0.10) !important; transform: translateX(2px) !important; }
            `}</style>

            <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#f0fdf4 0%,#f8fafc 45%,#f0f9ff 100%)', fontFamily: "'DM Sans',sans-serif" }}>

                {/* Header */}
                <div style={{ background: '#fff', borderBottom: '1.5px solid #e2e8f0' }}>
                    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, background: '#15803d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(21,128,61,0.30)' }}>
                                <i className="fa-solid fa-book-open" style={{ color: '#fff', fontSize: 17 }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>User Stories</h1>
                                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>NexTech RMS · Story backlog</p>
                            </div>
                        </div>
                        <button
                            onClick={handleNewStory}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(21,128,61,0.30)', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(21,128,61,0.40)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(21,128,61,0.30)'}
                        >
                            <i className="fa-solid fa-plus" style={{ fontSize: 12 }} />
                            New User Story
                        </button>
                    </div>
                </div>

                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>

                    {/* Stats */}
                    {!loading && !error && <StatsRow stories={stories} />}

                    {/* Search + Sort + View */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
                            <input
                                className="s-input" type="text" value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by story ID, title or summary…"
                                style={{ width: '100%', padding: '9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13.5, background: '#fff', color: '#1e293b', transition: 'all 0.15s' }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                </button>
                            )}
                        </div>
                        <select
                            value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="updated_at">Latest Updated</option>
                            <option value="story_id">Story ID</option>
                            <option value="title">Title A–Z</option>
                            <option value="criticality">Criticality</option>
                        </select>
                        <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                            {['grid', 'list'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)} style={{ padding: '8px 13px', border: 'none', cursor: 'pointer', background: viewMode === m ? '#f0fdf4' : 'transparent', color: viewMode === m ? '#16a34a' : '#64748b', transition: 'all 0.12s' }}>
                                    <i className={`fa-solid ${m === 'grid' ? 'fa-grip' : 'fa-list'}`} style={{ fontSize: 13 }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter pills — all same fixed width, never resize */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
                        <FilterPill label="Module" icon="fa-cube" options={moduleOpts} value={filterModule} onChange={setFilterModule} />
                        <FilterPill label="Feature" icon="fa-puzzle-piece" options={featureOpts} value={filterFeature} onChange={setFilterFeature} />
                        <FilterPill label="Version" icon="fa-tag" options={versionOpts} value={filterVersion} onChange={setFilterVersion} />
                        <FilterPill label="Status" icon="fa-circle-half-stroke" options={Object.keys(STATUS_META)} value={filterStatus} onChange={setFilterStatus} />
                        <FilterPill label="Criticality" icon="fa-bolt" options={Object.keys(CRIT_META)} value={filterCrit} onChange={setFilterCrit} />
                        {activeFCount > 0 && (
                            <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 99, fontSize: 12.5, color: '#dc2626', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                                <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: 11 }} />
                                Clear {activeFCount} filter{activeFCount > 1 ? 's' : ''}
                            </button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {filtered.length} of {stories.length} stories
                        </span>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
                            <div style={{ width: 40, height: 40, border: '3px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <p style={{ color: '#64748b', fontSize: 14 }}>Loading user stories…</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, color: '#dc2626' }}>
                            <i className="fa-solid fa-circle-exclamation" /><span style={{ fontSize: 13.5 }}>{error}</span>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && filtered.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
                            <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-folder-open" style={{ fontSize: 28, color: '#94a3b8' }} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: 0 }}>No stories found</p>
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Try adjusting your search or filters</p>
                            {activeFCount > 0 && (
                                <button onClick={clearAll} style={{ marginTop: 4, padding: '8px 18px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Grid view */}
                    {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gridAutoRows: '160px',
                            gap: 16,
                        }}>
                            {filtered.map((story, i) => (
                                <div key={story.id} style={{ animation: `fadeUp 0.25s ease ${Math.min(i * 0.04, 0.5)}s both` }}>
                                    <StoryCard story={story} onClick={handleSelectStory} onEdit={openEditModal} onDelete={setDeleteTarget} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List view */}
                    {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px 110px 100px 100px 72px', gap: 12, padding: '8px 18px', background: '#f1f5f9', borderRadius: 8 }}>
                                {['Story ID', 'Title', 'Module / Feature', 'Status', 'Criticality', 'Version', ''].map(h => (
                                    <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                                ))}
                            </div>
                            {filtered.map((s, i) => (
                                <div key={s.id} className="list-row"
                                    style={{ animation: `fadeUp 0.2s ease ${Math.min(i * 0.03, 0.4)}s both`, display: 'grid', gridTemplateColumns: '110px 1fr 140px 110px 100px 100px 72px', gap: 12, alignItems: 'center', padding: '12px 18px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, transition: 'all 0.15s' }}>
                                    <span onClick={() => handleSelectStory(s)} style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: '#16a34a', cursor: 'pointer' }}>{s.story_id}</span>
                                    <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => handleSelectStory(s)}>
                                        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.story_title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled</span>}
                                        </p>
                                        {s.story_type && <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.story_type}</span>}
                                    </div>
                                    <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => handleSelectStory(s)}>
                                        {s.module && <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.module}</p>}
                                        {s.feature && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feature}</p>}
                                    </div>
                                    <Badge text={s.current_status || 'Draft'} meta={STATUS_META[s.current_status] || STATUS_META['Draft']} />
                                    {s.criticality ? <Badge text={s.criticality} meta={CRIT_META[s.criticality]} /> : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                                    <span style={{ fontSize: 12, color: '#64748b' }}>{s.planned_release || s.version_build || '—'}</span>
                                    {/* Edit / Delete */}
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={e => openEditModal(e, s)} title="Edit"
                                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 7, background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: 11 }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                                            <i className="fa-solid fa-pen-to-square" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(s); }} title="Delete"
                                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 7, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 11 }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                                            <i className="fa-solid fa-trash" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit Story Modal ── */}
            {editingStory && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setEditingStory(null)}>
                    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans',sans-serif" }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                            <div style={{ width: 38, height: 38, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fa-solid fa-pen-to-square" style={{ color: '#2563eb', fontSize: 15 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Edit User Story</h3>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{editingStory.story_id}</p>
                            </div>
                            <button onClick={() => setEditingStory(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                                <i className="fa-solid fa-times" />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Story Title */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Story Title <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input value={editForm.story_title} onChange={e => setEditForm(f => ({ ...f, story_title: e.target.value }))}
                                    placeholder="e.g., User can reset their password"
                                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                            </div>

                            {/* Summary */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</label>
                                <textarea value={editForm.story_summary} onChange={e => setEditForm(f => ({ ...f, story_summary: e.target.value }))}
                                    rows={3} placeholder="Brief description…"
                                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                            </div>

                            {/* Row: Type + Status */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Story Type</label>
                                    <select value={editForm.story_type} onChange={e => setEditForm(f => ({ ...f, story_type: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                        <option value="">Select type…</option>
                                        {['Feature', 'Bug Fix', 'Improvement', 'Technical', 'Research'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                                    <select value={editForm.current_status} onChange={e => setEditForm(f => ({ ...f, current_status: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                        {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row: Criticality + Story Points */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criticality</label>
                                    <select value={editForm.criticality} onChange={e => setEditForm(f => ({ ...f, criticality: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                        <option value="">Select…</option>
                                        {Object.keys(CRIT_META).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Story Points</label>
                                    <input type="number" min="0" value={editForm.story_points} onChange={e => setEditForm(f => ({ ...f, story_points: e.target.value }))}
                                        placeholder="e.g., 5"
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                </div>
                            </div>

                            {/* Row: Module + Feature */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module</label>
                                    <input value={editForm.module} onChange={e => setEditForm(f => ({ ...f, module: e.target.value }))}
                                        placeholder="e.g., Billing"
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</label>
                                    <input value={editForm.feature} onChange={e => setEditForm(f => ({ ...f, feature: e.target.value }))}
                                        placeholder="e.g., Invoice generation"
                                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                                </div>
                            </div>

                            {/* Row: Version + Dev/QA/Release status */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planned Release / Version</label>
                                <input value={editForm.planned_release} onChange={e => setEditForm(f => ({ ...f, planned_release: e.target.value }))}
                                    placeholder="e.g., v2.1.0"
                                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                                {[
                                    { key: 'development_status', label: 'Dev Status', opts: ['Not Started', 'In Progress', 'On Hold', 'Completed'] },
                                    { key: 'qa_status', label: 'QA Status', opts: ['Not Started', 'In Progress', 'Pass', 'Fail', 'Blocked'] },
                                    { key: 'release_status', label: 'Release Status', opts: ['Not Released', 'Scheduled', 'Released', 'Rolled Back'] },
                                ].map(({ key, label, opts }) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                                        <select value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#374151', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                                            <option value="">Select…</option>
                                            {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '14px 24px', borderTop: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: 0, background: '#fff' }}>
                            <button onClick={() => setEditingStory(null)}
                                style={{ padding: '9px 22px', border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleUpdateStory} disabled={editLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px', border: 'none', borderRadius: 9, background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 600, cursor: editLoading ? 'not-allowed' : 'pointer', opacity: editLoading ? 0.7 : 1 }}>
                                {editLoading ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</> : <><i className="fa-solid fa-check" /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setDeleteTarget(null)}>
                    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: 420, padding: 28, fontFamily: "'DM Sans',sans-serif" }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, background: '#fef2f2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fa-solid fa-trash" style={{ color: '#dc2626', fontSize: 18 }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Delete User Story</h3>
                                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>This action cannot be undone.</p>
                            </div>
                        </div>
                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace', margin: '0 0 4px' }}>{deleteTarget.story_id}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{deleteTarget.story_title || 'Untitled Story'}</p>
                        </div>
                        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 24, display: 'flex', gap: 10 }}>
                            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: 13, marginTop: 1, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
                                Deleting this story will permanently remove it and all its associations including linked test cases.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteStory} disabled={deleteLoading}
                                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin" /> Deleting…</> : <><i className="fa-solid fa-trash" /> Delete Story</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserStoriesList;