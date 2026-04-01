import { UserPlus } from 'lucide-react'
import { KanbanBoard } from '@/components/clientes/kanban-board'
import { estagiosMock, clientesMock } from '@/components/clientes/dados-mock'

export default function PaginaClientes() {
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 active:scale-95"
          aria-label="Adicionar novo cliente"
        >
          <UserPlus size={16} aria-hidden="true" />
          Novo Cliente
        </button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        estagios={estagiosMock}
        clientesIniciais={clientesMock}
      />
    </div>
  )
}
