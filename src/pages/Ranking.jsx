import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Users, CalendarDays, Target, TrendingUp, Search } from 'lucide-react'
import { useData } from '../lib/data'
import { supabase } from '../lib/supabase'
import { Avatar, StatCard } from '../components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const { leaderboard, profile, matches, content, myRank } = useData()
  const [q, setQ] = useState('')
  const [jStats, setJStats] = useState([])
  const [jFilter, setJFilter] = useState('all')
  useEffect(() => { supabase.rpc('get_jornada_stats').then(({ data }) => setJStats(data || [])) }, [])

  const jornadas = [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b)
  const doneJ = jornadas.filter((j) => matches.filter((m) => m.jornada === j).every((m) => m.status === 'finished')).length
  const total = content?.total_jornadas || jornadas.length
  const pph = content?.points_per_hit ?? 3

  const rows = useMemo(() => {
    let list = leaderboard
    if (jFilter !== 'all') {
      const j = +jFilter
      list = leaderboard.map((r) => {
        const s = jStats.find((x) => x.profile_id === r.profile_id && x.jornada === j)
        return { ...r, hits: s?.hits || 0, points: (s?.hits || 0) * pph, predictions: s?.predictions || 0 }
      }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    }
    return list.map((r, i) => ({ ...r, pos: i + 1 }))
  }, [leaderboard, jStats, jFilter, pph])

  const filtered = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()))
  const totalHits = leaderboard.reduce((a, r) => a + r.hits, 0)
  const avg = leaderboard.length ? (totalHits / leaderboard.length).toFixed(1) : 0
  const me = leaderboard.find((r) => r.profile_id === profile?.id)
  const mine = jornadas.map((j) => jStats.find((x) => x.profile_id === profile?.id && x.jornada === j)?.hits || 0)
  const maxHits = Math.max(1, ...mine)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title flex items-center gap-2"><BarChart3 className="h-7 w-7 text-primary" />Tabla General</h1>
        <p className="text-sm text-muted-foreground">Ranking general de la quiniela</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} value={leaderboard.length} label="Participantes" sub="jugadores registrados" />
        <StatCard icon={CalendarDays} value={`${doneJ} / ${total}`} label="Jornadas" sub={`${Math.round((doneJ / total) * 100)}% del torneo`} />
        <StatCard icon={Target} value={totalHits} label="Aciertos totales" sub={`prom. ${avg} por jugador`} />
        <StatCard icon={TrendingUp} value={avg} label="Promedio" sub="aciertos por jugador" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row">
            <select className="input md:w-48" value={jFilter} onChange={(e) => setJFilter(e.target.value)}>
              <option value="all">General</option>
              {jornadas.map((j) => <option key={j} value={j}>Jornada {j}</option>)}
            </select>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="input pl-9" placeholder="Buscar jugador..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">#</th><th className="px-2 py-3">Jugador</th><th className="px-2 py-3 text-right">Pts</th><th className="px-2 py-3 text-right">Aciertos</th><th className="px-4 py-3 text-right">Pronósticos</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.profile_id} className={`border-t border-border ${r.profile_id === profile?.id ? 'bg-primary/10' : ''}`}>
                    <td className="px-4 py-3 font-black">{MEDALS[r.pos - 1] || r.pos}</td>
                    <td className="px-2 py-3"><div className="flex items-center gap-2.5"><Avatar name={r.name} url={r.avatar_url} size={28} /><span className="font-semibold">{r.name}</span></div></td>
                    <td className="px-2 py-3 text-right font-black text-primary">{r.points}</td>
                    <td className="px-2 py-3 text-right">{r.hits}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.predictions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-black uppercase text-primary">Mi posición</p>
            <p className="mt-2 text-4xl font-black">{myRank ? `${myRank}°` : '-'}</p>
            <p className="text-xs text-muted-foreground">de {leaderboard.length} jugadores</p>
            <p className="mt-3 text-lg font-black">{me?.points || 0} pts</p>
            <p className="text-xs text-muted-foreground">{me?.hits || 0} aciertos</p>
          </div>
          <div className="card p-5">
            <p className="mb-4 text-[11px] font-black uppercase text-muted-foreground">Mis aciertos por jornada</p>
            <div className="flex h-32 items-end gap-1">
              {mine.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{v || ''}</span>
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${(v / maxHits) * 90}px`, minHeight: 2 }} />
                  <span className="text-[8px] text-muted-foreground">{jornadas[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
