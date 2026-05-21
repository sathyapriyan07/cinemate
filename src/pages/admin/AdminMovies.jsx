import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PAGE_SIZE = 20

export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchMovies() }, [query, page])

  async function fetchMovies() {
    setLoading(true)
    let q = supabase
      .from('movies')
      .select('id,title,release_date,vote_average,status,tmdb_id,poster_path', { count: 'exact' })
      .order('popularity', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (query) q = q.ilike('title', `%${query}%`)
    const { data, count } = await q
    setMovies(data || [])
    setTotal(Math.ceil((count || 0) / PAGE_SIZE))
    setLoading(false)
  }

  async function saveEdit() {
    await supabase.from('movies').update({
      title: editing.title,
      overview: editing.overview,
      status: editing.status,
      vote_average: parseFloat(editing.vote_average),
    }).eq('id', editing.id)
    setEditing(null)
    fetchMovies()
  }

  async function deleteMovie(id) {
    if (!window.confirm('Delete this movie and all its credits?')) return
    setDeleting(id)
    await supabase.from('movie_credits').delete().eq('movie_id', id)
    await supabase.from('movies').delete().eq('id', id)
    setDeleting(null)
    fetchMovies()
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={styles.title}>Manage Movies</h1>

      <div style={styles.toolbar}>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder="Search movies..." style={{ flex: 1, maxWidth: 360 }} />
        <span style={{ fontSize: 13, color: 'var(--text2)', alignSelf: 'center' }}>{total * PAGE_SIZE}+ entries</span>
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={styles.table}>
          <div style={{ ...styles.row, ...styles.header }}>
            <span>Title</span><span>Year</span><span>Rating</span><span>Status</span><span>Actions</span>
          </div>
          {movies.map((m) => (
            <div key={m.id} style={styles.row}>
              <span style={styles.movieTitle}>{m.title}</span>
              <span style={styles.cell}>{m.release_date?.slice(0, 4) || '—'}</span>
              <span style={styles.cell}>{m.vote_average?.toFixed(1) || '—'}</span>
              <span style={styles.cell}>{m.status || '—'}</span>
              <span style={styles.actions}>
                <button onClick={() => setEditing(m)} style={styles.editBtn}>Edit</button>
                <button onClick={() => deleteMovie(m.id)} disabled={deleting === m.id} style={styles.delBtn}>
                  {deleting === m.id ? '…' : 'Del'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div style={styles.pagRow}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={styles.pagBtn}>← Prev</button>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Page {page} of {total}</span>
        <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total} style={styles.pagBtn}>Next →</button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Edit Movie</h2>
            <div style={styles.fields}>
              <label style={styles.label}>Title</label>
              <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <label style={styles.label}>Status</label>
              <select value={editing.status || ''} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {['Released','Post Production','In Production','Planned','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
              <label style={styles.label}>Vote Average</label>
              <input type="number" step="0.1" min="0" max="10" value={editing.vote_average || ''} onChange={(e) => setEditing({ ...editing, vote_average: e.target.value })} />
              <label style={styles.label}>Overview</label>
              <textarea value={editing.overview || ''} onChange={(e) => setEditing({ ...editing, overview: e.target.value })} rows={4} style={{ resize: 'vertical' }} />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setEditing(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={saveEdit} style={styles.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  title: { fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, marginBottom: 24 },
  toolbar: { display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' },
  table: { border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 },
  row: { display: 'grid', gridTemplateColumns: '2fr 70px 70px 120px 120px', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  header: { background: 'var(--bg3)', fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  movieTitle: { fontSize: 13, fontWeight: 500 },
  cell: { fontSize: 13, color: 'var(--text2)' },
  actions: { display: 'flex', gap: 6 },
  editBtn: { padding: '5px 12px', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', cursor: 'pointer' },
  delBtn: { padding: '5px 12px', fontSize: 12, background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 5, color: 'var(--accent)', cursor: 'pointer' },
  pagRow: { display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', paddingTop: 16 },
  pagBtn: { padding: '7px 16px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 },
  modalTitle: { fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 20 },
  fields: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  label: { fontSize: 12, color: 'var(--text2)', marginBottom: -4 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '9px 20px', borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  saveBtn: { padding: '9px 20px', borderRadius: 6, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
