---
name: nova-migration
description: Cria um arquivo de migration SQL para o Supabase com timestamp e estrutura correta
argument-hint: "[descricao-da-migration]"
allowed-tools: Read, Write, Bash(date *)
---

# Criar Nova Migration Supabase

Gere um arquivo de migration SQL seguindo o padrão do Supabase.

## Argumento
- `$ARGUMENTS`: descrição em snake_case (ex: `criar_tabela_produtos`)

## Localização
`supabase/migrations/[timestamp]_$ARGUMENTS.sql`

O timestamp é gerado no formato `YYYYMMDDHHMMSS`.

## Estrutura do arquivo SQL

```sql
-- Migration: $ARGUMENTS
-- Criado em: [data atual]

-- =============================================
-- TABELA
-- =============================================
create table if not exists public.[tabela] (
  id uuid primary key default gen_random_uuid(),
  -- campos específicos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table public.[tabela] enable row level security;

-- Política: usuários autenticados podem ler
create policy "Usuários autenticados podem visualizar [tabela]"
  on public.[tabela] for select
  to authenticated
  using (true);

-- Política: somente o próprio usuário pode inserir/atualizar
-- (ajustar conforme a regra de negócio)

-- =============================================
-- INDEXES
-- =============================================
-- create index [tabela]_[campo]_idx on public.[tabela]([campo]);

-- =============================================
-- TRIGGER: atualizar updated_at automaticamente
-- =============================================
create trigger set_updated_at
  before update on public.[tabela]
  for each row
  execute function public.handle_updated_at();
```

## Regras
- Sempre usar `if not exists` / `if exists` para idempotência
- Sempre habilitar RLS em tabelas com dados de negócio
- Sempre incluir `created_at` e `updated_at` com default
- IDs como `uuid` com `gen_random_uuid()`
- Comentários em Português-BR
- Após criar a migration, lembrar de rodar `/gerar-tipos` para atualizar os tipos TypeScript
