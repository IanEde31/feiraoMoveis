'use client'

import { useState, useMemo } from 'react'
import { Search, X, Plus, Package, SlidersHorizontal } from 'lucide-react'
import { CardProduto } from './card-produto'
import { SheetProduto } from './sheet-produto'
import { ModalProduto } from './modal-produto'
import type { Produto, CategoriaProduto } from './tipos'

interface ListaProdutosProps {
  produtosIniciais: Produto[]
  categorias: CategoriaProduto[]
}

type FiltroStatus = 'todos' | 'ativo' | 'inativo'

export function ListaProdutos({ produtosIniciais, categorias }: ListaProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [sheetAberto, setSheetAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null)
  const [deletando, setDeletando] = useState<string | null>(null)

  // Filtragem client-side
  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return produtos.filter((p) => {
      if (termo && !p.nome.toLowerCase().includes(termo) && !(p.sku?.toLowerCase().includes(termo))) {
        return false
      }
      if (filtroCategoria && p.categoria_id !== filtroCategoria) return false
      if (filtroStatus === 'ativo' && !p.ativo) return false
      if (filtroStatus === 'inativo' && p.ativo) return false
      return true
    })
  }, [produtos, busca, filtroCategoria, filtroStatus])

  const temFiltro = busca || filtroCategoria || filtroStatus !== 'todos'

  function abrirModal(produto: Produto) {
    setProdutoModal(produto)
  }

  function fecharModal() {
    setProdutoModal(null)
  }

  function abrirNovo() {
    setProdutoEditando(null)
    setSheetAberto(true)
  }

  function abrirEdicao(produto: Produto) {
    setProdutoEditando(produto)
    setSheetAberto(true)
  }

  function fecharSheet() {
    setSheetAberto(false)
    setProdutoEditando(null)
  }

  function aoSalvar(produtoSalvo: Produto) {
    setProdutos((prev) => {
      const existe = prev.find((p) => p.id === produtoSalvo.id)
      if (existe) return prev.map((p) => p.id === produtoSalvo.id ? produtoSalvo : p)
      return [produtoSalvo, ...prev]
    })
    fecharSheet()
  }

  function aoAtualizarProduto(produtoAtualizado: Produto) {
    setProdutos((prev) => prev.map((p) => p.id === produtoAtualizado.id ? produtoAtualizado : p))
    // Atualiza o produto no modal se estiver aberto
    setProdutoModal((prev) => prev?.id === produtoAtualizado.id ? produtoAtualizado : prev)
  }

  async function alternarAtivo(produto: Produto) {
    const res = await fetch(`/api/produtos/${produto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...produto, ativo: !produto.ativo, categorias_produto: undefined }),
    })
    if (res.ok) {
      const atualizado = await res.json()
      setProdutos((prev) => prev.map((p) => p.id === produto.id ? atualizado : p))
    }
  }

  async function deletarProduto(produto: Produto) {
    if (!confirm(`Deletar "${produto.nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(produto.id)
    const res = await fetch(`/api/produtos/${produto.id}`, { method: 'DELETE' })
    if (res.ok) {
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id))
    }
    setDeletando(null)
  }

  function limparFiltros() {
    setBusca('')
    setFiltroCategoria('')
    setFiltroStatus('todos')
  }

  const statusPills: { valor: FiltroStatus; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'ativo', rotulo: 'Ativos' },
    { valor: 'inativo', rotulo: 'Inativos' },
  ]

  return (
    <>
      {/* Barra de ferramentas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

        {/* Busca */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Search size={16} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none min-w-0"
            aria-label="Buscar produtos"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
              aria-label="Limpar busca"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />

        {/* Filtro categoria */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm text-slate-600 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded cursor-pointer"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />

        {/* Filtro status */}
        <div className="flex items-center gap-1" role="group" aria-label="Filtrar por status">
          {statusPills.map(({ valor, rotulo }) => (
            <button
              key={valor}
              onClick={() => setFiltroStatus(valor)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                filtroStatus === valor
                  ? 'bg-ouro-600 text-white border-ouro-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ].join(' ')}
              aria-pressed={filtroStatus === valor}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />

        {/* Novo produto */}
        <button
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2"
          aria-label="Cadastrar novo produto"
        >
          <Plus size={16} aria-hidden="true" />
          Novo Produto
        </button>
      </div>

      {/* Contagem e limpar filtros */}
      {temFiltro && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Exibindo{' '}
            <span className="font-semibold text-slate-700">{produtosFiltrados.length}</span> de{' '}
            <span className="font-semibold text-slate-700">{produtos.length}</span> produtos
          </span>
          <button
            onClick={limparFiltros}
            className="text-red-500 hover:text-red-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Grade de produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Package size={28} className="text-slate-300" aria-hidden="true" />
          </div>
          {temFiltro ? (
            <>
              <div className="text-center">
                <p className="text-slate-700 font-medium">Nenhum produto encontrado</p>
                <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
              </div>
              <button
                onClick={limparFiltros}
                className="text-sm text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-slate-700 font-medium">Nenhum produto cadastrado</p>
                <p className="text-slate-400 text-sm mt-1">Comece cadastrando o primeiro produto do catálogo</p>
              </div>
              <button
                onClick={abrirNovo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2"
              >
                <Plus size={16} aria-hidden="true" />
                Cadastrar primeiro produto
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => (
            <div key={produto.id} className={deletando === produto.id ? 'opacity-50 pointer-events-none' : ''}>
              <CardProduto
                produto={produto}
                aoClicar={abrirModal}
                aoEditar={abrirEdicao}
                aoAlternarAtivo={alternarAtivo}
                aoDeletar={deletarProduto}
              />
            </div>
          ))}
        </div>
      )}

      {/* Sheet de cadastro/edição */}
      <SheetProduto
        aberto={sheetAberto}
        produto={produtoEditando}
        categorias={categorias}
        aoFechar={fecharSheet}
        aoSalvar={aoSalvar}
      />

      {/* Modal de detalhes */}
      <ModalProduto
        produto={produtoModal}
        aoFechar={fecharModal}
        aoEditar={abrirEdicao}
        aoAlternarAtivo={alternarAtivo}
        aoDeletar={deletarProduto}
        aoAtualizar={aoAtualizarProduto}
      />
    </>
  )
}
