-- ================================================================
-- TABELA: usuarios
-- Espelho dos usuários do Clerk. Populada via webhook Clerk.
-- Permite RLS baseado em papéis (admin, gerente, vendedor, operador).
-- ================================================================

create table if not exists public.usuarios (
  id            uuid        primary key default gen_random_uuid(),
  clerk_id      text        unique not null,        -- ID do usuário no Clerk (user_xxxx)
  email         text        not null,
  nome          text,
  sobrenome     text,
  nome_completo text generated always as (
    coalesce(trim(coalesce(nome, '') || ' ' || coalesce(sobrenome, '')), email)
  ) stored,
  avatar_url    text,
  papel         text        not null default 'vendedor'
                            check (papel in ('admin', 'gerente', 'vendedor', 'operador')),
  -- admin    → acesso total (gestão de usuários, configurações, todos os dados)
  -- gerente  → acesso total aos dados, sem gestão de usuários
  -- vendedor → acesso aos próprios clientes/negociações, produtos (leitura), WhatsApp
  -- operador → acesso ao WhatsApp (leitura/envio), produtos (leitura)
  ativo         boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices
create index usuarios_clerk_id_idx on public.usuarios(clerk_id);
create index usuarios_email_idx    on public.usuarios(email);
create index usuarios_papel_idx    on public.usuarios(papel);

-- Trigger updated_at
create trigger set_updated_at_usuarios
  before update on public.usuarios
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.usuarios enable row level security;

-- Qualquer usuário autenticado pode ver o próprio perfil
create policy "Usuário pode ver seu próprio perfil"
  on public.usuarios for select
  using (clerk_id = public.clerk_user_id());

-- Admin e gerente podem ver todos os usuários
create policy "Admin e gerente podem ver todos os usuários"
  on public.usuarios for select
  using (public.is_admin_ou_gerente());

-- Apenas admin pode inserir/atualizar/deletar usuários
-- (criação via webhook do Clerk — usa service role, bypassa RLS)
create policy "Apenas admin pode atualizar papel de usuário"
  on public.usuarios for update
  using (public.is_admin())
  with check (public.is_admin());

-- Comentários
comment on table  public.usuarios                 is 'Espelho dos usuários do Clerk. Sincronizado via webhook.';
comment on column public.usuarios.clerk_id        is 'ID do usuário no Clerk. Formato: user_xxxx';
comment on column public.usuarios.papel           is 'Papel do usuário: admin, gerente, vendedor ou operador';
comment on column public.usuarios.nome_completo   is 'Coluna gerada: nome + sobrenome ou email';
