import { createServerClient } from '@/lib/supabase/server'

export interface EstagioComContagem {
  id: string
  nome: string
  cor: string
  ordem: number
  total: number
}

export interface ProdutoCritico {
  id: string
  nome: string
  estoque_atual: number
  estoque_minimo: number
  categoria: string | null
}

export interface NegociacaoResumida {
  id: string
  titulo: string | null
  status: string
  valor_total: number | null
  created_at: string
  clienteNome: string
}

export interface DashboardData {
  faturamentoMes: number
  faturamentoAnterior: number
  totalClientesAtivos: number
  totalClientesAnterior: number
  negociacoesAbertas: number
  negociacoesAbertasAnterior: number
  totalEstoque: number
  estagiosComContagem: EstagioComContagem[]
  estoqueCritico: ProdutoCritico[]
  ultimasNegociacoes: NegociacaoResumida[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createServerClient()
  const agora = new Date()

  const inicioMesAtual    = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMesAnterior    = new Date(agora.getFullYear(), agora.getMonth(), 0).toISOString().split('T')[0]

  const [
    { data: negsGanhasMes },
    { data: negsGanhasAnterior },
    { data: estagios },
    { data: clientesPorEstagio },
    { data: clientesAnterior },
    { data: negsAbertas },
    { data: negsAbertasAnterior },
    { data: produtos },
    { data: produtosCriticos },
    { data: ultimasNegs },
  ] = await Promise.all([
    supabase.from('negociacoes')
      .select('valor_total')
      .eq('status', 'ganha')
      .gte('data_fechamento', inicioMesAtual),

    supabase.from('negociacoes')
      .select('valor_total')
      .eq('status', 'ganha')
      .gte('data_fechamento', inicioMesAnterior)
      .lte('data_fechamento', fimMesAnterior),

    supabase.from('estagios_kanban')
      .select('id, nome, cor, ordem, eh_final')
      .order('ordem'),

    supabase.from('clientes')
      .select('estagio_id'),

    supabase.from('clientes')
      .select('id')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', fimMesAnterior + 'T23:59:59'),

    supabase.from('negociacoes')
      .select('id')
      .eq('status', 'aberta'),

    supabase.from('negociacoes')
      .select('id')
      .eq('status', 'aberta')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', fimMesAnterior + 'T23:59:59'),

    supabase.from('produtos')
      .select('estoque_atual')
      .eq('ativo', true),

    supabase.from('produtos')
      .select('id, nome, estoque_atual, estoque_minimo, categorias_produto(nome)')
      .eq('ativo', true)
      .gt('estoque_minimo', 0)
      .order('estoque_atual', { ascending: true })
      .limit(5),

    supabase.from('negociacoes')
      .select('id, titulo, status, valor_total, created_at, clientes(nome)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const faturamentoMes      = (negsGanhasMes     ?? []).reduce((s, n) => s + (n.valor_total ?? 0), 0)
  const faturamentoAnterior = (negsGanhasAnterior ?? []).reduce((s, n) => s + (n.valor_total ?? 0), 0)

  const contagemPorEstagio = (clientesPorEstagio ?? []).reduce<Record<string, number>>((acc, c) => {
    if (c.estagio_id) acc[c.estagio_id] = (acc[c.estagio_id] ?? 0) + 1
    return acc
  }, {})

  const estagiosComContagem: EstagioComContagem[] = (estagios ?? []).map((e) => ({
    id:    e.id,
    nome:  e.nome,
    cor:   e.cor,
    ordem: e.ordem,
    total: contagemPorEstagio[e.id] ?? 0,
  }))

  const idEstagiosFinais = new Set((estagios ?? []).filter((e) => e.eh_final).map((e) => e.id))
  const totalClientesAtivos = (clientesPorEstagio ?? []).filter(
    (c) => c.estagio_id && !idEstagiosFinais.has(c.estagio_id)
  ).length
  const totalClientesAnterior = clientesAnterior?.length ?? 0

  const totalEstoque = (produtos ?? []).reduce((s, p) => s + p.estoque_atual, 0)

  const estoqueCritico: ProdutoCritico[] = (produtosCriticos ?? [])
    .filter((p) => p.estoque_atual <= p.estoque_minimo)
    .map((p) => ({
      id:             p.id,
      nome:           p.nome,
      estoque_atual:  p.estoque_atual,
      estoque_minimo: p.estoque_minimo,
      categoria:      (p.categorias_produto as { nome: string } | null)?.nome ?? null,
    }))

  const ultimasNegociacoes: NegociacaoResumida[] = (ultimasNegs ?? []).map((n) => ({
    id:          n.id,
    titulo:      n.titulo,
    status:      n.status,
    valor_total: n.valor_total,
    created_at:  n.created_at,
    clienteNome: (n.clientes as { nome: string } | null)?.nome ?? 'Cliente desconhecido',
  }))

  return {
    faturamentoMes,
    faturamentoAnterior,
    totalClientesAtivos,
    totalClientesAnterior,
    negociacoesAbertas:         negsAbertas?.length         ?? 0,
    negociacoesAbertasAnterior: negsAbertasAnterior?.length ?? 0,
    totalEstoque,
    estagiosComContagem,
    estoqueCritico,
    ultimasNegociacoes,
  }
}
