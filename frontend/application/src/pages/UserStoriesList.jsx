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
const StoryCard = ({ story, onClick }) => {
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

// ── CSV helpers + Import Modal ────────────────────────────────────────────────
const splitCSVLine = (line) => {
    const cells = []; let inQ = false, cur = "";
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
        else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ""; }
        else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
};
const normaliseHeader = (h) => h.replace(/^﻿/, "").replace(/^["'\s]+|["'\s]+$/g, "").toLowerCase().trim();

const STORY_COLUMNS = [
    { label: "Module Name", required: true, hint: "Must match an existing module." },
    { label: "Feature Code", required: true, hint: "e.g. FEAT-001 — must match an existing feature." },
    { label: "Feature Name", required: true, hint: "Name of the linked feature." },
    { label: "User Story ID", required: true, hint: "e.g. US-046 — must be unique." },
    { label: "User Story Name", required: true, hint: "Story title." },
    { label: "Story Type", required: false, hint: "Optional — Feature Enhancement | New Feature | Bug Fix | Technical Debt" },
    { label: "Criticality", required: false, hint: "Optional — Critical | High | Medium | Low" },
    { label: "Story Summary", required: false, hint: "Optional — brief description." },
];

const downloadStoriesTemplate = () => {
    const headers = STORY_COLUMNS.map(c => c.label).join(",");
    const example = `"Login Module","FEAT-001","User Authentication","US-001","User can log in with valid credentials","New Feature","High","User can log in with email and password"`;
    const csv = `${headers}\n${example}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = "user_stories_import_template.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

const parseStoriesCSV = (text) => {
    const allLines = text.replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
    if (allLines.length < 2) return { rows: [], rowErrors: [], fatalError: "CSV must have a header row and at least one data row." };

    const rawHeaders = splitCSVLine(allLines[0]).map(normaliseHeader);
    const keyMap = {
        "module name": "module_name",
        "feature code": "feature_code",
        "feature name": "feature_name",
        "user story id": "story_id",
        "user story name": "story_title",
        "story type": "story_type",
        "criticality": "criticality",
        "story summary": "story_summary",
    };
    const idxMap = {};
    rawHeaders.forEach((h, i) => { const k = keyMap[h]; if (k) idxMap[k] = i; });

    const required = ["module_name", "feature_code", "feature_name", "story_id", "story_title"];
    const missing = required.filter(k => idxMap[k] === undefined);
    if (missing.length) {
        const labels = missing.map(k => STORY_COLUMNS.find(c => keyMap[normaliseHeader(c.label)] === k)?.label || k);
        return { rows: [], rowErrors: [], fatalError: `Missing required column${missing.length > 1 ? "s" : ""}: ${labels.join(", ")}. Please use the provided template.` };
    }

    const rows = [], rowErrors = [];
    allLines.slice(1).forEach((line, i) => {
        const cells = splitCSVLine(line);
        const get = (k) => idxMap[k] !== undefined ? (cells[idxMap[k]] || "").replace(/^"|"$/g, "").trim() : "";
        const rowNum = i + 2;
        const row = {
            module_name: get("module_name"),
            feature_code: get("feature_code"),
            feature_name: get("feature_name"),
            story_id: get("story_id"),
            story_title: get("story_title"),
            story_type: get("story_type"),
            criticality: get("criticality"),
            story_summary: get("story_summary"),
        };
        const errs = [];
        if (!row.module_name) errs.push("Module Name is required");
        if (!row.feature_code) errs.push("Feature Code is required");
        if (!row.feature_name) errs.push("Feature Name is required");
        if (!row.story_id) errs.push("User Story ID is required");
        else if (!/^US-\d+$/i.test(row.story_id)) errs.push(`User Story ID must be in format US-### (got "${row.story_id}")`);
        if (!row.story_title) errs.push("User Story Name is required");

        if (errs.length) rowErrors.push({ row: rowNum, name: row.story_id || `Row ${rowNum}`, messages: errs });
        else rows.push({ ...row, story_id: row.story_id.toUpperCase() });
    });
    return { rows, rowErrors, fatalError: null };
};

function ImportUserStoriesModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const inputRef = useRef(null);

    const handleClose = () => { setFile(null); setParsed(null); setImporting(false); setResult(null); onClose(); };

    const handleFile = (f) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith(".csv")) { alert("Only .csv files are supported."); return; }
        setFile(f); setResult(null); setParsed(null);
        const reader = new FileReader();
        reader.onload = (e) => setParsed(parseStoriesCSV(e.target.result));
        reader.readAsText(f);
    };

    const handleImport = async () => {
        if (!parsed?.rows?.length) return;
        setImporting(true);

        const [{ data: modules }, { data: features }, { data: existing }] = await Promise.all([
            supabase.from("modules").select("id, module_name"),
            supabase.from("features").select("id, feature_code, feature_name"),
            supabase.from("user_stories").select("story_id"),
        ]);
        const moduleMap = {};
        (modules || []).forEach(m => { if (m.module_name) moduleMap[m.module_name.toLowerCase().trim()] = m.id; });
        // Build TWO lookup maps so a feature can be resolved either by code or by name
        // (whichever the CSV matches). Whatever we find, we then store the DB-side
        // `feature_name` so LinkedFeaturesTab's name fallback always finds the row.
        const featureByCode = {};
        const featureByName = {};
        (features || []).forEach(f => {
            if (f.feature_code) featureByCode[f.feature_code.toLowerCase().trim()] = f;
            if (f.feature_name) featureByName[f.feature_name.toLowerCase().trim()] = f;
        });
        const existingIds = new Set((existing || []).map(s => (s.story_id || "").toUpperCase()));

        const success = [], failed = [];
        for (const row of parsed.rows) {
            if (existingIds.has(row.story_id)) { failed.push({ name: row.story_id, reason: "Story ID already exists" }); continue; }
            const moduleId = moduleMap[row.module_name.toLowerCase().trim()] || null;
            const matchedFeature =
                featureByCode[row.feature_code.toLowerCase().trim()] ||
                featureByName[row.feature_name.toLowerCase().trim()] || null;
            const featureIdToStore = matchedFeature?.id ?? null;
            const featureNameToStore = matchedFeature?.feature_name || row.feature_name;
            const now = new Date().toISOString();
            const payload = {
                story_id: row.story_id,
                story_title: row.story_title,
                module: row.module_name,
                module_id: moduleId,
                feature: featureNameToStore,
                story_type: row.story_type || null,
                criticality: row.criticality || null,
                story_summary: row.story_summary || null,
                linked_features: [featureNameToStore],
                current_status: "Draft",
                status: "Draft",
                approval_status: "Pending",
                created_at: now,
                updated_at: now,
            };
            const { data: saved, error } = await supabase.from("user_stories").insert([payload]).select("id").single();
            if (error) { failed.push({ name: row.story_id, reason: error.message }); continue; }
            if (saved?.id) {
                const { error: linkErr } = await supabase.from("user_story_features").insert([{
                    story_id: row.story_id,
                    story_uuid: saved.id,
                    feature_name: featureNameToStore,
                    feature_id: featureIdToStore,
                }]);
                if (linkErr) console.error(`user_story_features insert failed for ${row.story_id}:`, linkErr);
            }
            existingIds.add(row.story_id);
            success.push(row.story_id);
        }
        const skipped = (parsed.rowErrors || []).map(e => ({ name: e.name || `Row ${e.row}`, reason: Array.isArray(e.messages) ? e.messages.join(" · ") : e.messages }));
        setResult({ success, failed: [...skipped, ...failed] });
        setImporting(false);
        if (success.length) onSuccess();
    };

    const validRows = parsed?.rows?.length || 0;
    const canImport = !importing && !!file && !parsed?.fatalError && validRows > 0;

    return (
        <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, background: "#fff", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>Import User Stories</h3>
                        <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0" }}>Bulk-create user stories from a CSV file.</p>
                    </div>
                    <button onClick={handleClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
                </div>

                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {!result ? (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 16px", background: "#eff6ff", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 10 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", margin: "0 0 2px" }}>Download Import Template</p>
                                    <p style={{ fontSize: 12, color: "#3b82f6", margin: 0 }}>CSV with all expected columns and an example row.</p>
                                </div>
                                <button type="button" onClick={downloadStoriesTemplate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid rgba(37,99,235,0.3)", color: "#2563EB", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                                    <i className="fa-solid fa-download" style={{ fontSize: 11 }}></i> Template
                                </button>
                            </div>

                            <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                                <div style={{ padding: "9px 14px", background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Column Reference</span>
                                </div>
                                {STORY_COLUMNS.map((col, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: i < STORY_COLUMNS.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: "#374151", background: "#F8FAFC", padding: "2px 8px", borderRadius: 5, minWidth: 130, whiteSpace: "nowrap" }}>{col.label}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: col.required ? "#dc2626" : "#94a3b8", minWidth: 56 }}>
                                            {col.required ? "Required" : "Optional"}
                                        </span>
                                        <span style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>{col.hint}</span>
                                    </div>
                                ))}
                            </div>

                            <div
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                                onClick={() => inputRef.current?.click()}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, border: `2px dashed ${file ? "#16a34a" : "#D1D5DB"}`, padding: "32px 16px", borderRadius: 10, cursor: "pointer", background: file ? "rgba(22,163,74,0.04)" : "#FAFAFA" }}
                            >
                                <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
                                <div style={{ width: 42, height: 42, borderRadius: "50%", background: file ? "rgba(22,163,74,0.12)" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className={`fa-solid ${file ? "fa-file-csv" : "fa-cloud-arrow-up"}`} style={{ fontSize: 18, color: file ? "#16a34a" : "#9CA3AF" }}></i>
                                </div>
                                {file ? (
                                    <>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: 0 }}>{file.name}</p>
                                        <p style={{ fontSize: 11.5, color: "#64748b", margin: 0 }}>{(file.size / 1024).toFixed(1)} KB · click to replace</p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: 0 }}>Click or drag a CSV file here</p>
                                        <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>.csv only</p>
                                    </>
                                )}
                            </div>

                            {parsed?.fatalError && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 13px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9 }}>
                                    <i className="fa-solid fa-circle-xmark" style={{ color: "#dc2626", marginTop: 2 }}></i>
                                    <span style={{ fontSize: 12.5, color: "#dc2626" }}>{parsed.fatalError}</span>
                                </div>
                            )}

                            {parsed && !parsed.fatalError && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: validRows > 0 ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.06)", border: `1px solid ${validRows > 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 9 }}>
                                    <i className={`fa-solid ${validRows > 0 ? "fa-circle-check" : "fa-circle-xmark"}`} style={{ color: validRows > 0 ? "#15803d" : "#dc2626" }}></i>
                                    <span style={{ fontSize: 12.5, color: validRows > 0 ? "#15803d" : "#dc2626" }}>
                                        {validRows > 0 && <><strong>{validRows}</strong>{` valid row${validRows > 1 ? "s" : ""} ready to import.`}</>}
                                        {(parsed.rowErrors?.length || 0) > 0 && <> <strong style={{ color: "#dc2626" }}>{parsed.rowErrors.length}</strong><span style={{ color: "#dc2626" }}>{` row${parsed.rowErrors.length > 1 ? "s" : ""} will be skipped.`}</span></>}
                                    </span>
                                </div>
                            )}

                            {parsed && parsed.rowErrors?.length > 0 && (
                                <div style={{ border: "1px solid rgba(220,38,38,0.2)", borderRadius: 9, overflow: "hidden" }}>
                                    <div style={{ padding: "8px 14px", background: "rgba(220,38,38,0.05)", borderBottom: "1px solid rgba(220,38,38,0.1)" }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em" }}>Row errors</span>
                                    </div>
                                    <div style={{ maxHeight: 140, overflowY: "auto" }}>
                                        {parsed.rowErrors.map((err, i) => (
                                            <div key={i} style={{ display: "flex", gap: 10, padding: "7px 14px", borderBottom: i < parsed.rowErrors.length - 1 ? "1px solid rgba(220,38,38,0.06)" : "none" }}>
                                                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#dc2626", whiteSpace: "nowrap" }}>Row {err.row}</span>
                                                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{err.name}</span>
                                                <span style={{ fontSize: 12, color: "#B91C1C" }}>{Array.isArray(err.messages) ? err.messages.join(" · ") : err.messages}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div style={{ padding: 16, background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, textAlign: "center" }}>
                                    <p style={{ fontSize: 28, fontWeight: 700, color: "#15803d", margin: "0 0 4px" }}>{result.success.length}</p>
                                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Imported</p>
                                </div>
                                <div style={{ padding: 16, background: result.failed.length ? "rgba(220,38,38,0.07)" : "#F8FAFC", border: `1px solid ${result.failed.length ? "rgba(220,38,38,0.2)" : "#E5E7EB"}`, borderRadius: 10, textAlign: "center" }}>
                                    <p style={{ fontSize: 28, fontWeight: 700, color: result.failed.length ? "#dc2626" : "#94a3b8", margin: "0 0 4px" }}>{result.failed.length}</p>
                                    <p style={{ fontSize: 10.5, fontWeight: 700, color: result.failed.length ? "#dc2626" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Failed / Skipped</p>
                                </div>
                            </div>
                            {result.failed.length > 0 && (
                                <div style={{ border: "1px solid rgba(220,38,38,0.2)", borderRadius: 9, overflow: "hidden" }}>
                                    <div style={{ padding: "8px 14px", background: "rgba(220,38,38,0.05)", borderBottom: "1px solid rgba(220,38,38,0.1)" }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em" }}>Failed / Skipped</span>
                                    </div>
                                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                                        {result.failed.map((f, i) => (
                                            <div key={i} style={{ padding: "8px 14px", borderBottom: i < result.failed.length - 1 ? "1px solid rgba(220,38,38,0.06)" : "none" }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>{f.name}</p>
                                                <p style={{ fontSize: 11, color: "#dc2626", margin: 0 }}>{f.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ padding: "12px 22px", borderTop: "1px solid #E5E7EB", position: "sticky", bottom: 0, background: "#fff", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={handleClose} disabled={importing} style={{ padding: "8px 18px", background: "#fff", border: "1px solid #E5E7EB", color: "#374151", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                    {!result ? (
                        <button onClick={handleImport} disabled={!canImport} style={{ padding: "8px 18px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: canImport ? "pointer" : "not-allowed", opacity: canImport ? 1 : 0.45, display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {importing ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i> Importing…</> : <><i className="fa-solid fa-file-import" style={{ fontSize: 11 }}></i> Import {validRows > 0 ? `${validRows} Stor${validRows !== 1 ? "ies" : "y"}` : "Stories"}</>}
                        </button>
                    ) : (
                        <button onClick={handleClose} style={{ padding: "8px 18px", background: "#15803d", border: "none", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
const UserStoriesList = () => {
    const navigate = useNavigate();

    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterVersion, setFilterVersion] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCrit, setFilterCrit] = useState('');
    const [sortBy, setSortBy] = useState('updated_at');
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 12;

    const [versionOpts, setVersionOpts] = useState([]);
    const [showImport, setShowImport] = useState(false);

    const fetchStories = React.useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const { data, error } = await supabase
                .from('user_stories')
                .select('id,story_id,story_type,story_title,story_summary,module,feature,planned_release,version_build,current_status,criticality,story_points,development_status,qa_status,release_status,approval_status,created_at,updated_at,created_by')
                .order('updated_at', { ascending: false });
            if (error) throw error;
            const rows = data || [];
            setStories(rows);
            setVersionOpts([...new Set(rows.map(r => r.planned_release || r.version_build).filter(Boolean))].sort());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchStories(); }, [fetchStories]);

    const handleSelectStory = (story) => navigate(`/stories/${story.story_id}`);
    const handleNewStory = () => navigate('/stories/new');

    const filtered = stories
        .filter(s => {
            const q = search.toLowerCase();
            return (
                (!q || (s.story_id || '').toLowerCase().includes(q) || (s.story_title || '').toLowerCase().includes(q) || (s.story_summary || '').toLowerCase().includes(q))
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

    const activeFCount = [filterVersion, filterStatus, filterCrit].filter(Boolean).length;
    const clearAll = () => { setFilterVersion(''); setFilterStatus(''); setFilterCrit(''); setSearch(''); setPage(0); };

    React.useEffect(() => { setPage(0); }, [search, filterVersion, filterStatus, filterCrit, sortBy]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                onClick={() => setShowImport(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#fff', color: '#15803d', border: '1.5px solid #bbf7d0', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                            >
                                <i className="fa-solid fa-file-import" style={{ fontSize: 12 }} />
                                Import
                            </button>
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
                </div>

                {showImport && (
                    <ImportUserStoriesModal
                        onClose={() => setShowImport(false)}
                        onSuccess={fetchStories}
                    />
                )}

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
                            {paged.map((story, i) => (
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
                            {paged.map((s, i) => (
                                <div key={s.id} className="list-row" onClick={() => handleSelectStory(s)}
                                    style={{ animation: `fadeUp 0.2s ease ${Math.min(i * 0.03, 0.4)}s both`, display: 'grid', gridTemplateColumns: '110px 1fr 140px 110px 100px 100px', gap: 12, alignItems: 'center', padding: '12px 18px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{s.story_id}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.story_title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled</span>}
                                        </p>
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
                    {/* Pagination */}
                    {!loading && !error && totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, padding: '12px 20px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12 }}>
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} stories
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => setPage(0)} disabled={safePage === 0} style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: safePage === 0 ? '#cbd5e1' : '#374151', cursor: safePage === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>«</button>
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: safePage === 0 ? '#cbd5e1' : '#374151', cursor: safePage === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>‹</button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pg = i;
                                    if (totalPages > 7) {
                                        if (safePage <= 3) pg = i;
                                        else if (safePage >= totalPages - 4) pg = totalPages - 7 + i;
                                        else pg = safePage - 3 + i;
                                    }
                                    return (
                                        <button key={pg} onClick={() => setPage(pg)} style={{ padding: '6px 11px', border: `1.5px solid ${pg === safePage ? '#22c55e' : '#e2e8f0'}`, borderRadius: 8, background: pg === safePage ? '#f0fdf4' : '#fff', color: pg === safePage ? '#15803d' : '#374151', fontWeight: pg === safePage ? 700 : 400, cursor: 'pointer', fontSize: 13, minWidth: 36 }}>
                                            {pg + 1}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: safePage >= totalPages - 1 ? '#cbd5e1' : '#374151', cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>›</button>
                                <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} style={{ padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: safePage >= totalPages - 1 ? '#cbd5e1' : '#374151', cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>»</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserStoriesList;