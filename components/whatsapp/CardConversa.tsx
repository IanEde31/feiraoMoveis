import { CheckCheck, Users } from 'lucide-react'
import { corAvatar, formatarHorario, iniciais, nomeExibicao, PRESENCA_COR } from './helpers'
import type {
  Agente,
  Contato,
  MetaConversa,
  PrioridadeConversa,
  StatusConversa,
  UltimaMensagem,
} from './tipos'

const COR_PRIORIDADE: Record<PrioridadeConversa, string> = {
  urgente: 'bg-red-500',
  normal: 'bg-amber-500',
  baixa: 'bg-emerald-500',
}

const STATUS_BADGE: Record<StatusConversa, { label: string; cls: string }> = {
  novo: { label: 'Novo', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
  aguardando: { label: 'Aguardando', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolvido: { label: 'Resolvido', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

type Props = {
  contato: Contato
  ultima: UltimaMensagem | undefined
  naoLidos: number
  selecionado: boolean
  onClick: () => void
  meta: MetaConversa
  agente: Agente | null
}

export function CardConversa({
  contato,
  ultima,
  naoLidos,
  selecionado,
  onClick,
  meta,
  agente,
}: Props) {
  const nome = nomeExibicao(contato)
  const semAtribuicao = !meta.agente_id
  const status = STATUS_BADGE[meta.status]

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors border-b border-slate-100 hover:bg-slate-50 ${
        selecionado ? 'bg-amber-50/60 hover:bg-amber-50/80' : ''
      } ${semAtribuicao ? 'border-l-2 border-l-red-400' : ''}`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(
            nome
          )}`}
        >
          {iniciais(nome)}
        </div>
        {/* Ponto de prioridade */}
        <span
          title={`Prioridade: ${meta.prioridade}`}
          className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
            COR_PRIORIDADE[meta.prioridade]
          }`}
        />
        {contato.is_grupo && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <Users className="h-2.5 w-2.5 text-slate-500" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <span
            className={`text-sm truncate ${
              naoLidos > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
            }`}
          >
            {nome}
          </span>
          {ultima?.timestamp_whatsapp && (
            <span
              className={`text-[10px] shrink-0 ${
                naoLidos > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
              }`}
            >
              {formatarHorario(ultima.timestamp_whatsapp)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 truncate flex-1">
            {ultima ? (
              <>
                {ultima.enviado_por_nos && (
                  <CheckCheck className="inline h-3 w-3 mr-0.5 text-amber-500/80" />
                )}
                {ultima.conteudo ?? `[${ultima.tipo ?? 'mídia'}]`}
              </>
            ) : (
              <span className="italic text-slate-400">sem mensagens</span>
            )}
          </span>
          {naoLidos > 0 && (
            <span className="shrink-0 min-w-[1.25rem] h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
              {naoLidos > 99 ? '99+' : naoLidos}
            </span>
          )}
        </div>

        {/* Linha de agente + status */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {semAtribuicao ? (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                Sem atribuição
              </span>
            ) : agente ? (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRESENCA_COR[agente.presenca]}`}
                />
                <span className="text-[10px] text-slate-500 truncate">
                  {agente.nome} · {agente.equipe}
                </span>
              </>
            ) : null}
          </div>
          <span
            className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${status.cls}`}
          >
            {status.label}
          </span>
        </div>
      </div>
    </button>
  )
}
