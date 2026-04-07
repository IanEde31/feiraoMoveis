'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2, User, Phone, Mail, Tag, DollarSign, FileText, Hash } from 'lucide-react'
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
    valor_estimado: cliente.valor_estimado?.toString() ?? '',
    tags: cliente.tags,
    observacoes: cliente.observacoes ?? '',
  }
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
  )
}

interface InputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  maxLength?: number
}
function Input({ value, onChange, placeholder, type = 'text', required, maxLength }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-colors focus:border-ouro-400 focus:ring-2 focus:ring-ouro-100 placeholder:text-slate-400"
    />
  )
}

// ---------------------------------------------------------------------------
// Configurações estáticas
// ---------------------------------------------------------------------------

const origensOpcoes: { valor: Origem; rotulo: string }[] = [
  { valor: 'whatsapp',    rotulo: 'WhatsApp' },
  { valor: 'indicacao',   rotulo: 'Indicação' },
  { valor: 'loja_fisica', rotulo: 'Loja Física' },
  { valor: 'site',        rotulo: 'Site' },
  { valor: 'instagram',   rotulo: 'Instagram' },
  { valor: 'outro',       rotulo: 'Outro' },
]

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
  aberto,
  cliente,
  estagios,
  estagioIdPadrao,
  aoFechar,
  aoSalvar,
}: SheetClienteProps) {
  const [form, setForm] = useState<FormState>(() =>
    estadoInicial(cliente, estagioIdPadrao)
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const nomeRef = useRef<HTMLInputElement>(null)

  // Resetar form ao abrir/mudar cliente
  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(cliente, estagioIdPadrao))
      setErro(null)
      setTimeout(() => nomeRef.current?.focus(), 80)
    }
  }, [aberto, cliente, estagioIdPadrao])

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, aoFechar])

  // Travar scroll do body
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
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : undefined,
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

    // Normalizar para o tipo Cliente
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={editando ? 'Editar cliente' : 'Novo cliente'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-playfair text-lg font-semibold text-slate-900">
              {editando ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {editando ? `Editando ${cliente!.nome}` : 'Preencha os dados do cliente'}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Formulário */}
        <form
          id="form-cliente"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          noValidate
        >

          {/* Identificação */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-ouro-600" aria-hidden="true" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Identificação
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label required>Nome</Label>
                <input
                  ref={nomeRef}
                  type="text"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Nome completo ou empresa"
                  required
                  maxLength={120}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-colors focus:border-ouro-400 focus:ring-2 focus:ring-ouro-100 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CPF / CNPJ</Label>
                  <Input
                    value={form.cpf_cnpj}
                    onChange={(v) => set('cpf_cnpj', v)}
                    placeholder="000.000.000-00"
                    maxLength={18}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={14} className="text-ouro-600" aria-hidden="true" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Contato
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.telefone}
                  onChange={(v) => set('telefone', v)}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  maxLength={20}
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
          </section>

          {/* Funil de Vendas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} className="text-ouro-600" aria-hidden="true" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Funil de Vendas
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label required>Estágio</Label>
                <select
                  value={form.estagio_id}
                  onChange={(e) => set('estagio_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-colors focus:border-ouro-400 focus:ring-2 focus:ring-ouro-100 cursor-pointer"
                >
                  <option value="">Selecione um estágio</option>
                  {estagios
                    .slice()
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origem</Label>
                  <select
                    value={form.origem}
                    onChange={(e) => set('origem', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-colors focus:border-ouro-400 focus:ring-2 focus:ring-ouro-100 cursor-pointer"
                  >
                    <option value="">Não informado</option>
                    {origensOpcoes.map(({ valor, rotulo }) => (
                      <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Valor Estimado (R$)</Label>
                  <Input
                    value={form.valor_estimado}
                    onChange={(v) => set('valor_estimado', v)}
                    placeholder="0,00"
                    type="number"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={14} className="text-ouro-600" aria-hidden="true" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Tags
              </h3>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Selecionar tags">
              {tagsDisponiveis.map((tag) => {
                const ativo = form.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                      ativo
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                    aria-pressed={ativo}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Observações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-ouro-600" aria-hidden="true" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Observações
              </h3>
            </div>

            <div>
              <Label>Anotações internas</Label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Preferências, histórico, observações importantes..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-colors focus:border-ouro-400 focus:ring-2 focus:ring-ouro-100 placeholder:text-slate-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right tabular-nums">
                {form.observacoes.length}/1000
              </p>
            </div>
          </section>

        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white">
          {erro && (
            <p className="text-xs text-red-600 mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={aoFechar}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-cliente"
              disabled={salvando}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ouro-600 hover:bg-ouro-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-2 active:scale-95"
            >
              {salvando && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
