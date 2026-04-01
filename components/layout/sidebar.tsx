'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquare,
  Wifi,
  X,
  ChevronRight,
} from 'lucide-react'

const itensNav = [
  { href: '/dashboard', icone: LayoutDashboard, rotulo: 'Dashboard' },
  { href: '/clientes', icone: Users, rotulo: 'Clientes' },
  { href: '/produtos', icone: Package, rotulo: 'Produtos' },
  { href: '/whatsapp', icone: MessageSquare, rotulo: 'WhatsApp' },
  { href: '/conexoes', icone: Wifi, rotulo: 'Conexões' },
]

interface SidebarProps {
  aberta: boolean
  aoFechar: () => void
}

export function Sidebar({ aberta, aoFechar }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={aoFechar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          aberta ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ouro-400 to-ouro-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="font-playfair font-bold text-white text-base leading-none">F</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-playfair text-white font-semibold text-sm leading-tight truncate">
                Feirão Móveis
              </span>
              <span className="text-ouro-400 text-xs font-medium leading-tight">
                Gestão Premium
              </span>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label="Fechar menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Navegação */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Menu principal"
        >
          <p className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </p>
          {itensNav.map(({ href, icone: Icone, rotulo }) => {
            const ativo =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                onClick={aoFechar}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'transition-all duration-150 group',
                  ativo
                    ? 'bg-ouro-600/10 text-ouro-400 border border-ouro-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                ].join(' ')}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone
                  size={18}
                  className={[
                    'flex-shrink-0 transition-colors',
                    ativo
                      ? 'text-ouro-400'
                      : 'text-slate-500 group-hover:text-slate-300',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="flex-1">{rotulo}</span>
                {ativo && (
                  <ChevronRight
                    size={14}
                    className="text-ouro-500 opacity-70"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="px-3 border-t border-slate-800">
          <div className="flex items-center gap-3 py-4">
            <UserButton afterSignOutUrl="/sign-in" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">Minha conta</p>
              <p className="text-slate-500 text-xs truncate">Feirão Móveis</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
