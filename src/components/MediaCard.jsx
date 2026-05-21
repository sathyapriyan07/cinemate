import { Link } from 'react-router-dom'

export default function MediaCard({ item, type }) {
  const to = type === 'movie' ? `/movies/${item.id}` : `/series/${item.id}`
  const title = item.title || item.name
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)

  return (
    <Link to={to} style={styles.card}>
      <div style={styles.poster}>
        {item.poster_path ? (
          <img src={item.poster_path} alt={title} style={styles.img} loading="lazy" />
        ) : (
          <div style={styles.noImg}>
            <span style={styles.noImgText}>{title}</span>
          </div>
        )}
        <div style={styles.rating}>
          ★ {item.vote_average?.toFixed(1) ?? '—'}
        </div>
      </div>
      <div style={styles.info}>
        <p style={styles.title}>{title}</p>
        <p style={styles.year}>{year || '—'}</p>
      </div>
    </Link>
  )
}

const styles = {
  card: {
    display: 'block',
    borderRadius: 'var(--card-radius)',
    overflow: 'hidden',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    transition: 'transform 0.2s, border-color 0.2s',
    ':hover': { transform: 'translateY(-4px)' },
  },
  poster: { position: 'relative', aspectRatio: '2/3', background: 'var(--bg3)' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  noImg: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  noImgText: { fontSize: 13, color: 'var(--text2)', textAlign: 'center' },
  rating: {
    position: 'absolute', bottom: 8, right: 8,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    color: '#fbbf24', fontSize: 11, fontWeight: 600,
    padding: '2px 7px', borderRadius: 12,
  },
  info: { padding: '10px 12px 12px' },
  title: { fontSize: 13, fontWeight: 500, marginBottom: 2, lineHeight: 1.3 },
  year: { fontSize: 11, color: 'var(--text2)' },
}
