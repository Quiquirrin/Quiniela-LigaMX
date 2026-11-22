import { useState } from 'react'
import { BarChart3, Check, X as XIcon } from 'lucide-react'
import { useData } from '../lib/data'
import { firstLeg, fmtShort, isOpen, matchState, RESULT_LABEL, RESULT_SHORT, STAGES } from '../lib/utils'
import { TeamLogo, Modal } from './ui'
import { supabase } from '../lib/supabase'

const STATE_CHIP = {
  pending: ['Pendiente', 'bg-white/10 text-muted-foreground'],
  live: ['En curso', 'bg-red-500/20 text-red-400'],
  finished: ['Finalizado', 'bg-primary/15 text-primary'],
}

export default function MatchCard({ match, now }) {
  const { predByMatch, predict, matches } = useData()
  const pred = predByMatch[match.id]
  const st = matchState(match, now)
  const open = isOpen(match, now)
  const [stats, setStats] = useState(null)
  const knockout = match.stage !== 'groups'
  const ida = knockout ? firstLeg(match, matches) : null

  const correct = st === 'finished' && pred && pred.predicted_result === match.official_result

  async function showStats() {
    const { data } = await supabase.rpc('get_match_distribution', { p_match: match.id })
    setStats(data?.[0] || { local: 0, draw: 0, away: 0 })
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">{fmtShort(match.kickoff)}</span>
        <span className={`chip ${STATE_CHIP[st][1]}`}>{STATE_CHIP[st][0]}</span>
      </div>
      {knockout && (
        <p className="-mt-1 mb-3 text-center text-[11px] font-bold uppercase text-primary">
          {STAGES[match.stage]} · {ida ? 'Vuelta' : 'Ida'}
          {ida?.status === 'finished' && <span className="ml-1 font-semibold normal-case text-muted-foreground">· Ida: {ida.local_team_short || ida.local_team} {ida.local_score}-{ida.away_score} {ida.away_team_short || ida.away_team}</span>}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <Team name={match.local_team} flag={match.local_team_flag} />
        <div className="min-w-[64px] text-center">
          {match.local_score != null && match.away_score != null && st !== 'pending'
            ? <p className="text-2xl font-black tabular-nums">{match.local_score} - {match.away_score}</p>
            : <p className="text-sm font-black text-muted-foreground">VS</p>}
        </div>
        <Team name={match.away_team} flag={match.away_team_flag} />
      </div>

      {open ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['local', 'draw', 'away'].map((r) => {
            const sel = pred?.predicted_result === r
            return (
              <button key={r} onClick={() => predict(match, r)}
                className={`rounded-xl border py-2.5 text-center transition ${sel ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white/5 hover:border-primary/60'}`}>
                <span className="block text-base font-black">{RESULT_SHORT[r]}</span>
                <span className="block text-[10px] font-semibold opacity-80">{RESULT_LABEL[r]}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          {pred ? (
            <span className="flex items-center gap-2">
              Tu pronóstico: <b>{RESULT_LABEL[pred.predicted_result]}</b>
              {st === 'finished' && (correct
                ? <span className="flex items-center gap-1 font-bold text-primary"><Check className="h-3.5 w-3.5" />Acierto</span>
                : <span className="flex items-center gap-1 font-bold text-red-400"><XIcon className="h-3.5 w-3.5" />Fallo</span>)}
            </span>
          ) : <span className="text-muted-foreground">Sin pronóstico registrado</span>}
          <button onClick={showStats} className="flex items-center gap-1 font-bold text-primary hover:underline">
            <BarChart3 className="h-3.5 w-3.5" /> Estadísticas
          </button>
        </div>
      )}

      <Modal open={!!stats} onClose={() => setStats(null)} title={`${match.local_team} vs ${match.away_team}`}>
        {stats && <Distribution stats={stats} match={match} />}
      </Modal>
    </div>
  )
}

function Team({ name, flag }) {
  return (
    <div className="flex w-[38%] flex-col items-center gap-1.5 text-center">
      <TeamLogo src={flag} name={name} size={40} />
      <span className="text-sm font-bold leading-tight">{name}</span>
    </div>
  )
}

function Distribution({ stats, match }) {
  const total = stats.local + stats.draw + stats.away || 1
  const rows = [['local', match.local_team], ['draw', 'Empate'], ['away', match.away_team]]
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Cómo pronosticaron los participantes</p>
      {rows.map(([k, label]) => {
        const pct = Math.round((stats[k] / total) * 100)
        return (
          <div key={k}>
            <div className="mb-1 flex justify-between text-sm"><span className="font-bold">{label}</span><span className="tabular-nums text-muted-foreground">{stats[k]} · {pct}%</span></div>
            <div className="h-2.5 rounded-full bg-white/5"><div className={`h-2.5 rounded-full ${match.official_result === k ? 'bg-primary' : 'bg-white/30'}`} style={{ width: pct + '%' }} /></div>
          </div>
        )
      })}
    </div>
  )
}
