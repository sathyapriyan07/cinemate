import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ movies: 0, series: 0, persons: 0 })

  useEffect(() => {
    async function load() {
      const [m, s, p] = await Promise.all([
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('series').select('id', { count: 'exact', head: true }),
        supabase.from('persons').select('id', { count: 'exact', head: true }),
      ])
      setCounts({ movies: m.count || 0, series: s.count || 0, persons: p.count || 0 })
    }
    load()
  }, [])

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      <div style={styles.cards}>
        {[
          { label: 'Movies', count: counts.movies, to: '/admin/movies', color: '#e63946' },
          { label: 'Series', count: counts.series, to: '/admin/series', color: '#457b9d' },
          { label: 'Persons', count: counts.persons, to: '/admin/persons', color: '#2a9d8f' },
        ].map((c) => (
          <Link key={c.label} to={c.to} style={styles.card}>
            <p style={{ ...styles.cardCount, color: c.color }}>{c.count.toLocaleString()}</p>
            <p style={styles.cardLabel}>{c.label}</p>
          </Link>
        ))}
      </div>

      <div style={styles.quickLinks}>
        <h2 style={styles.sub}>Quick Actions</h2>
        <div style={styles.actions}>
          <Link to="/admin/import" style={styles.actionBtn}>Import from TMDB</Link>
          <Link to="/admin/movies" style={styles.actionBtn}>Manage Movies</Link>
          <Link to="/admin/series" style={styles.actionBtn}>Manage Series</Link>
          <Link to="/admin/persons" style={styles.actionBtn}>Manage Persons</Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  title: { fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, marginBottom: 32 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 48 },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, textAlign: 'center', transition: 'border-color 0.2s' },
  cardCount: { fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 1 },
  cardLabel: { fontSize: 13, color: 'var(--text2)', marginTop: 4 },
  sub: { fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 16 },
  quickLinks: {},
  actions: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  actionBtn: {
    padding: '10px 20px', background: 'var(--bg2)',
    border: '1px solid var(--border)', borderRadius: 8,
    fontSize: 14, fontWeight: 500,
    transition: 'border-color 0.2s',
  },
}
