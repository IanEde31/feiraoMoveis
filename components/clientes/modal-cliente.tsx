'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Phone, Mail, MessageCircle, Pencil, Trash2, Check, Copy,
  ChevronRight, Clock, Tag, FileText, Loader2, Calendar, Hash,
  TrendingUp, AlertCircle, Users, ArrowRight,
} from 'lucide-react'
import type { Cliente, EstagioKanban, Origem } from './tipos'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface HistoricoItem {
  id: string
  created_at: string
  estagio_anterior_id: string | null
  estagio_novo_id: string
  observacao: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const origensConfig: Record<string, { rotulo: string; classe: string }> = {
  whatsapp:    { rotulo: 'WhatsApp',    classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  indicacao:   { rotulo: 'Indicação',   classe: 'bg-violet-50  text-violet-700  border-violet-200' },
  loja_fisica: { rotulo: 'Loja Física', classe: 'bg-amber-50   text-amber-700   border-amber-200' },
  site:        { rotulo: 'Site',        classe: 'bg-blue-50    text-blue-700    border-blue-200' },
  instagram:   { rotulo: 'Instagram',   classe: 'bg-pink-50    text-pink-700    border-pink-200' },
  outro:       { rotulo: 'Outro',       classe: 'bg-slate-50   text-slate-600   border-slate-200' },
}

function iniciaisNome(nome: string): string {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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

function linkWhatsApp(tel: string): string {
  const n = tel.replace(/\D/g, '')
  return `https://wa.me/${n.startsWith('55') ? n : '55' + n}`
}

function formatarTelefone(tel: string): string {
  const n = tel.replace(/\D/g, '').replace(/^55/, '')
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return tel
}

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

function tempoRelativo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 30) return `há ${d} dias`
  if (d < 365) return `há ${Math.floor(d / 30)} meses`
  return `há ${Math.floor(d / 365)} anos`
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function SecaoTitulo({ icone: Icone, children }: { icone: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icone size={13} className="text-ouro-600 flex-shrink-0" aria-hidden="true" />
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{children}</h3>
    </div>
  )
}

function CampoContato({
  icone: Icone,
  label,
  valor,
  href,
  copiavel,
  copiado,
  onCopiar,
  chave,
}: {
  icone: React.ElementType
  label: string
  valor: string
  href?: string
  copiavel?: boolean
  copiado?: string | null
  onCopiar?: (v: string, k: string) => void
  chave?: string
}) {
  const isCopied = copiado === chave
  return (
    <div className="flex items-start gap-3 py-2.5 group/campo">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icone size={13} className="text-slate-500" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-800 hover:text-ouro-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
          >
            {valor}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-800 break-all">{valor}</p>
        )}
      </div>
      {copiavel && onCopiar && chave && (
        <button
          onClick={() => onCopiar(valor, chave)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover/campo:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
          aria-label={isCopied ? 'Copiado' : `Copiar ${label.toLowerCase()}`}
          title={isCopied ? 'Copiado!' : `Copiar ${label.toLowerCase()}`}
        >
          {isCopied
            ? <Check size={12} className="text-emerald-500" aria-hidden="true" />
            : <Copy size={12} aria-hidden="true" />
          }
        </button>
      )}
    </div>
  )
}

function SkeletonLinha() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-slate-200 rounded animate-pulse" style={{ width: '70%' }} />
        <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: '35%' }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ModalClienteProps {
  cliente: Cliente | null
  estagios: EstagioKanban[]
  aoFechar: () => void
  aoEditar: (cliente: Cliente) => void
  aoAtualizar: (cliente: Cliente) => void
  aoDeletar: (cliente: Cliente) => void
}

// ---------------------------------------------------------------------------
// Modal principal
// ---------------------------------------------------------------------------

