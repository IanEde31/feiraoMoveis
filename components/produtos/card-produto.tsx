'use client'

import { Package, Pencil, EyeOff, Eye, Trash2 } from 'lucide-react'
import type { Produto } from './tipos'
import { nivelEstoque, formatarPreco } from './tipos'

interface CardProdutoProps {
  produto: Produto
  aoClicar: (produto: Produto) => void
  aoEditar: (produto: Produto) => void
  aoAlternarAtivo: (produto: Produto) => void
  aoDeletar: (produto: Produto) => void
}

const badgeEstoque: Record<string, { texto: string; classe: string }> = {
  ok:      { texto: 'Em estoque',     classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  baixo:   { texto: 'Estoque baixo',  classe: 'bg-amber-50  text-amber-700  border-amber-200' },
  critico: { texto: 'Sem estoque',    classe: 'bg-red-50    text-red-700    border-red-200' },
}

export function CardProduto({ produto, aoClicar, aoEditar, aoAlternarAtivo, aoDeletar }: CardProdutoProps) {
  const nivel = nivelEstoque(produto.estoque_atual, produto.estoque_minimo)
  const badge = badgeEstoque[nivel]
  const imagemPrincipal = produto.imagens?.[0] ?? null

  return (
    <div
      className={[
        'group bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col cursor-pointer',
        produto.ativo ? 'border-slate-200' : 'border-slate-200 opacity-70',
      ].join(' ')}
      onClick={() => aoClicar(produto)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${produto.nome}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoClicar(produto) } }}
    >

      {/* Imagem */}
      <div className="relative aspect-[4/3] bg-slate-100 flex-shrink-0 overflow-hidden">
        {imagemPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagemPrincipal}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
            <Package size={32} className="text-slate-300" aria-hidden="true" />
            <span className="text-xs text-slate-400">Sem imagem</span>
          </div>
        )}

        {/* Badges sobrepostos */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!produto.ativo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-white backdrop-blur-sm">
              <EyeOff size={10} aria-hidden="true" />
              Inativo
            </span>
          )}
          {produto.imagens.length > 1 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
              +{produto.imagens.length - 1} fotos
            </span>
          )}
        </div>

        {/* Ações — visíveis no hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); aoEditar(produto) }}
            className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-ouro-700 hover:bg-ouro-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label={`Editar ${produto.nome}`}
          >
            <Pencil size={13} aria-hidden="true" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); aoAlternarAtivo(produto) }}
            className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label={produto.ativo ? `Desativar ${produto.nome}` : `Ativar ${produto.nome}`}
          >
            {produto.ativo ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); aoDeletar(produto) }}
            className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={`Deletar ${produto.nome}`}
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        {/* Nome + SKU */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
            {produto.nome}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {produto.sku && (
              <span className="text-xs text-slate-400 font-mono">
                #{produto.sku}
              </span>
            )}
            {produto.categorias_produto && (
              <span className="text-xs text-slate-400 truncate">
                {produto.sku && '· '}{produto.categorias_produto.nome}
              </span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rodapé: preço + estoque */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-base font-bold text-ouro-700 tabular-nums">
            {formatarPreco(produto.preco_venda)}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.classe}`}>
            {produto.estoque_atual} un.
          </span>
        </div>

        {/* Badge nível estoque */}
        {nivel !== 'ok' && (
          <span className={`inline-flex items-center justify-center w-full py-1 rounded-lg text-xs font-medium border ${badge.classe}`}>
            {badge.texto}
          </span>
        )}
      </div>
    </div>
  )
}
