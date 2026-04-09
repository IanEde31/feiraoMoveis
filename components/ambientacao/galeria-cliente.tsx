'use client'

import { ImageOff, Trash2, Download, Images, User } from 'lucide-react'
import type { ClienteResumo, ItemGaleria } from './tipos'

interface GaleriaClienteProps {
  cliente: ClienteResumo | null
  itens: ItemGaleria[]
  carregando: boolean
  aoAbrir: (item: ItemGaleria) => void
  aoRemover: (item: ItemGaleria) => void
}

function formatarData(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export function GaleriaCliente({
  cliente,
  itens,
  carregando,
  aoAbrir,
  aoRemover,
}: GaleriaClienteProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
            <Images size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-playfair text-base font-semibold text-slate-900 leading-tight">
              Galeria do cliente
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {cliente
                ? `Ambientações salvas para ${cliente.nome}`
                : 'Selecione um cliente para ver a galeria'}
            </p>
          </div>
        </div>
        {cliente && itens.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-ouro-50 border border-ouro-200 text-xs font-semibold text-ouro-800 tabular-nums">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {/* Sem cliente */}
      {!cliente && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
            <User size={20} className="text-slate-300" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-500">
            Selecione um cliente no topo para começar a salvar ambientações.
          </p>
        </div>
      )}

      {/* Cliente sem itens */}
      {cliente && !carregando && itens.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
            <ImageOff size={20} className="text-slate-300" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-500">
            Nenhuma ambientação salva ainda para este cliente.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Gere uma imagem acima e ela aparecerá aqui automaticamente.
          </p>
        </div>
      )}

      {/* Carregando */}
      {cliente && carregando && (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 h-32 rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Lista horizontal */}
      {cliente && !carregando && itens.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {itens.map((item) => (
            <div
              key={item.id}
              className="group relative flex-shrink-0 w-48 rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-ouro-300 transition-all"
            >
              <button
                type="button"
                onClick={() => aoAbrir(item)}
                className="block w-full text-left"
                aria-label="Abrir ambientação"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.miniatura_url}
                    alt="Ambientação salva"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {formatarData(item.criada_em)}
                  </p>
                  <p className="text-xs font-medium text-slate-700 line-clamp-1 mt-0.5">
                    {item.produtos_nomes.length > 0
                      ? item.produtos_nomes.join(', ')
                      : `${item.produtos_ids.length} produtos`}
                  </p>
                </div>
              </button>

              {/* Ações no hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      const blob = await fetch(item.resultado_url).then((r) => r.blob())
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ambientacao-${item.id}.png`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch {
                      console.error('Falha ao baixar ambientação')
                    }
                  }}
                  className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-ouro-700 hover:bg-ouro-50 transition-colors"
                  aria-label="Baixar"
                >
                  <Download size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    aoRemover(item)
                  }}
                  className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
