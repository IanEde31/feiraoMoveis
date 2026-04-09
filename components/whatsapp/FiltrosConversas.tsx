import { Search } from 'lucide-react'
import type { FiltroConversa } from './tipos'

const ABAS: { id: FiltroConversa; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'minhas', label: 'Minhas' },
  { id: 'sem_atribuicao', label: 'Sem atribuição' },
  { id: 'urgente', label: 'Urgente' },
]

type Props = {
  filtro: FiltroConversa
  onFiltro: (f: FiltroConversa) => void
  busca: string
  onBusca: (s: string) => void
  contadores: Record<FiltroConversa, number>
}

export function FiltrosConversas({ filtro, onFiltro, busca, onBusca, contadores }: Props) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="px-2 pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {ABAS.map((a) => {
          const ativo = filtro === a.id
          const c = contadores[a.id]
          return (
            <button
              key={a.id}
              onClick={() => onFiltro(a.id)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                ativo
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {a.label}
              {c > 0 && (
                <span
                  className={`min-w-[1rem] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    ativo ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {c}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="px-3 py-2 relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder="Buscar conversa…"
          className="w-full bg-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:bg-white transition-all"
        />
      </div>
    </div>
  )
}
