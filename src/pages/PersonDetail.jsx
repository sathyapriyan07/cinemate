import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import MediaCard from '../components/MediaCard'

export default function PersonDetail() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [movieCredits, setMovieCredits] = useState([])
  const [seriesCredits, setSeriesCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [bioExpanded, setBioExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: mc }, { data: sc }] = await Promise.all([
        supabase.from('persons').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('movie_credits')
          .select('department, job, character, movies(*)')
          .eq('person_id', id)
          .limit(50),
        supabase
          .from('series_credits')
          .select('department, job, character, series(*)')
          .eq('person_id', id)
          .limit(50),
      ])

      setPerson(p ?? null)
      setMovieCredits(mc || [])
      setSeriesCredits(sc || [])
      setLoading(false)
    }
    load()
  }, [id])

  const topMovies = useMemo(() => {
    const items = (movieCredits || [])
      .map((c) => c.movies)
      .filter(Boolean)
    const dedup = new Map(items.map((m) => [m.id, m]))
    return [...dedup.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12)
  }, [movieCredits])

  const topSeries = useMemo(() => {
    const items = (seriesCredits || [])
      .map((c) => c.series)
      .filter(Boolean)
    const dedup = new Map(items.map((s) => [s.id, s]))
    return [...dedup.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12)
  }, [seriesCredits])

  if (loading) return <div className="spinner" />
  if (!person) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Not found.</p>

  const born = person.birthday ? formatDate(person.birthday) : null
  const died = person.deathday ? formatDate(person.deathday) : null
  const aka = Array.isArray(person.also_known_as) ? person.also_known_as : []
  const bio = (person.biography || '').trim()
  const showBioToggle = bio.length > 480
  const bioText = showBioToggle && !bioExpanded ? `${bio.slice(0, 480)}…` : bio

  return (
    <div className="container" style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.left}>
          {person.profile_path
            ? <img src={person.profile_path} alt={person.name} style={styles.photo} />
            : <div style={styles.noPhoto} />
          }
        </div>

        <div style={styles.right}>
          <p style={styles.kicker}>Person</p>
          <h1 style={styles.name}>{person.name}</h1>

          {(aka || []).length > 0 && (
            <div style={styles.chips}>
              {aka.slice(0, 6).map((n) => (
                <span key={n} style={styles.chip}>{n}</span>
              ))}
            </div>
          )}

          <div style={styles.meta}>
            {born && <Meta label="Born" val={born} />}
            {person.place_of_birth && <Meta label="Place" val={person.place_of_birth} />}
            {died && <Meta label="Died" val={died} />}
            {person.known_for_department && <Meta label="Known For" val={person.known_for_department} />}
            {person.imdb_id && (
              <div>
                <p style={styles.metaLabel}>IMDb</p>
                <a
                  href={`https://www.imdb.com/name/${person.imdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.metaLink}
                >
                  {person.imdb_id}
                </a>
              </div>
            )}
            {person.homepage && (
              <div>
                <p style={styles.metaLabel}>Website</p>
                <a href={person.homepage} target="_blank" rel="noreferrer" style={styles.metaLink}>
                  Visit
                </a>
              </div>
            )}
          </div>

          {bio && (
            <div style={styles.bio}>
              <h2 style={styles.sectionTitle}>Biography</h2>
              <p style={styles.bioText}>{bioText}</p>
              {showBioToggle && (
                <button onClick={() => setBioExpanded((v) => !v)} style={styles.bioToggle}>
                  {bioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {topMovies.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Movies</h2>
            <Link to="/movies" style={styles.seeAll}>Browse</Link>
          </div>
          <div style={styles.grid}>
            {topMovies.map((m) => <MediaCard key={m.id} item={m} type="movie" />)}
          </div>
        </section>
      )}

      {topSeries.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Series</h2>
            <Link to="/series" style={styles.seeAll}>Browse</Link>
          </div>
          <div style={styles.grid}>
            {topSeries.map((s) => <MediaCard key={s.id} item={s} type="series" />)}
          </div>
        </section>
      )}

      {(person.images || []).length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Photos</h2>
          <div style={styles.photosGrid}>
            {(person.images || []).slice(0, 12).map((img, i) => (
              <img key={i} src={img.file_path} alt="" style={styles.galleryImg} loading="lazy" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Meta({ label, val }) {
  if (!val) return null
  return (
    <div>
      <p style={styles.metaLabel}>{label}</p>
      <p style={styles.metaVal}>{val}</p>
    </div>
  )
}

function formatDate(d) {
  try {
    const dt = new Date(d)
    // Date-only from Postgres can be parsed in local TZ; keep it simple.
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

const styles = {
  wrap: { paddingTop: 24, paddingBottom: 60 },
  header: { display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 40 },
  left: { width: 200, flexShrink: 0 },
  photo: { width: '100%', borderRadius: 10, aspectRatio: '2/3', objectFit: 'cover', border: '1px solid var(--border)' },
  noPhoto: { width: '100%', borderRadius: 10, aspectRatio: '2/3', background: 'var(--bg3)', border: '1px solid var(--border)' },
  right: { flex: 1, minWidth: 260 },
  kicker: { color: 'var(--text2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  name: { fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 52px)', letterSpacing: 1, lineHeight: 1.1, marginBottom: 10 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: { fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 999, color: 'var(--text2)' },
  meta: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px 18px', marginBottom: 18 },
  metaLabel: { fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  metaVal: { fontSize: 14 },
  metaLink: { fontSize: 14, color: 'var(--accent)' },
  bio: { marginTop: 12 },
  bioText: { fontSize: 14, lineHeight: 1.8, color: '#ccc' },
  bioToggle: { marginTop: 8, color: 'var(--accent)', fontSize: 13 },
  section: { marginBottom: 40 },
  sectionHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 },
  seeAll: { fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 },
  photosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
  galleryImg: { width: '100%', borderRadius: 8, aspectRatio: '2/3', objectFit: 'cover' },
}

