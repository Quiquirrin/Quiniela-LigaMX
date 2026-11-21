import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Pencil } from 'lucide-react'
import { useData } from '../lib/data'
import { supabase, SUPABASE_URL } from '../lib/supabase'
import { fmt, level, streaks } from '../lib/utils'
import { Avatar } from '../components/ui'

export default function Profile() {
  const { profile, session, myPreds, matchesById, myPoints, myHits, myRank, leaderboard, setProfile, notify, loadPrivate } = useData()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.full_name || '')
  const [alias, setAlias] = useState(profile?.alias || '')
  const [busy, setBusy] = useState(false)
  const file = useRef()
  if (!profile) return null

  const lv = level(myPoints)
  const pct = Math.min(100, ((myPoints - lv.min) / (lv.max - lv.min)) * 100)
  const st = streaks(myPreds, matchesById)
  const dist = ['local', 'draw', 'away'].map((k) => myPreds.filter((p) => p.predicted_result === k).length)
  const totalP = myPreds.length || 1
  const finishedCount = myPreds.filter((p) => matchesById[p.match_id]?.status === 'finished').length
  const display = profile.full_name || profile.alias

  async function save() {
    setBusy(true)
    const { data, error } = await supabase.from('profiles').update({ full_name: name, alias: alias || null }).eq('id', profile.id).select().single()
    setBusy(false)
    if (error) return notify('No se pudo guardar.', 'err')
    setProfile(data); setEditing(false); notify('Perfil actualizado.'); loadPrivate()
  }

  async function upload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const path = `avatars/${session.user.id}-${Date.now()}.${f.name.split('.').pop()}`
    const { error } = await supabase.storage.from('media').upload(path, f)
    if (error) return notify('No se pudo subir la foto.', 'err')
    const url = `${SUPABASE_URL}/storage/v1/object/public/media/${path}`
    const { data } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id).select().single()
    setProfile(data); notify('Foto actualizada.'); loadPrivate()
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="relative w-fit">
          <Avatar name={display} url={profile.avatar_url} size={96} />
          <button onClick={() => file.current.click()} className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground"><Camera className="h-4 w-4" /></button>
          <input ref={file} type="file" accept="image/*" hidden onChange={upload} />
        </div>
        <div className="flex-1">
          {editing ? (
            <div className="grid max-w-md gap-2">
              <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Alias (opcional)</label><input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} /></div>
              <div className="flex gap-2"><button disabled={busy} onClick={save} className="btn-primary">Guardar</button><button onClick={() => setEditing(false)} className="btn-ghost">Cancelar</button></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2"><h1 className="text-2xl font-black">{display}</h1><button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button></div>
              <span className="chip bg-primary/15 text-primary">{lv.name}</span>
              <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-xs text-muted-foreground">Desde {fmt(profile.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-black/20 p-5 text-center">
          <p className="text-[11px] font-black uppercase text-muted-foreground">Posición actual</p>
          <p className="text-4xl font-black text-primary">{myRank ? `${myRank}°` : '-'}</p>
          <p className="text-xs text-muted-foreground">de {leaderboard.length} jugadores</p>
          <Link to="/tabla" className="mt-2 inline-block text-xs font-bold text-primary">Ver tabla general</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[myPoints, 'Puntos totales', 'pts'], [myHits, 'Aciertos totales', 'correctos'], [myPreds.length, 'Partidos jugados', 'pronósticos'], [finishedCount ? (myPoints / finishedCount).toFixed(2) : '0.00', 'Promedio', 'pts/partido']].map(([v, l, s]) => (
          <div key={l} className="card p-4"><p className="text-[10px] font-black uppercase text-muted-foreground">{l}</p><p className="text-2xl font-black">{v}</p><p className="text-[11px] text-muted-foreground">{s}</p></div>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-[11px] font-black uppercase text-muted-foreground">Nivel y progreso</p>
          <p className="mt-2 text-xl font-black text-primary">{lv.name}</p>
          <p className="text-xs text-muted-foreground">{myPoints} / {lv.max} pts</p>
          <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-primary" style={{ width: pct + '%' }} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{myPoints >= 300 ? '¡Nivel máximo!' : `Te faltan ${lv.max - myPoints} pts para el siguiente nivel`}</p>
        </div>
        <div className="card p-5">
          <p className="mb-3 text-[11px] font-black uppercase text-muted-foreground">Estadísticas rápidas</p>
          {['Locales', 'Empates', 'Visitantes'].map((l, i) => (
            <div key={l} className="mb-2">
              <div className="flex justify-between text-sm"><span>{l}</span><span className="text-muted-foreground">{dist[i]} · {Math.round((dist[i] / totalP) * 100)}%</span></div>
              <div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-primary" style={{ width: (dist[i] / totalP) * 100 + '%' }} /></div>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-black uppercase text-muted-foreground">Mejor racha</p>
          <p className="text-3xl font-black">{st.best} <span className="text-sm font-semibold text-muted-foreground">aciertos consecutivos</span></p>
          <p className="mt-3 text-[11px] font-black uppercase text-muted-foreground">Racha actual: {st.current}</p>
          <div className="mt-2 flex gap-1.5">
            {st.last.map((ok, i) => <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${ok ? 'bg-primary text-primary-foreground' : 'bg-red-500/20 text-red-400'}`}>{ok ? '✓' : '✗'}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
