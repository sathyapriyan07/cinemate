const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const tmdbImageUrl = (path, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null

const tmdbFetch = async (endpoint, params = {}) => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', apiKey)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

export const tmdb = {
  searchMovies: (query, page = 1) =>
    tmdbFetch('/search/movie', { query, page }),

  searchSeries: (query, page = 1) =>
    tmdbFetch('/search/tv', { query, page }),

  getMovie: (id) =>
    tmdbFetch(`/movie/${id}`, {
      append_to_response: 'credits,videos,images,keywords,release_dates,external_ids',
    }),

  getSeries: (id) =>
    tmdbFetch(`/tv/${id}`, {
      append_to_response: 'credits,videos,images,keywords,content_ratings,external_ids',
    }),

  getSeason: (seriesId, seasonNumber) =>
    tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`, {}),

  getPerson: (id) =>
    tmdbFetch(`/person/${id}`, {
      append_to_response: 'combined_credits,images,external_ids',
    }),

  trendingMovies: (page = 1) =>
    tmdbFetch('/trending/movie/week', { page }),

  trendingSeries: (page = 1) =>
    tmdbFetch('/trending/tv/week', { page }),

  popularMovies: (page = 1) =>
    tmdbFetch('/movie/popular', { page }),

  popularSeries: (page = 1) =>
    tmdbFetch('/tv/popular', { page }),
}
