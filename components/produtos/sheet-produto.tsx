'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, Upload, Trash2, ImageIcon, Loader2, TrendingUp, Box,
  Tag, Layers, DollarSign, Package, Ruler, Image as ImageLucide,
  ChevronsUpDown, Check, GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'
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
    preco_venda: produto.preco_venda ? formatarCentavosParaExibicao(Math.round(produto.preco_venda * 100)) : '',
    preco_custo: produto.preco_custo ? formatarCentavosParaExibicao(Math.round(produto.preco_custo * 100)) : '',
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
// Máscara monetária
// ---------------------------------------------------------------------------

function formatarCentavosParaExibicao(centavos: number): string {
  if (centavos === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}

function aplicarMascaraMonetaria(valorAtual: string, novoValor: string): string {
  // Remove tudo que não é dígito
  const digits = novoValor.replace(/\D/g, '')
  if (digits === '' || digits === '0' || digits === '00') return ''
  const centavos = parseInt(digits, 10)
  return formatarCentavosParaExibicao(centavos)
}

function extrairNumeroDeFormatado(formatado: string): number {
  if (!formatado) return 0
  // "1.234,56" → 1234.56
  const limpo = formatado.replace(/\./g, '').replace(',', '.')
  return parseFloat(limpo) || 0
}

// ---------------------------------------------------------------------------
// Subcomponentes
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
  value, onChange, placeholder, type = 'text', required, min, step, maxLength,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; required?: boolean; min?: string | number
  step?: string | number; maxLength?: number
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
      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-all"
    />
  )
}

