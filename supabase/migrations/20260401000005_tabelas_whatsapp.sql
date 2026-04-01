-- ================================================================
-- TABELAS: conexoes_whatsapp, contatos_whatsapp, mensagens_whatsapp
-- Suporte a múltiplos provedores: Uazapi, Evolution API, Meta oficial
-- ================================================================

-- ----------------------------------------------------------------
-- Conexões WhatsApp (instâncias)
-- ----------------------------------------------------------------
create table if not exists public.conexoes_whatsapp (
  id                      uuid        primary key default gen_random_uuid(),
  nome                    text        not null,           -- ex: "Vendas Principal", "Atendimento"
  provedor                text        not null check (provedor in ('uazapi', 'evolution', 'meta')),
  instancia               text        not null,           -- nome/ID da instância no provedor
  base_url                text        not null,           -- URL base da API do provedor
  api_key                 text,
  -- ATENÇÃO: armazenar api_key criptografada na aplicação antes de salvar.
  -- Nunca expor em logs ou respostas de API públicas.
  numero_telefone         text,                           -- ex: 5511999990000
  status                  text        not null default 'desconectado'
                                      check (status in (
                                        'conectado',
                                        'desconectado',
                                        'aguardando_qr',
                                        'erro'
                                      )),
  qr_code                 text,                           -- base64 do QR code para conexão
  qr_expiracao            timestamptz,                    -- quando o QR code expira
  webhook_url             text,                           -- URL onde este provedor envia eventos
  webhook_secret          text,                           -- secret para validar webhooks recebidos
  usuario_responsavel_id  uuid        references public.usuarios(id) on delete set null,
  ativo                   boolean     not null default true,
  ultima_atividade        timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index conexoes_provedor_idx on public.conexoes_whatsapp(provedor);
create index conexoes_status_idx   on public.conexoes_whatsapp(status);
create index conexoes_ativo_idx    on public.conexoes_whatsapp(ativo);

create trigger set_updated_at_conexoes
  before update on public.conexoes_whatsapp
  for each row execute function public.handle_updated_at();

alter table public.conexoes_whatsapp enable row level security;

-- Todos os autenticados podem ver conexões ativas (para o chat)
create policy "Usuários autenticados veem conexões ativas"
  on public.conexoes_whatsapp for select
  to authenticated
  using (ativo = true);

-- Apenas admin e gerente gerenciam conexões
create policy "Admin e gerente gerenciam conexões"
  on public.conexoes_whatsapp for all
  using (public.is_admin_ou_gerente())
  with check (public.is_admin_ou_gerente());

comment on table  public.conexoes_whatsapp            is 'Instâncias de WhatsApp conectadas (multi-provedor)';
comment on column public.conexoes_whatsapp.api_key    is 'Chave da API — deve ser criptografada na aplicação antes de salvar';
comment on column public.conexoes_whatsapp.qr_code    is 'Base64 do QR code. Expira conforme qr_expiracao.';
comment on column public.conexoes_whatsapp.instancia  is 'Identificador da instância no provedor (nome ou ID)';

-- ----------------------------------------------------------------
-- Contatos WhatsApp
-- Um contato por instância (chave: conexao_id + jid)
-- ----------------------------------------------------------------
create table if not exists public.contatos_whatsapp (
  id               uuid        primary key default gen_random_uuid(),
  conexao_id       uuid        not null references public.conexoes_whatsapp(id) on delete cascade,
  jid              text        not null,
  -- JID = WhatsApp ID. Formato: 5511999990000@s.whatsapp.net (individual)
  --                              120363xxxxxxx@g.us (grupo)
  nome             text,                                 -- nome salvo nos contatos
  nome_push        text,                                 -- nome de exibição do WhatsApp
  numero_telefone  text        not null,
  avatar_url       text,                                 -- URL da foto de perfil
  cliente_id       uuid        references public.clientes(id) on delete set null,
  -- vínculo com cliente no CRM (pode ser nulo se não identificado)
  is_grupo         boolean     not null default false,
  nao_perturbar    boolean     not null default false,   -- bloquear notificações
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (conexao_id, jid)
);

create index contatos_conexao_id_idx  on public.contatos_whatsapp(conexao_id);
create index contatos_cliente_id_idx  on public.contatos_whatsapp(cliente_id) where cliente_id is not null;
create index contatos_telefone_idx    on public.contatos_whatsapp(numero_telefone);
create index contatos_nome_idx        on public.contatos_whatsapp using gin(
  to_tsvector('portuguese', coalesce(nome, '') || ' ' || coalesce(nome_push, ''))
);

create trigger set_updated_at_contatos
  before update on public.contatos_whatsapp
  for each row execute function public.handle_updated_at();

alter table public.contatos_whatsapp enable row level security;

create policy "Usuários autenticados veem contatos"
  on public.contatos_whatsapp for select
  to authenticated
  using (true);

create policy "Usuários autenticados gerenciam contatos"
  on public.contatos_whatsapp for all
  to authenticated
  using (true)
  with check (true);

comment on table  public.contatos_whatsapp           is 'Contatos de cada instância WhatsApp';
comment on column public.contatos_whatsapp.jid       is 'WhatsApp JID: número@s.whatsapp.net ou id@g.us para grupos';
comment on column public.contatos_whatsapp.cliente_id is 'Vínculo opcional com cliente no CRM';

-- ----------------------------------------------------------------
-- Mensagens WhatsApp
-- Espelho das mensagens — populado pelo webhook do provedor
-- ----------------------------------------------------------------
create table if not exists public.mensagens_whatsapp (
  id                  uuid        primary key default gen_random_uuid(),
  conexao_id          uuid        not null references public.conexoes_whatsapp(id) on delete cascade,
  contato_id          uuid        not null references public.contatos_whatsapp(id) on delete cascade,
  message_id          text        not null,               -- ID original da mensagem no WhatsApp
  de                  text        not null,               -- JID do remetente
  para                text        not null,               -- JID do destinatário
  tipo                text        not null default 'texto'
                                  check (tipo in (
                                    'texto', 'imagem', 'audio', 'video',
                                    'documento', 'localizacao', 'contato',
                                    'figurinha', 'reacao', 'outro'
                                  )),
  conteudo            text,                               -- texto ou legenda da mídia
  media_url           text,                               -- URL no Supabase Storage (bucket: whatsapp-media)
  media_mime_type     text,                               -- ex: image/jpeg, audio/ogg
  media_nome_arquivo  text,
  enviado_por_nos     boolean     not null default false, -- true = mensagem enviada pela loja
  status_entrega      text        default 'enviado'
                                  check (status_entrega in (
                                    'pendente', 'enviado', 'entregue', 'lido', 'erro'
                                  )),
  timestamp_whatsapp  timestamptz not null,               -- horário original da mensagem
  usuario_id          uuid        references public.usuarios(id) on delete set null,
  -- preenchido quando enviado_por_nos = true (quem enviou)
  mensagem_reply_id   text,                               -- message_id da mensagem respondida
  created_at          timestamptz not null default now(),
  unique (conexao_id, message_id)
);

-- Índices para performance no chat (ordenação + filtros frequentes)
create index mensagens_contato_id_idx       on public.mensagens_whatsapp(contato_id);
create index mensagens_conexao_id_idx       on public.mensagens_whatsapp(conexao_id);
create index mensagens_timestamp_idx        on public.mensagens_whatsapp(timestamp_whatsapp desc);
create index mensagens_enviado_por_nos_idx  on public.mensagens_whatsapp(enviado_por_nos);
create index mensagens_status_entrega_idx   on public.mensagens_whatsapp(status_entrega)
  where status_entrega in ('pendente', 'enviado');

alter table public.mensagens_whatsapp enable row level security;

-- Todos os autenticados podem ler e inserir mensagens (inbox compartilhado)
create policy "Usuários autenticados veem mensagens"
  on public.mensagens_whatsapp for select
  to authenticated
  using (true);

create policy "Usuários autenticados inserem mensagens"
  on public.mensagens_whatsapp for insert
  to authenticated
  with check (true);

-- Apenas update de status_entrega é permitido (webhook atualizando confirmações)
create policy "Atualizar status de entrega das mensagens"
  on public.mensagens_whatsapp for update
  to authenticated
  using (true)
  with check (true);

comment on table  public.mensagens_whatsapp                  is 'Espelho das mensagens WhatsApp. Populado pelo webhook do provedor.';
comment on column public.mensagens_whatsapp.message_id       is 'ID original da mensagem no WhatsApp (único por conexão)';
comment on column public.mensagens_whatsapp.enviado_por_nos  is 'true = mensagem enviada pela equipe da loja';
comment on column public.mensagens_whatsapp.media_url        is 'URL no Supabase Storage (bucket: whatsapp-media)';
comment on column public.mensagens_whatsapp.timestamp_whatsapp is 'Horário original da mensagem no WhatsApp (não o de inserção no banco)';

-- ----------------------------------------------------------------
-- View: última mensagem por contato (para lista de conversas)
-- ----------------------------------------------------------------
create or replace view public.ultimas_mensagens_por_contato as
select distinct on (m.contato_id)
  m.contato_id,
  m.conexao_id,
  m.id             as mensagem_id,
  m.conteudo,
  m.tipo,
  m.enviado_por_nos,
  m.status_entrega,
  m.timestamp_whatsapp,
  -- contagem de não lidas
  count(*) filter (
    where m2.status_entrega != 'lido'
      and m2.enviado_por_nos = false
  ) over (partition by m.contato_id) as nao_lidas
from public.mensagens_whatsapp m
left join public.mensagens_whatsapp m2
  on m2.contato_id = m.contato_id
order by m.contato_id, m.timestamp_whatsapp desc;

comment on view public.ultimas_mensagens_por_contato
  is 'Última mensagem de cada conversa + contagem de não lidas. Usada na lista de chats.';
