'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [recolhida, setRecolhida] = useState(false)

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar
        aberta={sidebarAberta}
        aoFechar={() => setSidebarAberta(false)}
        recolhida={recolhida}
      />

      <div
        className={[
          'flex flex-col flex-1 min-w-0 transition-[margin] duration-300 ease-in-out',
          recolhida ? 'lg:ml-16' : 'lg:ml-64',
        ].join(' ')}
      >
        <Header
          aoAbrirSidebar={() => setSidebarAberta(true)}
          aoAlternarRecolhida={() => setRecolhida((v) => !v)}
          recolhida={recolhida}
        />
        <main className="flex-1 p-4 lg:p-6" id="conteudo-principal">
          {children}
        </main>
      </div>
    </div>
  )
}
