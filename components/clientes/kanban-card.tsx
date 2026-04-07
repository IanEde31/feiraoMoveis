'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Phone, GripVertical, MessageCircle, MapPin, Globe, Instagram, Users, Pencil, Trash2 } from 'lucide-react'
import type { Cliente, Origem } from './tipos'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatarTelefone(tel: string): string {
  const n = tel.replace(/\D/g, '').replace(/^55/, '')
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return tel
}

function formatarValor(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

function diasDesde(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}

function iniciaisNome(nome: string): string {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Cor do avatar baseada no nome (determinística)
const coresAvatar = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]
function corAvatar(nome: string): string {
  const sum = nome.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return coresAvatar[sum % coresAvatar.length]
}

const origemConfig: Record<Origem, { rotulo: string; icone: React.ElementType; cor: string }> = {
  whatsapp:    { rotulo: 'WhatsApp',    icone: MessageCircle, cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  indicacao:   { rotulo: 'Indicação',   icone: Users,         cor: 'bg-violet-50  text-violet-700  border-violet-200' },
  loja_fisica: { rotulo: 'Loja',        icone: MapPin,        cor: 'bg-amber-50   text-amber-700   border-amber-200' },
  site:        { rotulo: 'Site',        icone: Globe,         cor: 'bg-blue-50    text-blue-700    border-blue-200' },
  instagram:   { rotulo: 'Instagram',   icone: Instagram,     cor: 'bg-pink-50    text-pink-700    border-pink-200' },
  outro:       { rotulo: 'Outro',       icone: Users,         cor: 'bg-slate-50   text-slate-600   border-slate-200' },
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  cliente: Cliente
  estagioCor: string
  isDragOverlay?: boolean
  aoClicar?: (cliente: Cliente) => void
  aoEditar?: (cliente: Cliente) => void
  aoDeletar?: (cliente: Cliente) => void
}

export function KanbanCard({ cliente, estagioCor, isDragOverlay = false, aoClicar, aoEditar, aoDeletar }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cliente.id,
    data: { tipo: 'card', estagioId: cliente.estagio_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const origem = cliente.origem ? origemConfig[cliente.origem] : null
  const OrigemIcone = origem?.icone

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group bg-white rounded-xl border border-slate-200 shadow-sm',
        'flex flex-col gap-0 overflow-hidden',
        'transition-shadow duration-150',
        isDragging
          ? 'opacity-40 shadow-none'
          : 'hover:shadow-md',
        isDragOverlay
          ? 'shadow-xl ring-2 ring-ouro-400 rotate-1 scale-105'
          : '',
        aoClicar && !isDragOverlay ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => !isDragOverlay && aoClicar?.(cliente)}
      role={aoClicar && !isDragOverlay ? 'button' : undefined}
      tabIndex={aoClicar && !isDragOverlay ? 0 : undefined}
      onKeyDown={aoClicar && !isDragOverlay
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoClicar(cliente) } }
        : undefined
      }
      aria-label={aoClicar && !isDragOverlay
        ? `Ver detalhes de ${cliente.nome}`
        : `Cliente ${cliente.nome}${cliente.valor_estimado ? `, valor estimado ${formatarValor(cliente.valor_estimado)}` : ''}`
      }
    >
      {/* Barra colorida do estágio */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: estagioCor }} />

      <div className="p-3 flex flex-col gap-2.5">
        {/* Header: avatar + nome + drag handle */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${corAvatar(cliente.nome)}`}
            aria-hidden="true"
          >
            {iniciaisNome(cliente.nome)}
          </div>

          {/* Nome */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
              {cliente.nome}
            </p>
            {cliente.email && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{cliente.email}</p>
            )}
          </div>

          {/* Ações + drag handle — visíveis no hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {aoEditar && !isDragOverlay && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); aoEditar(cliente) }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-ouro-700 hover:bg-ouro-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
                aria-label={`Editar ${cliente.nome}`}
              >
                <Pencil size={11} aria-hidden="true" />
              </button>
            )}
            {aoDeletar && !isDragOverlay && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); aoDeletar(cliente) }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label={`Deletar ${cliente.nome}`}
              >
                <Trash2 size={11} aria-hidden="true" />
              </button>
            )}
            <div
              {...listeners}
              {...attributes}
              className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
              aria-label="Arrastar card"
            >
              <GripVertical size={14} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Telefone */}
        {cliente.telefone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone size={11} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{formatarTelefone(cliente.telefone)}</span>
          </div>
        )}

        {/* Origem */}
        {origem && OrigemIcone && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${origem.cor}`}>
              <OrigemIcone size={10} aria-hidden="true" />
              {origem.rotulo}
            </span>
          </div>
        )}

        {/* Tags */}
        {cliente.tags.length > 0 && (
          <div className="flex flex-wrap gap-1" aria-label="Tags">
            {cliente.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
            {cliente.tags.length > 2 && (
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                +{cliente.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Rodapé: valor + tempo */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          {cliente.valor_estimado ? (
            <span className="text-xs font-semibold text-ouro-700 tabular-nums">
              {formatarValor(cliente.valor_estimado)}
            </span>
          ) : (
            <span className="text-xs text-slate-300">Sem estimativa</span>
          )}
          <span className="text-xs text-slate-400">{diasDesde(cliente.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
