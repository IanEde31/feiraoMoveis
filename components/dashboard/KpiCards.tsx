import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'

export interface Metrica {
  rotulo: string
  valor: string
  variacao: string
  tendencia: 'alta' | 'baixa' | 'neutro'
  icone: LucideIcon
  descricao: string
}

interface KpiCardsProps {
  metricas: Metrica[]
}

export function KpiCards({ metricas }: KpiCardsProps) {
  return (
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
  )
}
