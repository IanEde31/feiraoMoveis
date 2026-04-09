'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Upload, X, Camera } from 'lucide-react'
import type { AmbienteImagem } from './tipos'

interface UploadAmbienteProps {
  ambiente: AmbienteImagem | null
  aoSelecionar: (a: AmbienteImagem | null) => void
}

const TAMANHO_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export function UploadAmbiente({ ambiente, aoSelecionar }: UploadAmbienteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [erroTamanho, setErroTamanho] = useState(false)

  const processarArquivo = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > TAMANHO_MAX_BYTES) {
        setErroTamanho(true)
        return
      }
      setErroTamanho(false)
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        aoSelecionar({ arquivo: file, url, largura: img.width, altura: img.height })
      }
      img.src = url
    },
    [aoSelecionar]
  )

  const aoSoltar = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setArrastando(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processarArquivo(file)
    },
    [processarArquivo]
  )

  const limpar = () => {
    if (ambiente?.url) URL.revokeObjectURL(ambiente.url)
    aoSelecionar(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (ambiente) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ambiente.url}
          alt="Ambiente do cliente"
          className="w-full h-full max-h-[420px] object-contain bg-slate-100"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="text-xs text-white/90 font-medium truncate">
            {ambiente.arquivo.name}
            {ambiente.largura && ambiente.altura && (
              <span className="text-white/60 ml-2 tabular-nums">
                {ambiente.largura}×{ambiente.altura}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => inputRef.current?.click()}
              className="h-8 px-3 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <Upload size={12} aria-hidden="true" />
              Trocar
            </button>
            <button
              onClick={limpar}
              className="h-8 w-8 rounded-lg bg-white/95 text-red-600 hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Remover ambiente"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) processarArquivo(file)
          }}
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setArrastando(true)
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={aoSoltar}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={[
        'relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
        'flex flex-col items-center justify-center text-center px-6 py-14 min-h-[320px]',
        arrastando
          ? 'border-ouro-500 bg-ouro-50/60 scale-[1.01]'
          : 'border-slate-300 bg-gradient-to-br from-slate-50 to-white hover:border-ouro-400 hover:bg-ouro-50/30',
      ].join(' ')}
    >
      <div
        className={[
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-colors',
          arrastando
            ? 'bg-ouro-500 text-white'
            : 'bg-white border border-slate-200 text-ouro-600',
        ].join(' ')}
      >
        <ImagePlus size={28} aria-hidden="true" />
      </div>
      <p className="font-playfair text-lg text-slate-800 font-semibold mb-1">
        Envie a foto do ambiente do cliente
      </p>
      <p className="text-sm text-slate-500 max-w-sm mb-5">
        Arraste e solte aqui ou clique para selecionar. Quanto melhor a iluminação e o
        enquadramento, mais realista será o resultado.
      </p>
      {erroTamanho && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium" role="alert">
          Arquivo muito grande. O limite é 10 MB. Escolha uma imagem menor.
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200">
          <Camera size={11} aria-hidden="true" /> JPG, PNG ou WEBP
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200">
          até 10 MB
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processarArquivo(file)
        }}
      />
    </div>
  )
}
