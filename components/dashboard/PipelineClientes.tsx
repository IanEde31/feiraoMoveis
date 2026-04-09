import { ChevronRight } from 'lucide-react'
import type { EstagioComContagem } from '@/lib/dashboard/queries'

interface PipelineClientesProps {
  estagios: EstagioComContagem[]
  totalClientesFunil: number
}

export function PipelineClientes({ estagios, totalClientesFunil }: PipelineClientesProps) {
  return (
    <section aria-labelledby="titulo-kanban" className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 id="titulo-kanban" className="font-playfair text-base font-semibold text-slate-900">
            Pipeline de Clientes
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {totalClientesFunil} cliente{totalClientesFunil !== 1 ? 's' : ''} no funil
          </p>
        </div>
        <a
          href="/clientes"
          className="inline-flex items-center gap-1 text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
        >
          Ver kanban <ChevronRight size={13} aria-hidden="true" />
        </a>
      </div>

      {estagios.length === 0 ? (
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
          {estagios.map((estagio) => {
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
  )
}
