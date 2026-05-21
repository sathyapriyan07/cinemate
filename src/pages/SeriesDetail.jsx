import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SeriesDetail() {
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [openSeason, setOpenSeason] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.from('series').select('*').eq('id', id).single(),
        supabase
          .from('series_credits')
          .select('*, persons(*)')
          .eq('series_id', id)
          .order('order', { ascending: true, nullsFirst: false })
          .limit(30),
      ])
      setShow(s)
      setCredits(c || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="spinner" />
  if (!show) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Not found.</p>

  const cast = credits.filter((c) => c.department === 'Acting')
  const crew = credits.filter((c) => c.department !== 'Acting')
  const trailer = show.videos?.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  return (
    <div>
      {show.backdrop_path && (
        <div style={{ ...styles.backdrop, backgroundImage: `url(${show.backdrop_path})` }}>
          <div style={styles.backdropOverlay} />
        </div>
      )}

      <div className="container" style={styles.main}>
        <div style={styles.header}>
          {show.poster_path && (
            <img src={show.poster_path} alt={show.name} style={styles.poster} />
          )}
          <div style={styles.meta}>
            <div style={styles.genres}>
              {(show.genres || []).map((g) => (
                <span key={g.id || g.name} style={styles.genre}>{g.name}</span>
              ))}
            </div>
            <h1 style={styles.title}>{show.name}</h1>
            {show.tagline && <p style={styles.tagline}>{show.tagline}</p>}

            <div style={styles.stats}>
              {show.vote_average && <span style={styles.stat}>★ {show.vote_average.toFixed(1)}</span>}
              {show.first_air_date && <span style={styles.stat}>{show.first_air_date.slice(0, 4)}</span>}
              {show.number_of_seasons && <span style={styles.stat}>{show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}</span>}
              {show.number_of_episodes && <span style={styles.stat}>{show.number_of_episodes} Episodes</span>}
              {show.status && <span style={styles.stat}>{show.status}</span>}
            </div>

            <p style={styles.overview}>{show.overview}</p>

            {trailer && (
              <a href={`https://youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" style={styles.trailerBtn}>
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Details</h2>
          <div style={styles.detailGrid}>
            {show.type && <Detail label="Type" val={show.type} />}
            {show.original_language && <Detail label="Language" val={show.original_language.toUpperCase()} />}
            {show.last_air_date && <Detail label="Last Air Date" val={show.last_air_date} />}
            {(show.networks || []).length > 0 && <Detail label="Networks" val={show.networks.map((n) => n.name).join(', ')} />}
            {(show.created_by || []).length > 0 && <Detail label="Created By" val={show.created_by.map((c) => c.name).join(', ')} />}
            {(show.keywords || []).length > 0 && <Detail label="Keywords" val={show.keywords.slice(0, 10).join(', ')} />}
          </div>
        </section>

        {/* Seasons */}
        {(show.seasons || []).length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Seasons</h2>
            <div style={styles.seasonsGrid}>
              {show.seasons.filter((s) => s.season_number > 0).map((season) => (
                <button
                  key={season.id}
                  style={styles.seasonCard}
                  onClick={() => setOpenSeason((cur) => (cur === season.season_number ? null : season.season_number))}
                >
                  {season.poster_path
                    ? <img src={season.poster_path} alt={season.name} style={styles.seasonImg} loading="lazy" />
                    : <div style={styles.seasonNoImg} />
                  }
                  <p style={styles.seasonName}>{season.name}</p>
                  <p style={styles.seasonMeta}>
                    {season.episode_count} eps
                    {season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ''}
                  </p>
                </button>
              ))}
            </div>

            {openSeason != null && (
              <SeasonEpisodes season={(show.seasons || []).find((s) => s.season_number === openSeason)} />
            )}
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Cast</h2>
            <div style={styles.castGrid}>
              {cast.map((c) => <PersonCard key={c.id} credit={c} />)}
            </div>
          </section>
        )}

        {crew.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Crew</h2>
            <div style={styles.castGrid}>
              {crew.slice(0, 12).map((c) => <PersonCard key={c.id} credit={c} />)}
            </div>
          </section>
        )}

        {(show.images?.backdrops || []).length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Images</h2>
            <div style={styles.imageGrid}>
              {show.images.backdrops.slice(0, 6).map((img, i) => (
                <img key={i} src={img.file_path} alt="" style={styles.galleryImg} loading="lazy" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

const Detail = ({ label, val }) => (
  <div>
    <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
    <p style={{ fontSize: 14 }}>{val}</p>
  </div>
)

function PersonCard({ credit }) {
  const p = credit.persons
  if (!p) return null
  return (
    <Link to={`/person/${p.id}`} style={{ textAlign: 'center', display: 'block' }}>
      {p.profile_path
        ? <img src={p.profile_path} alt={p.name} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} loading="lazy" />
        : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', borderRadius: 6, marginBottom: 6 }} />
      }
      <p style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</p>
      <p style={{ fontSize: 11, color: 'var(--text2)' }}>{credit.character || credit.job}</p>
    </Link>
  )
}

const styles = {
  backdrop: { height: 260, backgroundSize: 'cover', backgroundPosition: 'center top', position: 'relative' },
  backdropOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 100%)' },
  main: { paddingTop: 24, paddingBottom: 60 },
  header: { display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap' },
  poster: { width: 160, flexShrink: 0, borderRadius: 8, alignSelf: 'flex-start' },
  meta: { flex: 1, minWidth: 240 },
  genres: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  genre: { fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text2)' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 52px)', letterSpacing: 1, lineHeight: 1.1, marginBottom: 6 },
  tagline: { color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, fontSize: 14 },
  stats: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  stat: { fontSize: 13, color: 'var(--text2)' },
  overview: { fontSize: 14, lineHeight: 1.8, color: '#ccc', marginBottom: 20 },
  trailerBtn: { display: 'inline-block', padding: '9px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 14 },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px' },
  seasonsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 },
  seasonCard: { textAlign: 'center', display: 'block' },
  seasonImg: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, marginBottom: 6 },
  seasonNoImg: { width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', borderRadius: 6, marginBottom: 6 },
  seasonName: { fontSize: 12, fontWeight: 500, marginBottom: 2 },
  seasonMeta: { fontSize: 11, color: 'var(--text2)' },
  castGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 },
  galleryImg: { width: '100%', borderRadius: 6, aspectRatio: '16/9', objectFit: 'cover' },
}

function SeasonEpisodes({ season }) {
  const episodes = season?.episodes || []
  if (!season) return null
  if (episodes.length === 0) {
    return (
      <div style={epStyles.wrap}>
        <p style={epStyles.title}>{season.name}</p>
        <p style={epStyles.note}>No episodes imported yet. Re-import this series from the Admin Import page.</p>
      </div>
    )
  }

  return (
    <div style={epStyles.wrap}>
      <p style={epStyles.title}>{season.name} episodes</p>
      <div style={epStyles.list}>
        {episodes.map((ep) => (
          <div key={ep.id || `${ep.season_number}-${ep.episode_number}`} style={epStyles.row}>
            <div style={epStyles.thumb}>
              {ep.still_path ? (
                <img src={ep.still_path} alt="" style={epStyles.thumbImg} loading="lazy" />
              ) : (
                <div style={epStyles.thumbNoImg} />
              )}
            </div>
            <div style={epStyles.meta}>
              <p style={epStyles.epTitle}>{ep.episode_number}. {ep.name}</p>
              <p style={epStyles.epSub}>
                {ep.air_date ? ep.air_date : '—'}{ep.runtime ? ` · ${ep.runtime}m` : ''}
              </p>
              {ep.overview && <p style={epStyles.overview}>{ep.overview}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const epStyles = {
  wrap: { marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' },
  title: { fontSize: 14, fontWeight: 600, marginBottom: 10 },
  note: { fontSize: 12, color: 'var(--text2)' },
  list: { display: 'grid', gap: 10 },
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 12,
    padding: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    borderRadius: 10,
  },
  thumb: { width: '100%' },
  thumbImg: { width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover' },
  thumbNoImg: { width: '100%', borderRadius: 8, aspectRatio: '16/9', background: 'var(--bg3)' },
  meta: { minWidth: 0 },
  epTitle: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  epSub: { fontSize: 11, color: 'var(--text2)', marginBottom: 6 },
  overview: { fontSize: 12, color: '#ccc', lineHeight: 1.6 },
}
