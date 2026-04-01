-- ================================================================
-- TABELAS: categorias_produto, produtos, movimentos_estoque
-- ================================================================

-- ----------------------------------------------------------------
-- Categorias de produto
-- ----------------------------------------------------------------
create table if not exists public.categorias_produto (
  id          uuid        primary key default gen_random_uuid(),
  nome        text        not null,
  descricao   text,
  created_at  timestamptz not null default now()
);

alter table public.categorias_produto enable row level security;

create policy "Usuários autenticados podem ver categorias"
  on public.categorias_produto for select
  to authenticated
  using (true);

create policy "Admin e gerente podem gerenciar categorias"
  on public.categorias_produto for all
  using (public.is_admin_ou_gerente())
  with check (public.is_admin_ou_gerente());

comment on table public.categorias_produto is 'Categorias para organizar o catálogo de produtos';

-- ----------------------------------------------------------------
-- Produtos
-- ----------------------------------------------------------------
create table if not exists public.produtos (
  id                 uuid           primary key default gen_random_uuid(),
  nome               text           not null,
  descricao          text,
  descricao_curta    text,
  sku                text           unique,             -- código interno
  preco_venda        numeric(12, 2) not null check (preco_venda >= 0),
  preco_custo        numeric(12, 2) check (preco_custo >= 0),
  margem_lucro       numeric(5, 2)  generated always as (
    case
      when preco_custo > 0
      then round(((preco_venda - preco_custo) / preco_custo) * 100, 2)
      else null
    end
  ) stored,
  estoque_atual      integer        not null default 0 check (estoque_atual >= 0),
  estoque_minimo     integer        not null default 0 check (estoque_minimo >= 0),
  -- estoque_atual < estoque_minimo → alerta de estoque baixo
  categoria_id       uuid           references public.categorias_produto(id) on delete set null,
  imagens            text[]         not null default '{}', -- URLs no Supabase Storage
  dimensoes          jsonb,
  -- ex: {"largura": 200, "altura": 85, "profundidade": 95, "peso": 120, "unidade": "cm"}
  material           text,
  fabricante         text,
  ativo              boolean        not null default true,
  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now()
);

-- Índices
create index produtos_categoria_id_idx on public.produtos(categoria_id);
create index produtos_ativo_idx        on public.produtos(ativo);
create index produtos_sku_idx          on public.produtos(sku) where sku is not null;
create index produtos_nome_idx         on public.produtos using gin(to_tsvector('portuguese', nome));

-- Trigger updated_at
create trigger set_updated_at_produtos
  before update on public.produtos
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.produtos enable row level security;

create policy "Usuários autenticados podem ver produtos ativos"
  on public.produtos for select
  to authenticated
  using (ativo = true);

create policy "Admin e gerente podem ver todos os produtos"
  on public.produtos for select
  using (public.is_admin_ou_gerente());

create policy "Admin e gerente podem criar produtos"
  on public.produtos for insert
  with check (public.is_admin_ou_gerente());

create policy "Admin e gerente podem atualizar produtos"
  on public.produtos for update
  using (public.is_admin_ou_gerente())
  with check (public.is_admin_ou_gerente());

create policy "Apenas admin pode deletar produtos"
  on public.produtos for delete
  using (public.is_admin());

comment on table  public.produtos              is 'Catálogo completo de produtos com controle de estoque';
comment on column public.produtos.sku          is 'Código interno do produto (Stock Keeping Unit)';
comment on column public.produtos.margem_lucro is 'Margem gerada: ((preco_venda - preco_custo) / preco_custo) * 100';
comment on column public.produtos.imagens      is 'Array de URLs públicas no Supabase Storage (bucket: produtos)';
comment on column public.produtos.dimensoes    is 'JSON: {largura, altura, profundidade, peso, unidade}';

-- ----------------------------------------------------------------
-- Movimentos de estoque
-- Imutável — nunca deletar registros, apenas inserir
-- ----------------------------------------------------------------
create table if not exists public.movimentos_estoque (
  id                   uuid        primary key default gen_random_uuid(),
  produto_id           uuid        not null references public.produtos(id) on delete restrict,
  tipo                 text        not null check (tipo in ('entrada', 'saida', 'ajuste', 'reserva', 'devolucao')),
  quantidade           integer     not null,              -- positivo = entrada, negativo = saída
  estoque_anterior     integer     not null,
  estoque_posterior    integer     not null,
  motivo               text,
  referencia_id        uuid,                              -- id da negociação, se aplicável
  referencia_tipo      text,                              -- 'negociacao', 'ajuste_manual', etc.
  usuario_id           uuid        references public.usuarios(id) on delete set null,
  created_at           timestamptz not null default now()
);

-- Índices
create index movimentos_produto_id_idx on public.movimentos_estoque(produto_id);
create index movimentos_tipo_idx       on public.movimentos_estoque(tipo);
create index movimentos_created_at_idx on public.movimentos_estoque(created_at desc);

-- RLS
alter table public.movimentos_estoque enable row level security;

create policy "Admin e gerente podem ver movimentos"
  on public.movimentos_estoque for select
  using (public.is_admin_ou_gerente());

create policy "Usuários autenticados podem inserir movimentos"
  on public.movimentos_estoque for insert
  to authenticated
  with check (true);

-- Proibir deleção/atualização (registro imutável de auditoria)
-- Sem policy de DELETE/UPDATE → bloqueado por padrão

comment on table  public.movimentos_estoque             is 'Registro imutável de todas as entradas/saídas de estoque';
comment on column public.movimentos_estoque.quantidade  is 'Positivo = entrada de estoque. Negativo = saída.';
comment on column public.movimentos_estoque.referencia_id is 'UUID da negociação ou outro documento que gerou o movimento';
