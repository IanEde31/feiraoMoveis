-- ================================================================
-- FUNÇÕES UTILITÁRIAS
-- Base para todas as outras migrations
-- ================================================================

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Função que retorna o clerk_id do usuário autenticado via JWT
-- Supabase recebe o token JWT do Clerk (template "supabase")
-- e injeta as claims em request.jwt.claims
create or replace function public.clerk_user_id()
returns text
language sql stable
security definer
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )
$$;

-- Função que retorna o UUID interno do usuário atual
create or replace function public.current_usuario_id()
returns uuid
language sql stable
security definer
as $$
  select id
  from public.usuarios
  where clerk_id = public.clerk_user_id()
$$;

-- Função que retorna o papel (role) do usuário atual
create or replace function public.current_usuario_papel()
returns text
language sql stable
security definer
as $$
  select papel
  from public.usuarios
  where clerk_id = public.clerk_user_id()
$$;

-- Função que verifica se o usuário atual é admin ou gerente
create or replace function public.is_admin_ou_gerente()
returns boolean
language sql stable
security definer
as $$
  select coalesce(public.current_usuario_papel() in ('admin', 'gerente'), false)
$$;

-- Função que verifica se o usuário atual é admin
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
as $$
  select coalesce(public.current_usuario_papel() = 'admin', false)
$$;
