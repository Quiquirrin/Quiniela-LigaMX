import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

export function DataProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [content, setContent] = useState(null)
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [myPreds, setMyPreds] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg, type = 'ok') => {
    setToast({ msg, type, id: Date.now() })
    setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setSession(s)
      if (e === 'PASSWORD_RECOVERY') window.location.hash = '#/nueva-contrasena'
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadPublic = useCallback(async () => {
    const [c, m, t] = await Promise.all([
      supabase.from('app_content').select('*').eq('id', 1).single(),
      supabase.from('matches').select('*').order('kickoff'),
      supabase.from('teams').select('*').order('name'),
    ])
    if (c.data) setContent(c.data)
    if (m.data) setMatches(m.data)
    if (t.data) setTeams(t.data)
  }, [])

  const loadPrivate = useCallback(async () => {
    if (!session) { setProfile(null); setMyPreds([]); setLeaderboard([]); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('auth_id', session.user.id).maybeSingle()
    setProfile(p)
    const [pr, lb] = await Promise.all([
      p ? supabase.from('predictions').select('*').eq('profile_id', p.id) : Promise.resolve({ data: [] }),
      supabase.rpc('get_leaderboard'),
    ])
    setMyPreds(pr.data || [])
    setLeaderboard(lb.data || [])
  }, [session])

  useEffect(() => {
    if (session === undefined) return
    setLoading(true)
    Promise.all([loadPublic(), loadPrivate()]).finally(() => setLoading(false))
  }, [session, loadPublic, loadPrivate])

  const refresh = useCallback(() => Promise.all([loadPublic(), loadPrivate()]), [loadPublic, loadPrivate])

  const predict = useCallback(async (match, result) => {
    if (!profile) return
    const prev = myPreds.find((p) => p.match_id === match.id)
    // optimistic
    setMyPreds((ps) => prev
      ? ps.map((p) => (p.match_id === match.id ? { ...p, predicted_result: result } : p))
      : [...ps, { id: 'tmp-' + match.id, profile_id: profile.id, match_id: match.id, predicted_result: result }])
    const { data, error } = await supabase.from('predictions')
      .upsert({ profile_id: profile.id, match_id: match.id, predicted_result: result }, { onConflict: 'profile_id,match_id' })
      .select().single()
    if (error) {
      notify('Este partido ya no acepta pronósticos.', 'err')
      setMyPreds((ps) => prev ? ps.map((p) => (p.match_id === match.id ? prev : p)) : ps.filter((p) => p.match_id !== match.id))
    } else {
      setMyPreds((ps) => ps.map((p) => (p.match_id === match.id ? data : p)))
    }
  }, [profile, myPreds, notify])

  const value = useMemo(() => {
    const matchesById = Object.fromEntries(matches.map((m) => [m.id, m]))
    const predByMatch = Object.fromEntries(myPreds.map((p) => [p.match_id, p]))
    const pph = content?.points_per_hit ?? 3
    const myHits = myPreds.filter((p) => matchesById[p.match_id]?.status === 'finished' && matchesById[p.match_id]?.official_result === p.predicted_result).length
    const myFinished = myPreds.filter((p) => matchesById[p.match_id]?.status === 'finished').length
    const myRank = profile ? leaderboard.findIndex((r) => r.profile_id === profile.id) + 1 : 0
    return {
      session, profile, content, matches, teams, myPreds, leaderboard, loading, toast,
      matchesById, predByMatch, pph, myHits, myPoints: myHits * pph, myFinished, myRank,
      isAdmin: profile?.role === 'admin',
      refresh, loadPublic, loadPrivate, predict, notify, setProfile, setContent,
    }
  }, [session, profile, content, matches, teams, myPreds, leaderboard, loading, toast, refresh, loadPublic, loadPrivate, predict, notify])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
