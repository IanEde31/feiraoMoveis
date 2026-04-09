import { Fragment, useEffect, useRef } from 'react'
import { CheckCheck, Loader2 } from 'lucide-react'
import { formatarData, mesmoDia } from './helpers'
import type { Mensagem } from './tipos'

type Props = {
  mensagens: Mensagem[]
  carregando: boolean
}

export function AreaMensagens({ mensagens, carregando }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/60">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (mensagens.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/60 px-6">
        <p className="text-xs text-slate-400">
          Nenhuma mensagem ainda. As mensagens aparecem aqui em tempo real.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-slate-50/60">
      {mensagens.map((m, i) => {
        const anterior = mensagens[i - 1]
        const exibirData = i === 0 || !mesmoDia(anterior.timestamp_whatsapp, m.timestamp_whatsapp)
        const enviado = m.enviado_por_nos
        return (
          <Fragment key={m.id}>
            {exibirData && (
              <div className="flex justify-center py-3">
                <span className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shadow-sm">
                  {formatarData(m.timestamp_whatsapp)}
                </span>
              </div>
            )}
            <div className={`flex ${enviado ? 'justify-end' : 'justify-start'} mb-0.5`}>
              <div
                className={`max-w-[65%] min-w-[4rem] rounded-2xl px-3.5 py-2 shadow-sm ${
                  enviado
                    ? 'bg-amber-500 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                }`}
              >
                {m.conteudo ? (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {m.conteudo}
                  </p>
                ) : (
                  <p className="text-sm italic opacity-60">[{m.tipo ?? 'mídia'}]</p>
                )}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 ${
                    enviado ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  <span className="text-[10px]">
                    {new Date(m.timestamp_whatsapp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {enviado && (
                    <CheckCheck
                      className={`h-3 w-3 ${m.status_entrega === 'lido' ? 'text-sky-200' : ''}`}
                    />
                  )}
                </div>
              </div>
            </div>
          </Fragment>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
