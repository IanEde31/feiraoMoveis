-- ================================================================
-- Suporte a Baileys como provedor WhatsApp
-- ================================================================
alter table public.conexoes_whatsapp drop constraint if exists conexoes_whatsapp_provedor_check;
alter table public.conexoes_whatsapp add constraint conexoes_whatsapp_provedor_check
  check (provedor in ('uazapi','evolution','meta','baileys'));

-- Baileys não usa base_url/instancia da mesma forma que provedores HTTP
alter table public.conexoes_whatsapp alter column base_url drop not null;
alter table public.conexoes_whatsapp alter column instancia drop not null;

-- Caminho da pasta de sessão Baileys
alter table public.conexoes_whatsapp add column if not exists session_path text;
