import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // If profile row doesn't exist yet (or older accounts created before trigger),
    // create it and re-fetch.
    if (!data) {
      const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId })
      if (upsertError) {
        // Can't create profile (likely RLS/GRANTs not applied yet). Fall back to null.
        setProfile(null)
        setLoading(false)
        return null
      }

      const { data: data2 } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data2 ?? null)
      setLoading(false)
      return data2 ?? null
    }

    setProfile(data ?? null)
    setLoading(false)
    return data ?? null
  }

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile: () => (user ? fetchProfile(user.id) : null), signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
