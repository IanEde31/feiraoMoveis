'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Users, TrendingUp } from 'lucide-react'

import { KanbanCard } from './kanban-card'
import { KanbanColuna } from './kanban-coluna'
import { BarraPesquisa } from './barra-pesquisa'
import type { EstagioKanban, Cliente, FiltrosAtivos } from './tipos'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function agruparPorEstagio(clientes: Cliente[]): Record<string, Cliente[]> {
  return clientes.reduce<Record<string, Cliente[]>>((acc, c) => {
    if (!acc[c.estagio_id]) acc[c.estagio_id] = []
    acc[c.estagio_id].push(c)
    return acc
  }, {})
}

function encontrarColunaDoCard(
  agrupados: Record<string, Cliente[]>,
  cardId: string
): string | null {
  for (const [estagioId, lista] of Object.entries(agrupados)) {
    if (lista.some((c) => c.id === cardId)) return estagioId
  }
  return null
}

function filtrarClientes(
  clientes: Cliente[],
  filtros: FiltrosAtivos
): Cliente[] {
  return clientes.filter((c) => {
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase()
      const bate =
        c.nome.toLowerCase().includes(q) ||
        c.telefone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      if (!bate) return false
    }
    if (filtros.origens.length > 0 && (!c.origem || !filtros.origens.includes(c.origem))) {
      return false
    }
    if (filtros.tags.length > 0 && !filtros.tags.every((t) => c.tags.includes(t))) {
      return false
    }
    return true
  })
}

function formatarValorTotal(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  estagios: EstagioKanban[]
  clientesIniciais: Cliente[]
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export function KanbanBoard({ estagios, clientesIniciais }: KanbanBoardProps) {
  // Estado dos clientes (muda com DnD)
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)

  // Estado dos filtros
  const [filtros, setFiltros] = useState<FiltrosAtivos>({ busca: '', origens: [], tags: [] })

  // Card sendo arrastado (para DragOverlay)
  const [cardArrastando, setCardArrastando] = useState<Cliente | null>(null)

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => filtrarClientes(clientes, filtros), [clientes, filtros])

  // Agrupamentos
  const agrupados = useMemo(() => agruparPorEstagio(clientes), [clientes])
  const agrupadosFiltrados = useMemo(() => agruparPorEstagio(clientesFiltrados), [clientesFiltrados])

  // Totais para o summary bar
  const totalValorPipeline = useMemo(
    () =>
      clientes
        .filter((c) => {
          const est = estagios.find((e) => e.id === c.estagio_id)
          return !est?.eh_final || est.tipo_final === 'ganho'
        })
        .reduce((acc, c) => acc + (c.valor_estimado ?? 0), 0),
    [clientes, estagios]
  )

  const totalGanho = useMemo(
    () =>
      clientes
        .filter((c) => estagios.find((e) => e.id === c.estagio_id)?.tipo_final === 'ganho')
        .reduce((acc, c) => acc + (c.valor_estimado ?? 0), 0),
    [clientes, estagios]
  )

  // ---------------------------------------------------------------------------
  // Sensores DnD
  // ---------------------------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ---------------------------------------------------------------------------
  // Handlers DnD
  // ---------------------------------------------------------------------------

  const onDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const colId = encontrarColunaDoCard(agrupados, active.id as string)
      if (colId) {
        const card = agrupados[colId]?.find((c) => c.id === active.id) ?? null
        setCardArrastando(card)
      }
    },
    [agrupados]
  )

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const fromColId = encontrarColunaDoCard(agrupados, activeId)
      const toColId =
        over.data.current?.tipo === 'coluna'
          ? overId
          : encontrarColunaDoCard(agrupados, overId)

      if (!fromColId || !toColId || fromColId === toColId) return

      setClientes((prev) => {
        const fromArr = prev.filter((c) => c.id !== activeId)
        const card = prev.find((c) => c.id === activeId)
        if (!card) return prev

        const movedCard = { ...card, estagio_id: toColId }

        // Inserir na posição correta dentro da coluna destino
        const destArr = fromArr.filter((c) => c.estagio_id === toColId)
        const overIdx = destArr.findIndex((c) => c.id === overId)

        // Rebuild final list maintaining order
        const result: Cliente[] = []
        let inserido = false
        for (const c of fromArr) {
          if (c.id === overId && !inserido) {
            result.push(movedCard)
            inserido = true
          }
          result.push(c)
        }
        if (!inserido) result.push(movedCard)

        return result
      })
    },
    [agrupados]
  )

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setCardArrastando(null)
      if (!over || active.id === over.id) return

      const activeId = active.id as string
      const overId = over.id as string

      // Reordenar dentro da mesma coluna
      if (over.data.current?.tipo !== 'coluna') {
        const fromColId = encontrarColunaDoCard(agrupados, activeId)
        const toColId = encontrarColunaDoCard(agrupados, overId)

        if (fromColId && toColId && fromColId === toColId) {
          const lista = agrupados[fromColId] ?? []
          const oldIdx = lista.findIndex((c) => c.id === activeId)
          const newIdx = lista.findIndex((c) => c.id === overId)

          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            const reordenada = arrayMove(lista, oldIdx, newIdx)
            setClientes((prev) => {
              const outros = prev.filter((c) => c.estagio_id !== fromColId)
              return [...outros, ...reordenada]
            })
          }
        }
      }
    },
    [agrupados]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-500">Total de clientes</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
            {clientes.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-500">Pipeline ativo</p>
          <p className="text-xl font-bold text-ouro-700 tabular-nums mt-0.5">
            {formatarValorTotal(totalValorPipeline)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-500">Receita fechada</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">
            {formatarValorTotal(totalGanho)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-500">Em negociação</p>
          <p className="text-xl font-bold text-orange-600 tabular-nums mt-0.5">
            {agrupados['negociacao']?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <BarraPesquisa
        filtros={filtros}
        onChange={setFiltros}
        totalVisiveis={clientesFiltrados.length}
        totalGeral={clientes.length}
      />

      {/* Estado vazio global */}
      {clientesFiltrados.length === 0 && (filtros.busca || filtros.origens.length > 0 || filtros.tags.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Users size={22} className="text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Nenhum cliente encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou a busca</p>
          </div>
          <button
            onClick={() => setFiltros({ busca: '', origens: [], tags: [] })}
            className="text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded px-2 py-1"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Kanban board com scroll horizontal */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 lg:-mx-6 px-4 lg:px-6"
          role="region"
          aria-label="Kanban de clientes — arraste os cards para mover entre estágios"
        >
          {estagios
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((estagio) => (
              <KanbanColuna
                key={estagio.id}
                estagio={estagio}
                clientes={agrupadosFiltrados[estagio.id] ?? []}
                totalClientes={agrupados[estagio.id]?.length ?? 0}
              />
            ))}
        </div>

        {/* Overlay do card sendo arrastado */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {cardArrastando && (
            <KanbanCard
              cliente={cardArrastando}
              estagioCor={
                estagios.find((e) => e.id === cardArrastando.estagio_id)?.cor ?? '#94a3b8'
              }
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
