// Dados mockados de equipe / agentes / respostas rápidas.
// TODO: substituir por chamadas reais quando as tabelas existirem no Supabase.
// Ver seção "Pendências de dados" no CLAUDE.md.

import type { Agente, RespostaRapida } from './tipos'

export const AGENTE_LOGADO_ID = 'ag-1'

export const AGENTES_MOCK: Agente[] = [
  { id: 'ag-1', nome: 'Você', equipe: 'Vendas', presenca: 'online', is_gerente: true },
  { id: 'ag-2', nome: 'Mariana Lopes', equipe: 'Vendas', presenca: 'online' },
  { id: 'ag-3', nome: 'Rafael Souza', equipe: 'Vendas', presenca: 'ocupado' },
  { id: 'ag-4', nome: 'Júlia Mendes', equipe: 'Atendimento', presenca: 'ausente' },
  { id: 'ag-5', nome: 'Bruno Lima', equipe: 'Pós-venda', presenca: 'offline' },
]

export const RESPOSTAS_RAPIDAS_MOCK: RespostaRapida[] = [
  {
    id: 'rr-1',
    titulo: 'Saudação',
    texto: 'Olá! Tudo bem? Sou da Feirão Móveis, em que posso ajudar hoje?',
    conexao_id: null,
  },
  {
    id: 'rr-2',
    titulo: 'Prazo entrega',
    texto: 'Nossa entrega para a sua região é de 5 a 10 dias úteis após confirmação do pagamento.',
    conexao_id: null,
  },
  {
    id: 'rr-3',
    titulo: 'Formas de pagamento',
    texto: 'Aceitamos PIX, cartão em até 12x sem juros, boleto e financiamento próprio.',
    conexao_id: null,
  },
  {
    id: 'rr-4',
    titulo: 'Disponibilidade',
    texto: 'Vou confirmar a disponibilidade no estoque e já te retorno!',
    conexao_id: null,
  },
]
