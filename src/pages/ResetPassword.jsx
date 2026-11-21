import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()
  async function submit(e) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setMsg(error.message)
    else nav('/inicio')
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-7">
        <h1 className="mb-4 text-xl font-black">Nueva contraseña</h1>
        <input className="input mb-3" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" />
        {msg && <p className="mb-3 text-xs text-red-300">{msg}</p>}
        <button className="btn-primary w-full">Guardar</button>
      </form>
    </div>
  )
}
