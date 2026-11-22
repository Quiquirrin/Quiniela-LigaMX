-- Liguilla de ida y vuelta: cada partido se pronostica L/E/V a 90 minutos,
-- así que el empate se permite también fuera de la temporada regular.
-- Se conserva el cierre a la hora de inicio del partido.
drop policy if exists "predictions insert own open" on public.predictions;
create policy "predictions insert own open" on public.predictions
  for insert with check (
    profile_id = public.my_profile_id()
    and exists (select 1 from public.matches m
                where m.id = predictions.match_id and m.status = 'pending' and m.kickoff > now())
  );

drop policy if exists "predictions update own open" on public.predictions;
create policy "predictions update own open" on public.predictions
  for update using (profile_id = public.my_profile_id())
  with check (
    profile_id = public.my_profile_id()
    and exists (select 1 from public.matches m
                where m.id = predictions.match_id and m.status = 'pending' and m.kickoff > now())
  );
