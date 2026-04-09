'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Package,
  UserPlus,
  AlertTriangle,
} from 'lucide-react'

type TipoNotificacao = 'mensagem' | 'cliente' | 'estoque' | 'alerta'

interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  descricao: string
  tempo: string
  lida: boolean
}

const NOTIFICACOES_INICIAIS: Notificacao[] = [
  {
    id: '1',
    tipo: 'mensagem',
    titulo: 'Nova mensagem no WhatsApp',
    descricao: 'Mariana Costa enviou uma foto do ambiente',
    tempo: 'Há 2 min',
    lida: false,
  },
  {
    id: '2',
    tipo: 'cliente',
    titulo: 'Novo cliente no pipeline',
    descricao: 'Roberto Almeida foi adicionado em "Interesse"',
    tempo: 'Há 18 min',
    lida: false,
  },
  {
    id: '3',
    tipo: 'estoque',
    titulo: 'Estoque crítico',
    descricao: 'Sofá Milano (Veludo Esmeralda) — restam 2 unidades',
    tempo: 'Há 1 h',
    lida: false,
  },
  {
    id: '4',
    tipo: 'alerta',
    titulo: 'Conexão WhatsApp instável',
    descricao: 'Instância "Showroom" reconectou automaticamente',
    tempo: 'Há 3 h',
    lida: true,
  },
]

const ICONES: Record<TipoNotificacao, { Icone: typeof Bell; cor: string; bg: string }> = {
  mensagem: { Icone: MessageSquare, cor: 'text-emerald-600', bg: 'bg-emerald-50' },
  cliente: { Icone: UserPlus, cor: 'text-blue-600', bg: 'bg-blue-50' },
  estoque: { Icone: Package, cor: 'text-amber-600', bg: 'bg-amber-50' },
  alerta: { Icone: AlertTriangle, cor: 'text-rose-600', bg: 'bg-rose-50' },
}

export function NotificacoesDropdown() {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_INICIAIS)
  const ref = useRef<HTMLDivElement>(null)

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes])

  useEffect(() => {
    if (!aberto) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [aberto])

  function marcarTodasLidas() {
    setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })))
  }

  function marcarLida(id: string) {
    setNotificacoes((atual) =>
      atual.map((n) => (n.id === id ? { ...n, lida: true } : n))
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
        aria-label={`Ver notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="menu"
      >
        <Bell size={18} aria-hidden="true" />
        {naoLidas > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-ouro-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="font-playfair text-sm font-semibold text-slate-900">
                Notificações
              </p>
              <p className="text-xs text-slate-500">
                {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia'}
              </p>
            </div>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-1 text-xs font-medium text-ouro-600 hover:text-ouro-700 hover:bg-ouro-50 px-2 py-1 rounded-md transition-colors"
              >
                <CheckCheck size={14} aria-hidden="true" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
                <p className="text-sm text-slate-500">Nenhuma notificação</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notificacoes.map((n) => {
                  const { Icone, cor, bg } = ICONES[n.tipo]
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => marcarLida(n.id)}
                        className={[
                          'w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50',
                          !n.lida && 'bg-ouro-50/30',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icone size={16} className={cor} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {n.titulo}
                            </p>
                            {!n.lida && (
                              <span
                                className="w-2 h-2 bg-ouro-500 rounded-full flex-shrink-0 mt-1.5"
                                aria-label="Não lida"
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {n.descricao}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">{n.tempo}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
            <button className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-900 py-1 flex items-center justify-center gap-1.5 transition-colors">
              <Check size={12} aria-hidden="true" />
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
