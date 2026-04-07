'use client'

import { useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
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
import { Users } from 'lucide-react'

import { KanbanCard } from './kanban-card'
import { KanbanColuna } from './kanban-coluna'
import { BarraPesquisa } from './barra-pesquisa'
import { SheetCliente } from './sheet-cliente'
import { ModalCliente } from './modal-cliente'
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

function filtrarClientes(clientes: Cliente[], filtros: FiltrosAtivos): Cliente[] {
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
// Props e Ref
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  estagios: EstagioKanban[]
  clientesIniciais: Cliente[]
}

export interface KanbanBoardRef {
  abrirNovoCliente: (estagioId?: string) => void
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(
function KanbanBoard({ estagios, clientesIniciais }, ref) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [filtros, setFiltros] = useState<FiltrosAtivos>({ busca: '', origens: [], tags: [] })
  const [cardArrastando, setCardArrastando] = useState<Cliente | null>(null)

  // Estado do Sheet
  const [sheetAberto, setSheetAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [estagioIdSheet, setEstagioIdSheet] = useState<string>('')

  // Estado de delete
  const [deletando, setDeletando] = useState<string | null>(null)

  // Estado do Modal de detalhes
  const [clienteModal, setClienteModal] = useState<Cliente | null>(null)

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
  // Handlers CRUD
  // ---------------------------------------------------------------------------

  function abrirNovoCliente(estagioId?: string) {
    setClienteEditando(null)
    setEstagioIdSheet(estagioId ?? estagios[0]?.id ?? '')
    setSheetAberto(true)
  }

  // Expor método para o componente pai
  useImperativeHandle(ref, () => ({ abrirNovoCliente }))

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente)
    setEstagioIdSheet(cliente.estagio_id)
    setSheetAberto(true)
  }

  function abrirModal(cliente: Cliente) {
    setClienteModal(cliente)
  }

  function fecharModal() {
    setClienteModal(null)
  }

  function aoAtualizarCliente(clienteAtualizado: Cliente) {
    setClientes((prev) => prev.map((c) => c.id === clienteAtualizado.id ? clienteAtualizado : c))
    // Manter modal sincronizado
    setClienteModal((prev) => prev?.id === clienteAtualizado.id ? clienteAtualizado : prev)
  }

  function fecharSheet() {
    setSheetAberto(false)
    setClienteEditando(null)
  }

  function aoSalvar(clienteSalvo: Cliente) {
    setClientes((prev) => {
      const existe = prev.find((c) => c.id === clienteSalvo.id)
      if (existe) return prev.map((c) => c.id === clienteSalvo.id ? clienteSalvo : c)
      return [clienteSalvo, ...prev]
    })
    fecharSheet()
  }

  async function aoDeletar(cliente: Cliente) {
    if (!confirm(`Deletar "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(cliente.id)
    const res = await fetch(`/api/clientes/${cliente.id}`, { method: 'DELETE' })
    if (res.ok) {
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
    }
    setDeletando(null)
  }

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

      const fromColId = encontrarColunaDoCard(agrupados, activeId)
      const toColId =
        over.data.current?.tipo === 'coluna'
          ? overId
          : encontrarColunaDoCard(agrupados, overId)

      // Reordenar dentro da mesma coluna
      if (over.data.current?.tipo !== 'coluna' && fromColId && toColId && fromColId === toColId) {
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
        return
      }

      // Persistir mudança de coluna no banco
      if (fromColId && toColId && fromColId !== toColId) {
        fetch(`/api/clientes/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estagio_id: toColId }),
        }).catch(() => {
          setClientes((prev) =>
            prev.map((c) => c.id === activeId ? { ...c, estagio_id: fromColId! } : c)
          )
        })
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
            {clientes.filter((c) => {
              const est = estagios.find((e) => e.id === c.estagio_id)
              return !est?.eh_final
            }).length}
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

      {/* Estado vazio global com filtros */}
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

      {/* Kanban board */}
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
              <div
                key={estagio.id}
                className={deletando ? 'pointer-events-none' : ''}
              >
                <KanbanColuna
                  estagio={estagio}
                  clientes={agrupadosFiltrados[estagio.id] ?? []}
                  totalClientes={agrupados[estagio.id]?.length ?? 0}
                  onNovoCliente={abrirNovoCliente}
                  aoClicar={abrirModal}
                  aoEditar={abrirEdicao}
                  aoDeletar={aoDeletar}
                />
              </div>
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

      {/* Modal de detalhes */}
      <ModalCliente
        cliente={clienteModal}
        estagios={estagios}
        aoFechar={fecharModal}
        aoEditar={(c) => { fecharModal(); abrirEdicao(c) }}
        aoAtualizar={aoAtualizarCliente}
        aoDeletar={(c) => { fecharModal(); aoDeletar(c) }}
      />

      {/* Sheet de cadastro/edição */}
      <SheetCliente
        aberto={sheetAberto}
        cliente={clienteEditando}
        estagios={estagios}
        estagioIdPadrao={estagioIdSheet}
        aoFechar={fecharSheet}
        aoSalvar={aoSalvar}
      />
    </div>
  )
})
