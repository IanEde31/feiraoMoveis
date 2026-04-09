import { AlertTriangle, ChevronRight } from 'lucide-react'
import type { ProdutoCritico } from '@/lib/dashboard/queries'

interface EstoqueCriticoProps {
  produtos: ProdutoCritico[]
}

export function EstoqueCritico({ produtos }: EstoqueCriticoProps) {
  return (
    <section aria-labelledby="titulo-estoque" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
          <h3 id="titulo-estoque" className="font-playfair text-base font-semibold text-slate-900">
            Estoque Crítico
          </h3>
        </div>
        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
          {produtos.length} {produtos.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {produtos.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-emerald-600 font-medium">✓ Estoque OK</p>
          <p className="text-xs text-slate-400 mt-1">Nenhum produto abaixo do mínimo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {produtos.map((produto) => {
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
  )
}
