'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Share2, Check } from 'lucide-react'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          ar?: boolean
          'ar-modes'?: string
          'camera-controls'?: boolean
          'touch-action'?: string
          'auto-rotate'?: boolean
          'shadow-intensity'?: string
          'environment-image'?: string
          alt?: string
          'ios-src'?: string
          loading?: string
          reveal?: string
        },
        HTMLElement
      >
    }
  }
}

interface ArViewerProps {
  src: string
  iosSrc?: string | null
  alt: string
  produtoId: string
}

export function ArViewer({ src, iosSrc, alt, produtoId }: ArViewerProps) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (document.querySelector('script[data-model-viewer]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src =
      'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js'
    script.setAttribute('data-model-viewer', 'true')
    document.head.appendChild(script)
  }, [])

  // Escuta eventos do model-viewer para loading/erro
  useEffect(() => {
    const intervalo = setInterval(() => {
      const mv = document.querySelector('model-viewer') as HTMLElement & {
        loaded?: boolean
      } | null
      if (mv) {
        clearInterval(intervalo)

        mv.addEventListener('load', () => setCarregando(false))
        mv.addEventListener('error', () => {
          setCarregando(false)
          setErro(true)
        })

        // Se já carregou antes do listener
        if (mv.loaded) setCarregando(false)
      }
    }, 100)

    return () => clearInterval(intervalo)
  }, [src])

  async function compartilhar() {
    const url = `${window.location.origin}/ar/${produtoId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
      {/* Skeleton de loading */}
      {carregando && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50">
          <Loader2 size={32} className="text-ouro-500 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-500">Carregando modelo 3D...</span>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-red-50">
          <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
          <span className="text-sm text-red-600 font-medium">Falha ao carregar o modelo 3D</span>
          <span className="text-xs text-red-400">Verifique se o arquivo .glb é válido</span>
        </div>
      )}

      {/* @ts-expect-error web component */}
      <model-viewer
        src={src}
        {...(iosSrc ? { 'ios-src': iosSrc } : {})}
        ar
        ar-modes="scene-viewer quick-look webxr"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        loading="eager"
        reveal="auto"
        alt={alt}
        style={{
          width: '100%',
          height: '70vh',
          minHeight: '420px',
          backgroundColor: '#f8fafc',
        }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full bg-gradient-to-br from-ouro-400 to-ouro-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-shadow"
        >
          Ver no seu ambiente
        </button>
        {/* @ts-expect-error web component */}
      </model-viewer>

      {/* Botão compartilhar */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={compartilhar}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          aria-label="Compartilhar link AR"
        >
          {copiado ? (
            <>
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
              <span className="text-emerald-600">Link copiado!</span>
            </>
          ) : (
            <>
              <Share2 size={14} aria-hidden="true" />
              Compartilhar AR
            </>
          )}
        </button>
      </div>
    </div>
  )
}
