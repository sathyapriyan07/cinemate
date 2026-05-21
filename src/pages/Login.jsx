import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const submit = async () => {
    setError(''); setLoading(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error: err, data } = await fn(email, password)
    if (err) { setError(err.message); return }
    if (mode === 'signup') { setError('Check your email to confirm your account.'); return }

    const prof = await refreshProfile?.()
    setLoading(false)
    navigate(prof?.role === 'admin' ? '/admin' : '/')
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CINE<span style={{ color: 'var(--accent)' }}>MATE</span></h1>
        <p style={styles.sub}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</p>

        <div style={styles.toggle}>
          <button onClick={() => setMode('login')} style={{ ...styles.toggleBtn, ...(mode === 'login' ? styles.toggleActive : {}) }}>Sign in</button>
          <button onClick={() => setMode('signup')} style={{ ...styles.toggleBtn, ...(mode === 'signup' ? styles.toggleActive : {}) }}>Sign up</button>
        </div>

        <div style={styles.fields}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button onClick={submit} disabled={loading} style={styles.btn}>
          {loading ? '...' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%', maxWidth: 380,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '36px 28px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 32, letterSpacing: 3,
    textAlign: 'center', marginBottom: 4,
  },
  sub: { textAlign: 'center', color: 'var(--text2)', fontSize: 14, marginBottom: 28 },
  toggle: {
    display: 'flex', background: 'var(--bg3)',
    borderRadius: 8, padding: 3, marginBottom: 24,
  },
  toggleBtn: {
    flex: 1, padding: '8px', borderRadius: 6,
    fontSize: 14, color: 'var(--text2)',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'var(--bg2)', color: 'var(--text)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  fields: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  error: { fontSize: 13, color: 'var(--accent2)', marginBottom: 12, textAlign: 'center' },
  btn: {
    width: '100%', padding: '11px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: 8, fontWeight: 600, fontSize: 15,
    cursor: 'pointer',
  },
}
