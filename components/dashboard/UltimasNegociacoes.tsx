import { Clock, ChevronRight } from 'lucide-react'
import { tempoRelativo } from '@/lib/dashboard/utils'
import type { NegociacaoResumida } from '@/lib/dashboard/queries'

const statusConfig: Record<string, { rotulo: string; cor: string }> = {
  aberta:    { rotulo: 'Em aberto',  cor: 'bg-blue-100 text-blue-700' },
  ganha:     { rotulo: 'Ganha',      cor: 'bg-emerald-100 text-emerald-700' },
  perdida:   { rotulo: 'Perdida',    cor: 'bg-red-100 text-red-700' },
  cancelada: { rotulo: 'Cancelada',  cor: 'bg-slate-100 text-slate-500' },
}

interface UltimasNegociacoesProps {
  negociacoes: NegociacaoResumida[]
}

export function UltimasNegociacoes({ negociacoes }: UltimasNegociacoesProps) {
  return (
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

      {negociacoes.length === 0 ? (
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
                {negociacoes.map((neg) => {
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
            {negociacoes.map((neg) => {
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
  )
}
