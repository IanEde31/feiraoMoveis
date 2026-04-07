'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Upload, Trash2, ImageIcon, Loader2, TrendingUp } from 'lucide-react'
import type { Produto, CategoriaProduto } from './tipos'
import { calcularMargem } from './tipos'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface FormState {
  nome: string
  sku: string
  descricao_curta: string
  descricao: string
  preco_venda: string
  preco_custo: string
  estoque_atual: string
  estoque_minimo: string
  categoria_id: string
  material: string
  fabricante: string
  dim_largura: string
  dim_altura: string
  dim_profundidade: string
  dim_peso: string
  imagens: string[]
  ativo: boolean
}

function estadoInicial(produto?: Produto | null): FormState {
  if (!produto) {
    return {
      nome: '', sku: '', descricao_curta: '', descricao: '',
      preco_venda: '', preco_custo: '',
      estoque_atual: '0', estoque_minimo: '0',
      categoria_id: '', material: '', fabricante: '',
      dim_largura: '', dim_altura: '', dim_profundidade: '', dim_peso: '',
      imagens: [], ativo: true,
    }
  }
  const dim = produto.dimensoes as Record<string, number | string> | null
  return {
    nome: produto.nome,
    sku: produto.sku ?? '',
    descricao_curta: produto.descricao_curta ?? '',
    descricao: produto.descricao ?? '',
    preco_venda: produto.preco_venda.toString(),
    preco_custo: produto.preco_custo?.toString() ?? '',
    estoque_atual: produto.estoque_atual.toString(),
    estoque_minimo: produto.estoque_minimo.toString(),
    categoria_id: produto.categoria_id ?? '',
    material: produto.material ?? '',
    fabricante: produto.fabricante ?? '',
    dim_largura: dim?.largura?.toString() ?? '',
    dim_altura: dim?.altura?.toString() ?? '',
    dim_profundidade: dim?.profundidade?.toString() ?? '',
    dim_peso: dim?.peso?.toString() ?? '',
    imagens: produto.imagens ?? [],
    ativo: produto.ativo,
  }
}

// ---------------------------------------------------------------------------
// Subcomponentes de apoio
// ---------------------------------------------------------------------------

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  min,
  step,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  min?: string | number
  step?: string | number
  maxLength?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
      maxLength={maxLength}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent transition"
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-1">
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Sheet principal
// ---------------------------------------------------------------------------

interface SheetProdutoProps {
  aberto: boolean
  produto: Produto | null
  categorias: CategoriaProduto[]
  aoFechar: () => void
  aoSalvar: (produto: Produto) => void
}

