-- ================================================================
-- TABELAS: estagios_kanban, clientes, historico_kanban,
--          interacoes_cliente, negociacoes, itens_negociacao
-- ================================================================

-- ----------------------------------------------------------------
-- Estágios do Kanban (configurável pelo admin)
-- ----------------------------------------------------------------
create table if not exists public.estagios_kanban (
  id          uuid        primary key default gen_random_uuid(),
  nome        text        not null,
  descricao   text,
  cor         text        not null default '#94a3b8',   -- hex para o card do kanban
  icone       text,                                      -- nome do ícone Lucide
  ordem       integer     not null,
  eh_final    boolean     not null default false,        -- true = estágio terminal (ganho/perdido)
  tipo_final  text        check (tipo_final in ('ganho', 'perdido') or tipo_final is null),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index estagios_ordem_idx on public.estagios_kanban(ordem);

create trigger set_updated_at_estagios
  before update on public.estagios_kanban
  for each row execute function public.handle_updated_at();

alter table public.estagios_kanban enable row level security;

create policy "Usuários autenticados podem ver estágios"
  on public.estagios_kanban for select
  to authenticated using (true);

create policy "Apenas admin pode gerenciar estágios"
  on public.estagios_kanban for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table  public.estagios_kanban          is 'Estágios configuráveis do funil de vendas (Kanban)';
comment on column public.estagios_kanban.eh_final is 'Se true, cliente neste estágio encerra o funil (ganho ou perdido)';

-- ----------------------------------------------------------------
-- Clientes
-- ----------------------------------------------------------------
create table if not exists public.clientes (
  id                uuid        primary key default gen_random_uuid(),
  nome              text        not null,
  telefone          text,                               -- formato: 5511999990000
  email             text,
  cpf_cnpj          text,
  endereco          jsonb,
  -- ex: {"cep": "01310100", "logradouro": "Av. Paulista", "numero": "1578",
  --      "complemento": "Sala 10", "bairro": "Bela Vista",
  --      "cidade": "São Paulo", "estado": "SP"}
  estagio_id        uuid        references public.estagios_kanban(id) on delete set null,
  vendedor_id       uuid        references public.usuarios(id) on delete set null,
  origem            text        check (origem in ('whatsapp', 'indicacao', 'loja_fisica', 'site', 'instagram', 'outro')),
  observacoes       text,
  tags              text[]      not null default '{}',
  valor_estimado    numeric(12, 2),                     -- valor potencial da venda
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Índices
create index clientes_vendedor_id_idx  on public.clientes(vendedor_id);
create index clientes_estagio_id_idx   on public.clientes(estagio_id);
create index clientes_telefone_idx     on public.clientes(telefone) where telefone is not null;
create index clientes_nome_idx         on public.clientes using gin(to_tsvector('portuguese', nome));

create trigger set_updated_at_clientes
  before update on public.clientes
  for each row execute function public.handle_updated_at();

alter table public.clientes enable row level security;

-- Vendedor vê apenas seus clientes
create policy "Vendedor vê seus próprios clientes"
  on public.clientes for select
  using (vendedor_id = public.current_usuario_id());

-- Admin e gerente veem todos
create policy "Admin e gerente veem todos os clientes"
  on public.clientes for select
  using (public.is_admin_ou_gerente());

-- Usuários autenticados podem criar clientes (tornam-se vendedor automaticamente)
create policy "Usuários autenticados podem criar clientes"
  on public.clientes for insert
  to authenticated
  with check (true);

-- Vendedor pode atualizar seus clientes; admin/gerente podem atualizar qualquer um
create policy "Vendedor pode atualizar seus clientes"
  on public.clientes for update
  using (
    vendedor_id = public.current_usuario_id()
    or public.is_admin_ou_gerente()
  )
  with check (
    vendedor_id = public.current_usuario_id()
    or public.is_admin_ou_gerente()
  );

create policy "Apenas admin pode deletar clientes"
  on public.clientes for delete
  using (public.is_admin());

comment on table  public.clientes               is 'Clientes no funil de vendas (Kanban)';
comment on column public.clientes.telefone      is 'Telefone no formato E.164 sem +: 5511999990000';
comment on column public.clientes.endereco      is 'JSON com campos de endereço IBGE padrão';
comment on column public.clientes.valor_estimado is 'Valor potencial estimado para o negócio';

-- ----------------------------------------------------------------
-- Histórico de movimentações no Kanban
-- Imutável — registra cada mudança de estágio
-- ----------------------------------------------------------------
create table if not exists public.historico_kanban (
  id                    uuid        primary key default gen_random_uuid(),
  cliente_id            uuid        not null references public.clientes(id) on delete cascade,
  estagio_anterior_id   uuid        references public.estagios_kanban(id) on delete set null,
  estagio_novo_id       uuid        not null references public.estagios_kanban(id) on delete restrict,
  usuario_id            uuid        references public.usuarios(id) on delete set null,
  observacao            text,
  created_at            timestamptz not null default now()
);

create index historico_kanban_cliente_id_idx on public.historico_kanban(cliente_id);
create index historico_kanban_created_at_idx on public.historico_kanban(created_at desc);

alter table public.historico_kanban enable row level security;

create policy "Admin e gerente podem ver histórico completo"
  on public.historico_kanban for select
  using (public.is_admin_ou_gerente());

create policy "Vendedor pode ver histórico dos seus clientes"
  on public.historico_kanban for select
  using (
    exists (
      select 1 from public.clientes c
      where c.id = historico_kanban.cliente_id
        and c.vendedor_id = public.current_usuario_id()
    )
  );

create policy "Usuários autenticados podem registrar movimentações"
  on public.historico_kanban for insert
  to authenticated
  with check (true);

comment on table public.historico_kanban is 'Auditoria imutável de movimentações no Kanban. Nunca deletar.';

-- ----------------------------------------------------------------
-- Interações com clientes (ligações, visitas, etc.)
-- ----------------------------------------------------------------
create table if not exists public.interacoes_cliente (
  id          uuid        primary key default gen_random_uuid(),
  cliente_id  uuid        not null references public.clientes(id) on delete cascade,
  tipo        text        not null check (tipo in ('ligacao', 'whatsapp', 'email', 'visita_loja', 'outro')),
  descricao   text        not null,
  usuario_id  uuid        references public.usuarios(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index interacoes_cliente_id_idx on public.interacoes_cliente(cliente_id);
create index interacoes_created_at_idx on public.interacoes_cliente(created_at desc);

alter table public.interacoes_cliente enable row level security;

create policy "Vendedor vê interações dos seus clientes"
  on public.interacoes_cliente for select
  using (
    exists (
      select 1 from public.clientes c
      where c.id = interacoes_cliente.cliente_id
        and c.vendedor_id = public.current_usuario_id()
    )
    or public.is_admin_ou_gerente()
  );

create policy "Usuários autenticados podem registrar interações"
  on public.interacoes_cliente for insert
  to authenticated
  with check (true);

-- ----------------------------------------------------------------
-- Negociações (deals)
-- ----------------------------------------------------------------
create table if not exists public.negociacoes (
  id                uuid        primary key default gen_random_uuid(),
  cliente_id        uuid        not null references public.clientes(id) on delete restrict,
  usuario_id        uuid        references public.usuarios(id) on delete set null,
  titulo            text,
  status            text        not null default 'aberta'
                                check (status in ('aberta', 'ganha', 'perdida', 'cancelada')),
  valor_total       numeric(12, 2) generated always as (
    -- calculado a partir dos itens, atualizado por trigger
    null::numeric
  ) stored,   -- placeholder; valor real mantido na coluna abaixo
  valor_total_manual numeric(12, 2),
  desconto_geral    numeric(5, 2) default 0,
  observacoes       text,
  motivo_perda      text,                               -- preenchido quando status = 'perdida'
  data_fechamento   date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Remove a coluna gerada e cria uma coluna real para valor_total
alter table public.negociacoes drop column valor_total;
alter table public.negociacoes add column valor_total numeric(12, 2);

create index negociacoes_cliente_id_idx on public.negociacoes(cliente_id);
create index negociacoes_usuario_id_idx on public.negociacoes(usuario_id);
create index negociacoes_status_idx     on public.negociacoes(status);

create trigger set_updated_at_negociacoes
  before update on public.negociacoes
  for each row execute function public.handle_updated_at();

alter table public.negociacoes enable row level security;

create policy "Vendedor vê suas negociações"
  on public.negociacoes for select
  using (usuario_id = public.current_usuario_id() or public.is_admin_ou_gerente());

create policy "Usuários autenticados podem criar negociações"
  on public.negociacoes for insert
  to authenticated
  with check (true);

create policy "Vendedor pode atualizar suas negociações"
  on public.negociacoes for update
  using (usuario_id = public.current_usuario_id() or public.is_admin_ou_gerente())
  with check (usuario_id = public.current_usuario_id() or public.is_admin_ou_gerente());

-- ----------------------------------------------------------------
-- Itens da Negociação
-- ----------------------------------------------------------------
create table if not exists public.itens_negociacao (
  id                    uuid           primary key default gen_random_uuid(),
  negociacao_id         uuid           not null references public.negociacoes(id) on delete cascade,
  produto_id            uuid           not null references public.produtos(id) on delete restrict,
  quantidade            integer        not null default 1 check (quantidade > 0),
  preco_unitario        numeric(12, 2) not null,
  desconto_percentual   numeric(5, 2)  not null default 0 check (desconto_percentual between 0 and 100),
  subtotal              numeric(12, 2) generated always as (
    quantidade * preco_unitario * (1 - desconto_percentual / 100)
  ) stored,
  created_at            timestamptz    not null default now()
);

create index itens_negociacao_id_idx on public.itens_negociacao(negociacao_id);
create index itens_produto_id_idx    on public.itens_negociacao(produto_id);

alter table public.itens_negociacao enable row level security;

create policy "Mesma regra da negociação pai"
  on public.itens_negociacao for all
  using (
    exists (
      select 1 from public.negociacoes n
      where n.id = itens_negociacao.negociacao_id
        and (n.usuario_id = public.current_usuario_id() or public.is_admin_ou_gerente())
    )
  )
  with check (
    exists (
      select 1 from public.negociacoes n
      where n.id = itens_negociacao.negociacao_id
        and (n.usuario_id = public.current_usuario_id() or public.is_admin_ou_gerente())
    )
  );

-- Trigger para atualizar valor_total na negociação quando itens mudam
create or replace function public.atualizar_valor_negociacao()
returns trigger
language plpgsql
security definer
as $$
declare
  v_negociacao_id uuid;
begin
  v_negociacao_id := coalesce(new.negociacao_id, old.negociacao_id);

  update public.negociacoes
  set valor_total = (
    select coalesce(sum(subtotal), 0)
    from public.itens_negociacao
    where negociacao_id = v_negociacao_id
  )
  where id = v_negociacao_id;

  return coalesce(new, old);
end;
$$;

create trigger atualizar_valor_negociacao_trigger
  after insert or update or delete on public.itens_negociacao
  for each row execute function public.atualizar_valor_negociacao();

comment on table public.negociacoes            is 'Negociações/deals vinculados a clientes';
comment on table public.itens_negociacao       is 'Produtos incluídos em uma negociação';
comment on column public.itens_negociacao.subtotal is 'Gerado: quantidade * preco_unitario * (1 - desconto/100)';
