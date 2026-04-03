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
const FilterPill = ({ label, icon, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const active = !!value;
    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={() => setOpen(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: active ? '#f0fdf4' : '#fff',
                border: `1.5px solid ${active ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? '#15803d' : '#374151',
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: active ? '0 0 0 3px rgba(34,197,94,0.10)' : 'none',
                transition: 'all 0.15s',
            }}>
                <i className={`fa-solid ${icon}`} style={{ fontSize: 11 }} />
                {active ? value : label}
                {active
                    ? <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', color: '#16a34a', marginLeft: 2 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </span>
                    : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                }
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: 200, padding: 6,
                    animation: 'pillDrop 0.15s ease',
                }}>
                    <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        All {label}
                    </div>
                    {options.map(opt => (
                        <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: value === opt ? '#15803d' : '#1e293b', fontWeight: value === opt ? 600 : 400, background: value === opt ? '#f0fdf4' : 'transparent' }}
                            onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}>
                            {opt}
                            {value === opt && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Story Card (Grid view) ────────────────────────────────────────────────────
const StoryCard = ({ story, onClick }) => {
    const [hov, setHov] = useState(false);
    const sm = STATUS_META[story.current_status] || STATUS_META['Draft'];
    const cm = CRIT_META[story.criticality];
    return (
        <div onClick={() => onClick(story)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                background: '#fff', border: `1.5px solid ${hov ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                boxShadow: hov ? '0 8px 24px rgba(34,197,94,0.13), 0 2px 8px rgba(0,0,0,0.05)' : '0 1px 4px rgba(0,0,0,0.05)',
                transform: hov ? 'translateY(-2px)' : 'translateY(0)',
                position: 'relative', overflow: 'hidden',
            }}>
            {/* top stripe */}
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
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <Badge text={story.current_status || 'Draft'} meta={sm} />
                    {story.criticality && <Badge text={story.criticality} meta={cm} />}
                </div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {story.story_title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled story</span>}
            </h3>

            {story.story_summary && (
                <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {story.story_summary}
                </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                {story.module && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-cube" style={{ color: '#a78bfa', fontSize: 10 }} />{story.module}</span>}
                {story.feature && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-puzzle-piece" style={{ color: '#34d399', fontSize: 10 }} />{story.feature}</span>}
                {story.planned_release && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-tag" style={{ color: '#60a5fa', fontSize: 10 }} />{story.planned_release}</span>}
                {story.story_points && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748b' }}><i className="fa-solid fa-circle-dot" style={{ color: '#fb923c', fontSize: 10 }} />{story.story_points} pts</span>}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                    {story.updated_at ? new Date(story.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
            </div>

            {/* dev/qa/release mini pills */}
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
        { label: 'Completed', val: counts['Completed'] || 0, color: '#22c55e', icon: 'fa-circle-check' },
        { label: 'Draft', val: counts['Draft'] || 0, color: '#94a3b8', icon: 'fa-file-pen' },
    ];
    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {stats.map(s => (
                <div key={s.label} style={{ flex: '1 1 120px', minWidth: 110, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
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

    // ── Navigation handlers ───────────────────────────────────────────────────
    const handleSelectStory = (story) => {
        navigate(`/stories/${story.story_id}`);
    };

    const handleNewStory = () => {
        navigate('/stories/new');
    };

    const filtered = stories
        .filter(s => {
            const q = search.toLowerCase();
            return (!q || (s.story_id || '').toLowerCase().includes(q) || (s.story_title || '').toLowerCase().includes(q) || (s.story_summary || '').toLowerCase().includes(q))
                && (!filterModule || s.module === filterModule)
                && (!filterFeature || s.feature === filterFeature)
                && (!filterVersion || s.planned_release === filterVersion || s.version_build === filterVersion)
                && (!filterStatus || s.current_status === filterStatus)
                && (!filterCrit || s.criticality === filterCrit);
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
                *{box-sizing:border-box;}
                ::-webkit-scrollbar{width:5px;height:5px}
                ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
                @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pillDrop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
                .s-input:focus{outline:none;border-color:#22c55e!important;box-shadow:0 0 0 3px rgba(34,197,94,0.12)!important}
                .list-row:hover{border-color:#22c55e!important;box-shadow:0 4px 14px rgba(34,197,94,0.10)!important;transform:translateX(2px)!important;}
            `}</style>

            <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#f0fdf4 0%,#f8fafc 45%,#f0f9ff 100%)', fontFamily: "'DM Sans',sans-serif" }}>

                {/* Header */}
                <div style={{ background: '#fff', borderBottom: '1.5px solid #e2e8f0' }}>
                    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(34,197,94,0.30)' }}>
                                <i className="fa-solid fa-book-open" style={{ color: '#fff', fontSize: 17 }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>User Stories</h1>
                                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>NexTech RMS · Story backlog</p>
                            </div>
                        </div>
                        <button
                            onClick={handleNewStory}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(34,197,94,0.30)', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(34,197,94,0.40)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.30)'}
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
                            <input className="s-input" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by story ID, title or summary…"
                                style={{ width: '100%', padding: '9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13.5, background: '#fff', color: '#1e293b', transition: 'all 0.15s' }} />
                            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>}
                        </div>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
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

                    {/* Filter pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
                        <FilterPill label="Module" icon="fa-cube" options={moduleOpts} value={filterModule} onChange={setFilterModule} />
                        <FilterPill label="Feature" icon="fa-puzzle-piece" options={featureOpts} value={filterFeature} onChange={setFilterFeature} />
                        <FilterPill label="Version" icon="fa-tag" options={versionOpts} value={filterVersion} onChange={setFilterVersion} />
                        <FilterPill label="Status" icon="fa-circle-half-stroke" options={Object.keys(STATUS_META)} value={filterStatus} onChange={setFilterStatus} />
                        <FilterPill label="Criticality" icon="fa-bolt" options={Object.keys(CRIT_META)} value={filterCrit} onChange={setFilterCrit} />
                        {activeFCount > 0 && (
                            <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 99, fontSize: 12.5, color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
                                <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: 11 }} />
                                Clear {activeFCount} filter{activeFCount > 1 ? 's' : ''}
                            </button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#94a3b8', fontWeight: 500 }}>{filtered.length} of {stories.length} stories</span>
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
                            {activeFCount > 0 && <button onClick={clearAll} style={{ marginTop: 4, padding: '8px 18px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear all filters</button>}
                        </div>
                    )}

                    {/* Grid view */}
                    {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                            {filtered.map((story, i) => (
                                <div key={story.id} style={{ animation: `fadeUp 0.25s ease ${Math.min(i * 0.04, 0.5)}s both` }}>
                                    <StoryCard story={story} onClick={handleSelectStory} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List view */}
                    {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px 110px 100px 100px', gap: 12, padding: '8px 18px', background: '#f1f5f9', borderRadius: 8 }}>
                                {['Story ID', 'Title', 'Module / Feature', 'Status', 'Criticality', 'Version'].map(h => (
                                    <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                                ))}
                            </div>
                            {filtered.map((s, i) => (
                                <div key={s.id} className="list-row" onClick={() => handleSelectStory(s)}
                                    style={{ animation: `fadeUp 0.2s ease ${Math.min(i * 0.03, 0.4)}s both`, display: 'grid', gridTemplateColumns: '110px 1fr 140px 110px 100px 100px', gap: 12, alignItems: 'center', padding: '12px 18px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{s.story_id}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.story_title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled</span>}</p>
                                        {s.story_type && <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.story_type}</span>}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        {s.module && <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.module}</p>}
                                        {s.feature && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feature}</p>}
                                    </div>
                                    <Badge text={s.current_status || 'Draft'} meta={STATUS_META[s.current_status] || STATUS_META['Draft']} />
                                    {s.criticality ? <Badge text={s.criticality} meta={CRIT_META[s.criticality]} /> : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                                    <span style={{ fontSize: 12, color: '#64748b' }}>{s.planned_release || s.version_build || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserStoriesList;