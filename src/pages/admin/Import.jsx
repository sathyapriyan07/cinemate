import { useState } from 'react'
import { tmdb } from '../../lib/tmdb'
import { importMovie, importSeries } from '../../lib/importer'

export default function AdminImport() {
  const [tab, setTab] = useState('movie')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(null)
  const [logs, setLogs] = useState([])
  const [done, setDone] = useState(null)

  const addLog = (msg) => setLogs((prev) => [...prev, msg])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true); setResults([])
    try {
      const fn = tab === 'movie' ? tmdb.searchMovies : tmdb.searchSeries
      const data = await fn(query)
      setResults(data.results || [])
    } catch (e) {
      addLog(`Search error: ${e.message}`)
    }
    setSearching(false)
  }

  const importItem = async (item) => {
    setImporting(item.id); setLogs([]); setDone(null)
    try {
      const fn = tab === 'movie' ? importMovie : importSeries
      await fn(item.id, addLog)
      setDone('success')
    } catch (e) {
      addLog(`Error: ${e.message}`)
      setDone('error')
    }
    setImporting(null)
  }

  const title = (item) => item.title || item.name
  const year = (item) => (item.release_date || item.first_air_date || '').slice(0, 4)
  const poster = (item) => item.poster_path
    ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
    : null

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={styles.title}>Import from TMDB</h1>

      {/* Tab */}
      <div style={styles.tabs}>
        {['movie', 'series'].map((t) => (
          <button key={t} onClick={() => { setTab(t); setResults([]) }}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
            {t === 'movie' ? 'Movie' : 'Series'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={styles.searchRow}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search TMDB for a ${tab}...`}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          style={{ flex: 1 }}
        />
        <button onClick={search} disabled={searching} style={styles.searchBtn}>
          {searching ? '...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={styles.results}>
          {results.map((item) => (
            <div key={item.id} style={styles.resultRow}>
              {poster(item)
                ? <img src={poster(item)} alt={title(item)} style={styles.thumb} />
                : <div style={styles.thumbEmpty} />
              }
              <div style={{ flex: 1 }}>
                <p style={styles.resultTitle}>{title(item)}</p>
                <p style={styles.resultMeta}>
                  {year(item)} · TMDB #{item.id} · ★ {item.vote_average?.toFixed(1)}
                </p>
                <p style={styles.resultOverview}>{item.overview?.slice(0, 100)}…</p>
              </div>
              <button
                onClick={() => importItem(item)}
                disabled={importing === item.id}
                style={styles.importBtn}
              >
                {importing === item.id ? 'Importing…' : 'Import'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div style={styles.logBox}>
          <p style={styles.logTitle}>
            {done === 'success' ? '✓ Done' : done === 'error' ? '✗ Failed' : '⏳ Importing…'}
          </p>
          {logs.map((l, i) => <p key={i} style={styles.logLine}>{l}</p>)}
        </div>
      )}
    </div>
  )
}

const styles = {
  title: { fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, marginBottom: 28 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '8px 20px', borderRadius: 8, fontSize: 14, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer' },
  tabActive: { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' },
  searchRow: { display: 'flex', gap: 10, marginBottom: 24 },
  searchBtn: { padding: '10px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' },
  results: { display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  resultRow: { display: 'flex', gap: 14, alignItems: 'flex-start', padding: 14, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' },
  thumb: { width: 46, flexShrink: 0, borderRadius: 4 },
  thumbEmpty: { width: 46, height: 66, flexShrink: 0, borderRadius: 4, background: 'var(--bg3)' },
  resultTitle: { fontSize: 14, fontWeight: 500, marginBottom: 2 },
  resultMeta: { fontSize: 12, color: 'var(--text2)', marginBottom: 4 },
  resultOverview: { fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 },
  importBtn: { padding: '7px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, cursor: 'pointer', flexShrink: 0 },
  logBox: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 },
  logTitle: { fontWeight: 600, marginBottom: 8, fontSize: 14 },
  logLine: { fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace', lineHeight: 1.8 },
}
