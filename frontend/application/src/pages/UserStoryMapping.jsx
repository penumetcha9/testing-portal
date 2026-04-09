import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from "../services/supabaseClient";

const CustomSelect = ({ value, onChange, options, placeholder = 'Select…' }) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(null);
    const [flipUp, setFlipUp] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleToggle = () => {
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            let scrollParent = ref.current.parentElement;
            while (scrollParent && scrollParent !== document.body) {
                const { overflow, overflowY } = window.getComputedStyle(scrollParent);
                if (/auto|scroll/.test(overflow + overflowY)) break;
                scrollParent = scrollParent.parentElement;
            }
            const containerBottom = scrollParent
                ? scrollParent.getBoundingClientRect().bottom
                : window.innerHeight;
            const spaceBelow = containerBottom - rect.bottom;
            const dropdownHeight = Math.min(options.length * 42 + 16, 280);
            setFlipUp(spaceBelow < dropdownHeight + 8);
        }
        setOpen(p => !p);
    };

    const selected = options.find(o => (typeof o === 'string' ? o : o.value) === value);
    const label = selected ? (typeof selected === 'string' ? selected : selected.label) : placeholder;
    const dropdownPos = flipUp ? { bottom: 'calc(100% + 6px)', top: 'auto' } : { top: 'calc(100% + 6px)', bottom: 'auto' };
    const animName = flipUp ? 'dropdownUp' : 'dropdownIn';

    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            <style>{`
                @keyframes dropdownIn { from { opacity:0; transform:translateY(-6px) scale(0.98);} to { opacity:1; transform:translateY(0) scale(1);}}
                @keyframes dropdownUp { from { opacity:0; transform:translateY(6px) scale(0.98);} to { opacity:1; transform:translateY(0) scale(1);}}
            `}</style>
            <button type="button" onClick={handleToggle} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: open ? '#f0fdf4' : 'linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)',
                border: open ? '1.5px solid #22c55e' : '1.5px solid #e2e6f0',
                borderRadius: '10px', fontSize: '13.5px', color: value ? '#1e293b' : '#94a3b8',
                fontWeight: value ? 500 : 400, cursor: 'pointer', transition: 'all 0.18s ease',
                boxShadow: open ? '0 0 0 3px rgba(34,197,94,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                outline: 'none', letterSpacing: '0.01em',
            }}>
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: open ? '#22c55e' : '#94a3b8', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
            </button>
            {open && (
                <div style={{ position: 'absolute', ...dropdownPos, left: 0, right: 0, zIndex: 9999, background: '#ffffff', border: '1.5px solid #dcfce7', borderRadius: '12px', boxShadow: '0 8px 32px rgba(34,197,94,0.10), 0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: `${animName} 0.18s cubic-bezier(.4,0,.2,1)` }}>
                    <div style={{ padding: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                        {options.map((opt, i) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            const isSelected = val === value;
                            const isHovered = hovered === i;
                            return (
                                <div key={val} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onClick={() => { onChange(val); setOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#15803d' : isHovered ? '#1e293b' : '#374151', background: isSelected ? '#dcfce7' : isHovered ? '#f0fdf4' : 'transparent', transition: 'all 0.12s ease', letterSpacing: '0.01em' }}>
                                    <span>{lbl}</span>
                                    {isSelected && (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MultiSelect = ({ values = [], onChange, options, placeholder = 'Select…', searchPlaceholder = 'Search...' }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [flipUp, setFlipUp] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleToggle = () => {
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            let scrollParent = ref.current.parentElement;
            while (scrollParent && scrollParent !== document.body) {
                const { overflow, overflowY } = window.getComputedStyle(scrollParent);
                if (/auto|scroll/.test(overflow + overflowY)) break;
                scrollParent = scrollParent.parentElement;
            }
            const containerBottom = scrollParent
                ? scrollParent.getBoundingClientRect().bottom
                : window.innerHeight;
            const spaceBelow = containerBottom - rect.bottom;
            setFlipUp(spaceBelow < 260);
        }
        setOpen(p => !p);
    };

    const filtered = options.filter(o => {
        const lbl = typeof o === 'string' ? o : o.label;
        return lbl.toLowerCase().includes(search.toLowerCase());
    });

    const toggle = (val) => {
        if (values.includes(val)) onChange(values.filter(v => v !== val));
        else onChange([...values, val]);
    };

    const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'];
    const getAvatarColor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length];
    const dropdownPos = flipUp ? { bottom: 'calc(100% + 6px)', top: 'auto' } : { top: 'calc(100% + 6px)', bottom: 'auto' };
    const animName = flipUp ? 'dropdownUp' : 'dropdownIn';

    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            {values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {values.map(v => (
                        <span key={v} className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            <span className={`w-4 h-4 ${getAvatarColor(v)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`} style={{ fontSize: 9 }}>
                                {v.charAt(0).toUpperCase()}
                            </span>
                            {v}
                            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }}
                                className="ml-0.5 text-green-700 hover:text-red-500 transition-colors leading-none">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <button type="button" onClick={handleToggle} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: open ? '#f0fdf4' : 'linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)',
                border: open ? '1.5px solid #22c55e' : '1.5px solid #e2e6f0',
                borderRadius: '10px', fontSize: '13.5px', color: '#94a3b8',
                cursor: 'pointer', transition: 'all 0.18s ease',
                boxShadow: open ? '0 0 0 3px rgba(34,197,94,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                outline: 'none',
            }}>
                <span style={{ color: values.length > 0 ? '#15803d' : '#94a3b8', fontWeight: values.length > 0 ? 500 : 400 }}>
                    {values.length > 0 ? `${values.length} selected` : placeholder}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: open ? '#22c55e' : '#94a3b8' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
            </button>
            {open && (
                <div style={{ position: 'absolute', ...dropdownPos, left: 0, right: 0, zIndex: 9999, background: '#ffffff', border: '1.5px solid #dcfce7', borderRadius: '12px', boxShadow: '0 8px 32px rgba(34,197,94,0.10), 0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: `${animName} 0.18s cubic-bezier(.4,0,.2,1)` }}>
                    <div style={{ padding: '8px 8px 4px' }}>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder} autoFocus
                            style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #dcfce7', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 6px 6px' }}>
                        {filtered.length === 0 && (
                            <p style={{ padding: '10px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>No items found</p>
                        )}
                        {filtered.map((opt) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            const isSelected = values.includes(val);
                            return (
                                <div key={val} onClick={() => toggle(val)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#dcfce7' : 'transparent', transition: 'all 0.1s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = isSelected ? '#bbf7d0' : '#f0fdf4'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#dcfce7' : 'transparent'; }}>
                                    <span className={`w-6 h-6 ${getAvatarColor(val)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ fontSize: 11 }}>
                                        {val.charAt(0).toUpperCase()}
                                    </span>
                                    <span style={{ flex: 1, fontSize: '13.5px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#15803d' : '#374151' }}>{lbl}</span>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {values.length > 0 && (
                        <div style={{ padding: '6px 8px 8px', borderTop: '1px solid #dcfce7' }}>
                            <button type="button" onClick={() => onChange([])}
                                style={{ width: '100%', padding: '6px', fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Section = ({ id, title, icon, iconColor, collapsedSections, toggleSection, children }) => (
    <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="section-header px-6 py-4 border-b border-border flex items-center justify-between cursor-pointer transition-all hover:bg-muted" onClick={() => toggleSection(id)}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${iconColor} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <i className={`fa-solid ${icon} ${iconColor.replace('bg-', 'text-')}`}></i>
                </div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
            <i className={`fa-solid ${collapsedSections[id] ? 'fa-chevron-down' : 'fa-chevron-up'} text-muted-foreground`}></i>
        </div>
        {!collapsedSections[id] && <div className="section-content p-6">{children}</div>}
    </div>
);

const TestCasesTab = ({ storyId, storyUUID }) => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!storyUUID) { setLoading(true); return; }
        const fetchTestCases = async () => {
            setLoading(true); setError(null);
            try {
                const { data, error: fetchError } = await supabase.from('test_cases').select('id, test_case_id, name, description, priority, status, test_type, assigned_to, created_at').eq('user_story_id', storyUUID).order('created_at', { ascending: false });
                if (fetchError) throw fetchError;
                setTestCases(data || []);
            } catch (err) { setError(err.message); } finally { setLoading(false); }
        };
        fetchTestCases();
    }, [storyUUID]);

    const statusColor = (s) => ({ 'Pass': 'bg-green-100 text-green-700', 'Fail': 'bg-red-100 text-red-700', 'Not Run': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-blue-100 text-blue-700', 'Blocked': 'bg-orange-100 text-orange-700' }[s] || 'bg-gray-100 text-gray-600');
    const priorityColor = (p) => ({ 'Critical': 'text-red-600', 'High': 'text-orange-500', 'Medium': 'text-yellow-600', 'Low': 'text-green-600' }[p] || 'text-gray-500');

    if (loading) return <div className="flex items-center justify-center py-16"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-muted-foreground">Loading test cases…</p></div></div>;
    if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{testCases.length} test case{testCases.length !== 1 ? 's' : ''} linked</span><span className="px-2 py-0.5 bg-primary bg-opacity-10 text-primary text-xs font-semibold rounded-full">{storyId}</span></div></div>
            {testCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center"><i className="fa-solid fa-list-check text-2xl text-muted-foreground"></i></div><p className="text-sm font-medium text-muted-foreground">No test cases linked to {storyId}</p></div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm"><thead><tr className="bg-muted border-b border-border">{['Test Case ID', 'Name', 'Type', 'Priority', 'Status', 'Assigned To'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>))}</tr></thead>
                        <tbody className="divide-y divide-border">{testCases.map(tc => (<tr key={tc.id} className="hover:bg-muted transition-colors"><td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{tc.test_case_id || '—'}</td><td className="px-4 py-3 font-medium text-foreground max-w-xs"><div className="truncate" title={tc.name}>{tc.name || '—'}</div>{tc.description && <div className="text-xs text-muted-foreground truncate mt-0.5" title={tc.description}>{tc.description}</div>}</td><td className="px-4 py-3 text-muted-foreground">{tc.test_type || '—'}</td><td className="px-4 py-3"><span className={`font-semibold text-xs ${priorityColor(tc.priority)}`}>{tc.priority || '—'}</span></td><td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColor(tc.status)}`}>{tc.status || '—'}</span></td><td className="px-4 py-3 text-muted-foreground text-xs">{tc.assigned_to || 'Unassigned'}</td></tr>))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const BugsTab = ({ storyId, storyUUID }) => {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newBug, setNewBug] = useState({ title: '', description: '', severity: '', status: 'Open', reported_by: '' });

    useEffect(() => { if (!storyUUID) { setLoading(false); return; } fetchBugs(); }, [storyUUID]);

    const fetchBugs = async () => { setLoading(true); try { const { data, error } = await supabase.from('bugs').select('*').eq('story_id', storyUUID).order('created_at', { ascending: false }); if (error) throw error; setBugs(data || []); } catch (err) { setError(err.message); } finally { setLoading(false); } };
    const handleAddBug = async () => { if (!newBug.title.trim()) { alert('Bug title is required'); return; } setSaving(true); try { const bugCount = bugs.length + 1; const bugId = `BUG-${String(bugCount).padStart(3, '0')}`; const { error } = await supabase.from('bugs').insert([{ story_id: storyUUID, bug_id: bugId, ...newBug }]); if (error) throw error; setNewBug({ title: '', description: '', severity: '', status: 'Open', reported_by: '' }); setShowForm(false); await fetchBugs(); } catch (err) { alert(`Error: ${err.message}`); } finally { setSaving(false); } };

    const severityColor = (s) => ({ 'Critical': 'bg-red-100 text-red-700 border-red-200', 'High': 'bg-orange-100 text-orange-700 border-orange-200', 'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200', 'Low': 'bg-green-100 text-green-700 border-green-200' }[s] || 'bg-gray-100 text-gray-600 border-gray-200');
    const statusColor = (s) => ({ 'Open': 'bg-red-50 text-red-600', 'In Progress': 'bg-blue-50 text-blue-600', 'Fixed': 'bg-green-50 text-green-600', 'Closed': 'bg-gray-100 text-gray-500', 'Reopened': 'bg-orange-50 text-orange-600' }[s] || 'bg-gray-100 text-gray-600');

    if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>;

    const inputCls = "w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{bugs.length} bug{bugs.length !== 1 ? 's' : ''} linked</span><button onClick={() => setShowForm(p => !p)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"><i className={`fa-solid ${showForm ? 'fa-times' : 'fa-plus'}`}></i>{showForm ? 'Cancel' : 'Link Bug'}</button></div>
            {showForm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-red-700">Link New Bug</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Title *</label><input type="text" value={newBug.title} onChange={e => setNewBug(p => ({ ...p, title: e.target.value }))} placeholder="Bug title..." className={inputCls} /></div>
                        <div className="sm:col-span-2"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Description</label><textarea rows="2" value={newBug.description} onChange={e => setNewBug(p => ({ ...p, description: e.target.value }))} placeholder="Describe the bug..." className={inputCls} /></div>
                        <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Severity</label><CustomSelect value={newBug.severity} onChange={v => setNewBug(p => ({ ...p, severity: v }))} options={['Critical', 'High', 'Medium', 'Low']} placeholder="Select severity" /></div>
                        <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Reported By</label><input type="text" value={newBug.reported_by} onChange={e => setNewBug(p => ({ ...p, reported_by: e.target.value }))} placeholder="Your name" className={inputCls} /></div>
                    </div>
                    <button onClick={handleAddBug} disabled={saving} className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save Bug'}</button>
                </div>
            )}
            {bugs.length === 0 && !showForm ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center"><i className="fa-solid fa-bug text-2xl text-muted-foreground"></i></div><p className="text-sm font-medium text-muted-foreground">No bugs linked to {storyId}</p></div>
            ) : (
                <div className="space-y-3">{bugs.map(bug => (<div key={bug.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:border-red-200 transition-colors"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1 flex-wrap"><span className="font-mono text-xs text-red-600 font-semibold">{bug.bug_id}</span>{bug.severity && <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${severityColor(bug.severity)}`}>{bug.severity}</span>}<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor(bug.status)}`}>{bug.status}</span></div><p className="text-sm font-medium text-foreground">{bug.title}</p>{bug.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bug.description}</p>}{bug.reported_by && <p className="text-xs text-muted-foreground mt-1"><i className="fa-solid fa-user mr-1"></i>Reported by {bug.reported_by}</p>}</div><span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(bug.created_at).toLocaleDateString()}</span></div>))}</div>
            )}
        </div>
    );
};

const CommentsTab = ({ storyId, storyUUID }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => { if (!storyUUID) { setLoading(false); return; } fetchComments(); }, [storyUUID]);

    const fetchComments = async () => { setLoading(true); try { const { data, error } = await supabase.from('comments').select('*').eq('story_id', storyUUID).order('created_at', { ascending: true }); if (error) throw error; setComments(data || []); } catch (err) { setError(err.message); } finally { setLoading(false); } };
    const handlePostComment = async () => { if (!newComment.trim()) { alert('Please enter a comment'); return; } setPosting(true); try { const { error } = await supabase.from('comments').insert([{ story_id: storyUUID, comment_text: newComment.trim(), user_id: authorName.trim() || 'Anonymous' }]); if (error) throw error; setNewComment(''); await fetchComments(); } catch (err) { alert(`Error: ${err.message}`); } finally { setPosting(false); } };

    const timeAgo = (dateStr) => { const diff = Date.now() - new Date(dateStr).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`; };
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AN';
    const avatarColor = (name) => { const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']; return colors[name ? name.charCodeAt(0) % colors.length : 0]; };

    if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>;

    return (
        <div className="space-y-6">
            {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center"><i className="fa-solid fa-comment-dots text-2xl text-muted-foreground"></i></div><p className="text-sm font-medium text-muted-foreground">No comments yet — be the first!</p></div>
            ) : (
                <div className="space-y-4">{comments.map(c => (<div key={c.id} className="flex gap-3"><div className={`w-9 h-9 ${avatarColor(c.user_id)} rounded-full flex items-center justify-center flex-shrink-0`}><span className="text-white text-xs font-bold">{getInitials(c.user_id)}</span></div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-foreground">{c.user_id || 'Anonymous'}</span><span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span></div><div className="bg-muted rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">{c.comment_text}</div></div></div>))}</div>
            )}
            <div className="border-t border-border pt-5 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Add a comment</h4>
                <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your name (optional)" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <textarea rows="3" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePostComment(); }} placeholder="Write a comment… (Ctrl+Enter to post)" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                <div className="flex justify-end"><button onClick={handlePostComment} disabled={posting || !newComment.trim()} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"><i className="fa-solid fa-paper-plane"></i>{posting ? 'Posting…' : 'Post Comment'}</button></div>
            </div>
        </div>
    );
};

const T = {
    body: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
    bodyMed: { fontSize: 13, fontWeight: 500, lineHeight: 1.5 },
    label: { fontSize: 12, fontWeight: 400, lineHeight: 1.5 },
    micro: { fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.5 },
    subhead: { fontSize: 15, fontWeight: 500, lineHeight: 1.2 },
    section: { fontSize: 18, fontWeight: 600, lineHeight: 1.2 },
};
const font = 'Inter, system-ui, -apple-system, sans-serif';

const AttachmentsTab = ({ storyId, storyUUID }) => {
    const [attachments, setAttachments] = useState([]);
    const [figmaLinks, setFigmaLinks] = useState([]);
    const [webLinks, setWebLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [linksLoading, setLinksLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedBy, setUploadedBy] = useState('');
    const fileInputRef = useRef(null);

    const [showFigmaForm, setShowFigmaForm] = useState(false);
    const [figmaSaving, setFigmaSaving] = useState(false);
    const [newFigma, setNewFigma] = useState({ url: '', title: '', added_by: '' });
    const [figmaError, setFigmaError] = useState('');

    const [showWebForm, setShowWebForm] = useState(false);
    const [webSaving, setWebSaving] = useState(false);
    const [newWeb, setNewWeb] = useState({ url: '', title: '', added_by: '' });
    const [webError, setWebError] = useState('');

    useEffect(() => {
        if (!storyUUID) { setLoading(false); setLinksLoading(false); return; }
        fetchAttachments();
        fetchLinks();
    }, [storyUUID]);

    const fetchAttachments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('attachments').select('*').eq('story_id', storyUUID).order('uploaded_at', { ascending: false });
            if (error) throw error;
            setAttachments(data || []);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const fetchLinks = async () => {
        setLinksLoading(true);
        try {
            const { data, error } = await supabase.from('story_links').select('*').eq('story_id', storyUUID).order('created_at', { ascending: false });
            if (error) throw error;
            const all = data || [];
            setFigmaLinks(all.filter(l => l.figma_link));
            setWebLinks(all.filter(l => l.web_link && !l.figma_link));
        } catch (err) { console.error('Links fetch error:', err.message); } finally { setLinksLoading(false); }
    };

    const isValidFigmaLink = (url) => /^https?:\/\/(www\.)?figma\.com\/.+/i.test(url.trim());
    const isValidWebLink = (url) => { try { const u = new URL(url.trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

    const handleSaveFigma = async () => {
        if (!newFigma.url.trim()) { setFigmaError('Figma URL is required'); return; }
        if (!isValidFigmaLink(newFigma.url)) { setFigmaError('Please enter a valid Figma URL (figma.com/...)'); return; }
        setFigmaSaving(true);
        try {
            const { error } = await supabase.from('story_links').insert([{ story_id: storyUUID, figma_link: newFigma.url.trim(), web_link: null, added_by: newFigma.added_by.trim() || 'Anonymous', title: newFigma.title.trim() || null }]);
            if (error) throw error;
            setNewFigma({ url: '', title: '', added_by: '' }); setFigmaError(''); setShowFigmaForm(false); await fetchLinks();
        } catch (err) { alert(`Error: ${err.message}`); } finally { setFigmaSaving(false); }
    };

    const handleSaveWeb = async () => {
        if (!newWeb.url.trim()) { setWebError('Web URL is required'); return; }
        if (!isValidWebLink(newWeb.url)) { setWebError('Please enter a valid URL (https://...)'); return; }
        setWebSaving(true);
        try {
            const { error } = await supabase.from('story_links').insert([{ story_id: storyUUID, figma_link: null, web_link: newWeb.url.trim(), added_by: newWeb.added_by.trim() || 'Anonymous', title: newWeb.title.trim() || null }]);
            if (error) throw error;
            setNewWeb({ url: '', title: '', added_by: '' }); setWebError(''); setShowWebForm(false); await fetchLinks();
        } catch (err) { alert(`Error: ${err.message}`); } finally { setWebSaving(false); }
    };

    const handleDeleteLink = async (link) => {
        if (!window.confirm('Delete this link?')) return;
        try { const { error } = await supabase.from('story_links').delete().eq('id', link.id); if (error) throw error; await fetchLinks(); } catch (err) { alert(`Delete error: ${err.message}`); }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const filePath = `${storyUUID}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('story-attachments').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('story-attachments').getPublicUrl(filePath);
                const { error: dbError } = await supabase.from('attachments').insert([{ story_id: storyUUID, file_name: file.name, file_url: publicUrl || filePath, file_size: file.size, file_type: file.type, uploaded_by: uploadedBy.trim() || 'Anonymous' }]);
                if (dbError) throw dbError;
            }
            await fetchAttachments();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) { alert(`Upload error: ${err.message}`); } finally { setUploading(false); }
    };

    const handleDeleteFile = async (attachment) => {
        if (!window.confirm(`Delete "${attachment.file_name}"?`)) return;
        try { const { error } = await supabase.from('attachments').delete().eq('id', attachment.id); if (error) throw error; setAttachments(p => p.filter(a => a.id !== attachment.id)); } catch (err) { alert(`Delete error: ${err.message}`); }
    };

    const formatSize = (bytes) => { if (!bytes) return '—'; if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; };
    const fileIcon = (type) => { if (!type) return 'fa-file'; if (type.startsWith('image/')) return 'fa-file-image'; if (type === 'application/pdf') return 'fa-file-pdf'; if (type.includes('word')) return 'fa-file-word'; if (type.includes('sheet') || type.includes('excel')) return 'fa-file-excel'; if (type.includes('zip') || type.includes('rar')) return 'fa-file-zipper'; return 'fa-file'; };

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontFamily: font, ...T.body }}>
            <i className="fa-solid fa-circle-exclamation"></i><span>{error}</span>
        </div>
    );

    const inp = (extra = {}) => ({ width: '100%', padding: '10px 14px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, fontFamily: font, ...T.body, color: '#111827', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5, ...extra });
    const inpFocus = (ref) => { if (ref) { ref.style.borderColor = '#6366F1'; ref.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; } };
    const inpBlur = (ref) => { if (ref) { ref.style.borderColor = '#E5E7EB'; ref.style.boxShadow = 'none'; } };
    const MicroLabel = ({ children, color = '#6B7280' }) => (<span style={{ display: 'block', fontFamily: font, ...T.micro, textTransform: 'uppercase', color, marginBottom: 6 }}>{children}</span>);
    const SectionHeading = ({ icon, iconBg, iconColor, title, count, countBg, countColor }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={icon} style={{ color: iconColor, fontSize: 15 }}></i></div>
            <span style={{ fontFamily: font, ...T.subhead, color: '#111827' }}>{title}</span>
            {count > 0 && <span style={{ padding: '2px 10px', borderRadius: 99, background: countBg, color: countColor, fontFamily: font, ...T.label, fontWeight: 600 }}>{count}</span>}
        </div>
    );
    const EmptyState = ({ icon, message }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10, border: '2px dashed #E5E7EB', borderRadius: 12 }}>
            <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className={icon} style={{ color: '#9CA3AF', fontSize: 16 }}></i></div>
            <span style={{ fontFamily: font, ...T.body, color: '#6B7280' }}>{message}</span>
        </div>
    );
    const LinkRow = ({ href, icon, iconBg, iconColor, urlColor, metaColor, url, title, meta, onDelete, hoverBorder }) => {
        const [hov, setHov] = useState(false);
        return (
            <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: hov ? '#F9FAFB' : '#FFFFFF', border: `1px solid ${hov ? hoverBorder : '#E5E7EB'}`, borderRadius: 10, transition: 'all 0.15s' }}>
                <div style={{ width: 36, height: 36, background: iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={icon} style={{ color: iconColor, fontSize: 15 }}></i></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {title && <span style={{ display: 'block', fontFamily: font, ...T.bodyMed, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>}
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: font, ...T.label, color: urlColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{url}</a>
                    <span style={{ fontFamily: font, ...T.label, color: metaColor }}>{meta}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }} title="Open link"><i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 11 }}></i></a>
                    <button onClick={onDelete} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete"><i className="fa-solid fa-trash" style={{ fontSize: 11 }}></i></button>
                </div>
            </div>
        );
    };
    const AddLinkForm = ({ bg, borderColor, accentColor, urlLabel, urlPlaceholder, urlIcon, urlValue, onUrlChange, urlError, titleValue, onTitleChange, nameValue, onNameChange, onSave, onCancel, saving, saveLabel }) => (
        <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: '20px 20px 16px', marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
                <MicroLabel color={accentColor}>{urlLabel} <span style={{ color: '#EF4444' }}>*</span></MicroLabel>
                <div style={{ position: 'relative' }}>
                    <i className={urlIcon} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: accentColor, fontSize: 13, opacity: 0.7 }}></i>
                    <input type="url" value={urlValue} onChange={onUrlChange} placeholder={urlPlaceholder} style={{ ...inp({ paddingLeft: 36, borderColor: urlError ? '#EF4444' : '#E5E7EB' }) }} onFocus={e => inpFocus(e.target)} onBlur={e => inpBlur(e.target)} />
                </div>
                {urlError && <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontFamily: font, ...T.label, color: '#EF4444' }}><i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }}></i>{urlError}</span>}
            </div>
            <div style={{ marginBottom: 14 }}>
                <MicroLabel color={accentColor}>Link title</MicroLabel>
                <input type="text" value={titleValue} onChange={onTitleChange} placeholder="e.g. Homepage wireframe, Jira ticket…" style={inp()} onFocus={e => inpFocus(e.target)} onBlur={e => inpBlur(e.target)} />
            </div>
            <div style={{ marginBottom: 18 }}>
                <MicroLabel color={accentColor}>Added by</MicroLabel>
                <input type="text" value={nameValue} onChange={onNameChange} placeholder="Your name (optional)" style={inp()} onFocus={e => inpFocus(e.target)} onBlur={e => inpBlur(e.target)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onSave} disabled={saving} style={{ padding: '9px 20px', background: accentColor, color: '#FFFFFF', border: 'none', borderRadius: 8, fontFamily: font, ...T.bodyMed, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {saving ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 12 }}></i> Saving…</> : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 12 }}></i> {saveLabel}</>}
                </button>
                <button onClick={onCancel} style={{ padding: '9px 18px', background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontFamily: font, ...T.bodyMed, cursor: 'pointer' }}>Cancel</button>
            </div>
        </div>
    );
    const AddButton = ({ onClick, active, accentColor, label }) => (
        <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: active ? '#F3F4F6' : accentColor, color: active ? '#374151' : '#FFFFFF', border: active ? '1px solid #E5E7EB' : 'none', borderRadius: 8, fontFamily: font, ...T.bodyMed, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
            <i className={`fa-solid ${active ? 'fa-times' : 'fa-plus'}`} style={{ fontSize: 12 }}></i>{active ? 'Cancel' : label}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: font }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFigmaForm ? 16 : figmaLinks.length > 0 ? 16 : 12 }}>
                    <SectionHeading icon="fa-brands fa-figma" iconBg="rgba(139,92,246,0.10)" iconColor="#7C3AED" title="Figma Design Links" count={figmaLinks.length} countBg="rgba(139,92,246,0.10)" countColor="#6D28D9" />
                    <AddButton onClick={() => { setShowFigmaForm(p => !p); setFigmaError(''); }} active={showFigmaForm} accentColor="#7C3AED" label="Add Figma Link" />
                </div>
                {showFigmaForm && <AddLinkForm bg="rgba(139,92,246,0.04)" borderColor="rgba(139,92,246,0.20)" accentColor="#7C3AED" urlLabel="Figma URL" urlPlaceholder="https://www.figma.com/file/..." urlIcon="fa-brands fa-figma" urlValue={newFigma.url} onUrlChange={e => { setNewFigma(p => ({ ...p, url: e.target.value })); setFigmaError(''); }} urlError={figmaError} titleValue={newFigma.title} onTitleChange={e => setNewFigma(p => ({ ...p, title: e.target.value }))} nameValue={newFigma.added_by} onNameChange={e => setNewFigma(p => ({ ...p, added_by: e.target.value }))} onSave={handleSaveFigma} onCancel={() => { setShowFigmaForm(false); setFigmaError(''); setNewFigma({ url: '', title: '', added_by: '' }); }} saving={figmaSaving} saveLabel="Save Figma Link" />}
                {linksLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div style={{ width: 20, height: 20, border: '2px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div></div>
                    : figmaLinks.length === 0 && !showFigmaForm ? <EmptyState icon="fa-brands fa-figma" message="No Figma design links added yet" />
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{figmaLinks.map(link => <LinkRow key={link.id} href={link.figma_link} url={link.figma_link} icon="fa-brands fa-figma" iconBg="rgba(139,92,246,0.10)" iconColor="#7C3AED" urlColor="#6D28D9" hoverBorder="#C4B5FD" title={link.title || ''} meta={`Added by ${link.added_by || 'Anonymous'} · ${new Date(link.created_at).toLocaleDateString()}`} metaColor="#9CA3AF" onDelete={() => handleDeleteLink(link)} />)}</div>}
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showWebForm ? 16 : webLinks.length > 0 ? 16 : 12 }}>
                    <SectionHeading icon="fa-solid fa-globe" iconBg="rgba(59,130,246,0.10)" iconColor="#2563EB" title="Web Links" count={webLinks.length} countBg="rgba(59,130,246,0.10)" countColor="#1D4ED8" />
                    <AddButton onClick={() => { setShowWebForm(p => !p); setWebError(''); }} active={showWebForm} accentColor="#2563EB" label="Add Web Link" />
                </div>
                {showWebForm && <AddLinkForm bg="rgba(59,130,246,0.04)" borderColor="rgba(59,130,246,0.20)" accentColor="#2563EB" urlLabel="Web URL" urlPlaceholder="https://example.com/..." urlIcon="fa-solid fa-globe" urlValue={newWeb.url} onUrlChange={e => { setNewWeb(p => ({ ...p, url: e.target.value })); setWebError(''); }} urlError={webError} titleValue={newWeb.title} onTitleChange={e => setNewWeb(p => ({ ...p, title: e.target.value }))} nameValue={newWeb.added_by} onNameChange={e => setNewWeb(p => ({ ...p, added_by: e.target.value }))} onSave={handleSaveWeb} onCancel={() => { setShowWebForm(false); setWebError(''); setNewWeb({ url: '', title: '', added_by: '' }); }} saving={webSaving} saveLabel="Save Web Link" />}
                {linksLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div style={{ width: 20, height: 20, border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div></div>
                    : webLinks.length === 0 && !showWebForm ? <EmptyState icon="fa-solid fa-globe" message="No web links added yet" />
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{webLinks.map(link => <LinkRow key={link.id} href={link.web_link} url={link.web_link} icon="fa-solid fa-globe" iconBg="rgba(59,130,246,0.10)" iconColor="#2563EB" urlColor="#1D4ED8" hoverBorder="#93C5FD" title={link.title || ''} meta={`Added by ${link.added_by || 'Anonymous'} · ${new Date(link.created_at).toLocaleDateString()}`} metaColor="#9CA3AF" onDelete={() => handleDeleteLink(link)} />)}</div>}
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.10)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="fa-solid fa-paperclip" style={{ color: '#059669', fontSize: 15 }}></i></div>
                    <span style={{ fontFamily: font, ...T.subhead, color: '#111827' }}>File Attachments</span>
                    {attachments.length > 0 && <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.10)', color: '#065F46', fontFamily: font, ...T.label, fontWeight: 600 }}>{attachments.length}</span>}
                </div>
                <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); if (files.length) { const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); fileInputRef.current.files = dt.files; handleFileUpload({ target: { files: dt.files } }); } }} style={{ border: '2px dashed #D1FAE5', borderRadius: 12, padding: '28px 20px', textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><i className="fa-solid fa-cloud-arrow-up" style={{ color: '#059669', fontSize: 18 }}></i></div>
                    <p style={{ fontFamily: font, ...T.bodyMed, color: '#111827', marginBottom: 4 }}>Drop files here or click to upload</p>
                    <p style={{ fontFamily: font, ...T.label, color: '#6B7280', marginBottom: 14 }}>Supports any file type</p>
                    <input type="text" value={uploadedBy} onChange={e => setUploadedBy(e.target.value)} placeholder="Your name (optional)" style={{ ...inp({ width: 'auto', padding: '7px 14px', marginBottom: 12, display: 'inline-block', textAlign: 'center' }) }} />
                    <div>
                        <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                        <label htmlFor="file-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: uploading ? '#9CA3AF' : '#059669', color: '#FFFFFF', borderRadius: 8, fontFamily: font, ...T.bodyMed, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                            <i className="fa-solid fa-paperclip" style={{ fontSize: 12 }}></i>{uploading ? 'Uploading…' : 'Choose Files'}
                        </label>
                    </div>
                </div>
                {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div style={{ width: 20, height: 20, border: '2px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div></div>
                    : attachments.length === 0 ? <EmptyState icon="fa-solid fa-file" message={`No file attachments yet for ${storyId}`} />
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: font, ...T.micro, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.06em', marginBottom: 4 }}>{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
                            {attachments.map(att => {
                                const [hov, setHov] = useState(false);
                                return (
                                    <div key={att.id} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: hov ? '#F9FAFB' : '#FFFFFF', border: `1px solid ${hov ? '#6EE7B7' : '#E5E7EB'}`, borderRadius: 10, transition: 'all 0.15s' }}>
                                        <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={`fa-solid ${fileIcon(att.file_type)}`} style={{ fontSize: 16, color: '#9CA3AF' }}></i></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontFamily: font, ...T.bodyMed, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{att.file_name}</p>
                                            <span style={{ fontFamily: font, ...T.label, color: '#9CA3AF' }}>{formatSize(att.file_size)} · Uploaded by {att.uploaded_by || '—'} · {new Date(att.uploaded_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
                                            <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#9CA3AF', textDecoration: 'none' }} title="Download"><i className="fa-solid fa-download" style={{ fontSize: 11 }}></i></a>
                                            <button onClick={() => handleDeleteFile(att)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete"><i className="fa-solid fa-trash" style={{ fontSize: 11 }}></i></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ── Helper: generate next story ID ───────────────────────────────────────────
const generateNextStoryId = (existingIds = []) => {
    if (!existingIds.length) return 'US-001';
    const nums = existingIds
        .map(id => { const match = id.match(/^US-(\d+)$/i); return match ? parseInt(match[1], 10) : 0; })
        .filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `US-${String(max + 1).padStart(3, '0')}`;
};

const EMPTY_FORM = {
    storyId: '', storyType: '', storyTitle: '', storySummary: '',
    moduleId: '', parentStoryId: '', sequence: '', businessContext: '',
    problemStatement: '', expectedOutcome: '', businessDomain: '', processArea: '',
    transactionType: '', criticality: '', product: 'NexTech RMS', application: '',
    module: '', feature: '', userRole: '', screenPage: '', asA: '', iWant: '',
    soThat: '', preconditions: '', mainFlow: '', alternateFlow: '', exceptionFlow: '',
    postconditions: '', businessRules: '', validationRules: '', fieldBehavior: '',
    calculationLogic: '', apiImpacted: '', dbTablesImpacted: '', integrationImpacted: '',
    reportsImpacted: '', configurationImpacted: '', securityRBACImpact: '',
    auditTrailRequired: '', performanceImpact: '', testScenarioCount: '',
    currentStatus: '', blocked: false, blockedReason: '',
    storyPoints: '', estimateHours: '', plannedSprint: '', plannedRelease: '', versionBuild: '',
    assignedBa: [], assignedFrontendDeveloper: [], assignedBackendDeveloper: [], assignedTester: [],
    linkedFeatures: [],
    approvalStatus: 'Pending', developmentStatus: 'Not Started', qaStatus: 'Not Started', releaseStatus: 'Not Released',
    createdBy: '', approvedBy: '', approvedAt: '', createdAt: '', updatedAt: ''
};

const UserStoryMapping = () => {
    const { storyId: urlStoryId } = useParams();
    const navigate = useNavigate();

    const isNew = !urlStoryId || urlStoryId === 'new';

    const [activeTab, setActiveTab] = useState('details');
    const [collapsedSections, setCollapsedSections] = useState({});
    const [lastSaved, setLastSaved] = useState('never');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showRelatedStories, setShowRelatedStories] = useState(false);
    const [showRelatedBugs, setShowRelatedBugs] = useState(false);
    const [showChangeRequests, setShowChangeRequests] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [storyUUID, setStoryUUID] = useState(null);
    const [tabCounts, setTabCounts] = useState({ testcases: null, bugs: null, comments: null, attachments: null });

    const [storyIdEditing, setStoryIdEditing] = useState(false);
    const [storyIdDraft, setStoryIdDraft] = useState('');
    const [storyIdError, setStoryIdError] = useState('');
    const storyIdInputRef = useRef(null);

    const [formData, setFormData] = useState({ ...EMPTY_FORM, storyId: isNew ? '' : urlStoryId });

    useEffect(() => {
        if (!isNew && urlStoryId) {
            setFormData(prev => ({ ...EMPTY_FORM, storyId: urlStoryId }));
            setStoryUUID(null);
            setActiveTab('details');
            setCollapsedSections({});
            setLastSaved('never');
            setTabCounts({ testcases: null, bugs: null, comments: null, attachments: null });
        }
    }, [urlStoryId]);

    useEffect(() => {
        if (!isNew) return;
        (async () => {
            const { data } = await supabase.from('user_stories').select('story_id').order('story_id', { ascending: true });
            const existingIds = (data || []).map(s => s.story_id);
            setFormData(prev => ({ ...prev, storyId: generateNextStoryId(existingIds) }));
        })();
    }, [isNew]);

    const [acceptanceCriteria, setAcceptanceCriteria] = useState([]);
    const [definitionOfDone, setDefinitionOfDone] = useState([
        { id: 1, text: 'Code reviewed and approved', checked: false },
        { id: 2, text: 'Unit tests written and passing', checked: false },
        { id: 3, text: 'Integration tests passing', checked: false },
        { id: 4, text: 'QA testing completed', checked: false },
        { id: 5, text: 'Documentation updated', checked: false }
    ]);

    const [profiles, setProfiles] = useState([]);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [features, setFeatures] = useState([]);
    const [featuresLoading, setFeaturesLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            setProfilesLoading(true);
            try {
                const { data, error } = await supabase.from('profiles').select('id, full_name, email, role').order('full_name', { ascending: true });
                if (error) { console.error('Profiles fetch error:', error); return; }
                if (data) setProfiles(data);
            } catch (err) { console.error('Profiles unexpected error:', err); }
            finally { setProfilesLoading(false); }
        };
        fetchProfiles();
    }, []);

    useEffect(() => {
        const fetchFeatures = async () => {
            setFeaturesLoading(true);
            try {
                const { data, error } = await supabase.from('features').select('id, feature_name, feature_code, module_id').order('feature_name', { ascending: true });
                if (error) { console.error('Features fetch error:', error); return; }
                if (data) setFeatures(data);
            } catch (err) { console.error('Features unexpected error:', err); }
            finally { setFeaturesLoading(false); }
        };
        fetchFeatures();
    }, []);

    useEffect(() => {
        if (!formData.storyId) return;
        const fetchStoryData = async () => {
            const { data } = await supabase
                .from('user_stories')
                .select('id, story_points, estimate_hours, planned_sprint, planned_release, version_build, assigned_ba, assigned_frontend_developer, assigned_backend_developer, assigned_tester, linked_features, approval_status, development_status, qa_status, release_status, approved_by, approved_at, created_by, created_at, updated_at')
                .eq('story_id', formData.storyId)
                .single();
            if (data) {
                setStoryUUID(data.id);
                setFormData(prev => ({
                    ...prev,
                    storyPoints: data.story_points ?? '',
                    estimateHours: data.estimate_hours ?? '',
                    plannedSprint: data.planned_sprint ?? '',
                    plannedRelease: data.planned_release ?? '',
                    versionBuild: data.version_build ?? '',
                    assignedBa: Array.isArray(data.assigned_ba) ? data.assigned_ba : (data.assigned_ba ? [data.assigned_ba] : []),
                    assignedFrontendDeveloper: Array.isArray(data.assigned_frontend_developer) ? data.assigned_frontend_developer : (data.assigned_frontend_developer ? [data.assigned_frontend_developer] : []),
                    assignedBackendDeveloper: Array.isArray(data.assigned_backend_developer) ? data.assigned_backend_developer : (data.assigned_backend_developer ? [data.assigned_backend_developer] : []),
                    assignedTester: Array.isArray(data.assigned_tester) ? data.assigned_tester : (data.assigned_tester ? [data.assigned_tester] : []),
                    linkedFeatures: Array.isArray(data.linked_features) ? data.linked_features : [],
                    approvalStatus: data.approval_status ?? 'Pending',
                    developmentStatus: data.development_status ?? 'Not Started',
                    qaStatus: data.qa_status ?? 'Not Started',
                    releaseStatus: data.release_status ?? 'Not Released',
                    approvedBy: data.approved_by ?? '',
                    approvedAt: data.approved_at ?? '',
                    createdBy: data.created_by ?? '',
                    createdAt: data.created_at ?? '',
                    updatedAt: data.updated_at ?? '',
                }));
            }
        };
        fetchStoryData();
    }, [formData.storyId]);

    useEffect(() => {
        if (!storyUUID) return;
        const fetchCounts = async () => {
            const [tc, bg, cm, at] = await Promise.all([
                supabase.from('test_cases').select('id', { count: 'exact', head: true }).eq('user_story_id', storyUUID),
                supabase.from('bugs').select('id', { count: 'exact', head: true }).eq('story_id', storyUUID),
                supabase.from('comments').select('id', { count: 'exact', head: true }).eq('story_id', storyUUID),
                supabase.from('attachments').select('id', { count: 'exact', head: true }).eq('story_id', storyUUID),
            ]);
            setTabCounts({ testcases: tc.count, bugs: bg.count, comments: cm.count, attachments: at.count });
        };
        fetchCounts();
    }, [storyUUID, activeTab]);

    const handleStoryIdEditStart = () => {
        setStoryIdDraft(formData.storyId);
        setStoryIdError('');
        setStoryIdEditing(true);
        setTimeout(() => storyIdInputRef.current?.select(), 50);
    };

    const handleStoryIdSave = async () => {
        const trimmed = storyIdDraft.trim().toUpperCase();
        if (!trimmed) { setStoryIdError('Story ID cannot be empty'); return; }
        if (!/^US-\d+$/.test(trimmed)) { setStoryIdError('Format must be US-### (e.g. US-046)'); return; }
        if (trimmed === formData.storyId) { setStoryIdEditing(false); return; }
        const { data } = await supabase.from('user_stories').select('id').eq('story_id', trimmed).maybeSingle();
        if (data) { setStoryIdError(`${trimmed} already exists`); return; }
        setFormData(prev => ({ ...prev, storyId: trimmed }));
        setStoryUUID(null);
        setStoryIdEditing(false);
        setStoryIdError('');
    };

    const handleStoryIdKeyDown = (e) => {
        if (e.key === 'Enter') handleStoryIdSave();
        if (e.key === 'Escape') { setStoryIdEditing(false); setStoryIdError(''); }
    };

    const handleAddNewStory = () => {
        if (formData.storyTitle || formData.storySummary || formData.mainFlow) {
            if (!window.confirm('Unsaved changes on the current story will be lost. Continue?')) return;
        }
        navigate('/stories/new');
    };

    const handleBackToList = () => {
        if (formData.storyTitle || formData.storySummary) {
            if (!window.confirm('Unsaved changes will be lost. Continue?')) return;
        }
        navigate('/stories');
    };

    const tabs = [
        { id: 'details', label: 'Story Details', icon: 'fa-info-circle' },
        { id: 'testcases', label: 'Linked Test Cases', icon: 'fa-list-check', countKey: 'testcases' },
        { id: 'bugs', label: 'Related Bugs', icon: 'fa-bug', countKey: 'bugs' },
        { id: 'comments', label: 'Comments', icon: 'fa-comment-dots', countKey: 'comments' },
        { id: 'attachments', label: 'Attachments', icon: 'fa-paperclip', countKey: 'attachments' },
    ];

    const toggleSection = useCallback((sectionId) => { setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] })); }, []);
    const handleInputChange = useCallback((field, value) => { setFormData(prev => ({ ...prev, [field]: value })); }, []);
    const toggleAcceptanceCriteria = useCallback((id) => { setAcceptanceCriteria(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)); }, []);
    const toggleDefinitionOfDone = useCallback((id) => { setDefinitionOfDone(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)); }, []);
    const addAcceptanceCriteria = useCallback(() => { setAcceptanceCriteria(prev => { const newId = Math.max(...prev.map(ac => ac.id), 0) + 1; return [...prev, { id: newId, text: 'New acceptance criteria', checked: false }]; }); }, []);

    // ── buildPayload — matched exactly to user_stories schema ─────────────────
    const buildPayload = (extraStatus) => {
        const now = new Date().toISOString();
        // approved_at must be a full ISO timestamp or null (it's timestamptz)
        let approvedAt = null;
        if (formData.approvedAt) {
            // if it's just a date string like "2026-04-09", convert to full ISO
            approvedAt = formData.approvedAt.includes('T')
                ? formData.approvedAt
                : `${formData.approvedAt}T00:00:00.000Z`;
        }
        return {
            story_id: formData.storyId,
            story_type: formData.storyType || null,
            story_title: formData.storyTitle || 'Untitled Story',
            story_summary: formData.storySummary || null,
            module_id: formData.moduleId || null,
            parent_story_id: formData.parentStoryId || null,
            sequence: formData.sequence ? parseInt(formData.sequence) : null,
            business_context: formData.businessContext || null,
            problem_statement: formData.problemStatement || null,
            expected_outcome: formData.expectedOutcome || null,
            business_domain: formData.businessDomain || null,
            process_area: formData.processArea || null,
            transaction_type: formData.transactionType || null,
            criticality: formData.criticality || null,
            application: formData.application || null,
            module: formData.module || null,
            feature: formData.feature || null,
            user_role: formData.userRole || null,
            screen_page: formData.screenPage || null,
            as_a: formData.asA || null,
            i_want: formData.iWant || null,
            so_that: formData.soThat || null,
            preconditions: formData.preconditions || null,
            main_flow: formData.mainFlow || null,
            alternate_flow: formData.alternateFlow || null,
            exception_flow: formData.exceptionFlow || null,
            postconditions: formData.postconditions || null,
            business_rules: formData.businessRules || null,
            validation_rules: formData.validationRules || null,
            field_behavior: formData.fieldBehavior || null,
            calculation_logic: formData.calculationLogic || null,
            api_impacted: formData.apiImpacted || null,
            db_tables_impacted: formData.dbTablesImpacted || null,
            integration_impacted: formData.integrationImpacted || null,
            reports_impacted: formData.reportsImpacted || null,
            configuration_impacted: formData.configurationImpacted || null,
            security_rbac_impact: formData.securityRBACImpact || null,
            audit_trail_required: formData.auditTrailRequired || null,
            performance_impact: formData.performanceImpact || null,
            test_scenario_count: formData.testScenarioCount ? parseInt(formData.testScenarioCount) : null,
            current_status: formData.currentStatus || extraStatus,
            blocked: formData.blocked ?? false,
            blocked_reason: formData.blockedReason || null,
            acceptance_criteria: acceptanceCriteria,
            definition_of_done: definitionOfDone,
            status: extraStatus,
            story_points: formData.storyPoints ? parseInt(formData.storyPoints) : null,
            estimate_hours: formData.estimateHours ? parseFloat(formData.estimateHours) : null,
            planned_sprint: formData.plannedSprint || null,
            planned_release: formData.plannedRelease || null,
            version_build: formData.versionBuild || null,
            // jsonb column
            assigned_ba: formData.assignedBa.length > 0 ? formData.assignedBa : null,
            // ARRAY columns
            assigned_frontend_developer: formData.assignedFrontendDeveloper.length > 0 ? formData.assignedFrontendDeveloper : null,
            assigned_backend_developer: formData.assignedBackendDeveloper.length > 0 ? formData.assignedBackendDeveloper : null,
            assigned_tester: formData.assignedTester.length > 0 ? formData.assignedTester : null,
            linked_features: formData.linkedFeatures.length > 0 ? formData.linkedFeatures : null,
            approval_status: formData.approvalStatus || null,
            development_status: formData.developmentStatus || null,
            qa_status: formData.qaStatus || null,
            release_status: formData.releaseStatus || null,
            approved_by: formData.approvedBy || null,
            approved_at: approvedAt,
            created_by: formData.createdBy || null,
            created_at: formData.createdAt || now,
            updated_at: now,
        };
    };

    const syncFeatures = async (savedStoryUUID, savedStoryId, selectedFeatures) => {
        try {
            const { error: deleteError } = await supabase.from('user_story_features').delete().eq('story_uuid', savedStoryUUID);
            if (deleteError) throw deleteError;
            if (!selectedFeatures || selectedFeatures.length === 0) return;
            const { data: featureRows, error: lookupError } = await supabase.from('features').select('id, feature_name').in('feature_name', selectedFeatures);
            if (lookupError) throw lookupError;
            const featureIdMap = {};
            (featureRows || []).forEach(f => { featureIdMap[f.feature_name] = f.id; });
            const rows = selectedFeatures.map(name => ({ story_id: savedStoryId, story_uuid: savedStoryUUID, feature_name: name, feature_id: featureIdMap[name] ?? null }));
            const { error: insertError } = await supabase.from('user_story_features').insert(rows);
            if (insertError) throw insertError;
        } catch (err) { console.error('syncFeatures error:', err.message); throw err; }
    };

    const handleSaveDraft = async () => {
        setSaveLoading(true);
        try {
            const { data, error } = await supabase.from('user_stories').upsert([buildPayload('Draft')], { onConflict: 'story_id' }).select('id').single();
            if (error) throw error;
            const savedUUID = data?.id;
            if (savedUUID) { setStoryUUID(savedUUID); await syncFeatures(savedUUID, formData.storyId, formData.linkedFeatures); }
            setLastSaved(new Date().toLocaleString());
            if (isNew) navigate(`/stories/${formData.storyId}`, { replace: true });
            alert('✅ Draft saved!');
        } catch (err) { alert(`❌ ${err.message}`); }
        finally { setSaveLoading(false); }
    };

    const handleSaveAndSubmit = async () => {
        if (!formData.storyTitle) { alert('⚠️ Story Title is required'); return; }
        setSaveLoading(true);
        try {
            const { data, error } = await supabase.from('user_stories').upsert([buildPayload('Submitted')], { onConflict: 'story_id' }).select('id').single();
            if (error) throw error;
            const savedUUID = data?.id;
            if (savedUUID) { setStoryUUID(savedUUID); await syncFeatures(savedUUID, formData.storyId, formData.linkedFeatures); }
            setLastSaved(new Date().toLocaleString());
            if (isNew) navigate(`/stories/${formData.storyId}`, { replace: true });
            alert('✅ Submitted!');
        } catch (err) { alert(`❌ ${err.message}`); }
        finally { setSaveLoading(false); }
    };

    const handleDuplicate = () => {
        const newId = `US-${String(parseInt(formData.storyId.split('-')[1]) + 1).padStart(3, '0')}`;
        navigate(`/stories/${newId}`);
        alert(`✅ Duplicated as ${newId}. Save to create.`);
    };

    const storyTypeOpts = ['Feature Enhancement', 'New Feature', 'Bug Fix', 'Technical Debt'];
    const moduleIdOpts = ['MOD-001 - Dashboard', 'MOD-002 - User Management', 'MOD-003 - Reports', 'MOD-004 - Settings'];
    const businessDomainOpts = ['Operations', 'Finance', 'Sales', 'HR'];
    const transactionTypeOpts = ['Read', 'Create', 'Update', 'Delete'];
    const criticalityOpts = ['High', 'Medium', 'Low', 'Critical'];
    const userRoleOpts = ['QA Manager', 'Tester', 'Developer', 'Product Owner'];
    const yesNoOpts = ['Yes', 'No'];
    const performanceOpts = ['Low', 'Medium', 'High'];
    const statusOpts = ['In Progress', 'Not Started', 'Completed', 'On Hold', 'Cancelled'];
    const approvalStatusOpts = ['Pending', 'Approved', 'Rejected', 'In Review'];
    const devStatusOpts = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
    const qaStatusOpts = ['Not Started', 'In Progress', 'Pass', 'Fail', 'Blocked'];
    const releaseStatusOpts = ['Not Released', 'Scheduled', 'Released', 'Rolled Back'];

    const teamMemberOpts = profiles.filter(p => p.full_name && p.full_name.trim() !== '').map(p => ({ value: p.full_name, label: p.role ? `${p.full_name} (${p.role})` : p.full_name }));
    const featureOpts = features.filter(f => f.feature_name && f.feature_name.trim() !== '').map(f => ({ value: f.feature_name, label: f.feature_code ? `${f.feature_name} (${f.feature_code})` : f.feature_name }));

    const inputCls = "w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
    const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block";

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                ::-webkit-scrollbar { display: none; }
                body { font-family: 'Roboto', sans-serif; }
                .section-header { cursor: pointer; transition: all 0.2s; }
                .section-header:hover { background-color: #F8FAFC; }
                .status-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; }
                .modal-content { background: white; border-radius: 0.5rem; padding: 2rem; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; }
                .add-story-btn { position: relative; overflow: hidden; }
                .add-story-btn::after { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.15); opacity: 0; transition: opacity 0.15s; }
                .add-story-btn:hover::after { opacity: 1; }
                .story-id-edit-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
            `}</style>

            <div className="flex min-h-screen">
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="bg-card border-b border-border">
                        <div className="px-4 lg:px-8 py-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={handleBackToList}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                                        title="Back to User Stories list"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M9 2L5 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="hidden sm:inline">Stories</span>
                                    </button>

                                    <span className="text-muted-foreground text-sm hidden sm:inline">/</span>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                {storyIdEditing ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                ref={storyIdInputRef}
                                                                value={storyIdDraft}
                                                                onChange={e => { setStoryIdDraft(e.target.value.toUpperCase()); setStoryIdError(''); }}
                                                                onKeyDown={handleStoryIdKeyDown}
                                                                placeholder="US-###"
                                                                className="story-id-edit-input px-2.5 py-1 text-xl font-bold border-2 border-indigo-400 rounded-lg bg-white text-foreground w-32"
                                                                style={{ fontSize: '1.15rem' }}
                                                            />
                                                            <button onClick={handleStoryIdSave} className="flex items-center justify-center w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors" title="Confirm">
                                                                <i className="fa-solid fa-check" style={{ fontSize: 11 }}></i>
                                                            </button>
                                                            <button onClick={() => { setStoryIdEditing(false); setStoryIdError(''); }} className="flex items-center justify-center w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md transition-colors" title="Cancel">
                                                                <i className="fa-solid fa-times" style={{ fontSize: 11 }}></i>
                                                            </button>
                                                        </div>
                                                        {storyIdError && (
                                                            <span className="text-xs text-red-500 flex items-center gap-1">
                                                                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10 }}></i>{storyIdError}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleStoryIdEditStart}
                                                        className="group flex items-center gap-1.5 hover:bg-indigo-50 rounded-lg px-1.5 py-0.5 transition-colors"
                                                        title="Click to edit Story ID"
                                                    >
                                                        <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                                                            {isNew ? 'New Story' : `User Story: ${formData.storyId}`}
                                                        </h2>
                                                        {!isNew && <i className="fa-solid fa-pencil text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 12 }}></i>}
                                                    </button>
                                                )}
                                            </div>
                                            {formData.currentStatus && (
                                                <span className="status-badge bg-blue-500 bg-opacity-10 text-blue-600">
                                                    <i className="fa-solid fa-circle text-xs"></i> {formData.currentStatus}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{formData.storyTitle || 'No title yet'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddNewStory}
                                    className="add-story-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        border: 'none',
                                        letterSpacing: '0.01em',
                                        flexShrink: 0,
                                    }}
                                    title="Create a new user story"
                                >
                                    <span style={{
                                        width: 22, height: 22, borderRadius: 6,
                                        background: 'rgba(255,255,255,0.22)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i>
                                    </span>
                                    Add User Story
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto">
                        <div className="p-4 lg:p-8">
                            <div className="bg-card border border-border rounded-lg shadow-sm mb-6">
                                <div className="flex items-center gap-1 px-4 border-b border-border overflow-x-auto">
                                    {tabs.map(tab => {
                                        const count = tab.countKey ? tabCounts[tab.countKey] : null;
                                        return (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center ${activeTab === tab.id ? 'border-b-2 border-primary text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <i className={`fa-solid ${tab.icon} mr-2`}></i>{tab.label}
                                                {count !== null && count > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-primary bg-opacity-15 text-primary text-xs font-bold rounded-full">{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">

                                        <Section id="story-identification" title="Story Identification" icon="fa-fingerprint" iconColor="bg-primary" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={labelCls}>Story ID</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={formData.storyId}
                                                            readOnly
                                                            className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm pr-10 cursor-default"
                                                        />
                                                        <button
                                                            onClick={handleStoryIdEditStart}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                            title="Edit Story ID"
                                                        >
                                                            <i className="fa-solid fa-pencil" style={{ fontSize: 11 }}></i>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                                        <i className="fa-solid fa-circle-info text-indigo-400" style={{ fontSize: 10 }}></i>
                                                        Auto-generated · click <i className="fa-solid fa-pencil text-indigo-400 mx-0.5" style={{ fontSize: 9 }}></i> to change
                                                    </p>
                                                </div>
                                                <div><label className={labelCls}>Story Type</label><CustomSelect value={formData.storyType} onChange={v => handleInputChange('storyType', v)} options={storyTypeOpts} /></div>
                                                <div className="sm:col-span-2"><label className={labelCls}>Story Title <span className="text-destructive">*</span></label><input type="text" value={formData.storyTitle} onChange={e => handleInputChange('storyTitle', e.target.value)} placeholder="Enter story title..." className={inputCls} /></div>
                                                <div className="sm:col-span-2"><label className={labelCls}>Story Summary</label><textarea rows="3" value={formData.storySummary} onChange={e => handleInputChange('storySummary', e.target.value)} className={inputCls} placeholder="Brief summary..." /></div>
                                                <div><label className={labelCls}>Module ID</label><CustomSelect value={formData.moduleId} onChange={v => handleInputChange('moduleId', v)} options={moduleIdOpts} /></div>
                                                <div><label className={labelCls}>Parent Story ID</label><input type="text" value={formData.parentStoryId} onChange={e => handleInputChange('parentStoryId', e.target.value)} placeholder="US-XXX" className={inputCls} /></div>
                                                <div><label className={labelCls}>Sequence/Order</label><input type="number" value={formData.sequence} onChange={e => handleInputChange('sequence', e.target.value)} placeholder="e.g. 1" className={inputCls} /></div>
                                            </div>
                                        </Section>

                                        <Section id="business-context" title="Business Context" icon="fa-briefcase" iconColor="bg-blue-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="space-y-6">
                                                {[['businessContext', 'Business Context', 3, 'Describe the business context...'], ['problemStatement', 'Problem Statement', 3, 'What problem are we solving?'], ['expectedOutcome', 'Expected Outcome', 3, 'What is the expected outcome?']].map(([field, lbl, rows, ph]) => (<div key={field}><label className={labelCls}>{lbl}</label><textarea rows={rows} value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} className={inputCls} placeholder={ph} /></div>))}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div><label className={labelCls}>Business Domain</label><CustomSelect value={formData.businessDomain} onChange={v => handleInputChange('businessDomain', v)} options={businessDomainOpts} /></div>
                                                    <div><label className={labelCls}>Process Area</label><input type="text" value={formData.processArea} onChange={e => handleInputChange('processArea', e.target.value)} placeholder="e.g. Monitoring" className={inputCls} /></div>
                                                    <div><label className={labelCls}>Transaction Type</label><CustomSelect value={formData.transactionType} onChange={v => handleInputChange('transactionType', v)} options={transactionTypeOpts} /></div>
                                                </div>
                                                <div><label className={labelCls}>Criticality</label><CustomSelect value={formData.criticality} onChange={v => handleInputChange('criticality', v)} options={criticalityOpts} /></div>
                                            </div>
                                        </Section>

                                        <Section id="functional-context" title="Functional Context" icon="fa-layer-group" iconColor="bg-purple-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div><label className={labelCls}>Product</label><input type="text" value={formData.product} className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm" readOnly /></div>
                                                <div><label className={labelCls}>Application</label><input type="text" value={formData.application} onChange={e => handleInputChange('application', e.target.value)} placeholder="e.g. Testing Portal" className={inputCls} /></div>
                                                <div><label className={labelCls}>Module</label><input type="text" value={formData.module} onChange={e => handleInputChange('module', e.target.value)} placeholder="e.g. Dashboard" className={inputCls} /></div>
                                                <div><label className={labelCls}>Feature</label><input type="text" value={formData.feature} onChange={e => handleInputChange('feature', e.target.value)} placeholder="e.g. Real-time Updates" className={inputCls} /></div>
                                                <div><label className={labelCls}>User Role/Persona</label><CustomSelect value={formData.userRole} onChange={v => handleInputChange('userRole', v)} options={userRoleOpts} /></div>
                                                <div><label className={labelCls}>Screen/Page Name</label><input type="text" value={formData.screenPage} onChange={e => handleInputChange('screenPage', e.target.value)} placeholder="e.g. Main Dashboard" className={inputCls} /></div>
                                                <div className="sm:col-span-2">
                                                    <label className={labelCls}>
                                                        <i className="fa-solid fa-puzzle-piece text-purple-500 mr-1.5"></i>
                                                        Linked Features
                                                        {formData.linkedFeatures.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full normal-case">{formData.linkedFeatures.length}</span>}
                                                    </label>
                                                    <MultiSelect values={formData.linkedFeatures} onChange={v => handleInputChange('linkedFeatures', v)} options={featureOpts} placeholder={featuresLoading ? 'Loading features…' : featureOpts.length === 0 ? 'No features found' : 'Select features…'} searchPlaceholder="Search features..." />
                                                </div>
                                            </div>
                                        </Section>

                                        <Section id="story-definition" title="Standard Story Definition" icon="fa-pen-to-square" iconColor="bg-green-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                                                <div className="grid grid-cols-1 gap-4">
                                                    {[['asA', 'As a', 'text', 1, 'e.g. QA Manager'], ['iWant', 'I want', 'textarea', 2, 'e.g. to see real-time updates...'], ['soThat', 'So that', 'textarea', 2, 'e.g. I can monitor progress...']].map(([field, lbl, type, rows, ph]) => (
                                                        <div key={field}>
                                                            <label className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 block">{lbl}</label>
                                                            {type === 'textarea'
                                                                ? <textarea rows={rows} value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} placeholder={ph} className="w-full px-4 py-2.5 bg-white border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                                                : <input type="text" value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} placeholder={ph} className="w-full px-4 py-2.5 bg-white border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Section>

                                        <Section id="detailed-behavior" title="Detailed Behavior" icon="fa-diagram-project" iconColor="bg-orange-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="space-y-6">
                                                {[['preconditions', 'Preconditions', 3, 'Conditions that must be met...'], ['mainFlow', 'Main Flow', 5, 'Step-by-step main flow...'], ['alternateFlow', 'Alternate Flow', 4, 'Alternate paths...'], ['exceptionFlow', 'Exception Flow', 4, 'Error handling...'], ['postconditions', 'Postconditions', 3, 'State after completion...']].map(([field, lbl, rows, ph]) => (
                                                    <div key={field}><label className={labelCls}>{lbl}</label><textarea rows={rows} value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} className={inputCls} placeholder={ph} /></div>
                                                ))}
                                            </div>
                                        </Section>

                                        <Section id="business-rules" title="Business Rules & Validation" icon="fa-scale-balanced" iconColor="bg-red-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="space-y-6">
                                                {[['businessRules', 'Business Rules', 4, 'List business rules...'], ['validationRules', 'Validation Rules', 4, 'List validation rules...'], ['fieldBehavior', 'Field Behavior', 3, 'Describe field behaviors...'], ['calculationLogic', 'Calculation Logic', 3, 'Describe calculation logic...']].map(([field, lbl, rows, ph]) => (
                                                    <div key={field}><label className={labelCls}>{lbl}</label><textarea rows={rows} value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} className={inputCls} placeholder={ph} /></div>
                                                ))}
                                            </div>
                                        </Section>

                                        <Section id="acceptance-testing" title="Acceptance & Testing" icon="fa-clipboard-check" iconColor="bg-teal-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className={labelCls}>Acceptance Criteria</label>
                                                    <div className="space-y-3">
                                                        {acceptanceCriteria.length === 0 && <p className="text-sm text-muted-foreground italic">No acceptance criteria added yet.</p>}
                                                        {acceptanceCriteria.map(criteria => (<div key={criteria.id} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"><input type="checkbox" checked={criteria.checked} onChange={() => toggleAcceptanceCriteria(criteria.id)} className="mt-1 w-4 h-4 text-primary rounded" /><p className="text-sm text-foreground">{criteria.text}</p></div>))}
                                                        <button onClick={addAcceptanceCriteria} className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded-lg text-sm font-medium transition-colors"><i className="fa-solid fa-plus"></i> Add Acceptance Criteria</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Definition of Done</label>
                                                    <div className="space-y-2">{definitionOfDone.map(item => (<div key={item.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"><input type="checkbox" checked={item.checked} onChange={() => toggleDefinitionOfDone(item.id)} className="w-4 h-4 text-primary rounded" /><p className="text-sm text-foreground">{item.text}</p></div>))}</div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div><label className={labelCls}>Test Scenario Count</label><input type="number" value={formData.testScenarioCount} onChange={e => handleInputChange('testScenarioCount', e.target.value)} placeholder="0" className={inputCls} /></div>
                                                    <div><label className={labelCls}>Linked Test Cases</label><button onClick={() => setActiveTab('testcases')} className="w-full px-4 py-2.5 bg-primary bg-opacity-10 text-primary border border-primary rounded-lg text-sm font-medium hover:bg-opacity-20 transition-colors"><i className="fa-solid fa-link mr-2"></i>View Test Cases {tabCounts.testcases !== null ? `(${tabCounts.testcases})` : ''}</button></div>
                                                </div>
                                            </div>
                                        </Section>

                                        <Section id="technical-references" title="Technical References" icon="fa-code" iconColor="bg-indigo-500" collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                            <div className="space-y-6">
                                                {[['apiImpacted', 'API Impacted', 3, 'List APIs impacted...'], ['dbTablesImpacted', 'DB Tables Impacted', 2, 'List DB tables...'], ['integrationImpacted', 'Integration Impacted', 2, 'List integrations...'], ['reportsImpacted', 'Reports Impacted', 2, 'List reports...'], ['configurationImpacted', 'Configuration Impacted', 2, 'List config settings...']].map(([field, lbl, rows, ph]) => (
                                                    <div key={field}><label className={labelCls}>{lbl}</label><textarea rows={rows} value={formData[field]} onChange={e => handleInputChange(field, e.target.value)} className={inputCls} placeholder={ph} /></div>
                                                ))}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div><label className={labelCls}>Security/RBAC Impact</label><CustomSelect value={formData.securityRBACImpact} onChange={v => handleInputChange('securityRBACImpact', v)} options={yesNoOpts} /></div>
                                                    <div><label className={labelCls}>Audit Trail Required</label><CustomSelect value={formData.auditTrailRequired} onChange={v => handleInputChange('auditTrailRequired', v)} options={yesNoOpts} /></div>
                                                    <div><label className={labelCls}>Performance Impact</label><CustomSelect value={formData.performanceImpact} onChange={v => handleInputChange('performanceImpact', v)} options={performanceOpts} /></div>
                                                </div>
                                            </div>
                                        </Section>

                                    </div>

                                    {/* ── RIGHT SIDEBAR ── */}
                                    <div className="space-y-6">
                                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><i className="fa-solid fa-circle-info text-primary"></i> Quick Information</h3>
                                            <div className="space-y-4">
                                                <div><p className="text-xs text-muted-foreground mb-1">Current Status</p>{formData.currentStatus ? <span className="status-badge bg-blue-500 bg-opacity-10 text-blue-600"><i className="fa-solid fa-circle text-xs"></i> {formData.currentStatus}</span> : <span className="text-sm text-muted-foreground italic">Not set</span>}</div>
                                                <div><p className="text-xs text-muted-foreground mb-1">Priority</p>{formData.criticality ? <span className="status-badge bg-red-500 bg-opacity-10 text-red-600"><i className="fa-solid fa-arrow-up"></i> {formData.criticality}</span> : <span className="text-sm text-muted-foreground italic">Not set</span>}</div>
                                                <div><label className="text-xs text-muted-foreground block mb-1">Story Points</label><input type="number" min="0" max="100" value={formData.storyPoints} onChange={e => handleInputChange('storyPoints', e.target.value)} placeholder="e.g. 5" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                <div><label className="text-xs text-muted-foreground block mb-1">Estimate Hours</label><input type="number" min="0" step="0.5" value={formData.estimateHours} onChange={e => handleInputChange('estimateHours', e.target.value)} placeholder="e.g. 8.5" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                <div className="pt-3 border-t border-border space-y-3">
                                                    <div><label className="text-xs text-muted-foreground block mb-1">Planned Sprint</label><input type="text" value={formData.plannedSprint} onChange={e => handleInputChange('plannedSprint', e.target.value)} placeholder="e.g. Sprint 12" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                    <div><label className="text-xs text-muted-foreground block mb-1">Planned Release</label><input type="text" value={formData.plannedRelease} onChange={e => handleInputChange('plannedRelease', e.target.value)} placeholder="e.g. v2.4.0" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                    <div><label className="text-xs text-muted-foreground block mb-1">Version/Build</label><input type="text" value={formData.versionBuild} onChange={e => handleInputChange('versionBuild', e.target.value)} placeholder="e.g. build-1042" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                </div>
                                                {formData.linkedFeatures.length > 0 && (
                                                    <div className="pt-3 border-t border-border">
                                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><i className="fa-solid fa-puzzle-piece text-purple-500 text-xs"></i>Linked Features<span className="ml-auto px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{formData.linkedFeatures.length}</span></p>
                                                        <div className="flex flex-wrap gap-1.5">{formData.linkedFeatures.map(f => (<span key={f} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium rounded-md"><i className="fa-solid fa-puzzle-piece text-purple-400" style={{ fontSize: 9 }}></i>{f}</span>))}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                                <i className="fa-solid fa-users text-primary"></i>Team Assignment
                                                {profilesLoading && <span className="text-xs text-muted-foreground font-normal ml-1 flex items-center gap-1"><span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin inline-block"></span>loading…</span>}
                                                {!profilesLoading && teamMemberOpts.length === 0 && <span className="text-xs text-amber-500 font-normal ml-1">(no profiles found)</span>}
                                            </h3>
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><i className="fa-solid fa-user-tie text-purple-500 text-xs"></i>Assigned BA{formData.assignedBa.length > 0 && <span className="ml-auto px-1.5 py-0.5 bg-primary bg-opacity-10 text-primary text-xs font-bold rounded-full">{formData.assignedBa.length}</span>}</label>
                                                    <MultiSelect values={formData.assignedBa} onChange={v => handleInputChange('assignedBa', v)} options={teamMemberOpts} placeholder={profilesLoading ? 'Loading members…' : teamMemberOpts.length === 0 ? 'No profiles found' : 'Select BAs…'} searchPlaceholder="Search members..." />
                                                </div>
                                                <div className="border border-blue-200 rounded-xl p-4 space-y-4 bg-blue-50/40">
                                                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><i className="fa-solid fa-code text-blue-500 text-xs"></i>Developers</p>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-desktop text-blue-500" style={{ fontSize: 9 }}></i></span>Frontend Developer{formData.assignedFrontendDeveloper.length > 0 && <span className="ml-auto px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{formData.assignedFrontendDeveloper.length}</span>}</label>
                                                        <MultiSelect values={formData.assignedFrontendDeveloper} onChange={v => handleInputChange('assignedFrontendDeveloper', v)} options={teamMemberOpts} placeholder={profilesLoading ? 'Loading members…' : teamMemberOpts.length === 0 ? 'No profiles found' : 'Select Frontend Devs…'} searchPlaceholder="Search members..." />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><span className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-server text-indigo-500" style={{ fontSize: 9 }}></i></span>Backend Developer{formData.assignedBackendDeveloper.length > 0 && <span className="ml-auto px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{formData.assignedBackendDeveloper.length}</span>}</label>
                                                        <MultiSelect values={formData.assignedBackendDeveloper} onChange={v => handleInputChange('assignedBackendDeveloper', v)} options={teamMemberOpts} placeholder={profilesLoading ? 'Loading members…' : teamMemberOpts.length === 0 ? 'No profiles found' : 'Select Backend Devs…'} searchPlaceholder="Search members..." />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><i className="fa-solid fa-flask text-green-500 text-xs"></i>Assigned Tester{formData.assignedTester.length > 0 && <span className="ml-auto px-1.5 py-0.5 bg-primary bg-opacity-10 text-primary text-xs font-bold rounded-full">{formData.assignedTester.length}</span>}</label>
                                                    <MultiSelect values={formData.assignedTester} onChange={v => handleInputChange('assignedTester', v)} options={teamMemberOpts} placeholder={profilesLoading ? 'Loading members…' : teamMemberOpts.length === 0 ? 'No profiles found' : 'Select Testers…'} searchPlaceholder="Search members..." />
                                                </div>
                                                {!profilesLoading && teamMemberOpts.length === 0 && (
                                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xs mt-0.5 flex-shrink-0"></i>
                                                        <p className="text-xs text-amber-700 leading-relaxed">No profiles loaded. You may need to add a Supabase RLS policy:<code className="block mt-1 bg-amber-100 px-2 py-1 rounded font-mono text-xs">CREATE POLICY "read_profiles" ON profiles FOR SELECT USING (true);</code></p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><i className="fa-solid fa-tasks text-primary"></i> Status Tracking</h3>
                                            <div className="space-y-4">
                                                <div><p className="text-xs text-muted-foreground mb-2">Current Status</p><CustomSelect value={formData.currentStatus} onChange={v => handleInputChange('currentStatus', v)} options={statusOpts} /></div>
                                                <div><p className="text-xs text-muted-foreground mb-2">Approval Status</p><CustomSelect value={formData.approvalStatus} onChange={v => handleInputChange('approvalStatus', v)} options={approvalStatusOpts} /></div>
                                                <div><p className="text-xs text-muted-foreground mb-2">Development Status</p><CustomSelect value={formData.developmentStatus} onChange={v => handleInputChange('developmentStatus', v)} options={devStatusOpts} /></div>
                                                <div><p className="text-xs text-muted-foreground mb-2">QA Status</p><CustomSelect value={formData.qaStatus} onChange={v => handleInputChange('qaStatus', v)} options={qaStatusOpts} /></div>
                                                <div><p className="text-xs text-muted-foreground mb-2">Release Status</p><CustomSelect value={formData.releaseStatus} onChange={v => handleInputChange('releaseStatus', v)} options={releaseStatusOpts} /></div>
                                                <div className="pt-4 border-t border-border">
                                                    <div className="flex items-center gap-2 mb-2"><input type="checkbox" checked={formData.blocked} onChange={e => handleInputChange('blocked', e.target.checked)} className="w-4 h-4 text-primary rounded" /><p className="text-xs font-semibold text-muted-foreground">Blocked</p></div>
                                                    {formData.blocked && <textarea rows="2" value={formData.blockedReason} onChange={e => handleInputChange('blockedReason', e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Describe the blocker..." />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><i className="fa-solid fa-link text-primary"></i> Related Items</h3>
                                            <div className="space-y-3">
                                                <button onClick={() => setShowRelatedStories(true)} className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"><span className="text-sm font-medium text-blue-700">Related User Stories</span><span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs font-semibold rounded">0</span></button>
                                                <button onClick={() => setActiveTab('bugs')} className="w-full flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"><span className="text-sm font-medium text-red-700">Related Bugs</span><span className="px-2 py-1 bg-red-200 text-red-700 text-xs font-semibold rounded">{tabCounts.bugs ?? 0}</span></button>
                                                <button onClick={() => setShowChangeRequests(true)} className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"><span className="text-sm font-medium text-purple-700">Change Requests</span><span className="px-2 py-1 bg-purple-200 text-purple-700 text-xs font-semibold rounded">0</span></button>
                                            </div>
                                        </div>

                                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><i className="fa-solid fa-clock text-primary"></i> Audit Information</h3>
                                            <div className="space-y-3">
                                                <div><label className="text-xs text-muted-foreground block mb-1">Created By</label><input type="text" value={formData.createdBy} onChange={e => handleInputChange('createdBy', e.target.value)} placeholder="Your name" className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                <div className="flex justify-between text-xs py-1"><span className="text-muted-foreground">Created Date</span><span className="font-medium text-foreground">{formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : '—'}</span></div>
                                                <div className="flex justify-between text-xs py-1"><span className="text-muted-foreground">Last Updated</span><span className="font-medium text-foreground">{formData.updatedAt ? new Date(formData.updatedAt).toLocaleDateString() : '—'}</span></div>
                                                <div className="pt-3 border-t border-border space-y-3">
                                                    <div><label className="text-xs text-muted-foreground block mb-1">Approved By</label><CustomSelect value={formData.approvedBy} onChange={v => handleInputChange('approvedBy', v)} options={teamMemberOpts} placeholder="Select approver…" /></div>
                                                    <div><label className="text-xs text-muted-foreground block mb-1">Approved Date</label><input type="date" value={formData.approvedAt ? formData.approvedAt.split('T')[0] : ''} onChange={e => handleInputChange('approvedAt', e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'testcases' && <div className="bg-card border border-border rounded-lg shadow-sm p-6"><TestCasesTab storyId={formData.storyId} storyUUID={storyUUID} /></div>}
                            {activeTab === 'bugs' && <div className="bg-card border border-border rounded-lg shadow-sm p-6"><BugsTab storyId={formData.storyId} storyUUID={storyUUID} /></div>}
                            {activeTab === 'comments' && <div className="bg-card border border-border rounded-lg shadow-sm p-6"><CommentsTab storyId={formData.storyId} storyUUID={storyUUID} /></div>}
                            {activeTab === 'attachments' && <div className="bg-card border border-border rounded-lg shadow-sm p-6"><AttachmentsTab storyId={formData.storyId} storyUUID={storyUUID} /></div>}
                        </div>
                    </main>

                    <footer className="bg-card border-t border-border">
                        <div className="px-4 lg:px-8 py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground"><i className="fa-solid fa-clock"></i><span>Last saved: {lastSaved}</span></div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleSaveDraft} disabled={saveLoading} className="px-6 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                                        <i className="fa-solid fa-floppy-disk mr-2"></i>{saveLoading ? 'Saving...' : 'Save Draft'}
                                    </button>
                                    <button onClick={handleSaveAndSubmit} disabled={saveLoading} className="px-6 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                                        <i className="fa-solid fa-check mr-2"></i>{saveLoading ? 'Submitting...' : 'Save & Submit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </footer>

                    {showHistoryModal && <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Story History</h3><p className="text-sm text-gray-600 mb-4">Version history for this user story.</p><div className="border-l-4 border-blue-500 pl-4 py-2"><p className="text-sm font-medium">Draft Created</p><p className="text-xs text-gray-500">Just now by System</p></div><button onClick={() => setShowHistoryModal(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Close</button></div></div>}
                    {showRelatedStories && <div className="modal-overlay" onClick={() => setShowRelatedStories(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Related User Stories</h3><p className="text-sm text-gray-600">No related stories found for {formData.storyId}.</p><button onClick={() => setShowRelatedStories(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Close</button></div></div>}
                    {showChangeRequests && <div className="modal-overlay" onClick={() => setShowChangeRequests(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Change Requests</h3><p className="text-sm text-gray-600">No change requests found for {formData.storyId}.</p><button onClick={() => setShowChangeRequests(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Close</button></div></div>}
                </div>
            </div>
        </>
    );
};

export default UserStoryMapping;