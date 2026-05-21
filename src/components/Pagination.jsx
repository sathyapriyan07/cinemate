export default function Pagination({ page, total, onChange }) {
  if (total <= 1) return null
  const pages = Math.min(total, 500)

  return (
    <div style={styles.wrap}>
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} style={styles.btn}>
        ← Prev
      </button>
      <span style={styles.info}>Page {page} of {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} style={styles.btn}>
        Next →
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingTop: 32, paddingBottom: 32,
  },
  btn: {
    padding: '8px 18px', borderRadius: 6,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer',
    ':disabled': { opacity: 0.4 },
  },
  info: { fontSize: 13, color: 'var(--text2)' },
}
