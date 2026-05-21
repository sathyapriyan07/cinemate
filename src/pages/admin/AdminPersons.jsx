import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PAGE_SIZE = 20

export default function AdminPersons() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchPersons() }, [query, page])

  async function fetchPersons() {
    setLoading(true)
    let q = supabase
      .from('persons')
      .select('id,name,known_for_department,birthday,profile_path,tmdb_id', { count: 'exact' })
      .order('popularity', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (query) q = q.ilike('name', `%${query}%`)
    const { data, count } = await q
    setPersons(data || [])
    setTotal(Math.ceil((count || 0) / PAGE_SIZE))
    setLoading(false)
  }

  async function saveEdit() {
    await supabase.from('persons').update({
      name: editing.name,
      biography: editing.biography,
      known_for_department: editing.known_for_department,
    }).eq('id', editing.id)
    setEditing(null)
    fetchPersons()
  }

  async function deletePerson(id) {
    if (!window.confirm('Delete this person? This will also remove all their credits.')) return
    setDeleting(id)
    await supabase.from('movie_credits').delete().eq('person_id', id)
    await supabase.from('series_credits').delete().eq('person_id', id)
    await supabase.from('persons').delete().eq('id', id)
    setDeleting(null)
    fetchPersons()
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={styles.title}>Manage Persons</h1>

      <div style={styles.toolbar}>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder="Search persons..." style={{ flex: 1, maxWidth: 360 }} />
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={styles.grid}>
          {persons.map((p) => (
            <div key={p.id} style={styles.card}>
              {p.profile_path
                ? <img src={p.profile_path} alt={p.name} style={styles.avatar} />
                : <div style={styles.avatarEmpty} />
              }
              <div style={styles.info}>
                <p style={styles.name}>{p.name}</p>
                <p style={styles.dept}>{p.known_for_department || '—'}</p>
                {p.birthday && <p style={styles.dept}>{p.birthday.slice(0, 4)}</p>}
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => setEditing(p)} style={styles.editBtn}>Edit</button>
                <button onClick={() => deletePerson(p.id)} disabled={deleting === p.id} style={styles.delBtn}>
                  {deleting === p.id ? '…' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.pagRow}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={styles.pagBtn}>← Prev</button>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Page {page} of {total}</span>
        <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total} style={styles.pagBtn}>Next →</button>
      </div>

      {editing && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Edit Person</h2>
            <div style={styles.fields}>
              <label style={styles.label}>Name</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <label style={styles.label}>Known For</label>
              <select value={editing.known_for_department || ''} onChange={(e) => setEditing({ ...editing, known_for_department: e.target.value })}>
                {['Acting','Directing','Writing','Production','Art','Sound','Camera','Editing','Costume & Make-Up','Visual Effects','Crew','Lighting'].map(d => <option key={d}>{d}</option>)}
              </select>
              <label style={styles.label}>Biography</label>
              <textarea value={editing.biography || ''} onChange={(e) => setEditing({ ...editing, biography: e.target.value })} rows={5} style={{ resize: 'vertical' }} />
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
  toolbar: { display: 'flex', gap: 16, marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 },
  card: { display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 },
  avatar: { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  avatarEmpty: { width: 48, height: 48, borderRadius: '50%', background: 'var(--bg3)', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontWeight: 500, marginBottom: 2 },
  dept: { fontSize: 12, color: 'var(--text2)' },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0 },
  editBtn: { padding: '5px 10px', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', cursor: 'pointer' },
  delBtn: { padding: '5px 10px', fontSize: 12, background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 5, color: 'var(--accent)', cursor: 'pointer' },
  pagRow: { display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', paddingTop: 16 },
  pagBtn: { padding: '7px 16px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 20 },
  fields: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  label: { fontSize: 12, color: 'var(--text2)', marginBottom: -4 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '9px 20px', borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  saveBtn: { padding: '9px 20px', borderRadius: 6, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
