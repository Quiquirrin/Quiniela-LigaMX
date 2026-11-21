import { Link } from 'react-router-dom'
import { Trophy, Target, TrendingUp, Clock, Send, CalendarDays } from 'lucide-react'
import { useData } from '../lib/data'
import { currentJornada, isOpen, jornadaRange } from '../lib/utils'
import { Avatar, Countdown, StatCard, useNow } from '../components/ui'
import MatchCard from '../components/MatchCard'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Dashboard() {
  const { profile, content, matches, predByMatch, myPoints, myHits, myFinished, myRank, leaderboard } = useData()
  const now = useNow(30000)
  const cj = currentJornada(matches)
  const jm = matches.filter((m) => m.jornada === cj)
  const total = content?.total_jornadas || 17
  const finishedJ = [...new Set(matches.map((m) => m.jornada))].filter((j) => matches.filter((m) => m.jornada === j).every((m) => m.status === 'finished')).length
  const openMatches = matches.filter((m) => isOpen(m, now))
  const pending = openMatches.filter((m) => !predByMatch[m.id]).length
  const nextClose = openMatches[0]?.kickoff
  const name = profile?.full_name || profile?.alias || ''
  const accuracy = myFinished ? Math.round((myHits / myFinished) * 100) : 0

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
          <div>
            <span className="chip bg-primary/15 text-primary">⚡ {content?.tournament_name || 'Torneo'}</span>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Hola, {name} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bienvenido al {content?.tournament_name}</p>
            <p className="mt-3 text-lg font-black text-primary">Jornada {cj}</p>
            <p className="text-sm text-muted-foreground">Haz tus pronósticos y demuestra que eres el mejor experto.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#jornada" className="btn-primary"><Send className="h-4 w-4" />Pronosticar ahora</a>
              <Link to="/partidos" className="btn-ghost"><CalendarDays className="h-4 w-4" />Ver calendario</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-black/20 p-5">
            <p className="text-[11px] font-bold uppercase text-muted-foreground">Progreso del torneo</p>
            <p className="mt-1 text-2xl font-black">Jornada {cj} <span className="text-sm text-muted-foreground">de {total}</span></p>
            <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (finishedJ / total) * 100)}%` }} /></div>
            <p className="mt-1 text-[11px] text-muted-foreground">{finishedJ} de {total} jornadas terminadas</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Trophy} value={myPoints} label="Mis Puntos" sub="pts totales" color="text-yellow-400" />
        <StatCard icon={Target} value={myHits} label="Aciertos" sub={`de ${myFinished} posibles`} />
        <StatCard icon={TrendingUp} value={myRank ? `${myRank}°` : '-'} label="Mi Posición" sub={`de ${leaderboard.length} jugadores`} color="text-sky-400" />
        <StatCard icon={Clock} value={pending} label="Pendientes" sub="por pronosticar" color="text-violet-400" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section id="jornada" className="scroll-mt-20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black uppercase">Jornada {cj}</h2>
              <p className="text-xs text-muted-foreground">{jornadaRange(jm)}</p>
            </div>
            {nextClose && <Countdown target={nextClose} compact />}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {jm.map((m) => <MatchCard key={m.id} match={m} now={now} />)}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 font-black">Líderes</h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((r, i) => (
                <div key={r.profile_id} className={`flex items-center gap-3 ${r.profile_id === profile?.id ? 'text-primary' : ''}`}>
                  <span className="w-6 text-center text-sm font-black">{MEDALS[i] || i + 1}</span>
                  <Avatar name={r.name} url={r.avatar_url} size={28} />
                  <span className="flex-1 truncate text-sm font-semibold">{r.name}</span>
                  <span className="text-sm font-black text-primary">{r.points}</span>
                </div>
              ))}
            </div>
            <Link to="/tabla" className="mt-4 block text-xs font-bold text-primary hover:underline">Ver tabla completa →</Link>
          </div>
          <div className="card p-5">
            <h3 className="mb-4 font-black">Mis Logros</h3>
            <div className="space-y-3 text-sm">
              <p>🎯 <b>Precisión {accuracy}%</b> <span className="text-muted-foreground">· {myHits} aciertos</span></p>
              <p>💎 <b>{myPoints} puntos</b> <span className="text-muted-foreground">· {myPoints >= 100 ? 'Sumando fuerte' : 'Vamos por más'}</span></p>
              <p>📋 <b>{Object.keys(predByMatch).length} pronósticos</b> <span className="text-muted-foreground">· en el torneo</span></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
