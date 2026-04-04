import { useState, useRef, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

// ─── If you use React Router, uncomment this line: ───────────
// import { useNavigate } from 'react-router-dom'

// ─── Constants ───────────────────────────────────────────────
const ROLES = [
    { value: 'tester', label: 'Tester', icon: '🧪' },
    { value: 'developer', label: 'Developer', icon: '💻' },
    { value: 'admin', label: 'Admin', icon: '🔑' },
]

function NexTechLogo({ size = 52 }) {
    return (
        <div style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="data:image/png;base64,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" alt="NexTech Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
    )
}

// ─── Google Icon ─────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
}

// ─── Microsoft Icon ───────────────────────────────────────────
function MicrosoftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
        </svg>
    )
}

// ─── Spinner ─────────────────────────────────────────────────
function Spinner({ color = '#fff' }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            style={{ animation: 'rms-spin 0.8s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

// ─── Role Dropdown ────────────────────────────────────────────
function RoleDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const selected = ROLES.find(r => r.value === value)

    return (
        <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
            <button type="button" onClick={() => setOpen(o => !o)} style={{
                width: '100%', padding: '11px 14px',
                background: open ? '#fff' : '#f8fafc',
                border: `1.5px solid ${open ? '#E87722' : '#e2e6f0'}`,
                borderRadius: 10, fontSize: 13.5, fontWeight: 500, color: '#1e293b',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: open ? '0 0 0 3px rgba(232,119,34,.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.18s', boxSizing: 'border-box', fontFamily: 'inherit',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selected?.icon}</span><span>{selected?.label ?? 'Select role'}</span>
                </span>
                <span style={{
                    fontSize: 10, color: open ? '#E87722' : '#94a3b8',
                    display: 'inline-block',
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.18s',
                }}>▼</span>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                    background: '#fff', border: '1.5px solid #e8eaf6', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,.10)', padding: 6,
                    animation: 'dropdownIn 0.18s cubic-bezier(.4,0,.2,1)',
                }}>
                    {ROLES.map(r => (
                        <div key={r.value} onClick={() => { onChange(r.value); setOpen(false) }}
                            style={{
                                padding: '9px 12px', borderRadius: 8, fontSize: 13.5, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                color: r.value === value ? '#E87722' : '#374151',
                                fontWeight: r.value === value ? 600 : 400,
                                background: r.value === value ? '#fff7ed' : 'transparent',
                                transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (r.value !== value) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { if (r.value !== value) e.currentTarget.style.background = 'transparent' }}
                        >
                            <span>{r.icon}</span> {r.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Feature Item (left panel) ────────────────────────────────
function FeatureItem({ icon, title, desc }) {
    return (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(6,78,59,0.10)', border: '1px solid rgba(6,78,59,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 16,
            }}>{icon}</div>
            <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: '#064e3b' }}>{title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(6,78,59,0.6)', lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    )
}

// ─── Alert Banner ─────────────────────────────────────────────
function Alert({ type, msg }) {
    const isErr = type === 'error'
    return (
        <div style={{
            fontSize: 13, margin: '0 0 14px', padding: '10px 14px', borderRadius: 8,
            color: isErr ? '#dc2626' : '#0e5729',
            background: isErr ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${isErr ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
            <span>{isErr ? '⚠️' : '✅'}</span><span>{msg}</span>
        </div>
    )
}

// ─── Text Input ───────────────────────────────────────────────
function TextInput({ label, type = 'text', placeholder, value, onChange, required, autoComplete, suffix }) {
    const [focused, setFocused] = useState(false)
    return (
        <div style={{ marginBottom: 12 }}>
            {label && (
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    type={type} placeholder={placeholder} value={value}
                    onChange={onChange} required={required} autoComplete={autoComplete}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', padding: `11px ${suffix ? '44px' : '14px'} 11px 14px`,
                        boxSizing: 'border-box',
                        border: `1.5px solid ${focused ? '#E87722' : '#e2e6f0'}`,
                        borderRadius: 10, fontSize: 13.5, outline: 'none',
                        background: focused ? '#fff' : '#f8fafc', color: '#1e293b',
                        boxShadow: focused ? '0 0 0 3px rgba(232,119,34,0.12)' : 'none',
                        transition: 'all 0.18s', fontFamily: 'inherit',
                    }}
                />
                {suffix && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── OR Divider ───────────────────────────────────────────────
function Divider() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e6f0' }} />
            <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: '#e2e6f0' }} />
        </div>
    )
}

// ─── OAuth Button ─────────────────────────────────────────────
function OAuthButton({ icon, label, onClick, disabled }) {
    const [hov, setHov] = useState(false)
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                flex: 1, padding: '10px 12px',
                background: hov ? '#f8fafc' : '#fff',
                border: `1.5px solid ${hov ? '#cbd5e1' : '#e2e6f0'}`,
                borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, color: '#374151',
                transition: 'all 0.18s', fontFamily: 'inherit',
                opacity: disabled ? 0.6 : 1,
                boxShadow: hov ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
        >
            {icon}<span>{label}</span>
        </button>
    )
}

// ─── Main LoginPage ───────────────────────────────────────────
// view: 'login' | 'signup' | 'forgot'
export default function LoginPage() {
    // ── If using React Router, uncomment: ──────────────────────
    // const navigate = useNavigate()

    const [view, setView] = useState('login')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('tester')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [oauthLoading, setOauthLoading] = useState(null) // 'google' | 'microsoft' | null
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // ─────────────────────────────────────────────────────────
    // ✅ FIX: Listen for auth state changes and redirect on sign-in.
    // Uses a ref guard to prevent React Strict Mode double-mount
    // from creating two competing Supabase lock subscribers.
    // ─────────────────────────────────────────────────────────
    const authListenerRef = useRef(null)

    useEffect(() => {
        // If a subscription already exists (Strict Mode double-mount), skip
        if (authListenerRef.current) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // ── Option A: React Router (uncomment if using react-router-dom) ──
                // navigate('/dashboard')

                // ── Option B: Plain redirect (works with Next.js, Vite, CRA, etc.) ──
                window.location.href = '/dashboard'
            }
        })

        authListenerRef.current = subscription

        // Cleanup on true unmount
        return () => {
            subscription.unsubscribe()
            authListenerRef.current = null
        }

        // If using React Router's navigate, add it as a dependency:
        // }, [navigate])
    }, [])

    const reset = () => { setError(null); setSuccess(null) }
    const switchView = (v) => { reset(); setView(v) }
    const anyLoading = loading || !!oauthLoading

    // ── Email / Password sign in ──────────────────────────────
    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true); reset()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
        // ✅ On success: onAuthStateChange fires above → redirects to /dashboard
        // Do NOT setLoading(false) on success — keeps button disabled during redirect
    }

    // ── Email sign up ─────────────────────────────────────────
    async function handleSignup(e) {
        e.preventDefault()
        setLoading(true); reset()
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role } },
        })
        if (signUpError) { setError(signUpError.message); setLoading(false); return }

        // Upsert profile row (DB trigger does this too — safety net)
        if (data?.user) {
            const { error: pe } = await supabase
                .from('profiles')
                .upsert({ id: data.user.id, email, full_name: fullName, role }, { onConflict: 'id' })
            if (pe) console.warn('Profile upsert:', pe.message)
        }

        setSuccess('Account created! Check your email to confirm, then sign in.')
        switchView('login')
        setLoading(false)
    }

    // ── Forgot password ───────────────────────────────────────
    async function handleForgotPassword(e) {
        e.preventDefault()
        setLoading(true); reset()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) setError(error.message)
        else setSuccess('Password reset email sent! Check your inbox.')
        setLoading(false)
    }

    // ── Google OAuth ──────────────────────────────────────────
    async function handleGoogleLogin() {
        setOauthLoading('google'); reset()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: { access_type: 'offline', prompt: 'consent' },
            },
        })
        if (error) { setError(error.message); setOauthLoading(null) }
        // Success → browser redirects via Supabase OAuth flow
    }

    // ── Microsoft OAuth ───────────────────────────────────────
    async function handleMicrosoftLogin() {
        setOauthLoading('microsoft'); reset()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: 'email profile openid',
            },
        })
        if (error) { setError(error.message); setOauthLoading(null) }
    }

    const isLogin = view === 'login'
    const isSignup = view === 'signup'
    const isForgot = view === 'forgot'

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { font-family:'Sora',sans-serif; box-sizing:border-box; }
                @keyframes dropdownIn {
                    from { opacity:0; transform:translateY(-6px) scale(0.98); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(12px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes rms-spin { to { transform:rotate(360deg); } }

                .rms-submit {
                    width:100%; padding:12px; background:#0e4c38; color:#fff;
                    border:none; border-radius:10px; cursor:pointer;
                    font-size:14px; font-weight:700; transition:all 0.2s;
                    font-family:'Sora',sans-serif; letter-spacing:0.01em; margin-top:4px;
                    display:flex; align-items:center; justify-content:center; gap:8px;
                }
                .rms-submit:hover:not(:disabled) {
                    background:#E87722; transform:translateY(-1px);
                    box-shadow:0 6px 20px rgba(232,119,34,0.35);
                }
                .rms-submit:disabled { background:#94a3b8; cursor:not-allowed; }

                .rms-tab {
                    flex:1; padding:10px; border:none; cursor:pointer;
                    font-size:13px; font-weight:500; transition:all 0.2s;
                    font-family:'Sora',sans-serif;
                }
                .rms-tab.active   { background:#095b41; color:#fff; font-weight:700; }
                .rms-tab.inactive { background:transparent; color:#64748b; }
                .rms-tab.inactive:hover { background:#f1f5f9; color:#1e293b; }

                .back-btn {
                    background:none; border:none; cursor:pointer; color:#64748b;
                    font-size:13px; padding:0; margin-bottom:20px;
                    display:flex; align-items:center; gap:6px;
                    font-family:'Sora',sans-serif; transition:color 0.15s;
                }
                .back-btn:hover { color:#0e4c38; }

                @media (max-width:768px) {
                    .rms-left  { display:none !important; }
                    .rms-right { width:100% !important; border-radius:16px !important; }
                    .oauth-row { flex-direction:column !important; }
                }
            `}</style>

            <div style={{
                display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#f0f2f5 0%,#e8eaf0 100%)', padding: 32,
            }}>
                <div style={{
                    display: 'flex', width: '100%', maxWidth: 1000,
                    borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.14)', minHeight: 620,
                }}>

                    {/* ══ LEFT PANEL ══ */}
                    <div className="rms-left" style={{
                        flex: 1,
                        background: 'linear-gradient(145deg,#d1fae5 0%,#e7edea 50%,#fbfcfc 100%)',
                        padding: '52px 44px', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: -100, right: -100, width: 340, height: 340,
                            borderRadius: '50%', pointerEvents: 'none',
                            background: 'radial-gradient(circle,rgba(16,185,129,0.25) 0%,transparent 70%)',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -80, left: -80, width: 260, height: 260,
                            borderRadius: '50%', pointerEvents: 'none',
                            background: 'radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)',
                        }} />

                        {/* Testing doodle background */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                            <g transform="translate(340,30) rotate(-15)">
                                <ellipse cx="16" cy="10" rx="10" ry="7" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <line x1="16" y1="3" x2="16" y2="-4" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="6" y1="7" x2="-2" y2="3" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="26" y1="7" x2="34" y2="3" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="6" y1="13" x2="-2" y2="13" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="26" y1="13" x2="34" y2="13" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <ellipse cx="16" cy="17" rx="10" ry="7" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                            </g>
                            <g transform="translate(28,60)">
                                <rect x="0" y="0" width="32" height="40" rx="4" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <line x1="8" y1="10" x2="24" y2="10" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                                <polyline points="5,18 8,21 13,15" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <line x1="16" y1="18" x2="24" y2="18" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                                <polyline points="5,28 8,31 13,25" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <line x1="16" y1="28" x2="24" y2="28" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            <g transform="translate(60,460)">
                                <polyline points="0,0 -18,16 0,32" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <polyline points="40,0 58,16 40,32" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <line x1="18" y1="0" x2="22" y2="32" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                            </g>
                            <g transform="translate(330,220) rotate(30)">
                                <circle cx="14" cy="14" r="12" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <line x1="23" y1="23" x2="34" y2="34" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <g transform="translate(310,440)">
                                <rect x="0" y="28" width="10" height="20" rx="2" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <rect x="14" y="16" width="10" height="32" rx="2" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <rect x="28" y="8" width="10" height="40" rx="2" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <rect x="42" y="22" width="10" height="26" rx="2" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <line x1="-4" y1="50" x2="56" y2="50" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            <g transform="translate(24,280)">
                                <circle cx="22" cy="22" r="20" stroke="#064e3b" strokeWidth="2.5" fill="none" />
                                <polygon points="16,12 34,22 16,32" stroke="#064e3b" strokeWidth="2" fill="none" strokeLinejoin="round" />
                            </g>
                            <g transform="translate(180,20) rotate(15)">
                                <line x1="8" y1="0" x2="8" y2="28" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="20" y1="0" x2="20" y2="28" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M8,28 Q4,38 14,42 Q24,38 20,28" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <line x1="4" y1="2" x2="24" y2="2" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="14" cy="36" r="3" stroke="#064e3b" strokeWidth="1.5" fill="none" opacity="0.6" />
                            </g>
                            <g transform="translate(190,310)">
                                <path d="M0,30 Q20,-10 40,30" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <path d="M8,30 Q20,5 32,30" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <circle cx="20" cy="30" r="3" stroke="#064e3b" strokeWidth="2" fill="none" />
                            </g>
                            <g transform="translate(140,160)" opacity="0.8">
                                <line x1="6" y1="0" x2="6" y2="12" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="6" x2="12" y2="6" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                                <line x1="1.8" y1="1.8" x2="10.2" y2="10.2" stroke="#E87722" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="10.2" y1="1.8" x2="1.8" y2="10.2" stroke="#E87722" strokeWidth="1.5" strokeLinecap="round" />
                            </g>
                            <g transform="translate(290,130)" opacity="0.8">
                                <line x1="4" y1="0" x2="4" y2="8" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="4" x2="8" y2="4" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            <g transform="translate(80,390)" opacity="0.8">
                                <line x1="5" y1="0" x2="5" y2="10" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="5" x2="10" y2="5" stroke="#E87722" strokeWidth="2" strokeLinecap="round" />
                                <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="#E87722" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="#E87722" strokeWidth="1.5" strokeLinecap="round" />
                            </g>
                            {[0, 1, 2, 3, 4].map(row =>
                                [0, 1, 2, 3].map(col => (
                                    <circle key={`${row}-${col}`} cx={240 + col * 22} cy={80 + row * 22} r="2.5" fill="#064e3b" opacity="0.5" />
                                ))
                            )}
                        </svg>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                                <NexTechLogo size={52} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: '#064e3b', letterSpacing: '-0.02em' }}>NexTech</p>
                                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(6,78,59,0.55)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>RMS Portal</p>
                                </div>
                            </div>
                            <h1 style={{ margin: '0 0 14px', fontSize: 34, fontWeight: 800, color: '#064e3b', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                                Welcome to<br /><span style={{ color: '#E87722' }}>NexTech RMS</span>
                            </h1>
                            <p style={{ margin: '0 0 44px', fontSize: 14, color: 'rgba(6,78,59,0.65)', lineHeight: 1.7, maxWidth: 280 }}>
                                Streamline testing workflows, manage requirements, and collaborate across teams.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                                <FeatureItem icon="🧪" title="Test Management" desc="Organize and track test cases with full traceability" />
                                <FeatureItem icon="⚡" title="Real-time Collaboration" desc="Work together across teams with live updates" />
                                <FeatureItem icon="📊" title="Reports & Analytics" desc="Insights and dashboards to drive quality decisions" />
                                <FeatureItem icon="🔒" title="Enterprise Security" desc="RBAC, audit trails, and encryption built-in" />
                            </div>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(6,78,59,0.35)', letterSpacing: '0.04em' }}>
                            © 2026 NexTech · All rights reserved
                        </p>
                    </div>

                    {/* ══ RIGHT PANEL ══ */}
                    <div className="rms-right" style={{
                        width: 440, background: '#fff', padding: '48px 44px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        overflowY: 'auto',
                    }}>

                        {/* ── FORGOT PASSWORD ── */}
                        {isForgot && (
                            <div style={{ animation: 'fadeUp 0.25s ease' }}>
                                <button className="back-btn" onClick={() => switchView('login')}>← Back to sign in</button>
                                <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Reset password</h2>
                                <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>
                                    Enter your email and we'll send a reset link.
                                </p>
                                {error && <Alert type="error" msg={error} />}
                                {success && <Alert type="success" msg={success} />}
                                <form onSubmit={handleForgotPassword}>
                                    <TextInput
                                        label="Enter Your Email address" type="email" placeholder="you@company.com"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        required autoComplete="email"
                                    />
                                    <button type="submit" disabled={anyLoading} className="rms-submit">
                                        {loading ? <><Spinner />Sending…</> : 'Send reset link'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ── LOGIN / SIGNUP ── */}
                        {!isForgot && (
                            <div style={{ animation: 'fadeUp 0.25s ease' }}>
                                <div style={{ marginBottom: 24 }}>
                                    <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                        {isLogin ? 'Sign in' : 'Create account'}
                                    </h2>
                                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                        {isLogin
                                            ? 'Access your account and continue your journey'
                                            : 'Fill in the details below to get started'}
                                    </p>
                                </div>

                                {/* Tabs */}
                                <div style={{
                                    display: 'flex', marginBottom: 22,
                                    border: '1.5px solid #e2e6f0', borderRadius: 10, overflow: 'hidden',
                                }}>
                                    {[['login', 'Sign in'], ['signup', 'Sign up']].map(([v, lbl]) => (
                                        <button key={v} className={`rms-tab ${view === v ? 'active' : 'inactive'}`}
                                            onClick={() => switchView(v)}>{lbl}</button>
                                    ))}
                                </div>

                                {error && <Alert type="error" msg={error} />}
                                {success && <Alert type="success" msg={success} />}

                                {/* OAuth buttons */}
                                <div className="oauth-row" style={{ display: 'flex', gap: 10 }}>
                                    <OAuthButton
                                        icon={oauthLoading === 'google'
                                            ? <Spinner color="#4285F4" />
                                            : <GoogleIcon />}
                                        label="Google"
                                        onClick={handleGoogleLogin}
                                        disabled={anyLoading}
                                    />
                                    <OAuthButton
                                        icon={oauthLoading === 'microsoft'
                                            ? <Spinner color="#00A4EF" />
                                            : <MicrosoftIcon />}
                                        label="Microsoft"
                                        onClick={handleMicrosoftLogin}
                                        disabled={anyLoading}
                                    />
                                </div>

                                <Divider />

                                {/* Email form */}
                                <form onSubmit={isLogin ? handleLogin : handleSignup}>
                                    {isSignup && (
                                        <TextInput
                                            label="Full name" placeholder="Jane Smith"
                                            value={fullName} onChange={e => setFullName(e.target.value)}
                                            required autoComplete="name"
                                        />
                                    )}

                                    <TextInput
                                        label="Email address" type="email" placeholder="you@company.com"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        required autoComplete="email"
                                    />

                                    <TextInput
                                        label="Password"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        required
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        suffix={
                                            <button type="button" tabIndex={-1}
                                                onClick={() => setShowPass(s => !s)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0, lineHeight: 1 }}>
                                                {showPass ? '🙈' : '👁️'}
                                            </button>
                                        }
                                    />

                                    {isLogin && (
                                        <div style={{ textAlign: 'right', marginBottom: 14, marginTop: -4 }}>
                                            <span onClick={() => switchView('forgot')}
                                                style={{ fontSize: 12, color: '#E87722', cursor: 'pointer', fontWeight: 500 }}>
                                                Forgot password?
                                            </span>
                                        </div>
                                    )}

                                    {isSignup && (
                                        <div style={{ marginBottom: 4 }}>
                                            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                                                Role
                                            </label>
                                            <RoleDropdown value={role} onChange={setRole} />
                                        </div>
                                    )}

                                    <button type="submit" disabled={anyLoading} className="rms-submit">
                                        {loading
                                            ? <><Spinner />Please wait…</>
                                            : isLogin ? 'Sign In' : 'Create Account'}
                                    </button>
                                </form>

                                <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', margin: '18px 0 0' }}>
                                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                    <span onClick={() => switchView(isLogin ? 'signup' : 'login')}
                                        style={{ color: '#E87722', cursor: 'pointer', fontWeight: 700 }}>
                                        {isLogin ? 'Create one now' : 'Sign in'}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}