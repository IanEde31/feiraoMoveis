'use client'

import { useRef } from 'react'
import { UserPlus } from 'lucide-react'
import { KanbanBoard, type KanbanBoardRef } from './kanban-board'
import type { EstagioKanban, Cliente } from './tipos'

interface PaginaClientesClientProps {
  estagios: EstagioKanban[]
  clientesIniciais: Cliente[]
}

export function PaginaClientesClient({ estagios, clientesIniciais }: PaginaClientesClientProps) {
  const boardRef = useRef<KanbanBoardRef>(null)

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-slate-900">
            Clientes
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Gerencie o funil de vendas e acompanhe negociações
          </p>
        </div>

        <button
          onClick={() => boardRef.current?.abrirNovoCliente()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 active:scale-95"
          aria-label="Adicionar novo cliente"
        >
          <UserPlus size={16} aria-hidden="true" />
          Novo Cliente
        </button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        ref={boardRef}
        estagios={estagios}
        clientesIniciais={clientesIniciais}
      />
    </div>
  )
}
