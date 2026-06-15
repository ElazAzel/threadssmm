/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'
import { demoMode, isSupabaseConfigured } from '../lib/env'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  demo: boolean
  signIn: (email: string, password: string) => Promise<AuthError | null>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const demoUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@threadssmm.local',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(demoMode ? demoUser : null)
  const [loading, setLoading] = useState(!demoMode && isSupabaseConfigured)

  useEffect(() => {
    if (demoMode || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isSupabaseConfigured || demoMode,
    demo: demoMode,
    async signIn(email, password) {
      if (demoMode) {
        setUser(demoUser)
        return null
      }
      if (!supabase) return new Error('Supabase не настроен') as AuthError
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error
    },
    async signUp(email, password, fullName) {
      if (demoMode) {
        setUser(demoUser)
        return { error: null, needsConfirmation: false }
      }
      if (!supabase) return { error: new Error('Supabase не настроен') as AuthError, needsConfirmation: false }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, locale: 'ru' } },
      })
      return { error, needsConfirmation: !data.session && !error }
    },
    async signOut() {
      if (!demoMode) await supabase?.auth.signOut()
    },
    async getAccessToken() {
      if (demoMode) return 'demo-token'
      const result = await supabase?.auth.getSession()
      return result?.data.session?.access_token ?? null
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
