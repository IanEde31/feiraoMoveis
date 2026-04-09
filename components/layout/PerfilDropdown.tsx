'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
  HelpCircle,
  Loader2,
} from 'lucide-react'

export function PerfilDropdown() {
  const { user, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  if (!isLoaded) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" aria-hidden="true" />
    )
  }

  const nome = user?.fullName || user?.firstName || 'Minha conta'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const imagem = user?.imageUrl
  const iniciais = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') || 'FM'

  async function handleSair() {
    try {
      setSaindo(true)
      await signOut(() => router.push('/sign-in'))
    } finally {
      setSaindo(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
        aria-label="Abrir menu de perfil"
        aria-expanded={aberto}
        aria-haspopup="menu"
      >
        <div className="relative">
          {imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagem}
              alt={nome}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ouro-400 to-ouro-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white shadow-sm">
              {iniciais.toUpperCase()}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"
            aria-label="Online"
          />
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform hidden sm:block ${
            aberto ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center gap-3">
              {imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagem}
                  alt={nome}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-ouro-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ouro-400 to-ouro-600 flex items-center justify-center text-white text-base font-semibold ring-2 ring-ouro-200">
                  {iniciais.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-playfair text-sm font-semibold text-slate-900 truncate">
                  {nome}
                </p>
                {email && (
                  <p className="text-xs text-slate-500 truncate" title={email}>
                    {email}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="py-1.5">
            <button
              onClick={() => {
                setAberto(false)
                openUserProfile()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              role="menuitem"
            >
              <UserIcon size={16} className="text-slate-400" aria-hidden="true" />
              Meu perfil
            </button>
            <button
              onClick={() => {
                setAberto(false)
                openUserProfile()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              role="menuitem"
            >
              <Settings size={16} className="text-slate-400" aria-hidden="true" />
              Configurações da conta
            </button>
            <Link
              href="/dashboard"
              onClick={() => setAberto(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              role="menuitem"
            >
              <HelpCircle size={16} className="text-slate-400" aria-hidden="true" />
              Ajuda e suporte
            </Link>
          </div>

          <div className="border-t border-slate-100 py-1.5">
            <button
              onClick={handleSair}
              disabled={saindo}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
              role="menuitem"
            >
              {saindo ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut size={16} aria-hidden="true" />
              )}
              {saindo ? 'Saindo...' : 'Sair da conta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
