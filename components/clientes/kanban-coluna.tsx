'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { KanbanCard } from './kanban-card'
import type { EstagioKanban, Cliente } from './tipos'

function formatarValor(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

interface KanbanColunaProps {
  estagio: EstagioKanban
  clientes: Cliente[]
  totalClientes: number // total sem filtro (para exibir no header)
  onNovoCliente?: (estagioId: string) => void
}

export function KanbanColuna({ estagio, clientes, totalClientes, onNovoCliente }: KanbanColunaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: estagio.id,
    data: { tipo: 'coluna', estagioId: estagio.id },
  })

  const totalValor = clientes.reduce((acc, c) => acc + (c.valor_estimado ?? 0), 0)

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col"
      role="region"
      aria-label={`Coluna ${estagio.nome}, ${totalClientes} cliente${totalClientes !== 1 ? 's' : ''}`}
    >
      {/* Header da coluna */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: estagio.cor }}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-slate-700 flex-1 truncate">
          {estagio.nome}
        </span>
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: estagio.cor }}
          aria-label={`${totalClientes} clientes`}
        >
          {totalClientes}
        </span>
      </div>

      {/* Valor total da coluna */}
      {totalValor > 0 && (
        <p className="text-xs text-slate-400 px-1 mb-2 tabular-nums">
          Total: <span className="font-semibold text-slate-600">{formatarValor(totalValor)}</span>
        </p>
      )}

      {/* Área droppable */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 min-h-[160px] rounded-xl p-2 flex flex-col gap-2',
          'transition-colors duration-150',
          isOver
            ? 'bg-ouro-50 border-2 border-dashed border-ouro-400'
            : 'bg-slate-100/70 border-2 border-transparent',
        ].join(' ')}
      >
        <SortableContext
          items={clientes.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {clientes.map((cliente) => (
            <KanbanCard
              key={cliente.id}
              cliente={cliente}
              estagioCor={estagio.cor}
            />
          ))}
        </SortableContext>

        {/* Estado vazio */}
        {clientes.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1 py-6 text-center">
            <div
              className="w-6 h-6 rounded-full border-2 border-dashed flex-shrink-0"
              style={{ borderColor: estagio.cor + '60' }}
              aria-hidden="true"
            />
            <p className="text-xs text-slate-400">
              {isOver ? 'Soltar aqui' : 'Nenhum cliente'}
            </p>
          </div>
        )}
      </div>

      {/* Botão adicionar */}
      <button
        onClick={() => onNovoCliente?.(estagio.id)}
        className="mt-2 mx-1 flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 group"
        aria-label={`Adicionar cliente em ${estagio.nome}`}
      >
        <Plus size={13} className="text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
        Adicionar cliente
      </button>
    </div>
  )
}
