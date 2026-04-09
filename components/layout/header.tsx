'use client'

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { NotificacoesDropdown } from './NotificacoesDropdown'
import { PerfilDropdown } from './PerfilDropdown'

const mapeamentoTitulos: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/whatsapp': 'WhatsApp',
  '/conexoes': 'Conexões',
}

interface HeaderProps {
  aoAbrirSidebar: () => void
  aoAlternarRecolhida: () => void
  recolhida: boolean
}

export function Header({ aoAbrirSidebar, aoAlternarRecolhida, recolhida }: HeaderProps) {
  const pathname = usePathname()

  const titulo =
    Object.entries(mapeamentoTitulos).find(([key]) =>
      pathname.startsWith(key)
    )?.[1] ?? 'Dashboard'

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={aoAbrirSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          aria-label="Abrir menu de navegação"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <button
          onClick={aoAlternarRecolhida}
          className="hidden lg:inline-flex p-1.5 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          aria-label={recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={recolhida ? 'Expandir menu' : 'Recolher menu'}
        >
          {recolhida ? (
            <PanelLeftOpen size={16} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} aria-hidden="true" />
          )}
        </button>
        <h1 className="font-playfair text-lg font-semibold text-slate-900">
          {titulo}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <NotificacoesDropdown />
        <div className="w-px h-6 bg-slate-200 mx-1.5" aria-hidden="true" />
        <PerfilDropdown />
      </div>
    </header>
  )
}
