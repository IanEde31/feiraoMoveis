-- ================================================================
-- DADOS INICIAIS
-- Estágios padrão do Kanban e categorias base de produtos
-- ================================================================

-- ----------------------------------------------------------------
-- Estágios padrão do Kanban de vendas
-- ----------------------------------------------------------------
insert into public.estagios_kanban (nome, descricao, cor, icone, ordem, eh_final, tipo_final) values
  ('Novo Lead',         'Cliente chegou mas ainda não foi contatado',   '#64748b', 'UserPlus',    1, false, null),
  ('Primeiro Contato',  'Equipe já entrou em contato com o cliente',    '#3b82f6', 'Phone',       2, false, null),
  ('Interesse Confirmado', 'Cliente demonstrou interesse real',         '#8b5cf6', 'Star',        3, false, null),
  ('Proposta Enviada',  'Orçamento/proposta formal enviada ao cliente', '#f59e0b', 'FileText',    4, false, null),
  ('Em Negociação',     'Negociando valores, condições ou produto',     '#f97316', 'MessageSquare', 5, false, null),
  ('Ganho',             'Venda concluída com sucesso',                  '#22c55e', 'Trophy',      6, true,  'ganho'),
  ('Perdido',           'Cliente não convertido',                       '#ef4444', 'XCircle',     7, true,  'perdido')
on conflict do nothing;

-- ----------------------------------------------------------------
-- Categorias padrão de produtos
-- ----------------------------------------------------------------
insert into public.categorias_produto (nome, descricao) values
  ('Sala de Estar',   'Sofás, poltronas, mesas de centro, estantes'),
  ('Sala de Jantar',  'Mesas, cadeiras, aparadores, cristaleiras'),
  ('Quarto',          'Camas, guarda-roupas, cômodas, criados-mudos'),
  ('Escritório',      'Mesas, cadeiras, estantes e home office'),
  ('Área Externa',    'Móveis para varanda, jardim e área gourmet'),
  ('Decoração',       'Itens decorativos, tapetes, espelhos, iluminação')
on conflict do nothing;
