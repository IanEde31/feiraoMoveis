-- BLOCO 1: Adicionar organization_id nullable em todas as tabelas de domínio
ALTER TABLE ambientacoes ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE conexoes_whatsapp ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE contatos_whatsapp ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE mensagens_whatsapp ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE historico_kanban ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE interacoes_cliente ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE itens_negociacao ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE movimentos_estoque ADD COLUMN IF NOT EXISTS organization_id text;

-- BLOCO 2: Backfill com org_id real
UPDATE ambientacoes SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE clientes SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE conexoes_whatsapp SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE contatos_whatsapp SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE mensagens_whatsapp SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE negociacoes SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE produtos SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE usuarios SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE historico_kanban SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE interacoes_cliente SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE itens_negociacao SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;
UPDATE movimentos_estoque SET organization_id = 'org_3C8fHAW9RYA9GOuxvQXiubmOy7o' WHERE organization_id IS NULL;

-- BLOCO 3: Adicionar NOT NULL após backfill
ALTER TABLE ambientacoes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE clientes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE conexoes_whatsapp ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contatos_whatsapp ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE mensagens_whatsapp ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE negociacoes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE produtos ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE historico_kanban ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE interacoes_cliente ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE itens_negociacao ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE movimentos_estoque ALTER COLUMN organization_id SET NOT NULL;

-- BLOCO 4: Índices
CREATE INDEX IF NOT EXISTS idx_ambientacoes_org ON ambientacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_clientes_org ON clientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_conexoes_whatsapp_org ON conexoes_whatsapp(organization_id);
CREATE INDEX IF NOT EXISTS idx_contatos_whatsapp_org ON contatos_whatsapp(organization_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_org ON mensagens_whatsapp(organization_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_org ON negociacoes(organization_id);
CREATE INDEX IF NOT EXISTS idx_produtos_org ON produtos(organization_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_org ON usuarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_historico_kanban_org ON historico_kanban(organization_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_cliente_org ON interacoes_cliente(organization_id);
CREATE INDEX IF NOT EXISTS idx_itens_negociacao_org ON itens_negociacao(organization_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_estoque_org ON movimentos_estoque(organization_id);

-- BLOCO 5: Tabelas de config da Fase 4 e 5 (sem organization_id,
-- mas precisam existir antes do hardening do agente)
ALTER TABLE mensagens_whatsapp
  ADD COLUMN IF NOT EXISTS enviado_pela_ia boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS logs_agente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  conexao_id uuid,
  contato_id uuid,
  created_at timestamptz DEFAULT now(),
  latencia_ms integer,
  tokens_usados integer,
  modelo text,
  erro text,
  sucesso boolean
);
CREATE INDEX IF NOT EXISTS idx_logs_agente_org ON logs_agente(organization_id);

CREATE TABLE IF NOT EXISTS conversas_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  contato_id uuid,
  prioridade text,
  status text,
  tags jsonb,
  notas text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversas_meta_org ON conversas_meta(organization_id);

CREATE TABLE IF NOT EXISTS respostas_rapidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  titulo text,
  texto text,
  conexao_id uuid,
  criada_por text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_respostas_rapidas_org ON respostas_rapidas(organization_id);
