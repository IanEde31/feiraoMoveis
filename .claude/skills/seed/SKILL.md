---
name: seed
description: Popula o banco de dados com dados de teste realistas para o Feirão Móveis
allowed-tools: Read, Write, Edit, Bash(npx supabase *), Bash(npm run *)
---

# Seed — Dados de Teste

Popule o banco de dados local com dados fictícios e realistas para desenvolvimento.

## Localização do arquivo de seed
`supabase/seed.sql`

## Dados a popular (adaptar conforme tabelas existentes)

### Produtos de Móveis de Luxo (exemplos realistas)
```sql
-- Limpar dados existentes (ambiente de dev apenas)
truncate table public.produtos restart identity cascade;

insert into public.produtos (nome, descricao, preco, estoque, categoria, imagem_url) values
  ('Sofá Chesterfield Premium', 'Sofá em couro legítimo italiano, botões capitonê, pés em madeira torneada', 12900.00, 3, 'Sala de Estar', null),
  ('Mesa de Jantar Mônaco', 'Mesa em mármore Carrara com base em aço inox escovado, 8 lugares', 18500.00, 2, 'Sala de Jantar', null),
  ('Poltrona Egg Réplica Premium', 'Poltrona em tecido bouclê bege, estrutura em fibra de vidro', 4200.00, 5, 'Sala de Estar', null),
  ('Cama King Size Florença', 'Cabeceira estofada em veludo azul royal, estrutura em MDF lacado', 8900.00, 4, 'Quarto', null),
  ('Aparador Milão', 'Aparador em madeira de nogueira maciça com puxadores em latão dourado', 6300.00, 6, 'Sala de Jantar', null);
```

### Clientes (Kanban)
```sql
truncate table public.clientes restart identity cascade;

insert into public.clientes (nome, telefone, email, estagio_kanban, observacoes) values
  ('Roberto Almeida', '11999990001', 'roberto@email.com', 'prospecto', 'Interessado em sofás para sala grande'),
  ('Mariana Costa', '11999990002', 'mariana@email.com', 'contato_feito', 'Quer orçamento para quarto completo'),
  ('Família Rodrigues', '11999990003', 'joao.rodrigues@email.com', 'proposta_enviada', 'Reforma completa do apartamento novo'),
  ('Ana Paula Ferreira', '11999990004', 'anapaula@email.com', 'negociando', 'Disputa entre 2 modelos de mesa'),
  ('Carlos Mendes', '11999990005', 'carlos@email.com', 'fechado', 'Venda realizada — mesa Mônaco');
```

## Como rodar
```bash
npx supabase db reset
# ou apenas o seed sem resetar:
npx supabase db seed
```

## Regras
- Dados de seed são apenas para ambiente local/desenvolvimento
- Usar nomes e valores fictícios mas plausíveis para o segmento de luxo
- Sempre usar `truncate ... cascade` antes de inserir para evitar conflitos
- Adaptar os inserts conforme as tabelas reais criadas pelas migrations
