import { CheckCircle2, History, UserPlus2 } from 'lucide-react'
import { corAvatar, iniciais, nomeExibicao } from './helpers'
import type { Contato, MetaConversa } from './tipos'

type Props = {
  contato: Contato
  meta: MetaConversa
  onTransferir: () => void
  onHistorico: () => void
  onResolver: () => void
}

export function CabecalhoChat({ contato, meta, onTransferir, onHistorico, onResolver }: Props) {
  const nome = nomeExibicao(contato)
  const resolvido = meta.status === 'resolvido'
  return (
    <div className="h-16 shrink-0 flex items-center gap-3 px-4 border-b border-slate-200 bg-white">
      <div
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(
          nome
        )}`}
      >
        {iniciais(nome)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">{nome}</div>
        <div className="text-[11px] text-slate-500">{contato.numero_telefone}</div>
      </div>

      {contato.is_grupo && (
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">
          Grupo
        </span>
      )}

      <div className="flex items-center gap-1">
        <BotaoIcone label="Transferir" onClick={onTransferir} icone={<UserPlus2 className="h-4 w-4" />} />
        <BotaoIcone label="Histórico" onClick={onHistorico} icone={<History className="h-4 w-4" />} />
        <button
          onClick={onResolver}
          disabled={resolvido}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${
            resolvido
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {resolvido ? 'Resolvida' : 'Resolver'}
        </button>
      </div>
    </div>
  )
}

function BotaoIcone({
  label,
  onClick,
  icone,
}: {
  label: string
  onClick: () => void
  icone: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="h-9 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
    >
      {icone}
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}
