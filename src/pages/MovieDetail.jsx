import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MovieDetail() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from('movies').select('*').eq('id', id).single(),
        supabase
          .from('movie_credits')
          .select('*, persons(*)')
          .eq('movie_id', id)
          .order('order', { ascending: true, nullsFirst: false })
          .limit(30),
      ])
      setMovie(m)
      setCredits(c || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="spinner" />
  if (!movie) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Not found.</p>

  const cast = credits.filter((c) => c.department === 'Acting')
  const crew = credits.filter((c) => c.department !== 'Acting')
  const trailer = movie.videos?.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  return (
    <div>
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div style={{ ...styles.backdrop, backgroundImage: `url(${movie.backdrop_path})` }}>
          <div style={styles.backdropOverlay} />
        </div>
      )}

      <div className="container" style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          {movie.poster_path && (
            <img src={movie.poster_path} alt={movie.title} style={styles.poster} />
          )}
          <div style={styles.meta}>
            <div style={styles.genres}>
              {(movie.genres || []).map((g) => (
                <span key={g.id || g.name} style={styles.genre}>{g.name}</span>
              ))}
            </div>
            <h1 style={styles.title}>{movie.title}</h1>
            {movie.tagline && <p style={styles.tagline}>{movie.tagline}</p>}

            <div style={styles.stats}>
              {movie.vote_average && (
                <span style={styles.stat}>★ {movie.vote_average.toFixed(1)}</span>
              )}
              {movie.release_date && (
                <span style={styles.stat}>{movie.release_date.slice(0, 4)}</span>
              )}
              {movie.runtime && (
                <span style={styles.stat}>{movie.runtime} min</span>
              )}
              {movie.status && (
                <span style={styles.stat}>{movie.status}</span>
              )}
            </div>

            <p style={styles.overview}>{movie.overview}</p>

            {trailer && (
              <a
                href={`https://youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                style={styles.trailerBtn}
              >
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Details</h2>
          <div style={styles.detailGrid}>
            {movie.original_title !== movie.title && detail('Original Title', movie.original_title)}
            {detail('Original Language', movie.original_language?.toUpperCase())}
            {movie.budget > 0 && detail('Budget', `$${movie.budget.toLocaleString()}`)}
            {movie.revenue > 0 && detail('Revenue', `$${movie.revenue.toLocaleString()}`)}
            {detail('Vote Count', movie.vote_count?.toLocaleString())}
            {(movie.production_companies || []).length > 0 &&
              detail('Production', movie.production_companies.map((c) => c.name).join(', '))}
            {(movie.keywords || []).length > 0 &&
              detail('Keywords', movie.keywords.slice(0, 10).join(', '))}
          </div>
        </section>

        {/* Cast */}
        {cast.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Cast</h2>
            <div style={styles.castGrid}>
              {cast.map((c) => (
                <PersonCard key={c.id} credit={c} />
              ))}
            </div>
          </section>
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Crew</h2>
            <div style={styles.castGrid}>
              {crew.slice(0, 12).map((c) => (
                <PersonCard key={c.id} credit={c} />
              ))}
            </div>
          </section>
        )}

        {/* Images */}
        {(movie.images?.backdrops || []).length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Images</h2>
            <div style={styles.imageGrid}>
              {movie.images.backdrops.slice(0, 6).map((img, i) => (
                <img key={i} src={img.file_path} alt="" style={styles.galleryImg} loading="lazy" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PersonCard({ credit }) {
  const p = credit.persons
  if (!p) return null
  return (
    <Link to={`/person/${p.id}`} style={pcStyles.card}>
      {p.profile_path
        ? <img src={p.profile_path} alt={p.name} style={pcStyles.img} loading="lazy" />
        : <div style={pcStyles.noImg} />
      }
      <p style={pcStyles.name}>{p.name}</p>
      <p style={pcStyles.role}>{credit.character || credit.job}</p>
    </Link>
  )
}

const detail = (label, val) => val ? (
  <div key={label}>
    <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
    <p style={{ fontSize: 14 }}>{val}</p>
  </div>
) : null

const styles = {
  backdrop: {
    height: 260, backgroundSize: 'cover', backgroundPosition: 'center top',
    position: 'relative',
  },
  backdropOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 100%)',
  },
  main: { paddingTop: 24, paddingBottom: 60 },
  header: {
    display: 'flex', gap: 24, marginBottom: 40,
    flexWrap: 'wrap',
  },
  poster: {
    width: 160, flexShrink: 0, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  meta: { flex: 1, minWidth: 240 },
  genres: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  genre: {
    fontSize: 11, padding: '3px 10px',
    border: '1px solid var(--border)', borderRadius: 20,
    color: 'var(--text2)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(28px, 6vw, 52px)',
    letterSpacing: 1, lineHeight: 1.1, marginBottom: 6,
  },
  tagline: { color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, fontSize: 14 },
  stats: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  stat: { fontSize: 13, color: 'var(--text2)' },
  overview: { fontSize: 14, lineHeight: 1.8, color: '#ccc', marginBottom: 20 },
  trailerBtn: {
    display: 'inline-block', padding: '9px 20px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: 6, fontWeight: 600, fontSize: 14,
  },
  section: { marginBottom: 40 },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22, letterSpacing: 1, marginBottom: 16,
    borderBottom: '1px solid var(--border)', paddingBottom: 8,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px 24px',
  },
  castGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: 12,
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 8,
  },
  galleryImg: { width: '100%', borderRadius: 6, aspectRatio: '16/9', objectFit: 'cover' },
}

const pcStyles = {
  card: { textAlign: 'center', display: 'block' },
  img: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, marginBottom: 6 },
  noImg: { width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', borderRadius: 6, marginBottom: 6 },
  name: { fontSize: 12, fontWeight: 500 },
  role: { fontSize: 11, color: 'var(--text2)' },
}
