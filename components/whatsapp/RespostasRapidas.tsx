import { Plus, Zap } from 'lucide-react'
import type { RespostaRapida } from './tipos'

type Props = {
  respostas: RespostaRapida[]
  onSelecionar: (texto: string) => void
  onNova: () => void
}

export function RespostasRapidas({ respostas, onSelecionar, onNova }: Props) {
  const visiveis = respostas.slice(0, 4)
  return (
    <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      <Zap className="h-3 w-3 text-amber-500 shrink-0" />
      {visiveis.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelecionar(r.texto)}
          title={r.texto}
          className="shrink-0 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-colors rounded-full px-2.5 py-1"
        >
          {r.titulo}
        </button>
      ))}
      <button
        onClick={onNova}
        className="shrink-0 text-[10px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors rounded-full px-2 py-1 flex items-center gap-0.5"
      >
        <Plus className="h-3 w-3" /> Nova
      </button>
    </div>
  )
}
