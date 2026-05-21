import MediaCard from './MediaCard'

export default function MediaGrid({ items, type, loading }) {
  if (loading) return <div className="spinner" />
  if (!items?.length) return <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No results found.</p>

  return (
    <div style={styles.grid}>
      {items.map((item) => (
        <MediaCard key={item.id} item={item} type={type} />
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 14,
  },
}
