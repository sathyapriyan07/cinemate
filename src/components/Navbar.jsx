import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const links = isAdmin
    ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/movies', label: 'Movies' },
        { to: '/admin/series', label: 'Series' },
        { to: '/admin/persons', label: 'Persons' },
        { to: '/admin/import', label: 'Import' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/movies', label: 'Movies' },
        { to: '/series', label: 'Series' },
      ]

  const active = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.inner}>
        <Link to={isAdmin ? '/admin' : '/'} style={styles.logo}>
          CINE<span style={{ color: 'var(--accent)' }}>MATE</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{ ...styles.link, ...(active(l.to) ? styles.linkActive : {}) }}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <button onClick={signOut} style={styles.signout}>Sign out</button>
          )}
          {!user && (
            <Link to="/login" style={styles.loginBtn}>Sign in</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button style={styles.burger} onClick={() => setOpen(!open)}>
          <span style={{ ...styles.bar, ...(open ? { transform: 'rotate(45deg) translate(5px,5px)' } : {}) }} />
          <span style={{ ...styles.bar, ...(open ? { opacity: 0 } : {}) }} />
          <span style={{ ...styles.bar, ...(open ? { transform: 'rotate(-45deg) translate(5px,-5px)' } : {}) }} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={styles.mobileMenu}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={styles.mobileLink} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user
            ? <button onClick={() => { signOut(); setOpen(false) }} style={styles.mobileLink}>Sign out</button>
            : <Link to="/login" style={styles.mobileLink} onClick={() => setOpen(false)}>Sign in</Link>
          }
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,10,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 56,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 24, letterSpacing: 2,
    color: 'var(--text)',
  },
  links: {
    display: 'flex', alignItems: 'center', gap: 4,
    '@media(max-width:640px)': { display: 'none' },
  },
  link: {
    padding: '6px 12px', borderRadius: 6,
    fontSize: 13, fontWeight: 500,
    color: 'var(--text2)',
    transition: 'color 0.15s',
  },
  linkActive: { color: 'var(--text)' },
  signout: {
    padding: '6px 12px', fontSize: 13,
    color: 'var(--text2)', borderRadius: 6,
  },
  loginBtn: {
    padding: '6px 14px', fontSize: 13, fontWeight: 500,
    background: 'var(--accent)', color: '#fff',
    borderRadius: 6,
  },
  burger: {
    display: 'none', flexDirection: 'column', gap: 5,
    padding: 8,
    '@media(max-width:640px)': { display: 'flex' },
  },
  bar: {
    display: 'block', width: 22, height: 2,
    background: 'var(--text)', borderRadius: 2,
    transition: 'all 0.2s',
  },
  mobileMenu: {
    display: 'flex', flexDirection: 'column',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  mobileLink: {
    padding: '14px 20px', fontSize: 15,
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)', textAlign: 'left',
    background: 'none', width: '100%',
  },
}
