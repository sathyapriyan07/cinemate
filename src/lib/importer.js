import { tmdb, tmdbImageUrl } from './tmdb'
import { supabase } from './supabase'

// ─── Person ───────────────────────────────────────────────────────────────────
export async function importPerson(tmdbPerson) {
  const full = await tmdb.getPerson(tmdbPerson.id)

  const personData = {
    tmdb_id: full.id,
    name: full.name,
    biography: full.biography,
    birthday: full.birthday || null,
    deathday: full.deathday || null,
    place_of_birth: full.place_of_birth,
    gender: full.gender,
    known_for_department: full.known_for_department,
    popularity: full.popularity,
    profile_path: tmdbImageUrl(full.profile_path, 'w185'),
    homepage: full.homepage,
    imdb_id: full.external_ids?.imdb_id,
    also_known_as: full.also_known_as || [],
    images: (full.images?.profiles || []).map((img) => ({
      file_path: tmdbImageUrl(img.file_path, 'w185'),
      width: img.width,
      height: img.height,
    })),
  }

  const { data, error } = await supabase
    .from('persons')
    .upsert(personData, { onConflict: 'tmdb_id' })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// ─── Movie ────────────────────────────────────────────────────────────────────
export async function importMovie(tmdbId, onLog) {
  const log = onLog || console.log
  log(`Fetching movie ${tmdbId} from TMDB...`)
  const m = await tmdb.getMovie(tmdbId)

  const movieData = {
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    overview: m.overview,
    tagline: m.tagline,
    status: m.status,
    release_date: m.release_date || null,
    runtime: m.runtime,
    budget: m.budget,
    revenue: m.revenue,
    popularity: m.popularity,
    vote_average: m.vote_average,
    vote_count: m.vote_count,
    adult: m.adult,
    original_language: m.original_language,
    homepage: m.homepage,
    imdb_id: m.imdb_id,
    poster_path: tmdbImageUrl(m.poster_path, 'w500'),
    backdrop_path: tmdbImageUrl(m.backdrop_path, 'original'),
    genres: m.genres || [],
    production_companies: (m.production_companies || []).map((c) => ({
      id: c.id,
      name: c.name,
      logo_path: tmdbImageUrl(c.logo_path, 'w200'),
      origin_country: c.origin_country,
    })),
    production_countries: m.production_countries || [],
    spoken_languages: m.spoken_languages || [],
    keywords: (m.keywords?.keywords || []).map((k) => k.name),
    videos: (m.videos?.results || []).map((v) => ({
      key: v.key,
      site: v.site,
      type: v.type,
      name: v.name,
      official: v.official,
    })),
    images: {
      posters: (m.images?.posters || []).slice(0, 10).map((img) => ({
        file_path: tmdbImageUrl(img.file_path, 'w500'),
        width: img.width,
        height: img.height,
        vote_average: img.vote_average,
      })),
      backdrops: (m.images?.backdrops || []).slice(0, 10).map((img) => ({
        file_path: tmdbImageUrl(img.file_path, 'original'),
        width: img.width,
        height: img.height,
        vote_average: img.vote_average,
      })),
    },
    external_ids: m.external_ids || {},
  }

  log(`Upserting movie "${m.title}"...`)
  const { data: movie, error: movieError } = await supabase
    .from('movies')
    .upsert(movieData, { onConflict: 'tmdb_id' })
    .select('id')
    .single()

  if (movieError) throw movieError

  // Import cast & crew
  const credits = m.credits || {}
  const cast = credits.cast || []
  const crew = credits.crew || []

  log(`Importing ${cast.length} cast + ${crew.length} crew members...`)

  const allPersons = [...cast, ...crew]
  const personMap = {}

  for (const p of allPersons) {
    if (personMap[p.id]) continue
    try {
      const dbId = await importPerson(p)
      personMap[p.id] = dbId
    } catch (e) {
      log(`  Warning: could not import person ${p.name}: ${e.message}`)
    }
  }

  // Upsert movie_credits
  const castRows = cast.map((c) => ({
    movie_id: movie.id,
    person_id: personMap[c.id],
    department: 'Acting',
    job: 'Actor',
    character: c.character,
    credit_id: c.credit_id,
    order: c.order,
    cast_id: c.cast_id,
    tmdb_person_id: c.id,
  })).filter((r) => r.person_id)

  const crewRows = crew.map((c) => ({
    movie_id: movie.id,
    person_id: personMap[c.id],
    department: c.department,
    job: c.job,
    character: null,
    credit_id: c.credit_id,
    order: null,
    cast_id: null,
    tmdb_person_id: c.id,
  })).filter((r) => r.person_id)

  if (castRows.length + crewRows.length > 0) {
    await supabase
      .from('movie_credits')
      .upsert([...castRows, ...crewRows], { onConflict: 'credit_id' })
  }

  log(`✓ Movie "${m.title}" imported successfully.`)
  return movie.id
}

// ─── Series ───────────────────────────────────────────────────────────────────
export async function importSeries(tmdbId, onLog) {
  const log = onLog || console.log
  log(`Fetching series ${tmdbId} from TMDB...`)
  const s = await tmdb.getSeries(tmdbId)

  // Fetch per-season episode details (TMDB /season endpoint).
  // Keep it bounded to avoid very large shows taking too long.
  const seasonsForEpisodes = (s.seasons || []).filter((season) => season.season_number > 0).slice(0, 25)
  const seasonDetails = {}

  for (const season of seasonsForEpisodes) {
    try {
      log(`  Fetching S${season.season_number} episodes...`)
      seasonDetails[season.season_number] = await tmdb.getSeason(s.id, season.season_number)
    } catch (e) {
      log(`  Warning: could not fetch S${season.season_number} episodes: ${e.message}`)
    }
  }

  const seriesData = {
    tmdb_id: s.id,
    name: s.name,
    original_name: s.original_name,
    overview: s.overview,
    tagline: s.tagline,
    status: s.status,
    type: s.type,
    first_air_date: s.first_air_date || null,
    last_air_date: s.last_air_date || null,
    number_of_episodes: s.number_of_episodes,
    number_of_seasons: s.number_of_seasons,
    episode_run_time: s.episode_run_time || [],
    popularity: s.popularity,
    vote_average: s.vote_average,
    vote_count: s.vote_count,
    adult: s.adult,
    original_language: s.original_language,
    homepage: s.homepage,
    in_production: s.in_production,
    origin_country: s.origin_country || [],
    languages: s.languages || [],
    poster_path: tmdbImageUrl(s.poster_path, 'w500'),
    backdrop_path: tmdbImageUrl(s.backdrop_path, 'original'),
    genres: s.genres || [],
    networks: (s.networks || []).map((n) => ({
      id: n.id,
      name: n.name,
      logo_path: tmdbImageUrl(n.logo_path, 'w200'),
      origin_country: n.origin_country,
    })),
    production_companies: (s.production_companies || []).map((c) => ({
      id: c.id,
      name: c.name,
      logo_path: tmdbImageUrl(c.logo_path, 'w200'),
      origin_country: c.origin_country,
    })),
    production_countries: s.production_countries || [],
    spoken_languages: s.spoken_languages || [],
    seasons: (s.seasons || []).map((season) => {
      const sd = seasonDetails[season.season_number]
      return ({
      id: season.id,
      name: season.name,
      overview: season.overview,
      season_number: season.season_number,
      episode_count: season.episode_count,
      air_date: season.air_date,
      poster_path: tmdbImageUrl(season.poster_path, 'w342'),
      vote_average: season.vote_average,
      episodes: (sd?.episodes || []).map((ep) => ({
        id: ep.id,
        name: ep.name,
        overview: ep.overview,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        air_date: ep.air_date,
        runtime: ep.runtime ?? null,
        still_path: tmdbImageUrl(ep.still_path, 'w300'),
        vote_average: ep.vote_average,
      })),
    })
    }),
    keywords: (s.keywords?.results || []).map((k) => k.name),
    videos: (s.videos?.results || []).map((v) => ({
      key: v.key,
      site: v.site,
      type: v.type,
      name: v.name,
      official: v.official,
    })),
    images: {
      posters: (s.images?.posters || []).slice(0, 10).map((img) => ({
        file_path: tmdbImageUrl(img.file_path, 'w500'),
        width: img.width,
        height: img.height,
      })),
      backdrops: (s.images?.backdrops || []).slice(0, 10).map((img) => ({
        file_path: tmdbImageUrl(img.file_path, 'original'),
        width: img.width,
        height: img.height,
      })),
    },
    external_ids: s.external_ids || {},
    created_by: (s.created_by || []).map((c) => ({
      id: c.id,
      name: c.name,
      profile_path: tmdbImageUrl(c.profile_path, 'w185'),
    })),
  }

  log(`Upserting series "${s.name}"...`)
  const { data: series, error: seriesError } = await supabase
    .from('series')
    .upsert(seriesData, { onConflict: 'tmdb_id' })
    .select('id')
    .single()

  if (seriesError) throw seriesError

  // Import cast & crew
  const credits = s.credits || {}
  const cast = credits.cast || []
  const crew = credits.crew || []

  log(`Importing ${cast.length} cast + ${crew.length} crew members...`)

  const allPersons = [...cast, ...crew]
  const personMap = {}

  for (const p of allPersons) {
    if (personMap[p.id]) continue
    try {
      const dbId = await importPerson(p)
      personMap[p.id] = dbId
    } catch (e) {
      log(`  Warning: could not import person ${p.name}: ${e.message}`)
    }
  }

  const castRows = cast.map((c) => ({
    series_id: series.id,
    person_id: personMap[c.id],
    department: 'Acting',
    job: 'Actor',
    character: c.character,
    credit_id: c.credit_id,
    order: c.order,
    tmdb_person_id: c.id,
  })).filter((r) => r.person_id)

  const crewRows = crew.map((c) => ({
    series_id: series.id,
    person_id: personMap[c.id],
    department: c.department,
    job: c.job,
    character: null,
    credit_id: c.credit_id,
    order: null,
    tmdb_person_id: c.id,
  })).filter((r) => r.person_id)

  if (castRows.length + crewRows.length > 0) {
    await supabase
      .from('series_credits')
      .upsert([...castRows, ...crewRows], { onConflict: 'credit_id' })
  }

  log(`✓ Series "${s.name}" imported successfully.`)
  return series.id
}
