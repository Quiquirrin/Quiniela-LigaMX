import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base './' = rutas relativas, para que funcione en GitHub Pages (usuario.github.io/Quiniela-LigaMX/)
// o en cualquier otro hosting estático. La app usa rutas con #, así que no hace falta más.
export default defineConfig({
  base: './',
  plugins: [react()],
})
