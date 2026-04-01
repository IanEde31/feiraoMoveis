import type { EstagioKanban, Cliente } from './tipos'

export const estagiosMock: EstagioKanban[] = [
  { id: 'novo-lead',   nome: 'Novo Lead',        cor: '#3b82f6', ordem: 1, eh_final: false },
  { id: 'em-contato',  nome: 'Em Contato',        cor: '#8b5cf6', ordem: 2, eh_final: false },
  { id: 'proposta',    nome: 'Proposta Enviada',   cor: '#f59e0b', ordem: 3, eh_final: false },
  { id: 'negociacao',  nome: 'Em Negociação',      cor: '#f97316', ordem: 4, eh_final: false },
  { id: 'ganho',       nome: 'Ganho',              cor: '#10b981', ordem: 5, eh_final: true,  tipo_final: 'ganho' },
  { id: 'perdido',     nome: 'Perdido',            cor: '#ef4444', ordem: 6, eh_final: true,  tipo_final: 'perdido' },
]

export const clientesMock: Cliente[] = [
  // Novo Lead
  { id: 'c1',  nome: 'Mariana Fonseca',       telefone: '5511991234567', email: 'mariana@gmail.com',    estagio_id: 'novo-lead',  origem: 'instagram',   tags: ['apartamento', 'sala'],     valor_estimado: 18500,  created_at: '2026-03-28T10:00:00Z' },
  { id: 'c2',  nome: 'Carlos Henrique Alves', telefone: '5511987654321',                                estagio_id: 'novo-lead',  origem: 'whatsapp',    tags: ['casa'],                    valor_estimado: 45000,  created_at: '2026-03-30T14:00:00Z' },
  { id: 'c3',  nome: 'Família Ribeiro',                                                                  estagio_id: 'novo-lead',  origem: 'indicacao',   tags: ['quarto', 'completo'],      valor_estimado: 32000,  created_at: '2026-03-31T09:00:00Z' },

  // Em Contato
  { id: 'c4',  nome: 'Roberto Alves',         telefone: '5511998765432', email: 'roberto@empresa.com',  estagio_id: 'em-contato', origem: 'site',        tags: ['escritorio'],              valor_estimado: 15200,  created_at: '2026-03-25T10:00:00Z' },
  { id: 'c5',  nome: 'Juliana Martins',       telefone: '5511912345678',                                estagio_id: 'em-contato', origem: 'instagram',   tags: ['sala', 'moderno'],         valor_estimado: 28000,  created_at: '2026-03-26T11:00:00Z' },
  { id: 'c6',  nome: 'André Souza',                                                                      estagio_id: 'em-contato', origem: 'loja_fisica', tags: [],                          valor_estimado: 7800,   created_at: '2026-03-27T15:00:00Z' },
  { id: 'c7',  nome: 'Patrícia Costa',        telefone: '5511956789012',                                estagio_id: 'em-contato', origem: 'whatsapp',    tags: ['quarto'],                  valor_estimado: 22000,  created_at: '2026-03-29T16:00:00Z' },

  // Proposta
  { id: 'c8',  nome: 'Lucas Ferreira',        telefone: '5511934567890', email: 'lucas@corp.com',       estagio_id: 'proposta',   origem: 'indicacao',   tags: ['completo', 'premium'],     valor_estimado: 85000,  created_at: '2026-03-20T10:00:00Z' },
  { id: 'c9',  nome: 'Amanda Nunes',          telefone: '5511978901234',                                estagio_id: 'proposta',   origem: 'instagram',   tags: ['sala'],                    valor_estimado: 12500,  created_at: '2026-03-22T14:00:00Z' },
  { id: 'c10', nome: 'Gustavo Pereira',                                                                  estagio_id: 'proposta',   origem: 'site',        tags: ['cozinha', 'moderno'],      valor_estimado: 34000,  created_at: '2026-03-23T09:00:00Z' },

  // Negociação
  { id: 'c11', nome: 'Família Oliveira',      telefone: '5511967890123',                                estagio_id: 'negociacao', origem: 'indicacao',   tags: ['completo', 'luxo'],        valor_estimado: 120000, created_at: '2026-03-10T10:00:00Z' },
  { id: 'c12', nome: 'Beatriz Santana',       telefone: '5511923456789', email: 'beatriz@email.com',   estagio_id: 'negociacao', origem: 'instagram',   tags: ['apartamento'],             valor_estimado: 42000,  created_at: '2026-03-15T11:00:00Z' },

  // Ganho
  { id: 'c13', nome: 'Camila Torres',         telefone: '5511945678901',                                estagio_id: 'ganho',      origem: 'whatsapp',    tags: ['quarto'],                  valor_estimado: 4500,   created_at: '2026-03-01T10:00:00Z' },
  { id: 'c14', nome: 'Pedro Nascimento',      telefone: '5511989012345',                                estagio_id: 'ganho',      origem: 'loja_fisica', tags: ['sala', 'premium'],         valor_estimado: 67000,  created_at: '2026-03-05T14:00:00Z' },

  // Perdido
  { id: 'c15', nome: 'Renata Lima',           telefone: '5511901234567',                                estagio_id: 'perdido',    origem: 'site',        tags: [],                          valor_estimado: 19000,  created_at: '2026-02-20T10:00:00Z' },
]
