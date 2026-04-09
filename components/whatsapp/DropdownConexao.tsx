'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2, Plus, QrCode, WifiOff } from 'lucide-react'
import { StatusDot } from './StatusDot'
import { corAvatar, STATUS_LABEL } from './helpers'
import type { Conexao } from './tipos'

type Props = {
  conexoes: Conexao[]
  selecionada: Conexao | null
  onSelecionar: (id: string) => void
  onNova: () => void
  onConectar: (id: string) => void
  conectandoId: string | null
}

export function DropdownConexao({
  conexoes,
  selecionada,
  onSelecionar,
  onNova,
  onConectar,
  conectandoId,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [aberto])

  return (
    <div className="p-3 border-b border-slate-200 bg-white">
      <div ref={ref} className="relative">
        <button
          onClick={() => setAberto((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 transition-colors text-left"
        >
          {selecionada ? (
            <>
              <div
                className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(
                  selecionada.nome
                )}`}
              >
                {selecionada.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {selecionada.nome}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusDot status={selecionada.status} />
                  <span className="text-[11px] text-slate-500 truncate">
                    {selecionada.status === 'conectado'
                      ? selecionada.numero_telefone ?? STATUS_LABEL[selecionada.status]
                      : STATUS_LABEL[selecionada.status]}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                <WifiOff className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 text-sm text-slate-500">Nenhuma conexão</div>
            </>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
              aberto ? 'rotate-180' : ''
            }`}
          />
        </button>

        {aberto && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-72 overflow-y-auto py-1">
              {conexoes.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  Nenhuma conexão cadastrada
                </div>
              )}
              {conexoes.map((c) => {
                const ativa = c.id === selecionada?.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelecionar(c.id)
                      setAberto(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                      ativa ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white ${corAvatar(
                        c.nome
                      )}`}
                    >
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{c.nome}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusDot status={c.status} />
                        <span className="text-[11px] text-slate-500 truncate">
                          {c.status === 'conectado'
                            ? c.numero_telefone ?? STATUS_LABEL[c.status]
                            : STATUS_LABEL[c.status]}
                        </span>
                      </div>
                    </div>
                    {ativa && <Check className="h-4 w-4 text-amber-600 shrink-0" />}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                setAberto(false)
                onNova()
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar nova conexão
            </button>
          </div>
        )}
      </div>

      {selecionada && selecionada.status !== 'conectado' && (
        <button
          onClick={() => onConectar(selecionada.id)}
          disabled={conectandoId === selecionada.id}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition-colors"
        >
          {conectandoId === selecionada.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <QrCode className="h-3.5 w-3.5" />
          )}
          {selecionada.status === 'aguardando_qr' ? 'Ver QR Code' : 'Conectar'}
        </button>
      )}
    </div>
  )
}
