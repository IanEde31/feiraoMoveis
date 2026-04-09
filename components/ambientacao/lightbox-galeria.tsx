'use client'

import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Calendar, Package } from 'lucide-react'
import type { ItemGaleria } from './tipos'

interface LightboxGaleriaProps {
  itens: ItemGaleria[]
  indiceAtivo: number
  aoFechar: () => void
  aoNavegar: (indice: number) => void
}

function formatarData(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export function LightboxGaleria({
  itens,
  indiceAtivo,
  aoFechar,
  aoNavegar,
}: LightboxGaleriaProps) {
  const item = itens[indiceAtivo]
  const temAnterior = indiceAtivo > 0
  const temProximo = indiceAtivo < itens.length - 1

  const irAnterior = useCallback(() => {
    if (temAnterior) aoNavegar(indiceAtivo - 1)
  }, [temAnterior, indiceAtivo, aoNavegar])

  const irProximo = useCallback(() => {
    if (temProximo) aoNavegar(indiceAtivo + 1)
  }, [temProximo, indiceAtivo, aoNavegar])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar()
      if (e.key === 'ArrowLeft') irAnterior()
      if (e.key === 'ArrowRight') irProximo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aoFechar, irAnterior, irProximo])

  // Bloqueia scroll do body enquanto aberto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!item) return null

  async function baixar() {
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
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de ambientações"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white/50 text-sm tabular-nums">
            {indiceAtivo + 1} / {itens.length}
          </span>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/60 text-xs min-w-0">
            <Calendar size={12} aria-hidden="true" />
            <span className="truncate">{formatarData(item.criada_em)}</span>
          </div>
          {item.produtos_nomes.length > 0 && (
            <>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs min-w-0">
                <Package size={12} aria-hidden="true" />
                <span className="truncate max-w-xs">
                  {item.produtos_nomes.join(', ')}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={baixar}
            className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            aria-label="Baixar imagem"
          >
            <Download size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
          <button
            type="button"
            onClick={aoFechar}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Área da imagem com botões de navegação */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 px-14">
        {/* Botão anterior */}
        <button
          type="button"
          onClick={irAnterior}
          disabled={!temAnterior}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors z-10"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        {/* Imagem */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={item.id}
          src={item.resultado_url}
          alt="Ambientação gerada"
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        />

        {/* Botão próximo */}
        <button
          type="button"
          onClick={irProximo}
          disabled={!temProximo}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors z-10"
          aria-label="Próxima foto"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Thumbnails na parte inferior */}
      {itens.length > 1 && (
        <div className="flex-shrink-0 pb-4 pt-3">
          <div className="flex gap-2 justify-center px-4 overflow-x-auto">
            {itens.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => aoNavegar(idx)}
                className={[
                  'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                  idx === indiceAtivo
                    ? 'border-ouro-400 opacity-100 scale-110'
                    : 'border-transparent opacity-50 hover:opacity-80',
                ].join(' ')}
                aria-label={`Ver foto ${idx + 1}`}
                aria-current={idx === indiceAtivo}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.miniatura_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      <div
        className="absolute inset-0 -z-10"
        onClick={aoFechar}
        aria-hidden="true"
      />
    </div>
  )
}
