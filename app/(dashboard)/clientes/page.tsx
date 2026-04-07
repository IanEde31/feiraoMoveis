import { createServerClient } from '@/lib/supabase/server'
import { PaginaClientesClient } from '@/components/clientes/pagina-clientes-client'
import type { EstagioKanban, Cliente, Origem } from '@/components/clientes/tipos'

const origensValidas = new Set<string>([
  'whatsapp', 'indicacao', 'loja_fisica', 'site', 'instagram', 'outro',
])

function normalizeOrigem(v: string | null): Origem | undefined {
  if (v && origensValidas.has(v)) return v as Origem
  return undefined
}

export default async function PaginaClientes() {
  const supabase = createServerClient()

  const [{ data: estagiosRaw }, { data: clientesRaw }] = await Promise.all([
    supabase
      .from('estagios_kanban')
      .select('id, nome, cor, ordem, eh_final, tipo_final')
      .order('ordem', { ascending: true }),
    supabase
      .from('clientes')
      .select('id, nome, telefone, email, cpf_cnpj, estagio_id, origem, tags, valor_estimado, observacoes, created_at')
      .order('created_at', { ascending: false }),
  ])

  const estagios: EstagioKanban[] = (estagiosRaw ?? []).map((e) => ({
    id: e.id,
    nome: e.nome,
    cor: e.cor,
    ordem: e.ordem,
    eh_final: e.eh_final,
    tipo_final: (e.tipo_final as 'ganho' | 'perdido' | null) ?? null,
  }))

  const primeiroEstagioId = estagios[0]?.id ?? ''

  const clientes: Cliente[] = (clientesRaw ?? [])
    .filter((c) => c.estagio_id !== null)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone ?? undefined,
      email: c.email ?? undefined,
      cpf_cnpj: c.cpf_cnpj ?? undefined,
      estagio_id: c.estagio_id ?? primeiroEstagioId,
      origem: normalizeOrigem(c.origem),
      tags: c.tags ?? [],
      valor_estimado: c.valor_estimado ?? undefined,
      observacoes: c.observacoes ?? undefined,
      created_at: c.created_at,
    }))

  return (
    <PaginaClientesClient
      estagios={estagios}
      clientesIniciais={clientes}
    />
  )
}
