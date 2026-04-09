'use client'

import { useMemo, useState } from 'react'
import { Search, PackageX, X } from 'lucide-react'
import { ProdutoSelecionavel } from './produto-selecionavel'
import type { Produto } from './tipos'
import type { CategoriaProduto } from '@/components/produtos/tipos'

interface SeletorProdutosProps {
  produtos: Produto[]
  categorias: CategoriaProduto[]
  selecionados: Produto[]
  aoAlternar: (p: Produto) => void
  aoLimpar: () => void
}

export function SeletorProdutos({
  produtos,
  categorias,
  selecionados,
  aoAlternar,
  aoLimpar,
}: SeletorProdutosProps) {
  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)

  const idsSelecionados = useMemo(
    () => new Set(selecionados.map((p) => p.id)),
    [selecionados]
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return produtos.filter((p) => {
      if (!p.ativo) return false
      if (categoriaId && p.categoria_id !== categoriaId) return false
      if (!termo) return true
      return (
        p.nome.toLowerCase().includes(termo) ||
        p.sku?.toLowerCase().includes(termo)
      )
    })
  }, [produtos, busca, categoriaId])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Cabeçalho — busca + filtros */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-colors"
          />
        </div>

        {/* Chips de categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          <button
            onClick={() => setCategoriaId(null)}
            className={[
              'px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
              categoriaId === null
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            ].join(' ')}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={[
                'px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                categoriaId === c.id
                  ? 'bg-ouro-600 text-white border-ouro-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-ouro-300',
              ].join(' ')}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo seleção */}
      {selecionados.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-ouro-50 border border-ouro-200">
          <p className="text-xs font-medium text-ouro-800">
            <span className="font-bold tabular-nums">{selecionados.length}</span>{' '}
            {selecionados.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
          </p>
          <button
            onClick={aoLimpar}
            className="inline-flex items-center gap-1 text-xs text-ouro-700 hover:text-ouro-900 font-medium"
          >
            <X size={12} aria-hidden="true" />
            Limpar
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
        {filtrados.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center text-slate-400 gap-2">
            <PackageX size={32} aria-hidden="true" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filtrados.map((p) => (
              <ProdutoSelecionavel
                key={p.id}
                produto={p}
                selecionado={idsSelecionados.has(p.id)}
                aoAlternar={aoAlternar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
