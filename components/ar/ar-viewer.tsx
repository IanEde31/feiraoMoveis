'use client'

import { useEffect } from 'react'

const GLB_URL =
  'https://atteroccvajbcwxsaoqp.supabase.co/storage/v1/object/sign/3dmodels/Sofa%20Free%20Version.glb?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hYmI1NDc2Zi0xNjI3LTQwZjktOWY4OS05ODU4ZmEyM2I1NWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiIzZG1vZGVscy9Tb2ZhIEZyZWUgVmVyc2lvbi5nbGIiLCJpYXQiOjE3NzU3MDc2MzksImV4cCI6MTc3NjMxMjQzOX0.p5GJS8D8H3NFNoNu9fPbHDwFtUPl1iDU7ry_eIqcQe8'

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
        },
        HTMLElement
      >
    }
  }
}

export function ArViewer() {
  useEffect(() => {
    if (document.querySelector('script[data-model-viewer]')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src =
      'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js'
    script.setAttribute('data-model-viewer', 'true')
    document.head.appendChild(script)
  }, [])

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* @ts-expect-error web component */}
      <model-viewer
        src={GLB_URL}
        ar
        ar-modes="scene-viewer quick-look webxr"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        alt="Modelo 3D — Sofá"
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
    </div>
  )
}
