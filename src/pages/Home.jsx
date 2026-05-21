import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import MediaGrid from '../components/MediaGrid'

export default function Home() {
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    async function load() {
      const [m, s] = await Promise.all([
        supabase.from('movies').select('*').order('popularity', { ascending: false }).limit(12),
        supabase.from('series').select('*').order('popularity', { ascending: false }).limit(12),
      ])
      const movieList = m.data || []
      const seriesList = s.data || []
      setMovies(movieList)
      setSeries(seriesList)
      if (movieList.length) setFeatured(movieList[0])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      {featured && (
        <div style={{ ...styles.hero, backgroundImage: `url(${featured.backdrop_path})` }}>
          <div style={styles.heroOverlay}>
            <div className="container" style={styles.heroContent}>
              <p style={styles.heroEyebrow}>Featured Film</p>
              <h1 style={styles.heroTitle}>{featured.title}</h1>
              <p style={styles.heroOverview}>{featured.overview?.slice(0, 160)}…</p>
              <Link to={`/movies/${featured.id}`} style={styles.heroBtn}>View Details</Link>
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Movies */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Popular Movies</h2>
            <Link to="/movies" style={styles.seeAll}>See all →</Link>
          </div>
          <MediaGrid items={movies} type="movie" loading={loading} />
        </section>

        {/* Series */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Popular Series</h2>
            <Link to="/series" style={styles.seeAll}>See all →</Link>
          </div>
          <MediaGrid items={series} type="series" loading={loading} />
        </section>
      </div>
    </div>
  )
}

const styles = {
  hero: {
    minHeight: 400, backgroundSize: 'cover', backgroundPosition: 'center',
  },
  heroOverlay: {
    minHeight: 400,
    background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 60%, rgba(10,10,10,0.2) 100%)',
    display: 'flex', alignItems: 'flex-end',
  },
  heroContent: { paddingBottom: 40, paddingTop: 40 },
  heroEyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: 3,
    textTransform: 'uppercase', color: 'var(--accent)',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(36px, 8vw, 72px)',
    letterSpacing: 2, lineHeight: 1,
    marginBottom: 12,
  },
  heroOverview: {
    color: 'var(--text2)', maxWidth: 520, fontSize: 14, marginBottom: 20,
  },
  heroBtn: {
    display: 'inline-block',
    padding: '10px 24px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: 6, fontWeight: 600, fontSize: 14,
  },
  section: { marginBottom: 52 },
  sectionHead: {
    display: 'flex', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28, letterSpacing: 1,
  },
  seeAll: { fontSize: 13, color: 'var(--accent)' },
}
