import React, { useState, useCallback, useRef, useEffect } from 'react';
import supabase from "../services/supabaseClient";

/* ─────────────────────────────────────────────
   CUSTOM DROPDOWN
   ───────────────────────────────────────────── */
const CustomSelect = ({ value, onChange, options, placeholder = 'Select…' }) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => (typeof o === 'string' ? o : o.value) === value);
    const label = selected
        ? typeof selected === 'string' ? selected : selected.label
        : placeholder;

    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: open
                        ? 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 100%)'
                        : 'linear-gradient(135deg,#fafbff 0%,#f4f6fb 100%)',
                    border: open ? '1.5px solid #6366f1' : '1.5px solid #e2e6f0',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    color: value ? '#1e293b' : '#94a3b8',
                    fontWeight: value ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: open
                        ? '0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    outline: 'none',
                    letterSpacing: '0.01em',
                }}
            >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                </span>
                <span style={{
                    marginLeft: 8,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: open ? '#6366f1' : '#94a3b8',
                    flexShrink: 0,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: '#ffffff',
                    border: '1.5px solid #e8eaf6',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    animation: 'dropdownIn 0.18s cubic-bezier(.4,0,.2,1)',
                }}>
                    <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>
                    <div style={{ padding: '6px' }}>
                        {options.map((opt, i) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            const isSelected = val === value;
                            const isHovered = hovered === i;

                            return (
                                <div
                                    key={val}
                                    onMouseEnter={() => setHovered(i)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => { onChange(val); setOpen(false); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13.5px',
                                        fontWeight: isSelected ? 600 : 400,
                                        color: isSelected ? '#4f46e5' : isHovered ? '#1e293b' : '#374151',
                                        background: isSelected
                                            ? 'linear-gradient(135deg,#eef2ff 0%,#f0f4ff 100%)'
                                            : isHovered ? '#f8fafc' : 'transparent',
                                        transition: 'all 0.12s ease',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    <span>{lbl}</span>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   SECTION COMPONENT — defined OUTSIDE parent
   ───────────────────────────────────────────── */
const Section = ({ id, title, icon, iconColor, collapsedSections, toggleSection, children }) => (
    <div className="bg-card border border-border rounded-lg shadow-sm">
        <div
            className="section-header px-6 py-4 border-b border-border flex items-center justify-between cursor-pointer transition-all hover:bg-muted"
            onClick={() => toggleSection(id)}
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${iconColor} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <i className={`fa-solid ${icon} ${iconColor.replace('bg-', 'text-')}`}></i>
                </div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
            <i className={`fa-solid ${collapsedSections[id] ? 'fa-chevron-down' : 'fa-chevron-up'} text-muted-foreground`}></i>
        </div>
        {!collapsedSections[id] && (
            <div className="section-content p-6">{children}</div>
        )}
    </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const UserStoryMapping = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [collapsedSections, setCollapsedSections] = useState({});
    const [lastSaved, setLastSaved] = useState('never');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showRelatedStories, setShowRelatedStories] = useState(false);
    const [showRelatedBugs, setShowRelatedBugs] = useState(false);
    const [showChangeRequests, setShowChangeRequests] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // ── All text fields are now empty by default ──
    const [formData, setFormData] = useState({
        storyId: 'US-045',
        storyType: '',
        storyTitle: '',
        storySummary: '',
        moduleId: '',
        parentStoryId: '',
        sequence: '',
        businessContext: '',
        problemStatement: '',
        expectedOutcome: '',
        businessDomain: '',
        processArea: '',
        transactionType: '',
        criticality: '',
        product: 'NexTech RMS',
        application: '',
        module: '',
        feature: '',
        userRole: '',
        screenPage: '',
        asA: '',
        iWant: '',
        soThat: '',
        preconditions: '',
        mainFlow: '',
        alternateFlow: '',
        exceptionFlow: '',
        postconditions: '',
        businessRules: '',
        validationRules: '',
        fieldBehavior: '',
        calculationLogic: '',
        apiImpacted: '',
        dbTablesImpacted: '',
        integrationImpacted: '',
        reportsImpacted: '',
        configurationImpacted: '',
        securityRBACImpact: '',
        auditTrailRequired: '',
        performanceImpact: '',
        testScenarioCount: '',
        currentStatus: '',
        blocked: false,
        blockedReason: ''
    });

    const [acceptanceCriteria, setAcceptanceCriteria] = useState([]);
    const [definitionOfDone, setDefinitionOfDone] = useState([
        { id: 1, text: 'Code reviewed and approved', checked: false },
        { id: 2, text: 'Unit tests written and passing', checked: false },
        { id: 3, text: 'Integration tests passing', checked: false },
        { id: 4, text: 'QA testing completed', checked: false },
        { id: 5, text: 'Documentation updated', checked: false }
    ]);

    const tabs = [
        { id: 'details', label: 'Story Details', icon: 'fa-info-circle', count: null },
        { id: 'testcases', label: 'Linked Test Cases', icon: 'fa-list-check', count: null },
        { id: 'bugs', label: 'Related Bugs', icon: 'fa-bug', count: null },
        { id: 'comments', label: 'Comments', icon: 'fa-comment-dots', count: null },
        { id: 'attachments', label: 'Attachments', icon: 'fa-paperclip', count: null }
    ];

    const toggleSection = useCallback((sectionId) => {
        setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }, []);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const toggleAcceptanceCriteria = useCallback((id) => {
        setAcceptanceCriteria(prev =>
            prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    }, []);

    const toggleDefinitionOfDone = useCallback((id) => {
        setDefinitionOfDone(prev =>
            prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    }, []);

    const addAcceptanceCriteria = useCallback(() => {
        setAcceptanceCriteria(prev => {
            const newId = Math.max(...prev.map(ac => ac.id), 0) + 1;
            return [...prev, { id: newId, text: 'New acceptance criteria', checked: false }];
        });
    }, []);

    /* ── BUTTON FUNCTIONS ── */
    const handleSaveDraft = async () => {
        setSaveLoading(true);
        try {
            const draftData = {
                story_id: formData.storyId,
                story_type: formData.storyType,
                story_title: formData.storyTitle,
                story_summary: formData.storySummary,
                module_id: formData.moduleId,
                parent_story_id: formData.parentStoryId,
                sequence: formData.sequence,
                business_context: formData.businessContext,
                problem_statement: formData.problemStatement,
                expected_outcome: formData.expectedOutcome,
                business_domain: formData.businessDomain,
                process_area: formData.processArea,
                transaction_type: formData.transactionType,
                criticality: formData.criticality,
                application: formData.application,
                module: formData.module,
                feature: formData.feature,
                user_role: formData.userRole,
                screen_page: formData.screenPage,
                as_a: formData.asA,
                i_want: formData.iWant,
                so_that: formData.soThat,
                preconditions: formData.preconditions,
                main_flow: formData.mainFlow,
                alternate_flow: formData.alternateFlow,
                exception_flow: formData.exceptionFlow,
                postconditions: formData.postconditions,
                business_rules: formData.businessRules,
                validation_rules: formData.validationRules,
                field_behavior: formData.fieldBehavior,
                calculation_logic: formData.calculationLogic,
                api_impacted: formData.apiImpacted,
                db_tables_impacted: formData.dbTablesImpacted,
                integration_impacted: formData.integrationImpacted,
                reports_impacted: formData.reportsImpacted,
                configuration_impacted: formData.configurationImpacted,
                security_rbac_impact: formData.securityRBACImpact,
                audit_trail_required: formData.auditTrailRequired,
                performance_impact: formData.performanceImpact,
                test_scenario_count: formData.testScenarioCount,
                current_status: formData.currentStatus || 'Draft',
                blocked: formData.blocked,
                blocked_reason: formData.blockedReason,
                acceptance_criteria: acceptanceCriteria,
                definition_of_done: definitionOfDone,
                status: 'Draft'
            };

            const { error } = await supabase.from('user_stories').upsert([draftData], { onConflict: 'story_id' });
            if (error) throw error;

            const now = new Date().toLocaleString();
            setLastSaved(now);
            alert('✅ Draft saved successfully!');
        } catch (err) {
            alert(`❌ Error saving draft: ${err.message}`);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSaveAndSubmit = async () => {
        if (!formData.storyTitle) {
            alert('⚠️ Please enter a Story Title before submitting');
            return;
        }

        setSaveLoading(true);
        try {
            const submitData = {
                story_id: formData.storyId,
                story_type: formData.storyType,
                story_title: formData.storyTitle,
                story_summary: formData.storySummary,
                module_id: formData.moduleId,
                parent_story_id: formData.parentStoryId,
                sequence: formData.sequence,
                business_context: formData.businessContext,
                problem_statement: formData.problemStatement,
                expected_outcome: formData.expectedOutcome,
                business_domain: formData.businessDomain,
                process_area: formData.processArea,
                transaction_type: formData.transactionType,
                criticality: formData.criticality,
                application: formData.application,
                module: formData.module,
                feature: formData.feature,
                user_role: formData.userRole,
                screen_page: formData.screenPage,
                as_a: formData.asA,
                i_want: formData.iWant,
                so_that: formData.soThat,
                preconditions: formData.preconditions,
                main_flow: formData.mainFlow,
                alternate_flow: formData.alternateFlow,
                exception_flow: formData.exceptionFlow,
                postconditions: formData.postconditions,
                business_rules: formData.businessRules,
                validation_rules: formData.validationRules,
                field_behavior: formData.fieldBehavior,
                calculation_logic: formData.calculationLogic,
                api_impacted: formData.apiImpacted,
                db_tables_impacted: formData.dbTablesImpacted,
                integration_impacted: formData.integrationImpacted,
                reports_impacted: formData.reportsImpacted,
                configuration_impacted: formData.configurationImpacted,
                security_rbac_impact: formData.securityRBACImpact,
                audit_trail_required: formData.auditTrailRequired,
                performance_impact: formData.performanceImpact,
                test_scenario_count: formData.testScenarioCount,
                current_status: formData.currentStatus || 'Submitted',
                blocked: formData.blocked,
                blocked_reason: formData.blockedReason,
                acceptance_criteria: acceptanceCriteria,
                definition_of_done: definitionOfDone,
                status: 'Submitted'
            };

            const { error } = await supabase.from('user_stories').upsert([submitData], { onConflict: 'story_id' });
            if (error) throw error;

            const now = new Date().toLocaleString();
            setLastSaved(now);
            alert('✅ User story submitted successfully!');
        } catch (err) {
            alert(`❌ Error submitting: ${err.message}`);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDuplicate = () => {
        const newStoryId = `US-${String(parseInt(formData.storyId.split('-')[1]) + 1).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, storyId: newStoryId, currentStatus: '' }));
        alert(`✅ Story duplicated as ${newStoryId}. Edit and save to create a new story.`);
    };

    const handleViewHistory = () => {
        setShowHistoryModal(true);
    };

    const handleBackToList = () => {
        if (window.confirm('Are you sure? Any unsaved changes will be lost.')) {
            window.history.back();
        }
    };

    const handleViewTestCases = () => {
        alert(`📋 Opening ${formData.testScenarioCount || '0'} linked test cases...`);
    };

    const handleViewRelatedStories = () => {
        setShowRelatedStories(true);
    };

    const handleViewRelatedBugs = () => {
        setShowRelatedBugs(true);
    };

    const handleViewChangeRequests = () => {
        setShowChangeRequests(true);
    };

    // ── Option lists ──
    const storyTypeOpts = ['Feature Enhancement', 'New Feature', 'Bug Fix', 'Technical Debt'];
    const moduleIdOpts = ['MOD-001 - Dashboard', 'MOD-002 - User Management', 'MOD-003 - Reports', 'MOD-004 - Settings'];
    const businessDomainOpts = ['Operations', 'Finance', 'Sales', 'HR'];
    const transactionTypeOpts = ['Read', 'Create', 'Update', 'Delete'];
    const criticalityOpts = ['High', 'Medium', 'Low', 'Critical'];
    const userRoleOpts = ['QA Manager', 'Tester', 'Developer', 'Product Owner'];
    const yesNoOpts = ['Yes', 'No'];
    const performanceOpts = ['Low', 'Medium', 'High'];
    const statusOpts = ['In Progress', 'Not Started', 'Completed', 'On Hold', 'Cancelled'];

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
        .status-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.375rem 0.75rem; border-radius: 0.375rem;
          font-size: 0.75rem; font-weight: 500;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
        }
        .modal-content {
          background: white; border-radius: 0.5rem; padding: 2rem;
          max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
        }
      `}</style>

            <div className="flex min-h-screen">
                <div className="flex-1 flex flex-col min-w-0">

                    {/* ── Header (Buttons Removed) ── */}
                    <header className="bg-card border-b border-border">
                        <div className="px-4 lg:px-8 py-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-xl lg:text-2xl font-bold text-foreground">User Story: {formData.storyId}</h2>
                                            {formData.currentStatus && (
                                                <span className="status-badge bg-blue-500 bg-opacity-10 text-blue-600">
                                                    <i className="fa-solid fa-circle text-xs"></i> {formData.currentStatus}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.storyTitle || 'No title yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* ── Main ── */}
                    <main className="flex-1 overflow-auto">
                        <div className="p-4 lg:p-8">

                            {/* Tabs */}
                            <div className="bg-card border border-border rounded-lg shadow-sm mb-6">
                                <div className="flex items-center gap-1 px-4 border-b border-border overflow-x-auto">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                                ? 'border-b-2 border-primary text-primary font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <i className={`fa-solid ${tab.icon} mr-2`}></i>
                                            {tab.label}{tab.count ? ` (${tab.count})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* ── Left Column ── */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Story Identification */}
                                    <Section id="story-identification" title="Story Identification" icon="fa-fingerprint" iconColor="bg-primary"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelCls}>Story ID</label>
                                                <input type="text" value={formData.storyId}
                                                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm" readOnly />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Story Type</label>
                                                <CustomSelect value={formData.storyType} onChange={v => handleInputChange('storyType', v)} options={storyTypeOpts} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={labelCls}>Story Title <span className="text-destructive">*</span></label>
                                                <input type="text" value={formData.storyTitle}
                                                    onChange={e => handleInputChange('storyTitle', e.target.value)}
                                                    placeholder="Enter story title..."
                                                    className={inputCls} required />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={labelCls}>Story Summary</label>
                                                <textarea rows="3" value={formData.storySummary}
                                                    onChange={e => handleInputChange('storySummary', e.target.value)}
                                                    className={inputCls} placeholder="Brief summary of the user story..." />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Module ID</label>
                                                <CustomSelect value={formData.moduleId} onChange={v => handleInputChange('moduleId', v)} options={moduleIdOpts} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Parent Story ID</label>
                                                <input type="text" value={formData.parentStoryId}
                                                    onChange={e => handleInputChange('parentStoryId', e.target.value)}
                                                    placeholder="US-XXX" className={inputCls} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Sequence/Order</label>
                                                <input type="number" value={formData.sequence}
                                                    onChange={e => handleInputChange('sequence', e.target.value)}
                                                    placeholder="e.g. 1"
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                    </Section>

                                    {/* Business Context */}
                                    <Section id="business-context" title="Business Context" icon="fa-briefcase" iconColor="bg-blue-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="space-y-6">
                                            <div>
                                                <label className={labelCls}>Business Context</label>
                                                <textarea rows="3" value={formData.businessContext}
                                                    onChange={e => handleInputChange('businessContext', e.target.value)}
                                                    className={inputCls} placeholder="Describe the business context..." />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Problem Statement</label>
                                                <textarea rows="3" value={formData.problemStatement}
                                                    onChange={e => handleInputChange('problemStatement', e.target.value)}
                                                    className={inputCls} placeholder="What problem are we solving?" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Expected Outcome</label>
                                                <textarea rows="3" value={formData.expectedOutcome}
                                                    onChange={e => handleInputChange('expectedOutcome', e.target.value)}
                                                    className={inputCls} placeholder="What is the expected outcome?" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={labelCls}>Business Domain</label>
                                                    <CustomSelect value={formData.businessDomain} onChange={v => handleInputChange('businessDomain', v)} options={businessDomainOpts} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Process Area</label>
                                                    <input type="text" value={formData.processArea}
                                                        onChange={e => handleInputChange('processArea', e.target.value)}
                                                        placeholder="e.g. Monitoring & Analytics"
                                                        className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Transaction Type</label>
                                                    <CustomSelect value={formData.transactionType} onChange={v => handleInputChange('transactionType', v)} options={transactionTypeOpts} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Criticality</label>
                                                <CustomSelect value={formData.criticality} onChange={v => handleInputChange('criticality', v)} options={criticalityOpts} />
                                            </div>
                                        </div>
                                    </Section>

                                    {/* Functional Context */}
                                    <Section id="functional-context" title="Functional Context" icon="fa-layer-group" iconColor="bg-purple-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelCls}>Product</label>
                                                <input type="text" value={formData.product}
                                                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm" readOnly />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Application</label>
                                                <input type="text" value={formData.application}
                                                    onChange={e => handleInputChange('application', e.target.value)}
                                                    placeholder="e.g. Testing Portal"
                                                    className={inputCls} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Module</label>
                                                <input type="text" value={formData.module}
                                                    onChange={e => handleInputChange('module', e.target.value)}
                                                    placeholder="e.g. Dashboard"
                                                    className={inputCls} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Feature</label>
                                                <input type="text" value={formData.feature}
                                                    onChange={e => handleInputChange('feature', e.target.value)}
                                                    placeholder="e.g. Real-time Data Updates"
                                                    className={inputCls} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>User Role/Persona</label>
                                                <CustomSelect value={formData.userRole} onChange={v => handleInputChange('userRole', v)} options={userRoleOpts} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Screen/Page Name</label>
                                                <input type="text" value={formData.screenPage}
                                                    onChange={e => handleInputChange('screenPage', e.target.value)}
                                                    placeholder="e.g. Main Dashboard"
                                                    className={inputCls} />
                                            </div>
                                        </div>
                                    </Section>

                                    {/* Standard Story Definition */}
                                    <Section id="story-definition" title="Standard Story Definition" icon="fa-pen-to-square" iconColor="bg-green-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 block">As a</label>
                                                    <input type="text" value={formData.asA}
                                                        onChange={e => handleInputChange('asA', e.target.value)}
                                                        placeholder="e.g. QA Manager"
                                                        className="w-full px-4 py-2.5 bg-white border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 block">I want</label>
                                                    <textarea rows="2" value={formData.iWant}
                                                        onChange={e => handleInputChange('iWant', e.target.value)}
                                                        placeholder="e.g. to see real-time updates on the dashboard..."
                                                        className="w-full px-4 py-2.5 bg-white border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 block">So that</label>
                                                    <textarea rows="2" value={formData.soThat}
                                                        onChange={e => handleInputChange('soThat', e.target.value)}
                                                        placeholder="e.g. I can monitor testing progress in real-time..."
                                                        className="w-full px-4 py-2.5 bg-white border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </Section>

                                    {/* Detailed Behavior */}
                                    <Section id="detailed-behavior" title="Detailed Behavior" icon="fa-diagram-project" iconColor="bg-orange-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="space-y-6">
                                            {[
                                                ['preconditions', 'Preconditions', 3, 'List the conditions that must be met before this story...'],
                                                ['mainFlow', 'Main Flow', 5, 'Describe the step-by-step main flow...'],
                                                ['alternateFlow', 'Alternate Flow', 4, 'Describe any alternate paths or flows...'],
                                                ['exceptionFlow', 'Exception Flow', 4, 'Describe exception and error handling...'],
                                                ['postconditions', 'Postconditions', 3, 'Describe the state after the story is complete...'],
                                            ].map(([field, lbl, rows, ph]) => (
                                                <div key={field}>
                                                    <label className={labelCls}>{lbl}</label>
                                                    <textarea rows={rows} value={formData[field]}
                                                        onChange={e => handleInputChange(field, e.target.value)}
                                                        className={inputCls} placeholder={ph} />
                                                </div>
                                            ))}
                                        </div>
                                    </Section>

                                    {/* Business Rules */}
                                    <Section id="business-rules" title="Business Rules & Validation" icon="fa-scale-balanced" iconColor="bg-red-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="space-y-6">
                                            {[
                                                ['businessRules', 'Business Rules', 4, 'List the business rules that apply...'],
                                                ['validationRules', 'Validation Rules', 4, 'List the validation rules...'],
                                                ['fieldBehavior', 'Field Behavior', 3, 'Describe the behavior of each field...'],
                                                ['calculationLogic', 'Calculation Logic', 3, 'Describe any calculation or computation logic...'],
                                            ].map(([field, lbl, rows, ph]) => (
                                                <div key={field}>
                                                    <label className={labelCls}>{lbl}</label>
                                                    <textarea rows={rows} value={formData[field]}
                                                        onChange={e => handleInputChange(field, e.target.value)}
                                                        className={inputCls} placeholder={ph} />
                                                </div>
                                            ))}
                                        </div>
                                    </Section>

                                    {/* Acceptance & Testing */}
                                    <Section id="acceptance-testing" title="Acceptance & Testing" icon="fa-clipboard-check" iconColor="bg-teal-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="space-y-6">
                                            <div>
                                                <label className={labelCls}>Acceptance Criteria</label>
                                                <div className="space-y-3">
                                                    {acceptanceCriteria.length === 0 && (
                                                        <p className="text-sm text-muted-foreground italic">No acceptance criteria added yet.</p>
                                                    )}
                                                    {acceptanceCriteria.map(criteria => (
                                                        <div key={criteria.id} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                            <input type="checkbox" checked={criteria.checked}
                                                                onChange={() => toggleAcceptanceCriteria(criteria.id)}
                                                                className="mt-1 w-4 h-4 text-primary rounded" />
                                                            <p className="text-sm text-foreground">{criteria.text}</p>
                                                        </div>
                                                    ))}
                                                    <button onClick={addAcceptanceCriteria}
                                                        className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded-lg text-sm font-medium transition-colors">
                                                        <i className="fa-solid fa-plus"></i> Add Acceptance Criteria
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Definition of Done</label>
                                                <div className="space-y-2">
                                                    {definitionOfDone.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <input type="checkbox" checked={item.checked}
                                                                onChange={() => toggleDefinitionOfDone(item.id)}
                                                                className="w-4 h-4 text-primary rounded" />
                                                            <p className="text-sm text-foreground">{item.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelCls}>Test Scenario Count</label>
                                                    <input type="number" value={formData.testScenarioCount}
                                                        onChange={e => handleInputChange('testScenarioCount', e.target.value)}
                                                        placeholder="0"
                                                        className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Linked Test Cases</label>
                                                    <button onClick={handleViewTestCases} className="w-full px-4 py-2.5 bg-primary bg-opacity-10 text-primary border border-primary rounded-lg text-sm font-medium hover:bg-opacity-20 transition-colors">
                                                        <i className="fa-solid fa-link mr-2"></i>
                                                        {formData.testScenarioCount ? `View ${formData.testScenarioCount} Test Cases` : 'View Test Cases'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Section>

                                    {/* Technical References */}
                                    <Section id="technical-references" title="Technical References" icon="fa-code" iconColor="bg-indigo-500"
                                        collapsedSections={collapsedSections} toggleSection={toggleSection}>
                                        <div className="space-y-6">
                                            {[
                                                ['apiImpacted', 'API Impacted', 3, 'List the APIs that will be impacted...'],
                                                ['dbTablesImpacted', 'DB Tables Impacted', 2, 'List the database tables that will be impacted...'],
                                                ['integrationImpacted', 'Integration Impacted', 2, 'List the integrations that will be impacted...'],
                                                ['reportsImpacted', 'Reports Impacted', 2, 'List the reports that will be impacted...'],
                                                ['configurationImpacted', 'Configuration Impacted', 2, 'List the configuration settings that will be impacted...'],
                                            ].map(([field, lbl, rows, ph]) => (
                                                <div key={field}>
                                                    <label className={labelCls}>{lbl}</label>
                                                    <textarea rows={rows} value={formData[field]}
                                                        onChange={e => handleInputChange(field, e.target.value)}
                                                        className={inputCls} placeholder={ph} />
                                                </div>
                                            ))}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={labelCls}>Security/RBAC Impact</label>
                                                    <CustomSelect value={formData.securityRBACImpact} onChange={v => handleInputChange('securityRBACImpact', v)} options={yesNoOpts} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Audit Trail Required</label>
                                                    <CustomSelect value={formData.auditTrailRequired} onChange={v => handleInputChange('auditTrailRequired', v)} options={yesNoOpts} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Performance Impact</label>
                                                    <CustomSelect value={formData.performanceImpact} onChange={v => handleInputChange('performanceImpact', v)} options={performanceOpts} />
                                                </div>
                                            </div>
                                        </div>
                                    </Section>
                                </div>

                                {/* ── Right Sidebar ── */}
                                <div className="space-y-6">

                                    {/* Quick Information */}
                                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-circle-info text-primary"></i> Quick Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                                                {formData.currentStatus
                                                    ? <span className="status-badge bg-blue-500 bg-opacity-10 text-blue-600"><i className="fa-solid fa-circle text-xs"></i> {formData.currentStatus}</span>
                                                    : <span className="text-sm text-muted-foreground italic">Not set</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                                                {formData.criticality
                                                    ? <span className="status-badge bg-red-500 bg-opacity-10 text-red-600"><i className="fa-solid fa-arrow-up"></i> {formData.criticality}</span>
                                                    : <span className="text-sm text-muted-foreground italic">Not set</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Story Points</p>
                                                <p className="text-sm text-muted-foreground italic">Not set</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Estimate Hours</p>
                                                <p className="text-sm text-muted-foreground italic">Not set</p>
                                            </div>
                                            <div className="pt-4 border-t border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Planned Sprint</p>
                                                <p className="text-sm text-muted-foreground italic">Not set</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Planned Release</p>
                                                <p className="text-sm text-muted-foreground italic">Not set</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Version/Build</p>
                                                <p className="text-sm text-muted-foreground italic">Not set</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Assignment */}
                                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-users text-primary"></i> Team Assignment
                                        </h3>
                                        <div className="space-y-4">
                                            {['Assigned BA', 'Assigned Developer', 'Assigned Tester'].map(role => (
                                                <div key={role}>
                                                    <p className="text-xs text-muted-foreground mb-2">{role}</p>
                                                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Tracking */}
                                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-tasks text-primary"></i> Status Tracking
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                                                <CustomSelect value={formData.currentStatus} onChange={v => handleInputChange('currentStatus', v)} options={statusOpts} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-2">Approval Status</p>
                                                <span className="text-sm text-muted-foreground italic">Pending</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-2">Development Status</p>
                                                <span className="text-sm text-muted-foreground italic">Not started</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-2">QA Status</p>
                                                <span className="text-sm text-muted-foreground italic">Not started</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-2">Release Status</p>
                                                <span className="text-sm text-muted-foreground italic">Not released</span>
                                            </div>
                                            <div className="pt-4 border-t border-border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input type="checkbox" checked={formData.blocked}
                                                        onChange={e => handleInputChange('blocked', e.target.checked)}
                                                        className="w-4 h-4 text-primary rounded" />
                                                    <p className="text-xs font-semibold text-muted-foreground">Blocked</p>
                                                </div>
                                                <textarea rows="2" value={formData.blockedReason}
                                                    onChange={e => handleInputChange('blockedReason', e.target.value)}
                                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Describe the blocker..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Related Items */}
                                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-link text-primary"></i> Related Items
                                        </h3>
                                        <div className="space-y-3">
                                            <button onClick={handleViewRelatedStories} className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                                <span className="text-sm font-medium text-blue-700">Related User Stories</span>
                                                <span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs font-semibold rounded">0</span>
                                            </button>
                                            <button onClick={handleViewRelatedBugs} className="w-full flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                                <span className="text-sm font-medium text-red-700">Related Bugs</span>
                                                <span className="px-2 py-1 bg-red-200 text-red-700 text-xs font-semibold rounded">0</span>
                                            </button>
                                            <button onClick={handleViewChangeRequests} className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                                                <span className="text-sm font-medium text-purple-700">Change Requests</span>
                                                <span className="px-2 py-1 bg-purple-200 text-purple-700 text-xs font-semibold rounded">0</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Audit Information */}
                                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-clock text-primary"></i> Audit Information
                                        </h3>
                                        <div className="space-y-3 text-xs">
                                            {[
                                                ['Created By:', '—'],
                                                ['Created Date:', '—'],
                                                ['Updated By:', '—'],
                                                ['Updated Date:', '—'],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex justify-between">
                                                    <span className="text-muted-foreground">{k}</span>
                                                    <span className="font-medium text-foreground">{v}</span>
                                                </div>
                                            ))}
                                            <div className="pt-3 border-t border-border">
                                                {[['Approved By:', '—'], ['Approved Date:', '—']].map(([k, v]) => (
                                                    <div key={k} className="flex justify-between mt-2">
                                                        <span className="text-muted-foreground">{k}</span>
                                                        <span className="font-medium text-foreground">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* ── Footer (All Buttons with Full Functionality) ── */}
                    <footer className="bg-card border-t border-border">
                        <div className="px-4 lg:px-8 py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <i className="fa-solid fa-clock"></i>
                                    <span>Last saved: {lastSaved}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleBackToList} className="px-6 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                                        <i className="fa-solid fa-arrow-left mr-2"></i>Back to List
                                    </button>
                                    <button onClick={handleSaveDraft} disabled={saveLoading} className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                                        <i className="fa-solid fa-floppy-disk mr-2"></i>{saveLoading ? 'Saving...' : 'Save Draft'}
                                    </button>
                                    <button onClick={handleSaveAndSubmit} disabled={saveLoading} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                                        <i className="fa-solid fa-check mr-2"></i>{saveLoading ? 'Submitting...' : 'Save & Submit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </footer>

                    {/* ── Modals ── */}
                    {showHistoryModal && (
                        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold mb-4">Story History</h3>
                                <p className="text-sm text-gray-600 mb-4">View version history and changes made to this user story.</p>
                                <div className="space-y-3">
                                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                                        <p className="text-sm font-medium">Draft Created</p>
                                        <p className="text-xs text-gray-500">Just now by System</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {showRelatedStories && (
                        <div className="modal-overlay" onClick={() => setShowRelatedStories(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold mb-4">Related User Stories</h3>
                                <p className="text-sm text-gray-600 mb-4">No related user stories found for {formData.storyId}</p>
                                <button onClick={() => setShowRelatedStories(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {showRelatedBugs && (
                        <div className="modal-overlay" onClick={() => setShowRelatedBugs(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold mb-4">Related Bugs</h3>
                                <p className="text-sm text-gray-600 mb-4">No related bugs found for {formData.storyId}</p>
                                <button onClick={() => setShowRelatedBugs(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {showChangeRequests && (
                        <div className="modal-overlay" onClick={() => setShowChangeRequests(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold mb-4">Change Requests</h3>
                                <p className="text-sm text-gray-600 mb-4">No change requests found for {formData.storyId}</p>
                                <button onClick={() => setShowChangeRequests(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserStoryMapping;