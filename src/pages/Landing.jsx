import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useData } from '../lib/data'

export default function Landing() {
  const { content, session } = useData()
  const c = content || {}
  const cta = session ? '/inicio' : '/login'
  const steps = [
    ['Elige la jornada', 'Selecciona la jornada que quieres jugar y realiza tus predicciones.'],
    ['Haz tus predicciones', 'Elige entre: Gana Local, Empate o Gana Visitante en cada partido.'],
    ['Suma puntos', 'Acumula puntos por cada acierto y mejora tu posición en el ranking.'],
    ['Sé el mejor experto', 'Compite con todos los participantes y llega a la cima.'],
  ]
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(201,227,58,0.08),transparent_60%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        {c.logo_url ? <img src={c.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="font-black text-primary">MX</span>}
        <Link to={cta} className="rounded-full p-2 hover:bg-white/10"><User className="h-5 w-5" /></Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-12 text-center">
        {c.banner_url && <img src={c.banner_url} alt={c.hero_title} className="mx-auto mb-8 w-full max-w-xl rounded-3xl border border-border shadow-2xl" />}
        <h1 className="text-3xl font-black uppercase leading-tight md:text-5xl">
          Bienvenido a<br /><span className="text-primary">{c.hero_title || 'Quiniela Liga MX'}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{c.hero_description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={cta} className="btn-primary px-6 py-3 uppercase">Ir al panel</Link>
          <a href="#como" className="btn-ghost px-6 py-3 uppercase">Cómo funciona</a>
        </div>
      </section>

      <section id="como" className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="mb-8 text-center text-2xl font-black uppercase">¿Cómo funciona?</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <div key={t} className="card p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">{i + 1}</span>
              <h3 className="font-black">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        {c.bank_note && <p className="card mx-auto mt-8 max-w-3xl p-5 text-center text-sm">💰 {c.bank_note}</p>}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-center text-2xl font-black uppercase">🏆 Premios</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">Distribución del total recaudado</p>
        <div className="grid grid-cols-3 items-end gap-3">
          {[['🥈', '2do lugar', c.prize_2 ?? 30, 'h-36'], ['🥇', '1er lugar', c.prize_1 ?? 50, 'h-44'], ['🥉', '3er lugar', c.prize_3 ?? 20, 'h-32']].map(([e, l, p, h]) => (
            <div key={l} className={`card flex ${h} flex-col items-center justify-center ${l.startsWith('1') ? 'border-primary/60' : ''}`}>
              <span className="text-3xl">{e}</span>
              <span className="mt-1 text-[11px] font-black uppercase text-muted-foreground">{l}</span>
              <span className="text-3xl font-black text-primary">{p}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 text-center">
        <h2 className="text-2xl font-black uppercase">¿Listo para competir?</h2>
        <p className="mt-2 text-muted-foreground">Regístrate y haz tus pronósticos del {c.tournament_name || 'torneo'}.</p>
        <Link to={cta} className="btn-primary mt-6 px-6 py-3 uppercase">Empezar</Link>
      </section>
      <footer className="py-8 text-center text-xs text-muted-foreground">Quiniela Liga MX — Hecho con ⚽ para fans del fútbol mexicano</footer>
    </div>
  )
}
