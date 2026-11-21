import { NavLink, Outlet } from 'react-router-dom'
import { Home, ListOrdered, BarChart3, User, Settings, LogOut } from 'lucide-react'
import { useData } from '../lib/data'
import { supabase } from '../lib/supabase'
import { Avatar } from './ui'

export default function Layout() {
  const { profile, isAdmin, content, myPoints } = useData()
  const nav = [
    { to: '/inicio', label: 'Inicio', icon: Home },
    { to: '/partidos', label: 'Partidos', icon: ListOrdered },
    { to: '/tabla', label: 'Tabla General', short: 'Tabla', icon: BarChart3 },
    { to: '/perfil', label: 'Mi Perfil', short: 'Perfil', icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Settings }] : []),
  ]
  const name = profile?.full_name || profile?.alias || profile?.email
  const cls = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`

  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          {content?.logo_url && <img src={content.logo_url} className="h-8 w-8 rounded-full object-cover" alt="" />}
          <span className="text-sm font-black">Quiniela <span className="text-primary">Liga MX</span></span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => <NavLink key={n.to} to={n.to} className={cls}><n.icon className="h-4 w-4" />{n.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <Avatar name={name} url={profile?.avatar_url} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{name}</p>
            <p className="text-[11px] font-bold text-primary">{myPoints} pts</p>
          </div>
          <button title="Cerrar sesión" onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          {content?.logo_url && <img src={content.logo_url} className="h-7 w-7 rounded-full object-cover" alt="" />}
          <span className="text-sm font-black">Quiniela <span className="text-primary">Liga MX</span></span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground"><LogOut className="h-4 w-4" /></button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-sidebar/95 backdrop-blur md:hidden">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <n.icon className="h-5 w-5" />{n.short || n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
