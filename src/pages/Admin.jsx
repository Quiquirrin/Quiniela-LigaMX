import { useEffect, useMemo, useState } from 'react'
import { Settings, Plus, Pencil, Trash2, Save, ListOrdered, Shield, Users, FileText, Zap } from 'lucide-react'
import { useData } from '../lib/data'
import { supabase, SUPABASE_URL } from '../lib/supabase'
import { currentJornada, fmtShort, resultFromScore, RESULT_LABEL, STAGES } from '../lib/utils'
import { Modal, TeamLogo, Avatar } from '../components/ui'

const TABS = [['results', 'Resultados', Zap], ['matches', 'Partidos', ListOrdered], ['teams', 'Equipos', Shield], ['users', 'Usuarios', Users], ['content', 'Contenido', FileText]]

export default function Admin() {
  const [tab, setTab] = useState('results')
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-title flex items-center gap-2"><Settings className="h-7 w-7 text-primary" />Panel de Administración</h1>
        <p className="text-sm text-muted-foreground">Gestiona partidos, equipos, resultados y contenido</p>
      </div>
      <div className="scrollbar-thin flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${tab === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><I className="h-3.5 w-3.5" />{l}</button>
        ))}
      </div>
      {tab === 'results' && <QuickResults />}
      {tab === 'matches' && <MatchesAdmin />}
      {tab === 'teams' && <TeamsAdmin />}
      {tab === 'users' && <UsersAdmin />}
      {tab === 'content' && <ContentAdmin />}
    </div>
  )
}

/* ---------- Resultados rápidos ---------- */
function QuickResults() {
  const { matches, loadPublic, loadPrivate, notify } = useData()
  const js = [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b)
  const [j, setJ] = useState(currentJornada(matches))
  const list = matches.filter((m) => m.jornada === j)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-muted-foreground">Jornada</label>
        <select className="input w-40" value={j} onChange={(e) => setJ(+e.target.value)}>{js.map((x) => <option key={x} value={x}>Jornada {x}</option>)}</select>
      </div>
      <p className="text-xs text-muted-foreground">Escribe el marcador y guarda: el partido queda como finalizado y los puntos se recalculan solos.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((m) => <ResultRow key={m.id} m={m} onSaved={() => { loadPublic(); loadPrivate(); notify('Resultado guardado. Ranking actualizado.') }} />)}
      </div>
    </div>
  )
}

function ResultRow({ m, onSaved }) {
  const [l, setL] = useState(m.local_score ?? '')
  const [a, setA] = useState(m.away_score ?? '')
  const [busy, setBusy] = useState(false)
  const { notify } = useData()
  async function save(finish = true) {
    const res = resultFromScore(l, a)
    if (finish && !res) return notify('Escribe ambos marcadores.', 'err')
    setBusy(true)
    const patch = finish ? { local_score: +l, away_score: +a, official_result: res, status: 'finished' }
      : { local_score: null, away_score: null, official_result: null, status: 'pending' }
    const { error } = await supabase.from('matches').update(patch).eq('id', m.id)
    setBusy(false)
    if (error) return notify(error.message, 'err')
    if (!finish) { setL(''); setA('') }
    onSaved()
  }
  return (
    <div className={`card p-4 ${m.status === 'finished' ? 'border-primary/30' : ''}`}>
      <div className="mb-2 flex justify-between text-[11px] text-muted-foreground"><span>{fmtShort(m.kickoff)}</span>{m.status === 'finished' && <span className="font-bold text-primary">Final · {RESULT_LABEL[m.official_result]}</span>}</div>
      <div className="flex items-center gap-2">
        <span className="flex flex-1 items-center justify-end gap-2 text-right text-sm font-bold">{m.local_team}<TeamLogo src={m.local_team_flag} name={m.local_team} size={24} /></span>
        <input className="input w-12 px-1 text-center text-lg font-black" inputMode="numeric" value={l} onChange={(e) => setL(e.target.value.replace(/\D/g, ''))} />
        <span>-</span>
        <input className="input w-12 px-1 text-center text-lg font-black" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ''))} />
        <span className="flex flex-1 items-center gap-2 text-sm font-bold"><TeamLogo src={m.away_team_flag} name={m.away_team} size={24} />{m.away_team}</span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {m.status === 'finished' && <button disabled={busy} onClick={() => save(false)} className="btn-ghost py-1.5 text-xs">Quitar resultado</button>}
        <button disabled={busy} onClick={() => save(true)} className="btn-primary py-1.5 text-xs"><Save className="h-3.5 w-3.5" />Guardar</button>
      </div>
    </div>
  )
}

