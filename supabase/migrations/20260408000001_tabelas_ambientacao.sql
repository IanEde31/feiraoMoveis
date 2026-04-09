-- Migration: tabelas_ambientacao
-- Criado em: 2026-04-08

-- =============================================
-- TABELA: ambientacoes
-- Cada linha é uma ambientação gerada para um cliente
-- =============================================
create table if not exists public.ambientacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,

  -- Imagens (paths dentro do bucket `ambientacoes`)
  ambiente_path text not null,           -- foto original enviada pelo vendedor
  resultado_path text not null,          -- imagem gerada pela IA
  miniatura_path text,                   -- thumbnail opcional (gerar no upload)

  -- Contexto da geração
  produtos_ids uuid[] not null default '{}',
  produtos_snapshot jsonb not null default '[]'::jsonb,
  -- snapshot leve: [{ id, nome, preco_venda, imagem }] — preserva nomes
  -- mesmo se o produto for editado/deletado depois.

  provedor text,                         -- 'openai' | 'replicate' | etc.
  modelo text,                           -- ex.: 'gpt-image-1'
  prompt text,                           -- prompt usado, se aplicável
  metadata jsonb default '{}'::jsonb,    -- payload extra do provedor

  status text not null default 'pronto'
    check (status in ('processando', 'pronto', 'erro')),
  mensagem_erro text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists ambientacoes_cliente_id_idx
  on public.ambientacoes (cliente_id, created_at desc);

create index if not exists ambientacoes_usuario_id_idx
  on public.ambientacoes (usuario_id);

-- =============================================
-- TRIGGER: atualizar updated_at automaticamente
-- Reutiliza função criada em 20260401000001_funcoes_utilitarias.sql
-- =============================================
create trigger ambientacoes_set_updated_at
  before update on public.ambientacoes
  for each row execute function public.handle_updated_at();

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table public.ambientacoes enable row level security;

create policy "leitura autenticada"
  on public.ambientacoes for select
  to authenticated using (true);

create policy "insert autenticada"
  on public.ambientacoes for insert
  to authenticated with check (true);

create policy "update autenticada"
  on public.ambientacoes for update
  to authenticated using (true);

create policy "delete autenticada"
  on public.ambientacoes for delete
  to authenticated using (true);
