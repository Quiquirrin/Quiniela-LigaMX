# Quiniela Liga MX (versión independiente)

App de quiniela en React + Vite + Tailwind, con base de datos y login en Supabase
(proyecto `quiniela-ligamx`, id `ptmspriwtxutctziyqyk`). Ya no depende de Base44.

## Qué incluye
- Página de inicio pública (banner, cómo funciona, premios).
- Login con correo y contraseña, registro y recuperación de contraseña.
- Inicio: jornada actual, pronósticos L/E/V, cuenta regresiva, líderes y tus números.
- Partidos: las 17 jornadas, filtros, búsqueda y estadísticas de cada partido (después de que empieza).
- Tabla general: ranking total o por jornada, y tus aciertos por jornada.
- Perfil: nombre, foto, nivel, racha y distribución L/E/V.
- Admin: resultados rápidos (escribes el marcador y se recalcula todo), partidos, equipos, usuarios y contenido.

## Reglas (iguales a la versión anterior)
- 3 puntos por acierto (configurable en Admin › Contenido).
- Cada partido se cierra a la hora de inicio; la base de datos lo hace cumplir, no solo la pantalla.
- Liguilla (Cuartos, Semis y Final) de ida y vuelta: cada partido se pronostica L/E/V a 90 minutos (sí se permite empate), 3 puntos por acierto.
  Admin › Partidos › "Serie de liguilla" crea la ida (casa del peor posicionado) y la vuelta (casa del mejor posicionado)
  en las jornadas 18-19 (Cuartos), 20-21 (Semis) y 22-23 (Final).
- Los pronósticos de los demás solo se ven cuando el partido ya empezó.

## Usuarios migrados
Los 17 usuarios y sus 1,870 pronósticos ya están en la base de datos. Cada persona entra en
"Regístrate" con **el mismo correo** que usaba antes y recupera automáticamente su historial.

## Correr en tu computadora
```
npm install
npm run dev
```

## Publicar
`npm run build` genera la carpeta `dist/`, que es un sitio estático. Usa rutas con `#`,
así que no necesita configuración extra del servidor. Funciona en Netlify, Vercel,
Cloudflare Pages o GitHub Pages.

## Variables (opcionales)
La URL y la clave pública de Supabase ya vienen en `src/lib/supabase.js`. Para cambiarlas:
`VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`.