/* ---------- Partidos ---------- */
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(new Date(iso).getTime() - 6 * 3600e3) // CDMX = UTC-6
  return d.toISOString().slice(0, 16)
}
const fromLocalInput = (v) => new Date(v + ':00-06:00').toISOString()

function MatchesAdmin() {
  const { matches, teams, loadPublic, notify } = useData()
  const js = [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b)
  const [j, setJ] = useState('all')
  const [edit, setEdit] = useState(null)
  const list = matches.filter((m) => j === 'all' || m.jornada === +j)

  async function del(m) {
    if (!confirm(`¿Borrar ${m.local_team} vs ${m.away_team}? También se borran sus pronósticos. No se puede deshacer.`)) return
    const { error } = await supabase.from('matches').delete().eq('id', m.id)
    if (error) return notify(error.message, 'err')
    notify('Partido eliminado.'); loadPublic()
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <p className="font-black">Partidos ({matches.length})</p>
        <div className="flex gap-2">
          <select className="input w-40" value={j} onChange={(e) => setJ(e.target.value)}><option value="all">Todas</option>{js.map((x) => <option key={x} value={x}>Jornada {x}</option>)}</select>
          <button onClick={() => setEdit({ jornada: js[js.length - 1] || 1, stage: 'groups', status: 'pending' })} className="btn-primary"><Plus className="h-4 w-4" />Partido</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase text-muted-foreground"><tr><th className="px-4 py-2">J</th><th className="px-2 py-2">Partido</th><th className="px-2 py-2">Fase</th><th className="px-2 py-2">Fecha (CDMX)</th><th className="px-2 py-2">Resultado</th><th className="px-4 py-2 text-right">Acciones</th></tr></thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-2.5 font-bold">{m.jornada}</td>
                <td className="px-2 py-2.5 font-semibold">{m.local_team} vs {m.away_team}</td>
                <td className="px-2 py-2.5"><span className="chip bg-primary/10 text-primary">{STAGES[m.stage] || m.stage}</span></td>
                <td className="px-2 py-2.5 text-muted-foreground">{fmtShort(m.kickoff)}</td>
                <td className="px-2 py-2.5">{m.status === 'finished' ? `${m.local_score}-${m.away_score} · ${RESULT_LABEL[m.official_result]}` : <span className="text-muted-foreground">Pendiente</span>}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => setEdit(m)} className="mr-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(m)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar partido' : 'Nuevo partido'}>
        {edit && <MatchForm m={edit} teams={teams} onDone={() => { setEdit(null); loadPublic(); notify('Partido guardado.') }} />}
      </Modal>
    </div>
  )
}