function MoneyInput({
  value, onChange, placeholder, required,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  function handleChange(novoValor: string) {
    onChange(aplicarMascaraMonetaria(value, novoValor))
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none select-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-all tabular-nums"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Seção com ícone e título
// ---------------------------------------------------------------------------

function SectionCard({
  icon: Icon, titulo, children, numero,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  titulo: string
  children: React.ReactNode
  numero?: number
}) {
  return (
    <section className="bg-slate-50/60 rounded-2xl border border-slate-100 p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        {numero !== undefined && (
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ouro-100 text-ouro-700 text-xs font-bold flex items-center justify-center">
            {numero}
          </span>
        )}
        <Icon size={16} className="text-ouro-600 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
          {titulo}
        </h3>
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Combobox de Categorias
// ---------------------------------------------------------------------------

function ComboboxCategoria({
  categorias, valor, onChange,
}: {
  categorias: CategoriaProduto[]; valor: string; onChange: (v: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const selecionada = categorias.find((c) => c.id === valor)

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={aberto}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-xl bg-white transition-all',
            'focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400',
            selecionada ? 'text-slate-800 border-slate-200' : 'text-slate-400 border-slate-200',
          )}
        >
          <span className="truncate">
            {selecionada ? selecionada.nome : 'Selecione uma categoria...'}
          </span>
          <ChevronsUpDown size={14} className="ml-2 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {/* Opção para limpar */}
              <CommandItem
                value="__nenhuma__"
                onSelect={() => { onChange(''); setAberto(false) }}
              >
                <span className="text-slate-400 italic">Sem categoria</span>
                {!valor && <Check size={14} className="ml-auto text-ouro-600" />}
              </CommandItem>
              {categorias.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.nome}
                  onSelect={() => {
                    onChange(cat.id === valor ? '' : cat.id)
                    setAberto(false)
                  }}
                >
                  {cat.nome}
                  {cat.id === valor && <Check size={14} className="ml-auto text-ouro-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Imagem sortable (dnd-kit)
// ---------------------------------------------------------------------------

function SortableImageItem({
  url, index, onRemove,
}: {
  url: string; index: number; onRemove: () => void
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group aspect-square rounded-xl overflow-hidden border bg-slate-100',
        isDragging ? 'border-ouro-400 shadow-lg ring-2 ring-ouro-300/50' : 'border-slate-200',
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-md bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-400"
        aria-label={`Reordenar imagem ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={12} />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />

      {/* Badge "Principal" */}
      {index === 0 && (
        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ouro-600 text-white shadow-sm">
          Principal
        </span>
      )}

      {/* Botão remover */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label={`Remover imagem ${index + 1}`}
      >
        <X size={10} />
      </button>
    </div>
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

  // Modelo 3D
  const [modelo3dPath, setModelo3dPath] = useState<string | null>(produto?.modelo_3d_path ?? null)
  const [enviandoModelo, setEnviandoModelo] = useState(false)
  const [removendoModelo, setRemovendoModelo] = useState(false)
  const [arrastandoModelo, setArrastandoModelo] = useState(false)
  const inputModeloRef = useRef<HTMLInputElement>(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    setForm(estadoInicial(produto))
    setErro(null)
    setModelo3dPath(produto?.modelo_3d_path ?? null)
  }, [produto])

  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  const set = useCallback(<K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }, [])

  // --- Drag & Drop imagens ---

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

  function handleSortEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = form.imagens.indexOf(active.id as string)
      const newIndex = form.imagens.indexOf(over.id as string)
      set('imagens', arrayMove(form.imagens, oldIndex, newIndex))
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

  // --- Modelo 3D ---

  async function uploadModelo3d(arquivo: File) {
    if (!produto?.id) {
      setErro('Salve o produto primeiro antes de adicionar um modelo 3D.')
      return
    }
    setEnviandoModelo(true)
    setErro(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      const res = await fetch(`/api/produtos/${produto.id}/modelo-3d`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar modelo 3D')
      setModelo3dPath(json.modelo_3d_path)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar modelo 3D')
    } finally {
      setEnviandoModelo(false)
    }
  }

  async function removerModelo3d() {
    if (!produto?.id) return
    setRemovendoModelo(true)
    setErro(null)
    try {
      const res = await fetch(`/api/produtos/${produto.id}/modelo-3d`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao remover modelo 3D')
      setModelo3dPath(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover modelo 3D')
    } finally {
      setRemovendoModelo(false)
    }
  }

  // --- Submit ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome do produto é obrigatório.'); return }

    const precoVenda = extrairNumeroDeFormatado(form.preco_venda)
    const precoCusto = extrairNumeroDeFormatado(form.preco_custo)
    if (!precoVenda || precoVenda <= 0) { setErro('Preço de venda inválido.'); return }

    setSalvando(true)
    setErro(null)

    const payload = {
      nome: form.nome.trim(),
      sku: form.sku.trim() || null,
      descricao_curta: form.descricao_curta.trim() || null,
      descricao: form.descricao.trim() || null,
      preco_venda: precoVenda,
      preco_custo: precoCusto || null,
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

  const precoVendaNum = extrairNumeroDeFormatado(form.preco_venda)
  const precoCustoNum = extrairNumeroDeFormatado(form.preco_custo)
  const margem = calcularMargem(precoVendaNum, precoCustoNum)

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
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full sm:w-[580px] bg-gradient-to-b from-white to-slate-50/80 shadow-2xl',
          'flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          aberto ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 flex-shrink-0 bg-white">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-slate-900">
              {produto ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {produto ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label="Fechar painel"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-4">

            {/* Erro global */}
            {erro && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
                <span className="flex-shrink-0 font-semibold">Erro:</span>
                <span>{erro}</span>
              </div>
            )}

            {/* ── 1. Identificação ── */}
            <SectionCard icon={Tag} titulo="Identificação" numero={1}>
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
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                        form.ativo
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100'
                          : 'bg-slate-50 border-slate-200 text-slate-500',
                      )}
                      aria-pressed={form.ativo}
                    >
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors',
                        form.ativo ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-slate-400',
                      )} aria-hidden="true" />
                      {form.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 2. Classificação ── */}
            <SectionCard icon={Layers} titulo="Classificação" numero={2}>
              <div className="space-y-3">
                <div>
                  <Label>Categoria</Label>
                  <ComboboxCategoria
                    categorias={categorias}
                    valor={form.categoria_id}
                    onChange={(v) => set('categoria_id', v)}
                  />
                </div>
                <div>
                  <Label>Descrição curta</Label>
                  <Input
                    value={form.descricao_curta}
                    onChange={(v) => set('descricao_curta', v)}
                    placeholder="Resumo de uma linha para listagens"
                    maxLength={160}
                  />
                  {form.descricao_curta.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">
                      {form.descricao_curta.length}/160
                    </p>
                  )}
                </div>
                <div>
                  <Label>Descrição completa</Label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => set('descricao', e.target.value)}
                    placeholder="Descrição detalhada do produto, materiais, diferenciais..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 resize-none transition-all"
                  />
                </div>
              </div>
            </SectionCard>

            {/* ── 3. Preços ── */}
            <SectionCard icon={DollarSign} titulo="Preços" numero={3}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Preço de venda</Label>
                  <MoneyInput
                    value={form.preco_venda}
                    onChange={(v) => set('preco_venda', v)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <Label>Preço de custo</Label>
                  <MoneyInput
                    value={form.preco_custo}
                    onChange={(v) => set('preco_custo', v)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              {margem && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <TrendingUp size={14} className="text-emerald-600" aria-hidden="true" />
                  <span className="text-xs text-emerald-700">
                    Margem de lucro: <strong className="font-semibold">{margem}</strong>
                  </span>
                </div>
              )}
            </SectionCard>

            {/* ── 4. Estoque ── */}
            <SectionCard icon={Package} titulo="Estoque" numero={4}>
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
                  <p className="text-[10px] text-slate-400 mt-1">Alerta abaixo desse valor</p>
                </div>
              </div>
            </SectionCard>

            {/* ── 5. Detalhes ── */}
            <SectionCard icon={Ruler} titulo="Detalhes Físicos" numero={5}>
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
                  <Label>Dimensões</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { campo: 'dim_largura' as const,      label: 'Larg.', unidade: 'cm' },
                      { campo: 'dim_altura' as const,       label: 'Alt.', unidade: 'cm' },
                      { campo: 'dim_profundidade' as const, label: 'Prof.', unidade: 'cm' },
                      { campo: 'dim_peso' as const,         label: 'Peso', unidade: 'kg' },
                    ]).map(({ campo, label, unidade }) => (
                      <div key={campo}>
                        <p className="text-[10px] text-slate-400 mb-1 font-medium">{label}</p>
                        <div className="relative">
                          <input
                            type="number"
                            value={form[campo]}
                            onChange={(e) => set(campo, e.target.value)}
                            placeholder="—"
                            min="0"
                            step="0.1"
                            className="w-full px-2 pr-7 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-all text-center tabular-nums"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                            {unidade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 6. Mídia ── */}
            <SectionCard icon={ImageLucide} titulo="Mídia" numero={6}>
              {/* -- Imagens -- */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500">Fotos do produto</p>

                {/* Upload area */}
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
                  className={cn(
                    'w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed rounded-xl text-sm transition-all duration-150 select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                    enviandoImagem
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : arrastandoSobre
                        ? 'border-ouro-500 bg-ouro-50 scale-[1.01] cursor-copy shadow-md'
                        : 'border-slate-200 hover:border-ouro-400 hover:bg-ouro-50/30 cursor-pointer',
                  )}
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

                {/* Grid de imagens com reordenação */}
                {form.imagens.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSortEnd}
                  >
                    <SortableContext items={form.imagens} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 gap-2">
                        {form.imagens.map((url, i) => (
                          <SortableImageItem
                            key={url}
                            url={url}
                            index={i}
                            onRemove={() => removerImagem(url)}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => inputImagemRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-ouro-400 hover:bg-ouro-50/30 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-ouro-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
                          aria-label="Adicionar mais imagens"
                        >
                          <ImageIcon size={16} aria-hidden="true" />
                          <span className="text-xs">Adicionar</span>
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {form.imagens.length > 1 && (
                  <p className="text-[10px] text-slate-400 text-center">
                    Arraste para reordenar — a primeira imagem será a principal
                  </p>
                )}
              </div>

              {/* -- Modelo 3D -- */}
              <div className="space-y-3 pt-3 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Box size={14} className="text-ouro-600" aria-hidden="true" />
                  <p className="text-xs font-medium text-slate-500">Modelo 3D (Realidade Aumentada)</p>
                </div>

                {!produto?.id ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 opacity-60">
                    <Box size={20} className="text-slate-300" aria-hidden="true" />
                    <span className="text-xs text-slate-400 font-medium text-center px-4">
                      Salve o produto primeiro para adicionar um modelo 3D
                    </span>
                  </div>
                ) : modelo3dPath ? (
                    <div className="flex items-center gap-3 p-3 bg-ouro-50 border border-ouro-200 rounded-xl">
                      <Box size={20} className="text-ouro-600 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {modelo3dPath.split('/').pop()}
                        </p>
                        <p className="text-xs text-ouro-600">Modelo 3D cadastrado</p>
                      </div>
                      <button
                        type="button"
                        onClick={removerModelo3d}
                        disabled={removendoModelo}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        {removendoModelo ? (
                          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 size={12} aria-hidden="true" />
                        )}
                        {removendoModelo ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => !enviandoModelo && inputModeloRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setArrastandoModelo(true) }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setArrastandoModelo(true) }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setArrastandoModelo(false) }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setArrastandoModelo(false)
                          const arquivo = e.dataTransfer.files?.[0]
                          if (arquivo && (arquivo.name.endsWith('.glb') || arquivo.type === 'model/gltf-binary' || arquivo.type === 'application/octet-stream')) {
                            uploadModelo3d(arquivo)
                          } else if (arquivo) {
                            setErro('Formato inválido. Envie apenas arquivos .glb')
                          }
                        }}
                        role="button"
                        tabIndex={enviandoModelo ? -1 : 0}
                        aria-label="Selecionar ou arrastar modelo 3D para upload"
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && !enviandoModelo) {
                            e.preventDefault()
                            inputModeloRef.current?.click()
                          }
                        }}
                        className={cn(
                          'w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed rounded-xl text-sm transition-all duration-150 select-none',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                          enviandoModelo
                            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                            : arrastandoModelo
                              ? 'border-ouro-500 bg-ouro-50 scale-[1.01] cursor-copy shadow-md'
                              : 'border-slate-200 hover:border-ouro-400 hover:bg-ouro-50/30 cursor-pointer',
                        )}
                      >
                        {enviandoModelo ? (
                          <>
                            <Loader2 size={20} className="text-slate-400 animate-spin" aria-hidden="true" />
                            <span className="text-slate-500">Enviando modelo 3D...</span>
                          </>
                        ) : arrastandoModelo ? (
                          <>
                            <Box size={20} className="text-ouro-500 animate-bounce" aria-hidden="true" />
                            <span className="text-ouro-700 font-semibold">Solte o arquivo aqui</span>
                          </>
                        ) : (
                          <>
                            <Box size={20} className="text-slate-400" aria-hidden="true" />
                            <span className="text-slate-600 font-medium">Clique ou arraste um modelo 3D</span>
                            <span className="text-slate-400 text-xs">Formato .glb — máx. 80MB</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={inputModeloRef}
                        type="file"
                        accept=".glb"
                        className="sr-only"
                        aria-hidden="true"
                        onChange={(e) => {
                          const arquivo = e.target.files?.[0]
                          if (arquivo) uploadModelo3d(arquivo)
                          e.target.value = ''
                        }}
                      />
                    </>
                  )}
                </div>
            </SectionCard>

            {/* Espaço para o footer fixo */}
            <div className="h-2" />
          </div>
        </form>

        {/* Footer fixo */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando || enviandoImagem}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {salvando && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {salvando ? 'Salvando...' : produto ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </div>
    </>
  )
}
