'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Pencil, EyeOff, Eye, Trash2, Package,
  ChevronLeft, ChevronRight, Plus, Minus,
  TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Loader2, Tag, Ruler, Factory,
  Layers, ArrowUpCircle, ArrowDownCircle, Box,
} from 'lucide-react'
import type { Produto } from './tipos'
import { nivelEstoque, formatarPreco, calcularMargem } from './tipos'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type TipoMovimento = 'entrada' | 'saida'

interface FeedbackEstoque {
  tipo: 'sucesso' | 'erro'
  mensagem: string
}

// ---------------------------------------------------------------------------
// Configurações de nível de estoque
// ---------------------------------------------------------------------------

const configEstoque = {
  ok:      { cor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icone: CheckCircle2,   texto: 'Estoque OK' },
  baixo:   { cor: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icone: AlertTriangle,  texto: 'Estoque Baixo' },
  critico: { cor: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icone: AlertTriangle,  texto: 'Sem Estoque' },
}

// ---------------------------------------------------------------------------
// Subcomponente: Galeria de imagens
// ---------------------------------------------------------------------------

function GaleriaImagens({ imagens, nome }: { imagens: string[]; nome: string }) {
  const [ativa, setAtiva] = useState(0)

  function anterior(e: React.MouseEvent) {
    e.stopPropagation()
    setAtiva((i) => (i > 0 ? i - 1 : imagens.length - 1))
  }
  function proximo(e: React.MouseEvent) {
    e.stopPropagation()
    setAtiva((i) => (i < imagens.length - 1 ? i + 1 : 0))
  }

  if (imagens.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-3 rounded-xl">
        <Package size={40} className="text-slate-300" aria-hidden="true" />
        <span className="text-sm text-slate-400">Sem imagens cadastradas</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Imagem principal */}
      <div className="relative aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagens[ativa]}
          alt={`${nome} — imagem ${ativa + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Setas de navegação */}
        {imagens.length > 1 && (
          <>
            <button
              onClick={anterior}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              onClick={proximo}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>

            {/* Contador */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs tabular-nums">
              {ativa + 1} / {imagens.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {imagens.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {imagens.map((url, i) => (
            <button
              key={url}
              onClick={() => setAtiva(i)}
              className={[
                'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                i === ativa ? 'border-ouro-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100',
              ].join(' ')}
              aria-label={`Ver imagem ${i + 1}`}
              aria-pressed={i === ativa}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponente: Ajuste de Estoque
// ---------------------------------------------------------------------------

function AjusteEstoque({
  produto,
  aoAtualizar,
}: {
  produto: Produto
  aoAtualizar: (p: Produto) => void
}) {
  const [tipo, setTipo] = useState<TipoMovimento>('entrada')
  const [quantidade, setQuantidade] = useState('1')
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackEstoque | null>(null)

  const nivel = nivelEstoque(produto.estoque_atual, produto.estoque_minimo)
  const cfg = configEstoque[nivel]
  const NivelIcone = cfg.icone

  async function confirmar() {
    const qtd = parseInt(quantidade)
    if (!qtd || qtd <= 0) return

    setSalvando(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/produtos/${produto.id}/estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          quantidade: tipo === 'saida' ? -qtd : qtd,
          motivo: motivo.trim() || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Erro ao ajustar estoque')

      aoAtualizar(json)
      setQuantidade('1')
      setMotivo('')
      setFeedback({ tipo: 'sucesso', mensagem: `${tipo === 'entrada' ? '+' : '-'}${qtd} unidade(s) registrada(s) com sucesso.` })
      setTimeout(() => setFeedback(null), 3000)
    } catch (e) {
      setFeedback({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Erro inesperado' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">

      {/* Estoque atual */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Estoque Atual
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
              {produto.estoque_atual}
            </span>
            <span className="text-sm text-slate-400">unidades</span>
          </div>
          {produto.estoque_minimo > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              mínimo: {produto.estoque_minimo} un.
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.cor}`}>
          <NivelIcone size={12} aria-hidden="true" />
          {cfg.texto}
        </span>
      </div>

      {/* Barra de nível */}
      {produto.estoque_minimo > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar"
            aria-valuenow={produto.estoque_atual} aria-valuemin={0} aria-valuemax={produto.estoque_minimo * 3}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                nivel === 'ok' ? 'bg-emerald-500' :
                nivel === 'baixo' ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((produto.estoque_atual / (produto.estoque_minimo * 3)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <hr className="border-slate-200" />

      {/* Tipo de movimento */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Registrar Movimento
        </p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de movimento">
          {([
            { valor: 'entrada' as const, rotulo: 'Entrada', icone: ArrowUpCircle, cor: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
            { valor: 'saida'  as const, rotulo: 'Saída',   icone: ArrowDownCircle, cor: 'text-red-700 border-red-300 bg-red-50' },
          ] as const).map(({ valor, rotulo, icone: Icone, cor }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipo(valor)}
              className={[
                'flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                tipo === valor ? cor : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50',
              ].join(' ')}
              aria-pressed={tipo === valor}
            >
              <Icone size={15} aria-hidden="true" />
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Quantidade + - */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Quantidade</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantidade((v) => Math.max(1, parseInt(v) - 1).toString())}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 flex-shrink-0"
            aria-label="Diminuir quantidade"
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            min="1"
            className="flex-1 h-9 text-center text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent tabular-nums"
            aria-label="Quantidade a movimentar"
          />
          <button
            type="button"
            onClick={() => setQuantidade((v) => (parseInt(v) + 1).toString())}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 flex-shrink-0"
            aria-label="Aumentar quantidade"
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Motivo */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">
          Motivo <span className="font-normal text-slate-400">(opcional)</span>
        </p>
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex: Contagem física, devolução..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent"
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role="alert"
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700',
          ].join(' ')}
        >
          {feedback.tipo === 'sucesso'
            ? <CheckCircle2 size={14} aria-hidden="true" />
            : <AlertTriangle size={14} aria-hidden="true" />
          }
          {feedback.mensagem}
        </div>
      )}

      {/* Botão confirmar */}
      <button
        type="button"
        onClick={confirmar}
        disabled={salvando || !quantidade || parseInt(quantidade) <= 0}
        className={[
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          tipo === 'entrada'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60'
            : 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-60',
          'disabled:cursor-not-allowed disabled:active:scale-100',
        ].join(' ')}
      >
        {salvando
          ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          : tipo === 'entrada'
            ? <ArrowUpCircle size={14} aria-hidden="true" />
            : <ArrowDownCircle size={14} aria-hidden="true" />
        }
        {salvando
          ? 'Registrando...'
          : tipo === 'entrada'
            ? `Registrar entrada de ${quantidade || 0} un.`
            : `Registrar saída de ${quantidade || 0} un.`
        }
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal principal
// ---------------------------------------------------------------------------

interface ModalProdutoProps {
  produto: Produto | null
  aoFechar: () => void
  aoEditar: (produto: Produto) => void
  aoAlternarAtivo: (produto: Produto) => void
  aoDeletar: (produto: Produto) => void
  aoAtualizar: (produto: Produto) => void
}

export function ModalProduto({
  produto,
  aoFechar,
  aoEditar,
  aoAlternarAtivo,
  aoDeletar,
  aoAtualizar,
}: ModalProdutoProps) {
  // Fecha com Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') aoFechar()
  }, [aoFechar])

  useEffect(() => {
    if (!produto) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [produto, handleKeyDown])

  if (!produto) return null

  const dim = produto.dimensoes as Record<string, number | string> | null
  const margem = calcularMargem(produto.preco_venda, produto.preco_custo ?? 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={produto.nome}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-playfair text-lg font-semibold text-slate-900 truncate">
                  {produto.nome}
                </h2>
                <span className={[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                  produto.ativo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200',
                ].join(' ')}>
                  <span className={`w-1.5 h-1.5 rounded-full ${produto.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {produto.sku && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Tag size={10} aria-hidden="true" />#{produto.sku}
                  </span>
                )}
                {produto.categorias_produto && (
                  <span className="text-xs text-slate-400">
                    {produto.sku && '·'} {produto.categorias_produto.nome}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={aoFechar}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
              aria-label="Fechar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ── Corpo rolável ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">

              {/* Galeria */}
              <GaleriaImagens imagens={produto.imagens} nome={produto.nome} />

              {/* Grid principal: Preços + Estoque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Preços */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Preços
                  </p>

                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Preço de venda</p>
                    <p className="text-2xl font-bold text-ouro-700 tabular-nums leading-tight">
                      {formatarPreco(produto.preco_venda)}
                    </p>
                  </div>

                  {produto.preco_custo && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-400">Custo</p>
                        <p className="text-sm font-semibold text-slate-600 tabular-nums">
                          {formatarPreco(produto.preco_custo)}
                        </p>
                      </div>
                      {margem && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Margem</p>
                          <p className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                            <TrendingUp size={13} aria-hidden="true" />
                            {margem}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ajuste de Estoque */}
                <AjusteEstoque produto={produto} aoAtualizar={aoAtualizar} />
              </div>

              {/* Detalhes do produto */}
              {(produto.material || produto.fabricante || dim) && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Detalhes
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {produto.material && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Material</p>
                        <p className="text-slate-700 font-medium">{produto.material}</p>
                      </div>
                    )}
                    {produto.fabricante && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Fabricante</p>
                        <p className="text-slate-700 font-medium">{produto.fabricante}</p>
                      </div>
                    )}
                    {dim && (dim.largura || dim.altura || dim.profundidade) && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                          <Ruler size={10} aria-hidden="true" />
                          Dimensões (cm)
                        </p>
                        <p className="text-slate-700 font-medium tabular-nums">
                          {[
                            dim.largura    ? `L ${dim.largura}`    : null,
                            dim.altura     ? `A ${dim.altura}`     : null,
                            dim.profundidade ? `P ${dim.profundidade}` : null,
                            dim.peso       ? `${dim.peso} kg`     : null,
                          ].filter(Boolean).join(' × ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição */}
              {(produto.descricao_curta || produto.descricao) && (
                <div className="space-y-2">
                  {produto.descricao_curta && (
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {produto.descricao_curta}
                    </p>
                  )}
                  {produto.descricao && (
                    <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                      {produto.descricao}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── Footer de ações ── */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-white flex-shrink-0">
            {/* Ações destrutivas */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { aoAlternarAtivo(produto); aoFechar() }}
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                  produto.ativo
                    ? 'text-slate-600 border-slate-200 hover:bg-slate-100'
                    : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50',
                ].join(' ')}
              >
                {produto.ativo ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                {produto.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => { aoDeletar(produto); aoFechar() }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border text-red-500 border-red-200 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 size={14} aria-hidden="true" />
                Deletar
              </button>
            </div>

            {/* Editar + Ver em AR */}
            <div className="flex items-center gap-2">
              {produto.modelo_3d_path && (
                <a
                  href={`/ar/${produto.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-ouro-300 bg-ouro-50 hover:bg-ouro-100 text-ouro-700 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2"
                >
                  <Box size={14} aria-hidden="true" />
                  Ver em AR
                </a>
              )}
              <button
                onClick={() => { aoFechar(); aoEditar(produto) }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2"
              >
                <Pencil size={14} aria-hidden="true" />
                Editar produto
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