export function SheetProduto({ aberto, produto, categorias, aoFechar, aoSalvar }: SheetProdutoProps) {
  const [form, setForm] = useState<FormState>(() => estadoInicial(produto))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [arrastandoSobre, setArrastandoSobre] = useState(false)
  const inputImagemRef = useRef<HTMLInputElement>(null)

  // Sincroniza form quando o produto muda
  useEffect(() => {
    setForm(estadoInicial(produto))
    setErro(null)
  }, [produto])

  // Trava scroll do body quando o sheet está aberto
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setArrastandoSobre(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setArrastandoSobre(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setArrastandoSobre(false)
    const arquivo = e.dataTransfer.files?.[0]
    if (arquivo && arquivo.type.startsWith('image/')) {
      uploadImagem(arquivo)
    } else if (arquivo) {
      setErro('Formato inválido. Solte apenas imagens (JPG, PNG ou WebP).')
    }
  }

  async function uploadImagem(arquivo: File) {
    setEnviandoImagem(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      const res = await fetch('/api/upload/produtos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar imagem')
      set('imagens', [...form.imagens, json.url])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar imagem')
    } finally {
      setEnviandoImagem(false)
    }
  }

  function removerImagem(url: string) {
    set('imagens', form.imagens.filter((i) => i !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome do produto é obrigatório.'); return }
    if (!form.preco_venda || isNaN(Number(form.preco_venda))) { setErro('Preço de venda inválido.'); return }

    setSalvando(true)
    setErro(null)

    const payload = {
      nome: form.nome.trim(),
      sku: form.sku.trim() || null,
      descricao_curta: form.descricao_curta.trim() || null,
      descricao: form.descricao.trim() || null,
      preco_venda: Number(form.preco_venda),
      preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
      estoque_atual: Number(form.estoque_atual) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      categoria_id: form.categoria_id || null,
      material: form.material.trim() || null,
      fabricante: form.fabricante.trim() || null,
      dimensoes: (form.dim_largura || form.dim_altura || form.dim_profundidade || form.dim_peso)
        ? {
            largura: form.dim_largura ? Number(form.dim_largura) : null,
            altura: form.dim_altura ? Number(form.dim_altura) : null,
            profundidade: form.dim_profundidade ? Number(form.dim_profundidade) : null,
            peso: form.dim_peso ? Number(form.dim_peso) : null,
            unidade: 'cm',
          }
        : null,
      imagens: form.imagens,
      ativo: form.ativo,
    }

    try {
      const isEdicao = !!produto?.id
      const url = isEdicao ? `/api/produtos/${produto.id}` : '/api/produtos'
      const method = isEdicao ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar produto')
      aoSalvar(json)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setSalvando(false)
    }
  }

  const margem = calcularMargem(Number(form.preco_venda), Number(form.preco_custo))

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={aoFechar}
          aria-hidden="true"
        />
      )}

      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={produto ? `Editar ${produto.nome}` : 'Novo Produto'}
        className={[
          'fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-white shadow-2xl',
          'flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          aberto ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-playfair text-lg font-semibold text-slate-900">
              {produto ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {produto ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label="Fechar painel"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">

            {/* Erro global */}
            {erro && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                <span className="flex-shrink-0 font-semibold">Erro:</span>
                <span>{erro}</span>
              </div>
            )}

            {/* ── Identificação ── */}
            <section>
              <SectionTitle>Identificação</SectionTitle>
              <div className="space-y-3">
                <div>
                  <Label required>Nome do produto</Label>
                  <Input
                    value={form.nome}
                    onChange={(v) => set('nome', v)}
                    placeholder="Ex: Sofá Chesterfield Premium 3 lugares"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={form.sku}
                      onChange={(v) => set('sku', v)}
                      placeholder="Ex: SF-CH-001"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <button
                      type="button"
                      onClick={() => set('ativo', !form.ativo)}
                      className={[
                        'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                        form.ativo
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500',
                      ].join(' ')}
                      aria-pressed={form.ativo}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${form.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                      {form.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Classificação ── */}
            <section>
              <SectionTitle>Classificação</SectionTitle>
              <div className="space-y-3">
                <div>
                  <Label>Categoria</Label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) => set('categoria_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent transition"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Descrição curta</Label>
                  <Input
                    value={form.descricao_curta}
                    onChange={(v) => set('descricao_curta', v)}
                    placeholder="Resumo de uma linha para listagens"
                    maxLength={160}
                  />
                </div>
                <div>
                  <Label>Descrição completa</Label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => set('descricao', e.target.value)}
                    placeholder="Descrição detalhada do produto, materiais, diferenciais..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent resize-none transition"
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Preços ── */}
            <section>
              <SectionTitle>Preços</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Preço de venda (R$)</Label>
                  <Input
                    type="number"
                    value={form.preco_venda}
                    onChange={(v) => set('preco_venda', v)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label>Preço de custo (R$)</Label>
                  <Input
                    type="number"
                    value={form.preco_custo}
                    onChange={(v) => set('preco_custo', v)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {margem && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                  <TrendingUp size={12} aria-hidden="true" />
                  <span>Margem calculada: <strong>{margem}</strong></span>
                </div>
              )}
            </section>

            <hr className="border-slate-100" />

            {/* ── Estoque ── */}
            <section>
              <SectionTitle>Estoque</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Qtd. atual</Label>
                  <Input
                    type="number"
                    value={form.estoque_atual}
                    onChange={(v) => set('estoque_atual', v)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Qtd. mínima</Label>
                  <Input
                    type="number"
                    value={form.estoque_minimo}
                    onChange={(v) => set('estoque_minimo', v)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-slate-400 mt-1">Abaixo desse valor gera alerta</p>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Detalhes ── */}
            <section>
              <SectionTitle>Detalhes</SectionTitle>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Material</Label>
                    <Input
                      value={form.material}
                      onChange={(v) => set('material', v)}
                      placeholder="Ex: Couro natural, MDF"
                    />
                  </div>
                  <div>
                    <Label>Fabricante</Label>
                    <Input
                      value={form.fabricante}
                      onChange={(v) => set('fabricante', v)}
                      placeholder="Ex: Móveis Brasil"
                    />
                  </div>
                </div>
                <div>
                  <Label>Dimensões (cm)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { campo: 'dim_largura' as const,      label: 'Larg.' },
                      { campo: 'dim_altura' as const,       label: 'Alt.' },
                      { campo: 'dim_profundidade' as const, label: 'Prof.' },
                      { campo: 'dim_peso' as const,         label: 'Peso kg' },
                    ].map(({ campo, label }) => (
                      <div key={campo}>
                        <p className="text-xs text-slate-400 mb-1">{label}</p>
                        <input
                          type="number"
                          value={form[campo]}
                          onChange={(e) => set(campo, e.target.value)}
                          placeholder="—"
                          min="0"
                          step="0.1"
                          className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500 focus:border-transparent transition text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── Imagens ── */}
            <section>
              <SectionTitle>Imagens</SectionTitle>

              {/* Upload area — clique ou drag and drop */}
              <div
                onClick={() => !enviandoImagem && inputImagemRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={enviandoImagem ? -1 : 0}
                aria-label="Selecionar ou arrastar imagem para upload"
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !enviandoImagem) {
                    e.preventDefault()
                    inputImagemRef.current?.click()
                  }
                }}
                className={[
                  'w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl text-sm transition-all duration-150 select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                  enviandoImagem
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                    : arrastandoSobre
                      ? 'border-ouro-500 bg-ouro-50 scale-[1.01] cursor-copy shadow-md'
                      : 'border-slate-300 hover:border-ouro-400 hover:bg-ouro-50/30 cursor-pointer',
                ].join(' ')}
              >
                {enviandoImagem ? (
                  <>
                    <Loader2 size={20} className="text-slate-400 animate-spin" aria-hidden="true" />
                    <span className="text-slate-500">Enviando imagem...</span>
                  </>
                ) : arrastandoSobre ? (
                  <>
                    <Upload size={20} className="text-ouro-500 animate-bounce" aria-hidden="true" />
                    <span className="text-ouro-700 font-semibold">Solte a imagem aqui</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400" aria-hidden="true" />
                    <span className="text-slate-600 font-medium">Clique ou arraste uma imagem</span>
                    <span className="text-slate-400 text-xs">JPG, PNG ou WebP — máx. 5MB</span>
                  </>
                )}
              </div>
              <input
                ref={inputImagemRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="sr-only"
                aria-hidden="true"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  if (arquivo) uploadImagem(arquivo)
                  e.target.value = ''
                }}
              />

              {/* Previews */}
              {form.imagens.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {form.imagens.map((url, i) => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removerImagem(url)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        aria-label={`Remover imagem ${i + 1}`}
                      >
                        <X size={10} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => inputImagemRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-ouro-400 hover:bg-ouro-50/30 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-ouro-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
                    aria-label="Adicionar mais imagens"
                  >
                    <ImageIcon size={16} aria-hidden="true" />
                    <span className="text-xs">Adicionar</span>
                  </button>
                </div>
              )}
            </section>

            {/* Espaço para o footer fixo não sobrepor */}
            <div className="h-4" />
          </div>
        </form>

        {/* Footer fixo */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando || enviandoImagem}
            className="inline-flex items-center gap-2 px-5 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {salvando && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {salvando ? 'Salvando...' : produto ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </div>
    </>
  )
}
