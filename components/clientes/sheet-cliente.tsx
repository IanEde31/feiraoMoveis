'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Loader2, User, Phone, Mail, DollarSign, FileText,
  ChevronsUpDown, Check, Tag, MessageCircle, Store, Globe,
  Instagram, HelpCircle, TrendingUp,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Cliente, Origem, EstagioKanban } from './tipos'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface FormState {
  nome: string
  telefone: string
  email: string
  cpf_cnpj: string
  estagio_id: string
  origem: string
  valor_estimado: string
  tags: string[]
  observacoes: string
}

function estadoInicial(cliente?: Cliente | null, estagioIdPadrao?: string): FormState {
  if (!cliente) {
    return {
      nome: '', telefone: '', email: '', cpf_cnpj: '',
      estagio_id: estagioIdPadrao ?? '',
      origem: '', valor_estimado: '', tags: [], observacoes: '',
    }
  }
  return {
    nome: cliente.nome,
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
    cpf_cnpj: cliente.cpf_cnpj ?? '',
    estagio_id: cliente.estagio_id,
    origem: cliente.origem ?? '',
    valor_estimado: cliente.valor_estimado
      ? formatarCentavosParaExibicao(Math.round(cliente.valor_estimado * 100))
      : '',
    tags: cliente.tags,
    observacoes: cliente.observacoes ?? '',
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

function aplicarMascaraMonetaria(novoValor: string): string {
  const digits = novoValor.replace(/\D/g, '')
  if (digits === '' || digits === '0' || digits === '00') return ''
  return formatarCentavosParaExibicao(parseInt(digits, 10))
}

function extrairNumeroDeFormatado(formatado: string): number {
  if (!formatado) return 0
  const limpo = formatado.replace(/\./g, '').replace(',', '.')
  return parseFloat(limpo) || 0
}

// ---------------------------------------------------------------------------
// Máscaras de input
// ---------------------------------------------------------------------------

function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function mascaraCpfCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  if (d.length === 0) return ''
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  if (d.length <= 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  // CNPJ
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
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
  value, onChange, placeholder, type = 'text', required, maxLength, inputRef,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; required?: boolean; maxLength?: number
  inputRef?: React.Ref<HTMLInputElement>
}) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-all"
    />
  )
}

function MoneyInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none select-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(aplicarMascaraMonetaria(e.target.value))}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 transition-all tabular-nums"
      />
    </div>
  )
}

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
// Combobox de Estágios
// ---------------------------------------------------------------------------

