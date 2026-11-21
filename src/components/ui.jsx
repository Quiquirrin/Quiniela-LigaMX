import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import { initials } from '../lib/utils'
import { useData } from '../lib/data'

export function Avatar({ name, url, size = 36, className = '' }) {
  const s = { width: size, height: size, fontSize: size * 0.4 }
  if (url) return <img src={url} alt="" style={s} className={`rounded-full object-cover ${className}`} />
  return (
    <div style={s} className={`flex items-center justify-center rounded-full bg-primary/15 font-black text-primary ${className}`}>
      {initials(name)}
    </div>
  )
}

export function TeamLogo({ src, name, size = 36 }) {
  const [err, setErr] = useState(false)
  if (!src || err) return <Avatar name={name} size={size} />
  return <img src={src} alt={name} onError={() => setErr(true)} style={{ width: size, height: size }} className="object-contain" />
}

export function StatCard({ icon: Icon, value, label, sub, color = 'text-primary' }) {
  return (
    <div className="card p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-bold">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t) }, [ms])
  return now
}

export function Countdown({ target, compact = false }) {
  const now = useNow()
  if (!target) return null
  const n = Math.max(0, new Date(target) - now)
  const d = Math.floor(n / 864e5), h = Math.floor((n % 864e5) / 36e5), m = Math.floor((n % 36e5) / 6e4), s = Math.floor((n % 6e4) / 1e3)
  const pad = (x) => String(x).padStart(2, '0')
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-1.5">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground">Cierra en</span>
        {n === 0 ? <span className="text-xs font-black text-red-400">Cerrada</span>
          : <span className="text-xs font-black tabular-nums">{d > 0 && `${d}d `}{pad(h)}h {pad(m)}m {pad(s)}s</span>}
      </div>
    )
  }
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[[d, 'días'], [h, 'horas'], [m, 'min']].map(([v, l]) => (
          <div key={l} className="rounded-xl bg-white/5 py-3">
            <p className="text-2xl font-black tabular-nums">{v}</p>
            <p className="text-[10px] uppercase text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {n === 0 && <p className="mt-3 text-center text-xs font-bold text-red-400">Jornada cerrada</p>}
    </div>
  )
}

export function Toast() {
  const { toast } = useData()
  if (!toast) return null
  return (
    <div className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-bold shadow-xl md:bottom-6 ${toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground'}`}>
      {toast.msg}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4" onClick={onClose}>
      <div className={`card max-h-[92vh] w-full overflow-y-auto p-5 ${wide ? 'md:max-w-2xl' : 'md:max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
}
