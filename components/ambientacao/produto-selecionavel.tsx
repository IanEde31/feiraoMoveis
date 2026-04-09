'use client'

import { Check, Package } from 'lucide-react'
import type { Produto } from './tipos'
import { formatarPreco } from '@/components/produtos/tipos'

interface ProdutoSelecionavelProps {
  produto: Produto
  selecionado: boolean
  aoAlternar: (p: Produto) => void
}

export function ProdutoSelecionavel({
  produto,
  selecionado,
  aoAlternar,
}: ProdutoSelecionavelProps) {
  const imagem = produto.imagens?.[0] ?? null

  return (
    <button
      type="button"
      onClick={() => aoAlternar(produto)}
      aria-pressed={selecionado}
      className={[
        'relative group rounded-xl overflow-hidden border bg-white text-left transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
        selecionado
          ? 'border-ouro-500 ring-2 ring-ouro-500/30 shadow-md'
          : 'border-slate-200 hover:border-ouro-300 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagem}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Package size={24} className="text-slate-300" aria-hidden="true" />
          </div>
        )}

        {/* Overlay quando selecionado */}
        <div
          className={[
            'absolute inset-0 transition-opacity',
            selecionado ? 'bg-ouro-500/10' : 'opacity-0',
          ].join(' ')}
        />

        {/* Checkbox */}
        <div
          className={[
            'absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            selecionado
              ? 'bg-ouro-500 border-ouro-500 text-white shadow-md'
              : 'bg-white/90 border-white text-transparent group-hover:border-ouro-300',
          ].join(' ')}
        >
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        </div>
      </div>

      <div className="p-2.5">
        <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug min-h-[2rem]">
          {produto.nome}
        </p>
        <p className="text-sm font-bold text-ouro-700 tabular-nums mt-1">
          {formatarPreco(produto.preco_venda)}
        </p>
      </div>
    </button>
  )
}
