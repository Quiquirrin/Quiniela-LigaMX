import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/data'

export default function Login() {
  const { session, content } = useData()
  const [mode, setMode] = useState('in') // in | up | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  if (session) return <Navigate to="/inicio" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const redirect = window.location.origin + window.location.pathname
    let res
    if (mode === 'in') res = await supabase.auth.signInWithPassword({ email, password })
    else if (mode === 'up') res = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: redirect } })
    else res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
    setBusy(false)
    if (res.error) {
      const m = res.error.message
      setMsg({ err: true, text: /Invalid login/i.test(m) ? 'Correo o contraseña incorrectos.' : /already registered/i.test(m) ? 'Ese correo ya tiene cuenta. Inicia sesión.' : /Password should/i.test(m) ? 'La contraseña debe tener al menos 6 caracteres.' : m })
    } else if (mode === 'up' && !res.data.session) {
      setMsg({ text: 'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.' })
    } else if (mode === 'forgot') {
      setMsg({ text: 'Te enviamos un enlace para restablecer tu contraseña.' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-7">
        {content?.logo_url && <img src={content.logo_url} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />}
        <h1 className="text-center text-2xl font-black">{mode === 'up' ? 'Crea tu cuenta' : mode === 'forgot' ? 'Recupera tu contraseña' : 'Bienvenido a Quiniela Liga MX'}</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          {mode === 'up' ? 'Si ya jugabas, usa el mismo correo y recuperas tu historial.' : mode === 'forgot' ? 'Te mandamos un enlace a tu correo.' : 'Inicia sesión para continuar'}
        </p>

        {mode === 'up' && (
          <Field icon={User} label="Nombre"><input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required /></Field>
        )}
        <Field icon={Mail} label="Correo"><input className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required /></Field>
        {mode !== 'forgot' && (
          <Field icon={Lock} label="Contraseña"><input className="input pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></Field>
        )}

        {msg && <p className={`mb-3 rounded-lg p-2.5 text-xs font-semibold ${msg.err ? 'bg-red-500/15 text-red-300' : 'bg-primary/15 text-primary'}`}>{msg.text}</p>}

        <button disabled={busy} className="btn-primary w-full">{busy ? '...' : mode === 'up' ? 'Crear cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Iniciar sesión'}</button>

        <div className="mt-5 space-y-2 text-center text-xs text-muted-foreground">
          {mode === 'in' && <>
            <button type="button" onClick={() => setMode('forgot')} className="hover:text-foreground">¿Olvidaste tu contraseña?</button>
            <p>¿No tienes cuenta? <button type="button" onClick={() => setMode('up')} className="font-bold text-primary">Regístrate</button></p>
          </>}
          {mode !== 'in' && <button type="button" onClick={() => setMode('in')} className="font-bold text-primary">Volver a iniciar sesión</button>}
        </div>
      </form>
    </div>
  )
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  )
}
