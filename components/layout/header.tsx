'use client'

import { Menu, Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'

const mapeamentoTitulos: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/whatsapp': 'WhatsApp',
  '/conexoes': 'Conexões',
}

interface HeaderProps {
  aoAbrirSidebar: () => void
}

export function Header({ aoAbrirSidebar }: HeaderProps) {
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
        <h1 className="font-playfair text-lg font-semibold text-slate-900">
          {titulo}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          aria-label="Ver notificações"
        >
          <Bell size={18} aria-hidden="true" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-ouro-500 rounded-full border-2 border-white"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  )
}
