import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MediaGrid from '../components/MediaGrid'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 24

export default function Movies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [genre, setGenre] = useState('')

  useEffect(() => {
    fetchMovies()
  }, [query, page, genre])

  async function fetchMovies() {
    setLoading(true)
    let q = supabase
      .from('movies')
      .select('*', { count: 'exact' })
      .order('popularity', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (query) q = q.ilike('title', `%${query}%`)
    if (genre) q = q.contains('genres', [{ name: genre }])

    const { data, count } = await q
    setMovies(data || [])
    setTotal(Math.ceil((count || 0) / PAGE_SIZE))
    setLoading(false)
  }

  const handleSearch = (q) => { setQuery(q); setPage(1) }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={styles.title}>Movies</h1>
      <div style={styles.toolbar}>
        <SearchBar onSearch={handleSearch} placeholder="Search movies..." />
        <select value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1) }} style={styles.select}>
          <option value="">All Genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <MediaGrid items={movies} type="movie" loading={loading} />
      <Pagination page={page} total={total} onChange={setPage} />
    </div>
  )
}

const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Family','Fantasy','History','Horror','Music','Mystery',
  'Romance','Science Fiction','Thriller','War','Western',
]

const styles = {
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 40, letterSpacing: 2, marginBottom: 24,
  },
  toolbar: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  select: { width: 'auto', minWidth: 140 },
}