function MatchForm({ m, teams, onDone }) {
  const [f, setF] = useState({ ...m, kickoff_local: toLocalInput(m.kickoff) })
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const team = (name) => teams.find((t) => t.name === name)

  async function save(e) {
    e.preventDefault()
    const lt = team(f.local_team), at = team(f.away_team)
    if (!lt || !at || !f.kickoff_local) return setErr('Elige ambos equipos y la fecha.')
    const res = f.status === 'finished' ? resultFromScore(f.local_score, f.away_score) : null
    if (f.status === 'finished' && !res) return setErr('Para marcarlo finalizado escribe el marcador.')
    const row = {
      jornada: +f.jornada, stage: f.stage, venue: f.venue || null, city: f.city || null,
      local_team: lt.name, local_team_short: lt.short_name, local_team_flag: lt.flag_url,
      away_team: at.name, away_team_short: at.short_name, away_team_flag: at.flag_url,
      kickoff: fromLocalInput(f.kickoff_local), status: f.status,
      local_score: f.status === 'finished' ? +f.local_score : null,
      away_score: f.status === 'finished' ? +f.away_score : null,
      official_result: res,
    }
    const q = m.id ? supabase.from('matches').update(row).eq('id', m.id) : supabase.from('matches').insert(row)
    const { error } = await q
    if (error) return setErr(error.message)
    onDone()
  }

  return (
    <form onSubmit={save} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Local</label><select className="input" value={f.local_team || ''} onChange={set('local_team')}><option value="">—</option>{teams.map((t) => <option key={t.id}>{t.name}</option>)}</select></div>
        <div><label className="label">Visitante</label><select className="input" value={f.away_team || ''} onChange={set('away_team')}><option value="">—</option>{teams.map((t) => <option key={t.id}>{t.name}</option>)}</select></div>
        <div><label className="label">Jornada</label><input className="input" type="number" min="1" value={f.jornada} onChange={set('jornada')} /></div>
        <div><label className="label">Fase</label><select className="input" value={f.stage} onChange={set('stage')}>{Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="col-span-2"><label className="label">Fecha y hora (hora del centro de México)</label><input className="input" type="datetime-local" value={f.kickoff_local} onChange={set('kickoff_local')} /></div>
        <div><label className="label">Estadio</label><input className="input" value={f.venue || ''} onChange={set('venue')} /></div>
        <div><label className="label">Estado</label><select className="input" value={f.status} onChange={set('status')}><option value="pending">Pendiente</option><option value="finished">Finalizado</option></select></div>
        {f.status === 'finished' && <>
          <div><label className="label">Goles local</label><input className="input" type="number" min="0" value={f.local_score ?? ''} onChange={set('local_score')} /></div>
          <div><label className="label">Goles visitante</label><input className="input" type="number" min="0" value={f.away_score ?? ''} onChange={set('away_score')} /></div>
        </>}
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
      <button className="btn-primary">Guardar</button>
    </form>
  )
}

/* ---------- Equipos ---------- */
function TeamsAdmin() {
  const { teams, loadPublic, notify } = useData()
  const [edit, setEdit] = useState(null)
  async function save(e) {
    e.preventDefault()
    const row = { name: edit.name, short_name: edit.short_name, flag_url: edit.flag_url || null }
    const { error } = edit.id ? await supabase.from('teams').update(row).eq('id', edit.id) : await supabase.from('teams').insert(row)
    if (error) return notify(error.message, 'err')
    setEdit(null); loadPublic(); notify('Equipo guardado.')
  }
  async function del(t) {
    if (!confirm(`¿Borrar ${t.name}? Los partidos existentes no se borran.`)) return
    await supabase.from('teams').delete().eq('id', t.id); loadPublic()
  }
  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between"><p className="font-black">Equipos ({teams.length})</p><button onClick={() => setEdit({})} className="btn-primary"><Plus className="h-4 w-4" />Equipo</button></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <TeamLogo src={t.flag_url} name={t.name} size={32} />
            <div className="flex-1"><p className="text-sm font-bold">{t.name}</p><p className="text-[11px] text-muted-foreground">{t.short_name}</p></div>
            <button onClick={() => setEdit(t)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => del(t)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar equipo' : 'Nuevo equipo'}>
        {edit && (
          <form onSubmit={save} className="grid gap-3">
            <div><label className="label">Nombre</label><input className="input" required value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><label className="label">Abreviatura</label><input className="input" maxLength={4} value={edit.short_name || ''} onChange={(e) => setEdit({ ...edit, short_name: e.target.value.toUpperCase() })} /></div>
            <div><label className="label">URL del escudo</label><input className="input" value={edit.flag_url || ''} onChange={(e) => setEdit({ ...edit, flag_url: e.target.value })} /></div>
            <button className="btn-primary">Guardar</button>
          </form>
        )}
      </Modal>
    </div>
  )
}

/* ---------- Usuarios ---------- */
function UsersAdmin() {
  const { leaderboard, profile: me, notify } = useData()
  const [users, setUsers] = useState([])
  const load = () => supabase.from('profiles').select('*').order('full_name').then(({ data }) => setUsers(data || []))
  useEffect(() => { load() }, [])
  const pts = useMemo(() => Object.fromEntries(leaderboard.map((r) => [r.profile_id, r])), [leaderboard])

  async function toggleAdmin(u) {
    const role = u.role === 'admin' ? 'user' : 'admin'
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id)
    if (error) return notify(error.message, 'err')
    load(); notify(role === 'admin' ? 'Ahora es administrador.' : 'Ya no es administrador.')
  }
  async function del(u) {
    if (!confirm(`¿Eliminar a ${u.full_name || u.email} y todos sus pronósticos? No se puede deshacer.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', u.id)
    if (error) return notify(error.message, 'err')
    load()
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border p-4"><p className="font-black">Usuarios ({users.length})</p><p className="text-xs text-muted-foreground">"Sin cuenta" = migrado de la versión anterior y aún no se registra en la nueva app.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase text-muted-foreground"><tr><th className="px-4 py-2">Usuario</th><th className="px-2 py-2">Correo</th><th className="px-2 py-2 text-right">Pts</th><th className="px-2 py-2">Estado</th><th className="px-4 py-2 text-right">Acciones</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar name={u.full_name || u.alias} url={u.avatar_url} size={26} /><span className="font-semibold">{u.full_name || u.alias}</span>{u.role === 'admin' && <span className="chip bg-primary/15 text-primary">Admin</span>}</div></td>
                <td className="px-2 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="px-2 py-2.5 text-right font-bold text-primary">{pts[u.id]?.points ?? 0}</td>
                <td className="px-2 py-2.5">{u.auth_id ? <span className="text-xs text-primary">Activo</span> : <span className="text-xs text-muted-foreground">Sin cuenta</span>}</td>
                <td className="px-4 py-2.5 text-right">
                  {u.id !== me.id && <>
                    <button onClick={() => toggleAdmin(u)} className="btn-ghost mr-2 px-2 py-1 text-[11px]">{u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}</button>
                    <button onClick={() => del(u)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Contenido ---------- */
function ContentAdmin() {
  const { content, setContent, notify } = useData()
  const [f, setF] = useState(content || {})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save() {
    const { id, updated_at, ...row } = f
    for (const k of ['total_jornadas', 'points_per_hit', 'prize_1', 'prize_2', 'prize_3']) row[k] = +row[k]
    const { data, error } = await supabase.from('app_content').update({ ...row, updated_at: new Date().toISOString() }).eq('id', 1).select().single()
    if (error) return notify(error.message, 'err')
    setContent(data); notify('Contenido guardado.')
  }
  async function upload(key, file) {
    if (!file) return
    const path = `site/${key}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) return notify(error.message, 'err')
    setF((x) => ({ ...x, [key]: `${SUPABASE_URL}/storage/v1/object/public/media/${path}` }))
  }
  return (
    <div className="card grid gap-4 p-5 md:grid-cols-2">
      <div><label className="label">Título</label><input className="input" value={f.hero_title || ''} onChange={set('hero_title')} /></div>
      <div><label className="label">Nombre del torneo</label><input className="input" value={f.tournament_name || ''} onChange={set('tournament_name')} /></div>
      <div className="md:col-span-2"><label className="label">Descripción</label><textarea className="input" rows={2} value={f.hero_description || ''} onChange={set('hero_description')} /></div>
      <div className="md:col-span-2"><label className="label">Nota del banco / cooperación</label><textarea className="input" rows={2} value={f.bank_note || ''} onChange={set('bank_note')} /></div>
      <div><label className="label">Total de jornadas</label><input className="input" type="number" value={f.total_jornadas ?? 17} onChange={set('total_jornadas')} /></div>
      <div><label className="label">Puntos por acierto</label><input className="input" type="number" value={f.points_per_hit ?? 3} onChange={set('points_per_hit')} /></div>
      <div className="grid grid-cols-3 gap-2 md:col-span-2">
        {['prize_1', 'prize_2', 'prize_3'].map((k, i) => <div key={k}><label className="label">Premio {i + 1}° (%)</label><input className="input" type="number" value={f[k] ?? ''} onChange={set(k)} /></div>)}
      </div>
      {[['logo_url', 'Logo'], ['banner_url', 'Banner']].map(([k, l]) => (
        <div key={k}>
          <label className="label">{l}</label>
          {f[k] && <img src={f[k]} alt="" className="mb-2 h-24 rounded-xl border border-border object-cover" />}
          <input type="file" accept="image/*" className="text-xs" onChange={(e) => upload(k, e.target.files?.[0])} />
        </div>
      ))}
      <div className="md:col-span-2"><button onClick={save} className="btn-primary"><Save className="h-4 w-4" />Guardar contenido</button></div>
    </div>
  )
}
