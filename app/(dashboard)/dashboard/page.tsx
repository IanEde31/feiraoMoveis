import { currentUser } from '@clerk/nextjs/server'
import {
  TrendingUp,
  Users,
  Package,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Tendencia = 'alta' | 'baixa' | 'neutro'

interface Metrica {
  rotulo: string
  valor: string
  variacao: string
  tendencia: Tendencia
  icone: React.ElementType
  descricao: string
}

interface EstagioKanban {
  nome: string
  total: number
  cor: string
  bg: string
}

interface ProdutoCritico {
  nome: string
  categoria: string
  estoque: number
  minimo: number
}

interface Negociacao {
  cliente: string
  produto: string
  valor: string
  status: keyof typeof statusConfig
  tempo: string
}

// ---------------------------------------------------------------------------
// Dados mock — substituir por queries Supabase após aplicar migrations
// ---------------------------------------------------------------------------

const metricas: Metrica[] = [
  {
    rotulo: 'Faturamento do Mês',
    valor: 'R$ 127.450',
    variacao: '+12%',
    tendencia: 'alta',
    icone: TrendingUp,
    descricao: 'vs. mês anterior',
  },
  {
    rotulo: 'Clientes em Negociação',
    valor: '38',
    variacao: '+5',
    tendencia: 'alta',
    icone: Users,
    descricao: 'clientes ativos',
  },
  {
    rotulo: 'Produtos em Estoque',
    valor: '142',
    variacao: '-8',
    tendencia: 'baixa',
    icone: Package,
    descricao: 'unidades disponíveis',
  },
  {
    rotulo: 'Negociações Abertas',
    valor: '23',
    variacao: '+3',
    tendencia: 'alta',
    icone: MessageSquare,
    descricao: 'aguardando resposta',
  },
]

const estagiosKanban: EstagioKanban[] = [
  { nome: 'Novo Lead', total: 5, cor: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { nome: 'Em Contato', total: 8, cor: 'bg-violet-500', bg: 'bg-violet-50 border-violet-200' },
  { nome: 'Proposta', total: 6, cor: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { nome: 'Negociação', total: 4, cor: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { nome: 'Fechado', total: 12, cor: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
  { nome: 'Perdido', total: 3, cor: 'bg-red-400', bg: 'bg-red-50 border-red-200' },
]

const estoqueCritico: ProdutoCritico[] = [
  { nome: 'Sofá Moderno Milano', categoria: 'Sofás', estoque: 2, minimo: 5 },
  { nome: 'Mesa de Jantar Carrara', categoria: 'Mesas', estoque: 1, minimo: 3 },
  { nome: 'Poltrona Barcelona', categoria: 'Poltronas', estoque: 3, minimo: 5 },
  { nome: 'Rack Provençal 200cm', categoria: 'Racks', estoque: 2, minimo: 4 },
]

const statusConfig = {
  novo: { rotulo: 'Novo Lead', cor: 'bg-blue-100 text-blue-700' },
  contato: { rotulo: 'Em Contato', cor: 'bg-violet-100 text-violet-700' },
  proposta: { rotulo: 'Proposta', cor: 'bg-amber-100 text-amber-700' },
  negociacao: { rotulo: 'Negociação', cor: 'bg-orange-100 text-orange-700' },
  fechado: { rotulo: 'Fechado', cor: 'bg-emerald-100 text-emerald-700' },
  perdido: { rotulo: 'Perdido', cor: 'bg-red-100 text-red-700' },
}

const ultimasNegociacoes: Negociacao[] = [
  { cliente: 'Mariana Fonseca', produto: 'Sofá Chesterfield', valor: 'R$ 8.900', status: 'proposta', tempo: '2h atrás' },
  { cliente: 'Roberto Alves', produto: 'Conjunto Sala de Jantar', valor: 'R$ 15.200', status: 'negociacao', tempo: '4h atrás' },
  { cliente: 'Camila Torres', produto: 'Cama Box Casal Premium', valor: 'R$ 4.500', status: 'fechado', tempo: '6h atrás' },
  { cliente: 'Família Oliveira', produto: 'Guarda-Roupa Planejado', valor: 'R$ 12.800', status: 'contato', tempo: 'Ontem' },
  { cliente: 'André Souza', produto: 'Mesa de Centro Luxo', valor: 'R$ 2.300', status: 'novo', tempo: 'Ontem' },
]

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PaginaDashboard() {
  const usuario = await currentUser()
  const primeiroNome = usuario?.firstName ?? 'Bem-vindo'
  const horaAtual = new Date().getHours()
  const saudacao = formatarSaudacao(horaAtual)
  const dataFormatada = formatarData()

  const totalClientes = estagiosKanban.reduce((acc, e) => acc + e.total, 0)

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

      {/* Métricas KPI */}
      <section aria-labelledby="titulo-metricas">
        <h3 id="titulo-metricas" className="sr-only">Métricas principais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metricas.map((m) => {
            const Icone = m.icone
            const ehAlta = m.tendencia === 'alta'
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
                  <span
                    className={[
                      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                      ehAlta ? 'bg-emerald-50 text-emerald-700' : '',
                      ehBaixa ? 'bg-red-50 text-red-600' : '',
                      !ehAlta && !ehBaixa ? 'bg-slate-100 text-slate-600' : '',
                    ].join(' ')}
                    aria-label={`Variação: ${m.variacao}`}
                  >
                    {ehAlta && <ArrowUpRight size={11} aria-hidden="true" />}
                    {ehBaixa && <ArrowDownRight size={11} aria-hidden="true" />}
                    {m.variacao}
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                    {m.valor}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{m.rotulo}</p>
                </div>

                <p className="text-slate-400 text-xs border-t border-slate-100 pt-2">
                  {m.descricao}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Linha do meio: Estágios Kanban + Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Estágios do Kanban */}
        <section
          aria-labelledby="titulo-kanban"
          className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 id="titulo-kanban" className="font-playfair text-base font-semibold text-slate-900">
                Pipeline de Clientes
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">{totalClientes} clientes no funil</p>
            </div>
            <a
              href="/clientes"
              className="inline-flex items-center gap-1 text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
            >
              Ver kanban
              <ChevronRight size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="space-y-2">
            {estagiosKanban.map((estagio) => {
              const percentual = Math.round((estagio.total / totalClientes) * 100)
              return (
                <div key={estagio.nome} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-28 flex-shrink-0 font-medium">
                    {estagio.nome}
                  </span>
                  <div
                    className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={estagio.total}
                    aria-valuemin={0}
                    aria-valuemax={totalClientes}
                    aria-label={`${estagio.nome}: ${estagio.total} clientes`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${estagio.cor}`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                  <span className="text-slate-700 text-xs font-semibold w-5 text-right tabular-nums flex-shrink-0">
                    {estagio.total}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Estoque Crítico */}
        <section
          aria-labelledby="titulo-estoque"
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
              <h3 id="titulo-estoque" className="font-playfair text-base font-semibold text-slate-900">
                Estoque Crítico
              </h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {estoqueCritico.length} itens
            </span>
          </div>

          <div className="space-y-3">
            {estoqueCritico.map((produto) => {
              const nivel = produto.estoque <= 1 ? 'critico' : 'baixo'
              return (
                <div
                  key={produto.nome}
                  className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate leading-tight">
                      {produto.nome}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{produto.categoria}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={[
                        'inline-block text-xs font-bold px-2 py-0.5 rounded-full',
                        nivel === 'critico'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700',
                      ].join(' ')}
                      aria-label={`Estoque: ${produto.estoque} unidades`}
                    >
                      {produto.estoque} un.
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">mín. {produto.minimo}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <a
            href="/produtos"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          >
            Ver todos os produtos
            <ChevronRight size={13} aria-hidden="true" />
          </a>
        </section>
      </div>

      {/* Últimas negociações */}
      <section
        aria-labelledby="titulo-negociacoes"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
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
            Ver todos
            <ChevronRight size={13} aria-hidden="true" />
          </a>
        </div>

        {/* Tabela desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm" aria-label="Últimas negociações">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estágio
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tempo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasNegociacoes.map((neg, i) => {
                const cfg = statusConfig[neg.status]
                return (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full bg-ouro-100 flex items-center justify-center flex-shrink-0"
                          aria-hidden="true"
                        >
                          <span className="text-ouro-700 text-xs font-semibold">
                            {neg.cliente.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-800">{neg.cliente}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[180px]">
                      <span className="truncate block">{neg.produto}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 tabular-nums">
                      {neg.valor}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                        {cfg.rotulo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />
                        {neg.tempo}
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
          {ultimasNegociacoes.map((neg, i) => {
            const cfg = statusConfig[neg.status]
            return (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-ouro-100 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <span className="text-ouro-700 text-sm font-semibold">
                    {neg.cliente.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{neg.cliente}</p>
                  <p className="text-xs text-slate-500 truncate">{neg.produto}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-800 tabular-nums">{neg.valor}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.cor}`}>
                    {cfg.rotulo}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
