'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, User, UserPlus, Check, Phone } from 'lucide-react'
import type { ClienteResumo } from './tipos'

interface SeletorClienteProps {
  clientes: ClienteResumo[]
  clienteAtivo: ClienteResumo | null
  contagemPorCliente: Record<string, number>
  aoSelecionar: (c: ClienteResumo | null) => void
}

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function SeletorCliente({
  clientes,
  clienteAtivo,
  contagemPorCliente,
  aoSelecionar,
}: SeletorClienteProps) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  // Fechar com ESC
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aberto])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.telefone?.toLowerCase().includes(termo)
    )
  }, [clientes, busca])

  return (
    <div ref={ref} className="relative w-full sm:w-[340px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={[
          'w-full h-14 px-3 pr-3 rounded-2xl border bg-white shadow-sm flex items-center gap-3 text-left transition-all',
          aberto
            ? 'border-ouro-400 ring-2 ring-ouro-500/20'
            : 'border-slate-200 hover:border-ouro-300 hover:shadow-md',
        ].join(' ')}
      >
        <div
          className={[
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shadow-sm',
            clienteAtivo
              ? 'bg-gradient-to-br from-ouro-400 to-ouro-600 text-white'
              : 'bg-slate-100 text-slate-400',
          ].join(' ')}
        >
          {clienteAtivo ? iniciais(clienteAtivo.nome) : <User size={18} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 leading-none">
            Cliente
          </p>
          {clienteAtivo ? (
            <>
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight mt-1">
                {clienteAtivo.nome}
              </p>
              {clienteAtivo.telefone && (
                <p className="text-xs text-slate-500 truncate leading-tight">
                  {clienteAtivo.telefone}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium text-slate-500 leading-tight mt-1">
              Selecionar cliente
            </p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={[
            'flex-shrink-0 text-slate-400 transition-transform',
            aberto ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      {/* Popover */}
      {aberto && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Busca */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                autoFocus
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ouro-500/30 focus:border-ouro-400"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[320px] overflow-y-auto py-1" role="listbox">
            {filtrados.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                Nenhum cliente encontrado
              </div>
            ) : (
              filtrados.map((c) => {
                const ativo = clienteAtivo?.id === c.id
                const qtd = contagemPorCliente[c.id] ?? 0
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={ativo}
                    onClick={() => {
                      aoSelecionar(c)
                      setAberto(false)
                      setBusca('')
                    }}
                    className={[
                      'w-full px-3 py-2 flex items-center gap-3 text-left transition-colors',
                      ativo ? 'bg-ouro-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 flex items-center justify-center font-semibold text-xs">
                      {iniciais(c.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate leading-tight">
                        {c.nome}
                      </p>
                      {c.telefone && (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 leading-tight mt-0.5">
                          <Phone size={10} aria-hidden="true" />
                          {c.telefone}
                        </p>
                      )}
                    </div>
                    {qtd > 0 && (
                      <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-ouro-100 text-ouro-800 text-[11px] font-bold tabular-nums">
                        {qtd}
                      </span>
                    )}
                    {ativo && (
                      <Check size={14} className="text-ouro-600 flex-shrink-0" aria-hidden="true" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="border-t border-slate-100 p-2">
            <a
              href="/clientes"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-ouro-700 transition-colors"
            >
              <UserPlus size={13} aria-hidden="true" />
              Cadastrar novo cliente
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
