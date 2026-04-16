import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabaseClient'

// ─── Spinner (matches Login.jsx) ─────────────────────────────
function Spinner({ color = '#fff' }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            style={{ animation: 'rms-spin 0.8s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

// ─── Alert Banner (matches Login.jsx) ────────────────────────
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

// ─── Text Input (matches Login.jsx) ──────────────────────────
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

// ─── Password Strength Bar ────────────────────────────────────
function PasswordStrength({ password }) {
    if (!password) return null

    const rules = [
        { test: password.length >= 8, label: '8+ characters' },
        { test: /[A-Z]/.test(password), label: 'Uppercase letter' },
        { test: /[0-9]/.test(password), label: 'Number' },
        { test: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
    ]
    const passed = rules.filter(r => r.test).length
    const colors = ['#fca5a5', '#fca5a5', '#fbbf24', '#34d399', '#10b981']
    const labels = ['Too weak', 'Too weak', 'Fair', 'Good', 'Strong']
    const color = colors[passed]

    return (
        <div style={{ marginTop: -6, marginBottom: 14 }}>
            {/* Bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= passed ? color : '#e2e6f0',
                        transition: 'background 0.3s',
                    }} />
                ))}
            </div>
            {/* Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {rules.map((r, i) => (
                    <span key={i} style={{
                        fontSize: 11, fontWeight: 500,
                        color: r.test ? '#10b981' : '#94a3b8',
                        display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                        {r.test ? '✓' : '○'} {r.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ─── NexTech Logo ─────────────────────────────────────────────
function NexTechLogo({ size = 52 }) {
    return (
        <div style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#fce9d8' }}>
            <img src="data:image/png;base64,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" alt="NexTech Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
    )
}

// ─── Main ResetPasswordPage ───────────────────────────────────
export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [sessionReady, setSessionReady] = useState(false)
    const [invalidLink, setInvalidLink] = useState(false)

    // ── Detect Supabase recovery session from URL ─────────────
    // Supabase appends #access_token=...&type=recovery to the redirectTo URL.
    // onAuthStateChange fires with event='PASSWORD_RECOVERY' when it parses this.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setSessionReady(true)
            }
        })

        // Also check if already in a recovery session (page reload edge case)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true)
        })

        // If after 3s no recovery session found, the link is invalid/expired
        const timer = setTimeout(() => {
            setSessionReady(prev => {
                if (!prev) setInvalidLink(true)
                return prev
            })
        }, 3000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [])

    async function handleReset(e) {
        e.preventDefault()
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter.')
            return
        }
        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number.')
            return
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            setError('Password must contain at least one special character (e.g. @, #, !).')
            return
        }
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }
        setLoading(true)
        setError(null)

        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        // Sign out so the user lands on a clean login page
        await supabase.auth.signOut()
        setSuccess(true)
        setLoading(false)

        // Redirect to login after 2.5s
        setTimeout(() => {
            window.location.href = '/login'
        }, 2500)
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { font-family:'Sora',sans-serif; box-sizing:border-box; }
                @keyframes rms-spin { to { transform:rotate(360deg); } }
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(12px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes pulse-ring {
                    0%   { transform:scale(0.9); opacity:0.7; }
                    70%  { transform:scale(1.15); opacity:0; }
                    100% { transform:scale(0.9); opacity:0; }
                }
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
            `}</style>

            <div style={{
                display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #d1fae5 0%, #e7edea 50%, #f0fdf4 100%)', padding: 32,
            }}>
                <div style={{
                    width: '100%', maxWidth: 440,
                    background: '#fff', borderRadius: 20, padding: '48px 44px',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
                    animation: 'fadeUp 0.3s ease',
                }}>
                    {/* Logo + brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <NexTechLogo size={42} />
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>NexTech RMS</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Release Management System</div>
                        </div>
                    </div>

                    {/* ── SUCCESS STATE ── */}
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 20 }}>
                                <div style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    background: 'rgba(16,185,129,0.2)',
                                    animation: 'pulse-ring 1.5s ease-out infinite',
                                }} />
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                                }}>✓</div>
                            </div>
                            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Password Updated!</h2>
                            <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
                                Your password has been changed successfully.
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                                Redirecting you to sign in…
                            </p>
                        </div>

                    ) : invalidLink ? (
                        /* ── INVALID / EXPIRED LINK ── */
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Link Expired</h2>
                            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="rms-submit"
                            >
                                Back to Sign In
                            </button>
                        </div>

                    ) : !sessionReady ? (
                        /* ── LOADING / VERIFYING LINK ── */
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <Spinner color="#0e4c38" />
                            <p style={{ marginTop: 16, fontSize: 13.5, color: '#64748b' }}>Verifying reset link…</p>
                        </div>

                    ) : (
                        /* ── RESET FORM ── */
                        <div>
                            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Set new password
                            </h2>
                            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>
                                Choose a strong password for your account.
                            </p>

                            {error && <Alert type="error" msg={error} />}

                            <form onSubmit={handleReset}>
                                <TextInput
                                    label="New password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    suffix={
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowPass(s => !s)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0, lineHeight: 1 }}>
                                            {showPass ? '🙈' : '👁️'}
                                        </button>
                                    }
                                />
                                <PasswordStrength password={password} />

                                <TextInput
                                    label="Confirm new password"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    suffix={
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowConfirm(s => !s)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0, lineHeight: 1 }}>
                                            {showConfirm ? '🙈' : '👁️'}
                                        </button>
                                    }
                                />

                                {/* Match indicator */}
                                {confirm && (
                                    <div style={{
                                        fontSize: 12, marginTop: -6, marginBottom: 12, fontWeight: 600,
                                        color: password === confirm ? '#10b981' : '#ef4444',
                                    }}>
                                        {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </div>
                                )}

                                <button type="submit" disabled={loading || !password || !confirm} className="rms-submit" style={{ marginTop: 8 }}>
                                    {loading ? <><Spinner />Updating…</> : 'Update Password'}
                                </button>
                            </form>

                            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12.5, color: '#94a3b8' }}>
                                Remember it?{' '}
                                <span
                                    onClick={() => window.location.href = '/login'}
                                    style={{ color: '#E87722', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    Back to sign in
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}