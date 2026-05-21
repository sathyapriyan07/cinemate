import { useState } from 'react'

export default function SearchBar({ onSearch, placeholder = 'Search...' }) {
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    onSearch(q.trim())
  }

  return (
    <form onSubmit={submit} style={styles.form}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
      <button type="submit" style={styles.btn}>Search</button>
    </form>
  )
}

const styles = {
  form: { display: 'flex', gap: 8 },
  input: { flex: 1 },
  btn: {
    padding: '10px 20px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: 6, fontWeight: 600, fontSize: 14,
    whiteSpace: 'nowrap',
  },
}