function ComboboxEstagio({
  estagios, valor, onChange,
}: {
  estagios: EstagioKanban[]; valor: string; onChange: (v: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const selecionado = estagios.find((e) => e.id === valor)

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
            selecionado ? 'text-slate-800 border-slate-200' : 'text-slate-400 border-slate-200',
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selecionado && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selecionado.cor }}
              />
            )}
            {selecionado ? selecionado.nome : 'Selecione um estágio...'}
          </span>
          <ChevronsUpDown size={14} className="ml-2 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar estágio..." />
          <CommandList>
            <CommandEmpty>Nenhum estágio encontrado.</CommandEmpty>
            <CommandGroup>
              {estagios
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((est) => (
                  <CommandItem
                    key={est.id}
                    value={est.nome}
                    onSelect={() => { onChange(est.id); setAberto(false) }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: est.cor }}
                    />
                    {est.nome}
                    {est.id === valor && <Check size={14} className="ml-auto text-ouro-600" />}
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
// Combobox de Origem
// ---------------------------------------------------------------------------

const origensOpcoes: { valor: Origem; rotulo: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { valor: 'whatsapp',    rotulo: 'WhatsApp',    icon: MessageCircle },
  { valor: 'indicacao',   rotulo: 'Indicação',   icon: User },
  { valor: 'loja_fisica', rotulo: 'Loja Física',  icon: Store },
  { valor: 'site',        rotulo: 'Site',         icon: Globe },
  { valor: 'instagram',   rotulo: 'Instagram',    icon: Instagram },
  { valor: 'outro',       rotulo: 'Outro',        icon: HelpCircle },
]

function ComboboxOrigem({
  valor, onChange,
}: {
  valor: string; onChange: (v: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const selecionada = origensOpcoes.find((o) => o.valor === valor)

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
          <span className="flex items-center gap-2 truncate">
            {selecionada && <selecionada.icon size={14} className="text-slate-500 flex-shrink-0" />}
            {selecionada ? selecionada.rotulo : 'Selecione a origem...'}
          </span>
          <ChevronsUpDown size={14} className="ml-2 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar origem..." />
          <CommandList>
            <CommandEmpty>Nenhuma origem encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__nenhuma__"
                onSelect={() => { onChange(''); setAberto(false) }}
              >
                <span className="text-slate-400 italic">Não informado</span>
                {!valor && <Check size={14} className="ml-auto text-ouro-600" />}
              </CommandItem>
              {origensOpcoes.map(({ valor: v, rotulo, icon: Ico }) => (
                <CommandItem
                  key={v}
                  value={rotulo}
                  onSelect={() => { onChange(v === valor ? '' : v); setAberto(false) }}
                >
                  <Ico size={14} className="text-slate-500" />
                  {rotulo}
                  {v === valor && <Check size={14} className="ml-auto text-ouro-600" />}
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
// Configurações
// ---------------------------------------------------------------------------

const tagsDisponiveis = [
  'apartamento', 'casa', 'sala', 'quarto', 'cozinha',
  'escritorio', 'completo', 'premium', 'luxo', 'moderno',
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SheetClienteProps {
  aberto: boolean
  cliente?: Cliente | null
  estagios: EstagioKanban[]
  estagioIdPadrao?: string
  aoFechar: () => void
  aoSalvar: (cliente: Cliente) => void
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SheetCliente({
  aberto, cliente, estagios, estagioIdPadrao, aoFechar, aoSalvar,
}: SheetClienteProps) {
  const [form, setForm] = useState<FormState>(() =>
    estadoInicial(cliente, estagioIdPadrao),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const nomeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(cliente, estagioIdPadrao))
      setErro(null)
      setTimeout(() => nomeRef.current?.focus(), 80)
    }
  }, [aberto, cliente, estagioIdPadrao])

  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, aoFechar])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  function set(field: keyof FormState, value: FormState[keyof FormState]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return }
    if (!form.estagio_id) { setErro('Selecione um estágio'); return }

    setSalvando(true)
    setErro(null)

    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || undefined,
      email: form.email.trim() || undefined,
      cpf_cnpj: form.cpf_cnpj.trim() || undefined,
      estagio_id: form.estagio_id,
      origem: form.origem || undefined,
      valor_estimado: form.valor_estimado ? extrairNumeroDeFormatado(form.valor_estimado) : undefined,
      tags: form.tags,
      observacoes: form.observacoes.trim() || undefined,
    }

    const url = cliente ? `/api/clientes/${cliente.id}` : '/api/clientes'
    const method = cliente ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErro(json.error ?? 'Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }

    const salvo = await res.json()

    const clienteSalvo: Cliente = {
      id: salvo.id,
      nome: salvo.nome,
      telefone: salvo.telefone ?? undefined,
      email: salvo.email ?? undefined,
      cpf_cnpj: salvo.cpf_cnpj ?? undefined,
      estagio_id: salvo.estagio_id ?? form.estagio_id,
      origem: salvo.origem ?? undefined,
      tags: salvo.tags ?? [],
      valor_estimado: salvo.valor_estimado ?? undefined,
      observacoes: salvo.observacoes ?? undefined,
      created_at: salvo.created_at,
    }

    setSalvando(false)
    aoSalvar(clienteSalvo)
  }

  if (!aberto) return null

  const editando = !!cliente

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-gradient-to-b from-white to-slate-50/80 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={editando ? 'Editar cliente' : 'Novo cliente'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 flex-shrink-0 bg-white">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-slate-900">
              {editando ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {editando ? `Editando ${cliente!.nome}` : 'Preencha os dados do cliente'}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Formulário */}
        <form
          id="form-cliente"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
          noValidate
        >
          {/* Erro global */}
          {erro && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
              <span className="flex-shrink-0 font-semibold">Erro:</span>
              <span>{erro}</span>
            </div>
          )}

          {/* ── 1. Identificação ── */}
          <SectionCard icon={User} titulo="Identificação" numero={1}>
            <div className="space-y-3">
              <div>
                <Label required>Nome</Label>
                <Input
                  inputRef={nomeRef}
                  value={form.nome}
                  onChange={(v) => set('nome', v)}
                  placeholder="Nome completo ou empresa"
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <Label>CPF / CNPJ</Label>
                <Input
                  value={form.cpf_cnpj}
                  onChange={(v) => set('cpf_cnpj', mascaraCpfCnpj(v))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 2. Contato ── */}
          <SectionCard icon={Phone} titulo="Contato" numero={2}>
            <div className="space-y-3">
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.telefone}
                  onChange={(v) => set('telefone', mascaraTelefone(v))}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  maxLength={16}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  value={form.email}
                  onChange={(v) => set('email', v)}
                  placeholder="cliente@email.com"
                  type="email"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 3. Funil de Vendas ── */}
          <SectionCard icon={TrendingUp} titulo="Funil de Vendas" numero={3}>
            <div className="space-y-3">
              <div>
                <Label required>Estágio</Label>
                <ComboboxEstagio
                  estagios={estagios}
                  valor={form.estagio_id}
                  onChange={(v) => set('estagio_id', v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origem</Label>
                  <ComboboxOrigem
                    valor={form.origem}
                    onChange={(v) => set('origem', v)}
                  />
                </div>
                <div>
                  <Label>Valor Estimado</Label>
                  <MoneyInput
                    value={form.valor_estimado}
                    onChange={(v) => set('valor_estimado', v)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── 4. Tags ── */}
          <SectionCard icon={Tag} titulo="Tags" numero={4}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Selecionar tags">
              {tagsDisponiveis.map((tag) => {
                const ativo = form.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                      ativo
                        ? 'bg-ouro-600 text-white border-ouro-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-ouro-300 hover:bg-ouro-50/30',
                    )}
                    aria-pressed={ativo}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </SectionCard>

          {/* ── 5. Observações ── */}
          <SectionCard icon={FileText} titulo="Observações" numero={5}>
            <div>
              <Label>Anotações internas</Label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Preferências, histórico, observações importantes..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-ouro-500/40 focus:border-ouro-400 resize-none transition-all"
              />
              {form.observacoes.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">
                  {form.observacoes.length}/1000
                </p>
              )}
            </div>
          </SectionCard>

          <div className="h-2" />
        </form>

        {/* Footer */}
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
            type="submit"
            form="form-cliente"
            disabled={salvando}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {salvando && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
        </div>
      </div>
    </>
  )
}