export function ModalCliente({
  cliente,
  estagios,
  aoFechar,
  aoEditar,
  aoAtualizar,
  aoDeletar,
}: ModalClienteProps) {
  // Estado local do cliente (mutações otimistas)
  const [local, setLocal] = useState<Cliente | null>(cliente)

  // Observações inline
  const [editandoObs, setEditandoObs] = useState(false)
  const [obsTexto, setObsTexto] = useState('')
  const [salvandoObs, setSalvandoObs] = useState(false)

  // Stage change
  const [alterandoEstagio, setAlterandoEstagio] = useState(false)
  const [estagioExpandido, setEstagioExpandido] = useState(false)

  // Histórico
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [historicoCarregando, setHistoricoCarregando] = useState(false)

  // Feedback
  const [copiado, setCopiado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Sincronizar com prop externa
  useEffect(() => {
    if (cliente) {
      setLocal(cliente)
      setEditandoObs(false)
      setEstagioExpandido(false)
      setErro(null)
    }
  }, [cliente])

  // Fechar com Escape
  useEffect(() => {
    if (!cliente) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editandoObs) { setEditandoObs(false); return }
        aoFechar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cliente, editandoObs, aoFechar])

  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = cliente ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [cliente])

  // Carregar histórico ao abrir
  useEffect(() => {
    if (!cliente) return
    setHistorico([])
    setHistoricoCarregando(true)
    fetch(`/api/clientes/${cliente.id}`)
      .then((r) => r.json())
      .then((data) => setHistorico(data.historico ?? []))
      .catch(() => {})
      .finally(() => setHistoricoCarregando(false))
  }, [cliente?.id])

  const copiar = useCallback(async (texto: string, chave: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(chave)
      setTimeout(() => setCopiado(null), 2000)
    } catch {}
  }, [])

  async function mudarEstagio(novoEstagioId: string) {
    if (!local || novoEstagioId === local.estagio_id) { setEstagioExpandido(false); return }
    const estagioAnteriorId = local.estagio_id
    const atualizado = { ...local, estagio_id: novoEstagioId }
    setLocal(atualizado)
    setEstagioExpandido(false)
    setAlterandoEstagio(true)

    const res = await fetch(`/api/clientes/${local.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio_id: novoEstagioId }),
    })

    setAlterandoEstagio(false)
    if (!res.ok) {
      setLocal({ ...local, estagio_id: estagioAnteriorId })
      setErro('Erro ao alterar estágio. Tente novamente.')
      setTimeout(() => setErro(null), 4000)
      return
    }

    aoAtualizar(atualizado)
    // Recarregar histórico após mudança de estágio
    fetch(`/api/clientes/${local.id}`)
      .then((r) => r.json())
      .then((data) => setHistorico(data.historico ?? []))
      .catch(() => {})
  }

  function iniciarEditarObs() {
    setObsTexto(local?.observacoes ?? '')
    setEditandoObs(true)
  }

  async function salvarObs() {
    if (!local) return
    setSalvandoObs(true)
    const atualizado = { ...local, observacoes: obsTexto.trim() || undefined }

    const res = await fetch(`/api/clientes/${local.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: local.nome, telefone: local.telefone, email: local.email,
        cpf_cnpj: local.cpf_cnpj, estagio_id: local.estagio_id,
        origem: local.origem, tags: local.tags,
        valor_estimado: local.valor_estimado,
        observacoes: obsTexto.trim() || null,
      }),
    })

    setSalvandoObs(false)
    if (res.ok) {
      setLocal(atualizado)
      setEditandoObs(false)
      aoAtualizar(atualizado)
    } else {
      setErro('Erro ao salvar observação.')
      setTimeout(() => setErro(null), 4000)
    }
  }

  if (!cliente || !local) return null

  const estagioAtual = estagios.find((e) => e.id === local.estagio_id)
  const estPrincipal = estagios.filter((e) => !e.eh_final).sort((a, b) => a.ordem - b.ordem)
  const estFinais = estagios.filter((e) => e.eh_final).sort((a, b) => a.ordem - b.ordem)
  const origem = local.origem ? origensConfig[local.origem] : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${local.nome}`}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Faixa colorida do estágio */}
          <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: estagioAtual?.cor ?? '#94a3b8' }} />

          {/* ── Header ── */}
          <div className="px-6 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${corAvatar(local.nome)}`}
                aria-hidden="true"
              >
                {iniciaisNome(local.nome)}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <h2 className="font-playfair text-xl font-semibold text-slate-900 leading-tight">
                  {local.nome}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {estagioAtual && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: estagioAtual.cor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" aria-hidden="true" />
                      {estagioAtual.nome}
                    </span>
                  )}
                  {origem && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${origem.classe}`}>
                      {origem.rotulo}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={10} aria-hidden="true" />
                    {formatarData(local.created_at)}
                  </span>
                </div>
              </div>

              {/* Botões do header */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => { aoEditar(local); aoFechar() }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ouro-600 hover:bg-ouro-700 text-white text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 focus-visible:ring-offset-1"
                  aria-label="Editar cliente"
                >
                  <Pencil size={12} aria-hidden="true" />
                  Editar
                </button>
                <button
                  onClick={aoFechar}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
                  aria-label="Fechar"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Ações rápidas de contato */}
            {(local.telefone || local.email) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {local.telefone && (
                  <a
                    href={linkWhatsApp(local.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label={`Abrir WhatsApp de ${local.nome}`}
                  >
                    <MessageCircle size={12} aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
                {local.telefone && (
                  <a
                    href={`tel:${local.telefone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label={`Ligar para ${local.nome}`}
                  >
                    <Phone size={12} aria-hidden="true" />
                    Ligar
                  </a>
                )}
                {local.email && (
                  <a
                    href={`mailto:${local.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label={`Enviar e-mail para ${local.nome}`}
                  >
                    <Mail size={12} aria-hidden="true" />
                    E-mail
                  </a>
                )}
              </div>
            )}

            {/* Erro inline */}
            {erro && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700" role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {erro}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 flex-shrink-0" />

          {/* ── Body (scrollável) ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Grid: Contato + Funil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Contato */}
              <div className="bg-slate-50 rounded-xl p-4">
                <SecaoTitulo icone={Phone}>Contato</SecaoTitulo>
                <div className="divide-y divide-slate-100">
                  {local.telefone ? (
                    <CampoContato
                      icone={Phone}
                      label="Telefone"
                      valor={formatarTelefone(local.telefone)}
                      copiavel
                      copiado={copiado}
                      onCopiar={copiar}
                      chave="telefone"
                    />
                  ) : null}
                  {local.email ? (
                    <CampoContato
                      icone={Mail}
                      label="E-mail"
                      valor={local.email}
                      href={`mailto:${local.email}`}
                      copiavel
                      copiado={copiado}
                      onCopiar={copiar}
                      chave="email"
                    />
                  ) : null}
                  {local.cpf_cnpj ? (
                    <CampoContato
                      icone={Hash}
                      label="CPF / CNPJ"
                      valor={local.cpf_cnpj}
                      copiavel
                      copiado={copiado}
                      onCopiar={copiar}
                      chave="cpf_cnpj"
                    />
                  ) : null}
                  {!local.telefone && !local.email && !local.cpf_cnpj && (
                    <p className="text-xs text-slate-400 py-2">Sem informações de contato</p>
                  )}
                </div>
              </div>

              {/* Funil */}
              <div className="bg-slate-50 rounded-xl p-4">
                <SecaoTitulo icone={TrendingUp}>Funil de Vendas</SecaoTitulo>

                {/* Valor estimado */}
                {local.valor_estimado ? (
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-1">Valor estimado</p>
                    <p className="text-xl font-bold text-ouro-700 tabular-nums">
                      {formatarMoeda(local.valor_estimado)}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-1">Valor estimado</p>
                    <p className="text-sm text-slate-300 italic">Não informado</p>
                  </div>
                )}

                {/* Estágio atual + alterar */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Estágio atual</p>

                  {/* Badge do estágio atual */}
                  <button
                    onClick={() => setEstagioExpandido((v) => !v)}
                    disabled={alterandoEstagio}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 disabled:opacity-60"
                    style={{
                      borderColor: estagioAtual?.cor ?? '#94a3b8',
                      backgroundColor: (estagioAtual?.cor ?? '#94a3b8') + '12',
                    }}
                    aria-expanded={estagioExpandido}
                    aria-label="Alterar estágio"
                  >
                    <div className="flex items-center gap-2">
                      {alterandoEstagio
                        ? <Loader2 size={12} className="animate-spin text-slate-400" aria-hidden="true" />
                        : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: estagioAtual?.cor }} aria-hidden="true" />
                      }
                      <span className="text-sm font-semibold text-slate-800">
                        {estagioAtual?.nome ?? 'Sem estágio'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Alterar</span>
                  </button>

                  {/* Painel de seleção de estágio */}
                  {estagioExpandido && (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 shadow-lg">
                      {/* Estágios principais */}
                      <p className="text-xs text-slate-400 px-1 mb-1.5 font-medium">Pipeline</p>
                      <div className="space-y-0.5 mb-2">
                        {estPrincipal.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => mudarEstagio(e.id)}
                            className={[
                              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                              e.id === local.estagio_id
                                ? 'bg-slate-100 font-semibold text-slate-800 cursor-default'
                                : 'hover:bg-slate-50 text-slate-600 cursor-pointer',
                            ].join(' ')}
                            aria-current={e.id === local.estagio_id ? 'true' : undefined}
                          >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} aria-hidden="true" />
                            {e.nome}
                            {e.id === local.estagio_id && (
                              <Check size={12} className="ml-auto text-ouro-600" aria-hidden="true" />
                            )}
                          </button>
                        ))}
                      </div>
                      {/* Estágios finais */}
                      {estFinais.length > 0 && (
                        <>
                          <div className="border-t border-slate-100 my-1.5" />
                          <p className="text-xs text-slate-400 px-1 mb-1.5 font-medium">Encerramento</p>
                          <div className="space-y-0.5">
                            {estFinais.map((e) => (
                              <button
                                key={e.id}
                                onClick={() => mudarEstagio(e.id)}
                                className={[
                                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                                  e.id === local.estagio_id
                                    ? 'bg-slate-100 font-semibold text-slate-800 cursor-default'
                                    : 'hover:bg-slate-50 text-slate-600 cursor-pointer',
                                ].join(' ')}
                                aria-current={e.id === local.estagio_id ? 'true' : undefined}
                              >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} aria-hidden="true" />
                                {e.nome}
                                {e.id === local.estagio_id && (
                                  <Check size={12} className="ml-auto text-ouro-600" aria-hidden="true" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {local.tags.length > 0 && (
              <div>
                <SecaoTitulo icone={Tag}>Tags</SecaoTitulo>
                <div className="flex flex-wrap gap-2">
                  {local.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SecaoTitulo icone={FileText}>Observações</SecaoTitulo>
                {!editandoObs && (
                  <button
                    onClick={iniciarEditarObs}
                    className="flex items-center gap-1 text-xs text-ouro-600 hover:text-ouro-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded px-1"
                    aria-label="Editar observações"
                  >
                    <Pencil size={11} aria-hidden="true" />
                    Editar
                  </button>
                )}
              </div>

              {editandoObs ? (
                <div className="space-y-2">
                  <textarea
                    value={obsTexto}
                    onChange={(e) => setObsTexto(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Preferências, histórico, observações importantes..."
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm text-slate-800 bg-white border border-ouro-300 rounded-xl outline-none focus:ring-2 focus:ring-ouro-100 placeholder:text-slate-400 resize-none transition-colors"
                    aria-label="Texto das observações"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 tabular-nums">{obsTexto.length}/1000</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditandoObs(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={salvarObs}
                        disabled={salvandoObs}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-ouro-600 hover:bg-ouro-700 disabled:opacity-60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500"
                      >
                        {salvandoObs
                          ? <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                          : <Check size={11} aria-hidden="true" />
                        }
                        {salvandoObs ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-slate-50 rounded-xl px-4 py-3 min-h-[60px] cursor-text"
                  onClick={iniciarEditarObs}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') iniciarEditarObs() }}
                  aria-label="Clique para editar observações"
                >
                  {local.observacoes ? (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {local.observacoes}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Clique para adicionar observações sobre este cliente...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Histórico de movimentações */}
            <div>
              <SecaoTitulo icone={Clock}>Histórico de Movimentações</SecaoTitulo>

              {historicoCarregando ? (
                <div className="space-y-4">
                  <SkeletonLinha />
                  <SkeletonLinha />
                  <SkeletonLinha />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                    <Clock size={16} className="text-slate-300" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-400">Nenhuma movimentação registrada</p>
                  <p className="text-xs text-slate-300 mt-0.5">O histórico aparecerá quando o cliente mudar de estágio</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-[5px] top-3 bottom-3 w-px bg-slate-200" aria-hidden="true" />
                  <div className="space-y-4 pl-5">
                    {historico.map((item) => {
                      const estAnterior = estagios.find((e) => e.id === item.estagio_anterior_id)
                      const estNovo = estagios.find((e) => e.id === item.estagio_novo_id)
                      const ehCriacao = !item.estagio_anterior_id

                      return (
                        <div key={item.id} className="relative">
                          {/* Ponto da timeline */}
                          <div
                            className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-white flex-shrink-0"
                            style={{ backgroundColor: estNovo?.cor ?? '#94a3b8' }}
                            aria-hidden="true"
                          />

                          <div>
                            {ehCriacao ? (
                              <p className="text-sm text-slate-700 font-medium">
                                Cliente cadastrado em{' '}
                                <span className="font-semibold" style={{ color: estNovo?.cor }}>
                                  {estNovo?.nome ?? 'estágio desconhecido'}
                                </span>
                              </p>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap text-sm text-slate-700">
                                <span
                                  className="font-medium"
                                  style={{ color: estAnterior?.cor ?? '#64748b' }}
                                >
                                  {estAnterior?.nome ?? 'Estágio anterior'}
                                </span>
                                <ArrowRight size={12} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                                <span
                                  className="font-semibold"
                                  style={{ color: estNovo?.cor }}
                                >
                                  {estNovo?.nome ?? 'Estágio desconhecido'}
                                </span>
                              </div>
                            )}
                            {item.observacao && (
                              <p className="text-xs text-slate-500 mt-0.5 italic">
                                &ldquo;{item.observacao}&rdquo;
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-0.5">
                              {tempoRelativo(item.created_at)} · {formatarData(item.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-100 px-6 py-3.5 flex-shrink-0 flex items-center justify-between bg-white">
            <button
              onClick={() => aoDeletar(local)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label={`Deletar cliente ${local.nome}`}
            >
              <Trash2 size={12} aria-hidden="true" />
              Deletar cliente
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {formatarData(local.created_at)}
              </span>
              <button
                onClick={aoFechar}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
