import { useEffect, useMemo, useState } from 'react'
import { Search, CalendarDays, Radio, CheckCircle2, Clock, Trophy } from 'lucide-react'
import { useData } from '../lib/data'
import { currentJornada, dayKey, fmtDay, isOpen, jornadaInfo, jornadaRange, matchState } from '../lib/utils'
import { Countdown, useNow } from '../components/ui'
import MatchCard from '../components/MatchCard'

export default function Matches() {
  const { matches, predByMatch, pph } = useData()
  const now = useNow(30000)
  const jornadas = useMemo(() => [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b), [matches])
  const cj = currentJornada(matches)
  const [sel, setSel] = useState(cj)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  useEffect(() => setSel(cj), [cj])

  const jm = matches.filter((m) => m.jornada === sel)
  const info = jornadaInfo(sel, matches)
  const jStatus = (j) => {
    const ms = matches.filter((m) => m.jornada === j)
    return ms.every((m) => m.status === 'finished') ? 'finished' : 'active'
  }
  const shown = jm
    .filter((m) => filter === 'all' || matchState(m, now) === filter)
    .filter((m) => !q || (m.local_team + ' ' + m.away_team).toLowerCase().includes(q.toLowerCase()))
  const groups = shown.reduce((acc, m) => { (acc[dayKey(m.kickoff)] ||= []).push(m); return acc }, {})
  const open = jm.filter((m) => isOpen(m, now))
  const predicted = jm.filter((m) => predByMatch[m.id]).length
  const hits = jm.filter((m) => m.status === 'finished' && predByMatch[m.id]?.predicted_result === m.official_result).length
  const live = jm.filter((m) => matchState(m, now) === 'live').length

  return (
    <div className="space-y-5">
      <section className="card grid gap-6 p-6 md:grid-cols-[1fr_300px] md:items-center">
        <div>
          <span className="chip bg-primary/15 text-primary">{info.stage === 'groups' ? 'Temporada Regular' : 'Liguilla'}</span>
          <h1 className="mt-2 h-title">{info.stage === 'groups' ? '⚽' : '🏆'} {info.label}</h1>
          <p className="text-xs font-semibold text-muted-foreground">{jornadaRange(jm)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{jm.length} partidos · Haz tus pronósticos antes de cada partido.</p>
        </div>
        <div className="rounded-2xl border border-border bg-black/20 p-4">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground"><Clock className="h-3.5 w-3.5" />Próximo cierre</p>
          <Countdown target={open[0]?.kickoff || jm[0]?.kickoff} />
        </div>
      </section>

      <div className="scrollbar-thin -mx-1 flex gap-2.5 overflow-x-auto px-1 py-2">
        {jornadas.map((j) => {
          const s = sel === j, c = cj === j, f = jStatus(j) === 'finished'
          return (
            <button key={j} onClick={() => setSel(j)}
              className={`min-w-[68px] flex-shrink-0 rounded-xl border p-2 text-center transition ${s ? 'scale-105 border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50'}`}>
              <p className="whitespace-nowrap text-sm font-black">{jornadaInfo(j, matches).short}</p>
              <p className={`text-[9px] font-bold uppercase ${s ? '' : f ? 'text-primary' : 'text-muted-foreground'}`}>{c ? 'Actual' : f ? '✓ Final' : 'Próxima'}</p>
            </button>
          )
        })}
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[[CalendarDays, jm.length, 'Partidos'], [Radio, live, 'En vivo'], [CheckCircle2, predicted, 'Pronosticados'], [Clock, open.filter((m) => !predByMatch[m.id]).length, 'Pendientes'], [Trophy, `${hits * pph}`, 'Puntos jornada']].map(([I, v, l]) => (
          <div key={l} className="card p-3 text-center">
            <I className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-xl font-black">{v}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{l}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="input pl-9" placeholder="Buscar equipo..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[['all', 'Todos'], ['pending', 'Pendientes'], ['live', 'En curso'], ['finished', 'Finalizados']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{l}</button>
          ))}
        </div>
      </div>

      {Object.entries(groups).map(([k, ms]) => (
        <section key={k}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black">📅 {fmtDay(ms[0].kickoff)} <span className="text-xs font-semibold text-muted-foreground">· {ms.length} partido{ms.length > 1 ? 's' : ''}</span></h3>
          <div className="grid gap-3 md:grid-cols-2">{ms.map((m) => <MatchCard key={m.id} match={m} now={now} />)}</div>
        </section>
      ))}
      {!shown.length && <p className="card p-8 text-center text-sm text-muted-foreground">No hay partidos con este filtro.</p>}
    </div>
  )
}
