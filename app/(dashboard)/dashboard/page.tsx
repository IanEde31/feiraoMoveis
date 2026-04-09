import { currentUser } from '@clerk/nextjs/server'
import { TrendingUp, Users, Package, MessageSquare } from 'lucide-react'
import { fetchDashboardData } from '@/lib/dashboard/queries'
import { formatarSaudacao, formatarData, formatarPreco, calcularVariacao } from '@/lib/dashboard/utils'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { PipelineClientes } from '@/components/dashboard/PipelineClientes'
import { EstoqueCritico } from '@/components/dashboard/EstoqueCritico'
import { UltimasNegociacoes } from '@/components/dashboard/UltimasNegociacoes'

export default async function PaginaDashboard() {
  const [usuario, dados] = await Promise.all([
    currentUser(),
    fetchDashboardData(),
  ])

  const primeiroNome  = usuario?.firstName ?? 'Bem-vindo'
  const saudacao      = formatarSaudacao(new Date().getHours())
  const dataFormatada = formatarData()

  const varFaturamento = calcularVariacao(dados.faturamentoMes, dados.faturamentoAnterior)
  const varClientes    = calcularVariacao(dados.totalClientesAtivos, dados.totalClientesAnterior)
  const varNegs        = calcularVariacao(dados.negociacoesAbertas, dados.negociacoesAbertasAnterior)

  const metricas = [
    {
      rotulo: 'Faturamento do Mês',
      valor: formatarPreco(dados.faturamentoMes),
      variacao: varFaturamento.texto,
      tendencia: varFaturamento.tendencia,
      icone: TrendingUp,
      descricao: 'negociações ganhas no mês',
    },
    {
      rotulo: 'Clientes em Negociação',
      valor: String(dados.totalClientesAtivos),
      variacao: varClientes.texto,
      tendencia: varClientes.tendencia,
      icone: Users,
      descricao: 'clientes no funil ativo',
    },
    {
      rotulo: 'Produtos em Estoque',
      valor: String(dados.totalEstoque),
      variacao: '—',
      tendencia: 'neutro' as const,
      icone: Package,
      descricao: 'unidades disponíveis',
    },
    {
      rotulo: 'Negociações Abertas',
      valor: String(dados.negociacoesAbertas),
      variacao: varNegs.texto,
      tendencia: varNegs.tendencia,
      icone: MessageSquare,
      descricao: 'aguardando resposta',
    },
  ]

  const totalClientesFunil = dados.estagiosComContagem.reduce((acc, e) => acc + e.total, 0)

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

      <KpiCards metricas={metricas} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <PipelineClientes estagios={dados.estagiosComContagem} totalClientesFunil={totalClientesFunil} />
        <EstoqueCritico produtos={dados.estoqueCritico} />
      </div>

      <UltimasNegociacoes negociacoes={dados.ultimasNegociacoes} />
    </div>
  )
}
