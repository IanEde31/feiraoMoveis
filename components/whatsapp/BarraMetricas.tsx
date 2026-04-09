import { MessageSquare, Clock, Smile } from 'lucide-react'

type Props = {
  abertas: number
  aguardando: number
  csat: number | null // null = sem dados disponíveis
}

export function BarraMetricas({ abertas, aguardando, csat }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-3 border-b border-slate-200 bg-white">
      <Metrica
        icone={<MessageSquare className="h-3.5 w-3.5" />}
        label="Abertas"
        valor={abertas}
        cor="text-slate-700"
      />
      <Metrica
        icone={<Clock className="h-3.5 w-3.5" />}
        label="Aguardando"
        valor={aguardando}
        cor={aguardando > 0 ? 'text-amber-600' : 'text-slate-700'}
        destaque={aguardando > 0}
      />
      {csat !== null ? (
        <Metrica
          icone={<Smile className="h-3.5 w-3.5" />}
          label="CSAT hoje"
          valor={`${csat.toFixed(1)}`}
          cor="text-emerald-600"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
          <span className="text-[9px] text-slate-400">CSAT —</span>
        </div>
      )}
    </div>
  )
}

function Metrica({
  icone,
  label,
  valor,
  cor,
  destaque,
}: {
  icone: React.ReactNode
  label: string
  valor: string | number
  cor: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        destaque ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      <div className={`flex items-center gap-1 ${cor}`}>
        {icone}
        <span className={`text-base font-bold leading-none`}>{valor}</span>
      </div>
      <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  )
}
