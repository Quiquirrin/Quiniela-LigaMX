export const TZ = 'America/Mexico_City'

export const RESULT_LABEL = { local: 'Local', draw: 'Empate', away: 'Visitante' }
export const RESULT_SHORT = { local: 'L', draw: 'E', away: 'V' }

export const STAGES = {
  groups: 'Temporada Regular',
  playin: 'Play-In',
  quarter: 'Cuartos',
  semi: 'Semifinal',
  final: 'Final',
}

export function fmt(date, opts) {
  return new Intl.DateTimeFormat('es-MX', { timeZone: TZ, ...opts }).format(new Date(date))
}
export const fmtTime = (d) => fmt(d, { hour: '2-digit', minute: '2-digit', hour12: false })
export const fmtDay = (d) => { const s = fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }); return s[0].toUpperCase() + s.slice(1) }
export const fmtShort = (d) => fmt(d, { day: 'numeric', month: 'short' }) + ' · ' + fmtTime(d)
export const dayKey = (d) => fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' })

export function jornadaRange(matches) {
  if (!matches.length) return ''
  const ds = matches.map((m) => new Date(m.kickoff)).sort((a, b) => a - b)
  const a = ds[0], b = ds[ds.length - 1]
  const da = fmt(a, { day: 'numeric' }), db = fmt(b, { day: 'numeric' })
  const ma = fmt(a, { month: 'long' }), mb = fmt(b, { month: 'long' })
  const y = fmt(b, { year: 'numeric' })
  return (ma === mb ? `${da} - ${db} de ${mb} ${y}` : `${da} ${ma} - ${db} ${mb} ${y}`).toUpperCase()
}

/** pending | live | finished — "live" when kickoff passed but no result yet */
export function matchState(m, now = new Date()) {
  if (m.status === 'finished') return 'finished'
  if (m.status === 'live' || new Date(m.kickoff) <= now) return 'live'
  return 'pending'
}
export const isOpen = (m, now = new Date()) => m.status === 'pending' && new Date(m.kickoff) > now

export function resultFromScore(l, a) {
  if (l == null || a == null || l === '' || a === '') return null
  l = +l; a = +a
  return l > a ? 'local' : l < a ? 'away' : 'draw'
}

export function level(points) {
  if (points >= 150) return { name: 'Leyenda', min: 150, max: 300 }
  if (points >= 50) return { name: 'Experto', min: 50, max: 150 }
  if (points >= 10) return { name: 'Intermedio', min: 10, max: 50 }
  return { name: 'Principiante', min: 0, max: 10 }
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

/** Current jornada: first one with a match not finished; otherwise the last one */
export function currentJornada(matches) {
  const js = [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b)
  for (const j of js) if (matches.some((m) => m.jornada === j && m.status !== 'finished')) return j
  return js[js.length - 1] || 1
}

export function streaks(preds, matchesById) {
  // preds sorted by kickoff over finished matches
  const seq = preds
    .map((p) => ({ p, m: matchesById[p.match_id] }))
    .filter((x) => x.m && x.m.status === 'finished')
    .sort((a, b) => new Date(a.m.kickoff) - new Date(b.m.kickoff))
    .map((x) => x.p.predicted_result === x.m.official_result)
  let best = 0, cur = 0
  for (const ok of seq) { cur = ok ? cur + 1 : 0; best = Math.max(best, cur) }
  return { best, current: cur, last: seq.slice(-5) }
}
