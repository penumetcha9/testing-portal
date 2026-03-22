import { useState, useRef, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

/* ── Custom Dropdown ── */
const ROLES = [
    { value: 'tester', label: 'Tester' },
    { value: 'admin', label: 'Admin' },
    { value: 'developer', label: 'Developer' },
]

function RoleDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // Close on outside click
    useEffect(() => {
        function onClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const selected = ROLES.find(r => r.value === value)

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
            <style>{`
                @keyframes dropdownIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .role-trigger {
                    width: 100%;
                    padding: 10px 14px;
                    background: linear-gradient(135deg, #fafbff 0%, #f4f6fb 100%);
                    border: 1.5px solid #e2e6f0;
                    border-radius: 10px;
                    font-size: 13.5px;
                    font-weight: 500;
                    letter-spacing: 0.01em;
                    color: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                    transition: all 0.18s ease;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-sizing: border-box;
                    text-align: left;
                }
                .role-trigger.open {
                    background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%);
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99,102,241,.12),
                                0 2px 8px rgba(99,102,241,.08);
                }
                .role-panel {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    z-index: 100;
                    background: #ffffff;
                    border: 1.5px solid #e8eaf6;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(99,102,241,.13),
                                0 2px 8px rgba(0,0,0,.08);
                    padding: 6px;
                    animation: dropdownIn 0.18s cubic-bezier(.4,0,.2,1);
                }
                .role-option {
                    padding: 9px 12px;
                    border-radius: 8px;
                    font-size: 13.5px;
                    color: #374151;
                    transition: all 0.12s ease;
                    cursor: pointer;
                    user-select: none;
                }
                .role-option:hover { background: #f8fafc; color: #1e293b; }
                .role-option.selected {
                    background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%);
                    color: #4f46e5;
                    font-weight: 600;
                }
            `}</style>

            <button
                type="button"
                className={`role-trigger${open ? ' open' : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                <span>{selected?.label}</span>
                <span style={{
                    fontSize: 10,
                    color: open ? '#6366f1' : '#94a3b8',
                    transition: 'transform 0.18s ease, color 0.18s ease',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                }}>▼</span>
            </button>

            {open && (
                <div className="role-panel">
                    {ROLES.map(r => (
                        <div
                            key={r.value}
                            className={`role-option${r.value === value ? ' selected' : ''}`}
                            onClick={() => { onChange(r.value); setOpen(false) }}
                        >
                            {r.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ── Login Page ── */
export default function LoginPage() {
    const [tab, setTab] = useState('login')   // 'login' | 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('tester') // 'tester' | 'admin' | 'developer'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    async function handleEmailAuth(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } =
            tab === 'login'
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { role } }   // store role in user metadata on sign up
                })

        if (error) setError(error.message)
        else if (tab === 'signup') setMessage('Check your email to confirm your account!')
        setLoading(false)
    }

    async function handleOAuth(provider) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin + '/dashboard' }
        })
        if (error) setError(error.message)
    }

    async function handleForgotPassword() {
        if (!email) return setError('Enter your email first')
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) setError(error.message)
        else setMessage('Password reset email sent!')
    }

    const inputStyle = {
        width: '100%',
        padding: 8,
        marginBottom: 10,
        boxSizing: 'border-box',
        border: '1px solid #ddd',
        borderRadius: 6,
        fontSize: 14,
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 380, padding: '2rem', border: '1px solid #eee', borderRadius: 12 }}>
                <h2>{tab === 'login' ? 'Welcome back' : 'Create account'}</h2>

                {/* Tab switcher */}
                <div style={{ display: 'flex', marginBottom: 16 }}>
                    {['login', 'signup'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            style={{
                                flex: 1, padding: '8px', background: tab === t ? '#3ECF8E' : 'transparent',
                                color: tab === t ? '#fff' : '#666', border: '1px solid #ddd', cursor: 'pointer'
                            }}>
                            {t === 'login' ? 'Sign in' : 'Sign up'}
                        </button>
                    ))}
                </div>

                {/* Error / success messages */}
                {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
                {message && <p style={{ color: 'green', fontSize: 13 }}>{message}</p>}

                {/* Email/password form */}
                <form onSubmit={handleEmailAuth}>
                    <input type="email" placeholder="Email" value={email}
                        onChange={e => setEmail(e.target.value)} required
                        style={inputStyle} />

                    <input type="password" placeholder="Password" value={password}
                        onChange={e => setPassword(e.target.value)} required
                        style={{ ...inputStyle, marginBottom: 6 }} />

                    {tab === 'login' && (
                        <p onClick={handleForgotPassword}
                            style={{ fontSize: 12, color: '#3ECF8E', cursor: 'pointer', textAlign: 'right', marginBottom: 10 }}>
                            Forgot password?
                        </p>
                    )}

                    {/* Role dropdown */}
                    <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
                        Role
                    </label>
                    <RoleDropdown value={role} onChange={setRole} />

                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: 10, background: '#3ECF8E', color: '#fff',
                            border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8
                        }}>
                        {loading ? 'Loading...' : tab === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                {/* OAuth buttons */}

            </div>
        </div>
    )
}