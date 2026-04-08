-- Habilita Realtime para tabelas WhatsApp (mensagens, contatos e conexões)
-- Sem isso, INSERT/UPDATE não chegam ao frontend via Supabase Realtime.

do $$
begin
  begin
    alter publication supabase_realtime add table public.mensagens_whatsapp;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.contatos_whatsapp;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.conexoes_whatsapp;
  exception when duplicate_object then null; end;
end $$;

alter table public.mensagens_whatsapp replica identity full;
alter table public.contatos_whatsapp  replica identity full;
alter table public.conexoes_whatsapp  replica identity full;
