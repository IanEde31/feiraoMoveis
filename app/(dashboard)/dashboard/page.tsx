import { currentUser } from '@clerk/nextjs/server'
import {
  TrendingUp, TrendingDown,
  Users, Package, MessageSquare,
  ArrowUpRight, ArrowDownRight,
  AlertTriangle, Clock, ChevronRight,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatarSaudacao(hora: number): string {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatarData(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

function formatarPreco(valor: number): string {
  if (valor >= 1_000_000)
    return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 1_000)
    return `R$ ${(valor / 1_000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(valor)
}

function calcularVariacao(atual: number, anterior: number): { texto: string; tendencia: 'alta' | 'baixa' | 'neutro' } {
  if (anterior === 0 && atual === 0) return { texto: '—', tendencia: 'neutro' }
  if (anterior === 0) return { texto: `+${atual}`, tendencia: 'alta' }
  const pct = ((atual - anterior) / anterior) * 100
  if (Math.abs(pct) < 0.5) return { texto: '0%', tendencia: 'neutro' }
  return {
    texto: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`,
    tendencia: pct > 0 ? 'alta' : 'baixa',
  }
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Agora há pouco'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ontem'
  if (d < 7) return `há ${d} dias`
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

// ---------------------------------------------------------------------------
// Configuração de status das negociações
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { rotulo: string; cor: string }> = {
  aberta:    { rotulo: 'Em aberto',  cor: 'bg-blue-100 text-blue-700' },
  ganha:     { rotulo: 'Ganha',      cor: 'bg-emerald-100 text-emerald-700' },
  perdida:   { rotulo: 'Perdida',    cor: 'bg-red-100 text-red-700' },
  cancelada: { rotulo: 'Cancelada',  cor: 'bg-slate-100 text-slate-500' },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PaginaDashboard() {
  const [usuario, supabaseData] = await Promise.all([
    currentUser(),
    fetchDashboardData(),
  ])

  const primeiroNome = usuario?.firstName ?? 'Bem-vindo'
  const horaAtual = new Date().getHours()
  const saudacao = formatarSaudacao(horaAtual)
  const dataFormatada = formatarData()

  const {
    faturamentoMes,
    faturamentoAnterior,
    totalClientesAtivos,
    totalClientesAnterior,
    negociacoesAbertas,
    negociacoesAbertasAnterior,
    totalEstoque,
    estagiosComContagem,
    estoqueCritico,
    ultimasNegociacoes,
  } = supabaseData

  const varFaturamento = calcularVariacao(faturamentoMes, faturamentoAnterior)
  const varClientes    = calcularVariacao(totalClientesAtivos, totalClientesAnterior)
  const varNegs        = calcularVariacao(negociacoesAbertas, negociacoesAbertasAnterior)

  const totalClientesFunil = estagiosComContagem.reduce((acc, e) => acc + e.total, 0)

  type Tendencia = 'alta' | 'baixa' | 'neutro'

  const metricas = [
    {
      rotulo: 'Faturamento do Mês',
      valor: formatarPreco(faturamentoMes),
      variacao: varFaturamento.texto,
      tendencia: varFaturamento.tendencia as Tendencia,
      icone: TrendingUp,
      descricao: 'negociações ganhas no mês',
    },
    {
      rotulo: 'Clientes em Negociação',
      valor: String(totalClientesAtivos),
      variacao: varClientes.texto,
      tendencia: varClientes.tendencia as Tendencia,
      icone: Users,
      descricao: 'clientes no funil ativo',
    },
    {
      rotulo: 'Produtos em Estoque',
      valor: String(totalEstoque),
      variacao: '—',
      tendencia: 'neutro' as Tendencia,
      icone: Package,
      descricao: 'unidades disponíveis',
    },
    {
      rotulo: 'Negociações Abertas',
      valor: String(negociacoesAbertas),
      variacao: varNegs.texto,
      tendencia: varNegs.tendencia as Tendencia,
      icone: MessageSquare,
      descricao: 'aguardando resposta',
    },
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-slate-900">
            {saudacao}, {primeiroNome}
          </h2>
          <p className="text-slate-500 text-sm capitalize mt-0.5">{dataFormatada}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ouro-50 border border-ouro-200 text-ouro-700 text-xs font-medium self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-ouro-500 animate-pulse" aria-hidden="true" />
          Sistema ativo
        </div>
      </div>

      {/* KPIs */}
      <section aria-labelledby="titulo-metricas">
        <h3 id="titulo-metricas" className="sr-only">Métricas principais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metricas.map((m) => {
            const Icone = m.icone
            const ehAlta  = m.tendencia === 'alta'
            const ehBaixa = m.tendencia === 'baixa'
            return (
              <div
                key={m.rotulo}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-ouro-50 border border-ouro-100 flex items-center justify-center flex-shrink-0">
                    <Icone size={18} className="text-ouro-600" aria-hidden="true" />
                  </div>
                  {m.variacao !== '—' && (
                    <span
                      className={[
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                        ehAlta  ? 'bg-emerald-50 text-emerald-700' : '',
                        ehBaixa ? 'bg-red-50 text-red-600'         : '',
                        !ehAlta && !ehBaixa ? 'bg-slate-100 text-slate-600' : '',
                      ].join(' ')}
                      aria-label={`Variação: ${m.variacao}`}
                    >
                      {ehAlta  && <ArrowUpRight   size={11} aria-hidden="true" />}
                      {ehBaixa && <ArrowDownRight  size={11} aria-hidden="true" />}
                      {m.variacao}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{m.valor}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{m.rotulo}</p>
                </div>
                <p className="text-slate-400 text-xs border-t border-slate-100 pt-2">{m.descricao}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pipeline + Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Pipeline */}
        <section aria-labelledby="titulo-kanban" className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 id="titulo-kanban" className="font-playfair text-base font-semibold text-slate-900">
                Pipeline de Clientes
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">{totalClientesFunil} cliente{totalClientesFunil !== 1 ? 's' : ''} no funil</p>
            </div>
            <a
              href="/clientes"
              className="inline-flex items-center gap-1 text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
            >
              Ver kanban <ChevronRight size={13} aria-hidden="true" />
            </a>
          </div>

          {estagiosComContagem.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum estágio configurado.</p>
          ) : totalClientesFunil === 0 ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-sm text-slate-400">Nenhum cliente no funil ainda.</p>
              <a href="/clientes" className="text-xs text-ouro-600 hover:text-ouro-700 font-medium">
                Cadastrar primeiro cliente →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {estagiosComContagem.map((estagio) => {
                const percentual = totalClientesFunil > 0
                  ? Math.round((estagio.total / totalClientesFunil) * 100)
                  : 0
                return (
                  <div key={estagio.id} className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs w-32 flex-shrink-0 font-medium truncate">
                      {estagio.nome}
                    </span>
                    <div
                      className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={estagio.total}
                      aria-valuemin={0}
                      aria-valuemax={totalClientesFunil}
                      aria-label={`${estagio.nome}: ${estagio.total} cliente(s)`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentual}%`, backgroundColor: estagio.cor }}
                      />
                    </div>
                    <span className="text-slate-700 text-xs font-semibold w-5 text-right tabular-nums flex-shrink-0">
                      {estagio.total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Estoque Crítico */}
        <section aria-labelledby="titulo-estoque" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
              <h3 id="titulo-estoque" className="font-playfair text-base font-semibold text-slate-900">
                Estoque Crítico
              </h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {estoqueCritico.length} {estoqueCritico.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {estoqueCritico.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">✓ Estoque OK</p>
              <p className="text-xs text-slate-400 mt-1">Nenhum produto abaixo do mínimo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {estoqueCritico.map((produto) => {
                const nivel = produto.estoque_atual === 0 ? 'critico' : 'baixo'
                return (
                  <div
                    key={produto.id}
                    className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate leading-tight">
                        {produto.nome}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {produto.categoria ?? 'Sem categoria'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={[
                          'inline-block text-xs font-bold px-2 py-0.5 rounded-full',
                          nivel === 'critico' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                        ].join(' ')}
                        aria-label={`Estoque: ${produto.estoque_atual} unidades`}
                      >
                        {produto.estoque_atual} un.
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">mín. {produto.estoque_minimo}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <a
            href="/produtos"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          >
            Ver todos os produtos <ChevronRight size={13} aria-hidden="true" />
          </a>
        </section>
      </div>

      {/* Últimas Negociações */}
      <section aria-labelledby="titulo-negociacoes" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 id="titulo-negociacoes" className="font-playfair text-base font-semibold text-slate-900">
              Últimas Negociações
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Atividade recente dos clientes</p>
          </div>
          <a
            href="/clientes"
            className="inline-flex items-center gap-1 text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
          >
            Ver todos <ChevronRight size={13} aria-hidden="true" />
          </a>
        </div>

        {ultimasNegociacoes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-slate-400 text-sm">Nenhuma negociação registrada ainda.</p>
            <a href="/clientes" className="text-xs text-ouro-600 hover:text-ouro-700 font-medium">
              Cadastrar primeiro cliente →
            </a>
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm" aria-label="Últimas negociações">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Cliente', 'Negociação', 'Valor', 'Status', 'Tempo'].map((col) => (
                      <th key={col} scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider first:pl-5">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ultimasNegociacoes.map((neg) => {
                    const cfg = statusConfig[neg.status] ?? statusConfig.aberta
                    return (
                      <tr key={neg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-ouro-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                              <span className="text-ouro-700 text-xs font-semibold">
                                {neg.clienteNome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-slate-800 truncate max-w-[140px]">{neg.clienteNome}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-[180px]">
                          <span className="truncate block">{neg.titulo ?? 'Sem título'}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800 tabular-nums">
                          {neg.valor_total != null
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(neg.valor_total)
                            : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                            {cfg.rotulo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock size={11} aria-hidden="true" />
                            {tempoRelativo(neg.created_at)}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Lista mobile */}
            <div className="sm:hidden divide-y divide-slate-100">
              {ultimasNegociacoes.map((neg) => {
                const cfg = statusConfig[neg.status] ?? statusConfig.aberta
                return (
                  <div key={neg.id} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-ouro-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <span className="text-ouro-700 text-sm font-semibold">
                        {neg.clienteNome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{neg.clienteNome}</p>
                      <p className="text-xs text-slate-500 truncate">{neg.titulo ?? 'Sem título'}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-800 tabular-nums">
                        {neg.valor_total != null
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(neg.valor_total)
                          : '—'}
                      </p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.cor}`}>
                        {cfg.rotulo}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Busca de dados do dashboard
// ---------------------------------------------------------------------------

async function fetchDashboardData() {
  const supabase = createServerClient()
  const agora = new Date()

  // Datas para comparação mês atual vs anterior
  const inicioMesAtual   = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
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
    // 1. Faturamento mês atual (negociações ganhas)
    supabase.from('negociacoes')
      .select('valor_total')
      .eq('status', 'ganha')
      .gte('data_fechamento', inicioMesAtual),

    // 2. Faturamento mês anterior
    supabase.from('negociacoes')
      .select('valor_total')
      .eq('status', 'ganha')
      .gte('data_fechamento', inicioMesAnterior)
      .lte('data_fechamento', fimMesAnterior),

    // 3. Estágios do kanban
    supabase.from('estagios_kanban')
      .select('id, nome, cor, ordem, eh_final')
      .order('ordem'),

    // 4. Clientes ativos (estágio não-final) — contagem por estágio
    supabase.from('clientes')
      .select('estagio_id'),

    // 5. Clientes criados no mês anterior (para variação)
    supabase.from('clientes')
      .select('id')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', fimMesAnterior + 'T23:59:59'),

    // 6. Negociações abertas atuais
    supabase.from('negociacoes')
      .select('id')
      .eq('status', 'aberta'),

    // 7. Negociações abertas no mês anterior
    supabase.from('negociacoes')
      .select('id')
      .eq('status', 'aberta')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', fimMesAnterior + 'T23:59:59'),

    // 8. Estoque total
    supabase.from('produtos')
      .select('estoque_atual')
      .eq('ativo', true),

    // 9. Produtos com estoque crítico
    supabase.from('produtos')
      .select('id, nome, estoque_atual, estoque_minimo, categorias_produto(nome)')
      .eq('ativo', true)
      .gt('estoque_minimo', 0)
      .order('estoque_atual', { ascending: true })
      .limit(5),

    // 10. Últimas negociações com nome do cliente
    supabase.from('negociacoes')
      .select('id, titulo, status, valor_total, created_at, clientes(nome)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Calcular faturamento
  const faturamentoMes      = (negsGanhasMes     ?? []).reduce((s, n) => s + (n.valor_total ?? 0), 0)
  const faturamentoAnterior = (negsGanhasAnterior ?? []).reduce((s, n) => s + (n.valor_total ?? 0), 0)

  // Estágios com contagem de clientes
  const contagemPorEstagio = (clientesPorEstagio ?? []).reduce<Record<string, number>>((acc, c) => {
    if (c.estagio_id) acc[c.estagio_id] = (acc[c.estagio_id] ?? 0) + 1
    return acc
  }, {})

  const estagiosComContagem = (estagios ?? []).map((e) => ({
    id:    e.id,
    nome:  e.nome,
    cor:   e.cor,
    ordem: e.ordem,
    total: contagemPorEstagio[e.id] ?? 0,
  }))

  // Total de clientes no funil (excluindo estágios finais)
  const idEstagiosFinais = new Set((estagios ?? []).filter((e) => e.eh_final).map((e) => e.id))
  const totalClientesAtivos = (clientesPorEstagio ?? []).filter(
    (c) => c.estagio_id && !idEstagiosFinais.has(c.estagio_id)
  ).length
  const totalClientesAnterior = clientesAnterior?.length ?? 0

  // Estoque total
  const totalEstoque = (produtos ?? []).reduce((s, p) => s + p.estoque_atual, 0)

  // Filtrar críticos (estoque_atual <= estoque_minimo)
  const estoqueCritico = (produtosCriticos ?? [])
    .filter((p) => p.estoque_atual <= p.estoque_minimo)
    .map((p) => ({
      id:             p.id,
      nome:           p.nome,
      estoque_atual:  p.estoque_atual,
      estoque_minimo: p.estoque_minimo,
      categoria:      (p.categorias_produto as { nome: string } | null)?.nome ?? null,
    }))

  // Últimas negociações formatadas
  const ultimasNegociacoes = (ultimasNegs ?? []).map((n) => ({
    id:           n.id,
    titulo:       n.titulo,
    status:       n.status,
    valor_total:  n.valor_total,
    created_at:   n.created_at,
    clienteNome:  (n.clientes as { nome: string } | null)?.nome ?? 'Cliente desconhecido',
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
