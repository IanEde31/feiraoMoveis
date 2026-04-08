'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  ChevronDown,
  Loader2,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Users,
  WifiOff,
  X,
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Conexao = {
  id: string
  nome: string
  status: 'conectado' | 'desconectado' | 'aguardando_qr' | 'conectando' | 'erro'
  numero_telefone: string | null
  qr_code: string | null
}

type Contato = {
  id: string
  conexao_id: string
  jid: string
  nome: string | null
  nome_push: string | null
  numero_telefone: string
  is_grupo: boolean
  avatar_url: string | null
}

type Mensagem = {
  id: string
  conexao_id: string
  contato_id: string
  conteudo: string | null
  tipo: string
  enviado_por_nos: boolean
  timestamp_whatsapp: string
  status_entrega: string | null
}

type UltimaMensagem = {
  contato_id: string | null
  conteudo: string | null
  enviado_por_nos: boolean | null
  timestamp_whatsapp: string | null
  tipo: string | null
  nao_lidas: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CORES_AVATAR = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-indigo-500',
]

function corAvatar(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_AVATAR[Math.abs(hash) % CORES_AVATAR.length]
}

function nomeExibicao(c: Contato): string {
  return c.nome ?? c.nome_push ?? c.numero_telefone
}

function formatarHorario(iso: string): string {
  const d = new Date(iso)
  const diffDias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDias === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDias === 1) return 'Ontem'
  if (diffDias < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  const diffDias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDias === 0) return 'Hoje'
  if (diffDias === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function mesmoDia(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

const STATUS_LABEL: Record<Conexao['status'], string> = {
  conectado: 'Conectado',
  aguardando_qr: 'Aguardando QR',
  conectando: 'Conectando…',
  desconectado: 'Desconectado',
  erro: 'Erro',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [conexoes, setConexoes] = useState<Conexao[]>([])
  const [conexaoSelId, setConexaoSelId] = useState<string | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [contatoSelId, setContatoSelId] = useState<string | null>(null)
  const [mensagensPorContato, setMensagensPorContato] = useState<Record<string, Mensagem[]>>({})
  const [ultimaMsgPorContato, setUltimaMsgPorContato] = useState<Record<string, UltimaMensagem>>({})
  const [naoLidosPorContato, setNaoLidosPorContato] = useState<Record<string, number>>({})

  const [busca, setBusca] = useState('')
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregandoMsgs, setCarregandoMsgs] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [qrModal, setQrModal] = useState<{ conexaoId: string; qr: string | null } | null>(null)
  const [novoModal, setNovoModal] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [conectando, setConectando] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownAberto) return
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [dropdownAberto])

  // ── Carregar conexões ──────────────────────────────────────────────────────

  const carregarConexoes = useCallback(async () => {
    const r = await fetch('/api/whatsapp/conexoes')
    const j = await r.json()
    const lista: Conexao[] = j.data ?? []
    setConexoes(lista)
    setConexaoSelId((prev) => {
      if (prev && lista.some((c) => c.id === prev)) return prev
      return lista.find((c) => c.status === 'conectado')?.id ?? lista[0]?.id ?? null
    })
  }, [])

  useEffect(() => { carregarConexoes() }, [carregarConexoes])

  // ── Carregar contatos + últimas mensagens ao trocar conexão ───────────────

  const carregarContatos = useCallback(
    async (conexaoId: string, opcoes?: { manterSelecao?: boolean }) => {
      const r = await fetch(`/api/whatsapp/contatos?conexao_id=${conexaoId}`, {
        cache: 'no-store',
      })
      const j = await r.json()
      const listaContatos: Contato[] = j.contatos ?? []
      const listaUltimas: UltimaMensagem[] = j.ultimas ?? []

      setContatos(listaContatos)
      if (!opcoes?.manterSelecao) setContatoSelId(null)

      const ultimasMap: Record<string, UltimaMensagem> = {}
      for (const u of listaUltimas) {
        if (u.contato_id) ultimasMap[u.contato_id] = u
      }
      setUltimaMsgPorContato(ultimasMap)

      // Não-lidos: incrementa quando chega nova mensagem que não é da conversa aberta.
      // Aqui apenas inicializa para contatos novos (não sobrescreve contadores existentes).
      setNaoLidosPorContato((prev) => {
        const nova = { ...prev }
        for (const u of listaUltimas) {
          if (u.contato_id && !(u.contato_id in nova)) {
            nova[u.contato_id] = u.nao_lidas ?? 0
          }
        }
        return nova
      })
    },
    []
  )

  useEffect(() => {
    if (!conexaoSelId) return
    carregarContatos(conexaoSelId)
  }, [conexaoSelId, carregarContatos])

  // ── Carregar mensagens ao selecionar contato ──────────────────────────────

  useEffect(() => {
    if (!contatoSelId) return
    setNaoLidosPorContato((prev) => ({ ...prev, [contatoSelId]: 0 }))
    if (mensagensPorContato[contatoSelId]) return

    setCarregandoMsgs(true)
    fetch(`/api/whatsapp/mensagens?contato_id=${contatoSelId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        setMensagensPorContato((prev) => ({
          ...prev,
          [contatoSelId]: (j.mensagens ?? []) as Mensagem[],
        }))
      })
      .finally(() => setCarregandoMsgs(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contatoSelId])

  const mensagensAtivas = useMemo(
    () => (contatoSelId ? (mensagensPorContato[contatoSelId] ?? []) : []),
    [mensagensPorContato, contatoSelId]
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagensAtivas.length])

  // ── Polling: lista de contatos / últimas mensagens (5s) ───────────────────
  // Substitui o Realtime do browser, que não funciona com a sessão JWT do Clerk
  // (RLS bloqueia). Toda leitura passa por API server-side com service role.

  useEffect(() => {
    if (!conexaoSelId) return
    const t = setInterval(() => {
      carregarContatos(conexaoSelId, { manterSelecao: true })
    }, 5000)
    return () => clearInterval(t)
  }, [conexaoSelId, carregarContatos])

  // ── Polling: mensagens da conversa aberta (3s, incremental) ───────────────

  useEffect(() => {
    if (!contatoSelId) return
    const t = setInterval(async () => {
      const atuais = mensagensPorContato[contatoSelId]
      const desde = atuais && atuais.length > 0
        ? atuais[atuais.length - 1].timestamp_whatsapp
        : null
      const url = desde
        ? `/api/whatsapp/mensagens?contato_id=${contatoSelId}&desde=${encodeURIComponent(desde)}`
        : `/api/whatsapp/mensagens?contato_id=${contatoSelId}`
      const r = await fetch(url, { cache: 'no-store' })
      const j = await r.json()
      const novas: Mensagem[] = j.mensagens ?? []
      if (novas.length === 0) return

      setMensagensPorContato((prev) => {
        const existentes = prev[contatoSelId] ?? []
        const ids = new Set(existentes.map((m) => m.id))
        const acrescimo = novas.filter((m) => !ids.has(m.id))
        if (acrescimo.length === 0) return prev
        return { ...prev, [contatoSelId]: [...existentes, ...acrescimo] }
      })
    }, 3000)
    return () => clearInterval(t)
  }, [contatoSelId, mensagensPorContato])

  // ── Polling: status das conexões (8s) ─────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() => carregarConexoes(), 8000)
    return () => clearInterval(t)
  }, [carregarConexoes])

  // Polling do QR (fallback)
  useEffect(() => {
    if (!qrModal) return
    const t = setInterval(async () => {
      const r = await fetch(`/api/whatsapp/status?conexao_id=${qrModal.conexaoId}`)
      const j = await r.json()
      if (j.status === 'conectado') {
        setQrModal(null)
        carregarConexoes()
      } else if (j.qr && j.qr !== qrModal.qr) {
        setQrModal((m) => (m ? { ...m, qr: j.qr } : m))
      }
    }, 3000)
    return () => clearInterval(t)
  }, [qrModal, carregarConexoes])

  // ── Ações ──────────────────────────────────────────────────────────────────

  async function criarNovaConexao() {
    if (!novoNome.trim()) return
    const r = await fetch('/api/whatsapp/conexoes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nome: novoNome }),
    })
    const j = await r.json()
    setNovoNome('')
    setNovoModal(false)
    await carregarConexoes()
    if (j?.data?.id) setConexaoSelId(j.data.id)
  }

  async function conectar(conexaoId: string) {
    setConectando(conexaoId)
    try {
      const r = await fetch('/api/whatsapp/conectar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conexao_id: conexaoId }),
      })
      const j = await r.json()
      if (!r.ok) {
        alert('Erro ao conectar: ' + (j.error ?? 'desconhecido'))
        return
      }
      if (j.status === 'conectado') carregarConexoes()
      else setQrModal({ conexaoId, qr: j.qr })
    } finally {
      setConectando(null)
    }
  }

  async function enviar() {
    if (!input.trim() || !contatoSelId || !conexaoSelId) return
    const contato = contatos.find((c) => c.id === contatoSelId)
    if (!contato) return
    setEnviando(true)
    try {
      await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conexao_id: conexaoSelId, jid: contato.jid, texto: input }),
      })
      setInput('')
    } finally {
      setEnviando(false)
    }
  }

  // ── Derivados ──────────────────────────────────────────────────────────────

  const contatosOrdenados = useMemo(() => {
    return [...contatos].sort((a, b) => {
      const tA = ultimaMsgPorContato[a.id]?.timestamp_whatsapp
      const tB = ultimaMsgPorContato[b.id]?.timestamp_whatsapp
      if (!tA && !tB) return 0
      if (!tA) return 1
      if (!tB) return -1
      return new Date(tB).getTime() - new Date(tA).getTime()
    })
  }, [contatos, ultimaMsgPorContato])

  const contatosFiltrados = useMemo(() => {
    if (!busca.trim()) return contatosOrdenados
    const q = busca.toLowerCase()
    return contatosOrdenados.filter(
      (c) => nomeExibicao(c).toLowerCase().includes(q) || c.numero_telefone.includes(q)
    )
  }, [contatosOrdenados, busca])

  const contatoSel = useMemo(
    () => contatos.find((c) => c.id === contatoSelId) ?? null,
    [contatos, contatoSelId]
  )

  const conexaoSel = useMemo(
    () => conexoes.find((c) => c.id === conexaoSelId) ?? null,
    [conexoes, conexaoSelId]
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Cabeçalho da página (mesmo padrão de Produtos/Clientes) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-slate-900">WhatsApp</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Espelho das conversas em tempo real por número conectado
          </p>
        </div>
      </div>

      {/* Card principal com duas colunas */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex h-[calc(100dvh-12rem)] min-h-[32rem]">

        {/* ═══ COLUNA: Conversas ═══════════════════════════════════════════ */}
        <aside className="w-80 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/40">

          {/* Dropdown de conexão (gestão de conexões) */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownAberto((v) => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 transition-colors text-left"
              >
                {conexaoSel ? (
                  <>
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(conexaoSel.nome)}`}
                    >
                      {conexaoSel.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {conexaoSel.nome}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusDot status={conexaoSel.status} />
                        <span className="text-[11px] text-slate-500 truncate">
                          {conexaoSel.status === 'conectado'
                            ? conexaoSel.numero_telefone ?? STATUS_LABEL[conexaoSel.status]
                            : STATUS_LABEL[conexaoSel.status]}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                      <WifiOff className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 text-sm text-slate-500">Nenhuma conexão</div>
                  </>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${dropdownAberto ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownAberto && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="max-h-72 overflow-y-auto py-1">
                    {conexoes.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-slate-500">
                        Nenhuma conexão cadastrada
                      </div>
                    )}
                    {conexoes.map((c) => {
                      const ativa = c.id === conexaoSelId
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setConexaoSelId(c.id)
                            setDropdownAberto(false)
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                            ativa ? 'bg-amber-50/60' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white ${corAvatar(c.nome)}`}
                          >
                            {c.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {c.nome}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StatusDot status={c.status} />
                              <span className="text-[11px] text-slate-500 truncate">
                                {c.status === 'conectado'
                                  ? c.numero_telefone ?? STATUS_LABEL[c.status]
                                  : STATUS_LABEL[c.status]}
                              </span>
                            </div>
                          </div>
                          {ativa && <Check className="h-4 w-4 text-amber-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setDropdownAberto(false)
                      setNovoModal(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar nova conexão
                  </button>
                </div>
              )}
            </div>

            {/* Botão conectar (se selecionada e desconectada) */}
            {conexaoSel && conexaoSel.status !== 'conectado' && (
              <button
                onClick={() => conectar(conexaoSel.id)}
                disabled={conectando === conexaoSel.id}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition-colors"
              >
                {conectando === conexaoSel.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <QrCode className="h-3.5 w-3.5" />
                )}
                {conexaoSel.status === 'aguardando_qr' ? 'Ver QR Code' : 'Conectar'}
              </button>
            )}
          </div>

          {/* Busca */}
          <div className="px-3 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar conversa…"
                className="w-full bg-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={() => conexaoSelId && carregarContatos(conexaoSelId)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              title="Recarregar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto">
            {!conexaoSelId && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <WifiOff className="h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-500">
                  Selecione uma conexão para ver as conversas
                </p>
              </div>
            )}

            {conexaoSelId && contatosFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-500">
                  {busca ? 'Nenhuma conversa encontrada.' : 'Aguardando mensagens…'}
                </p>
              </div>
            )}

            {contatosFiltrados.map((c) => {
              const ultima = ultimaMsgPorContato[c.id]
              const naoLidos = naoLidosPorContato[c.id] ?? 0
              const nome = nomeExibicao(c)
              const selecionado = contatoSelId === c.id

              return (
                <button
                  key={c.id}
                  onClick={() => setContatoSelId(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-slate-100 hover:bg-slate-50 ${
                    selecionado ? 'bg-amber-50/60 hover:bg-amber-50/80' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(nome)}`}
                    >
                      {nome.charAt(0).toUpperCase()}
                    </div>
                    {c.is_grupo && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                        <Users className="h-2.5 w-2.5 text-slate-500" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm truncate ${
                          naoLidos > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                        }`}
                      >
                        {nome}
                      </span>
                      {ultima?.timestamp_whatsapp && (
                        <span
                          className={`text-[10px] shrink-0 ml-2 ${
                            naoLidos > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {formatarHorario(ultima.timestamp_whatsapp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 truncate flex-1">
                        {ultima ? (
                          <>
                            {ultima.enviado_por_nos && (
                              <CheckCheck className="inline h-3 w-3 mr-0.5 text-amber-500/80" />
                            )}
                            {ultima.conteudo ?? `[${ultima.tipo ?? 'mídia'}]`}
                          </>
                        ) : (
                          <span className="italic text-slate-400">sem mensagens</span>
                        )}
                      </span>
                      {naoLidos > 0 && (
                        <span className="ml-2 shrink-0 min-w-[1.25rem] h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
                          {naoLidos > 99 ? '99+' : naoLidos}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ═══ COLUNA: Chat ════════════════════════════════════════════════ */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {!contatoSel ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-slate-50/60">
              <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <MessageCircle className="h-9 w-9 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Nenhuma conversa selecionada</p>
                <p className="text-xs text-slate-500 mt-1">
                  Escolha um contato na lista para visualizar as mensagens
                </p>
              </div>
              {conexaoSel && conexaoSel.status !== 'conectado' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <WifiOff className="h-4 w-4 shrink-0" />
                  <span>Conexão &ldquo;{conexaoSel.nome}&rdquo; está offline.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Cabeçalho do chat */}
              <div className="h-16 shrink-0 flex items-center gap-3 px-4 border-b border-slate-200 bg-white">
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ${corAvatar(nomeExibicao(contatoSel))}`}
                >
                  {nomeExibicao(contatoSel).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {nomeExibicao(contatoSel)}
                  </div>
                  <div className="text-[11px] text-slate-500">{contatoSel.numero_telefone}</div>
                </div>
                {contatoSel.is_grupo && (
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">
                    Grupo
                  </span>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-slate-50/60">
                {carregandoMsgs ? (
                  <div className="flex justify-center pt-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : mensagensAtivas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <p className="text-xs text-slate-400">
                      Nenhuma mensagem ainda. As mensagens aparecem aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  mensagensAtivas.map((m, i) => {
                    const anterior = mensagensAtivas[i - 1]
                    const exibirData = i === 0 || !mesmoDia(anterior.timestamp_whatsapp, m.timestamp_whatsapp)
                    const enviado = m.enviado_por_nos

                    return (
                      <Fragment key={m.id}>
                        {exibirData && (
                          <div className="flex justify-center py-3">
                            <span className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shadow-sm">
                              {formatarData(m.timestamp_whatsapp)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${enviado ? 'justify-end' : 'justify-start'} mb-0.5`}>
                          <div
                            className={`max-w-[65%] min-w-[4rem] rounded-2xl px-3.5 py-2 shadow-sm ${
                              enviado
                                ? 'bg-amber-500 text-white rounded-br-sm'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                            }`}
                          >
                            {m.conteudo ? (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {m.conteudo}
                              </p>
                            ) : (
                              <p className="text-sm italic opacity-60">[{m.tipo ?? 'mídia'}]</p>
                            )}
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 ${
                                enviado ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              <span className="text-[10px]">
                                {new Date(m.timestamp_whatsapp).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {enviado && (
                                <CheckCheck
                                  className={`h-3 w-3 ${
                                    m.status_entrega === 'lido' ? 'text-sky-200' : ''
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Composição */}
              <div className="shrink-0 px-4 py-3 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    enviar()
                  }}
                  className="flex items-end gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite uma mensagem…"
                    className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:bg-white border border-transparent focus:border-slate-200 transition-all"
                    disabled={enviando}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        enviar()
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !input.trim()}
                    className="h-10 w-10 shrink-0 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white shadow-sm"
                  >
                    {enviando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ═══ MODAL: QR Code ═══════════════════════════════════════════════ */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-[22rem] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-playfair font-semibold text-base text-slate-900">
                  Escanear QR Code
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {conexoes.find((c) => c.id === qrModal.conexaoId)?.nome}
                </p>
              </div>
              <button
                onClick={() => setQrModal(null)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              {qrModal.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrModal.qr}
                  alt="QR Code WhatsApp"
                  className="h-52 w-52 rounded-xl bg-white border border-slate-200 p-2 shadow-sm"
                />
              ) : (
                <div className="h-52 w-52 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                  <p className="text-xs text-slate-500">Gerando QR Code…</p>
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-slate-700">Como conectar:</p>
                <ol className="text-[11px] text-slate-500 space-y-0.5 text-left">
                  <li>1. Abra o WhatsApp no celular</li>
                  <li>2. Toque em <strong className="text-slate-700">Aparelhos conectados</strong></li>
                  <li>3. Toque em <strong className="text-slate-700">Conectar aparelho</strong></li>
                  <li>4. Aponte a câmera para este QR Code</li>
                </ol>
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando leitura…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Nova conexão ══════════════════════════════════════════ */}
      {novoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-playfair font-semibold text-base text-slate-900">
                Nova conexão WhatsApp
              </h3>
              <button
                onClick={() => setNovoModal(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  Nome da instância
                </label>
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Vendedor João, Atendimento…"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') criarNovaConexao()
                    if (e.key === 'Escape') setNovoModal(false)
                  }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setNovoModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarNovaConexao}
                  disabled={!novoNome.trim()}
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Conexao['status'] }) {
  const classes: Record<Conexao['status'], string> = {
    conectado: 'bg-emerald-500',
    aguardando_qr: 'bg-amber-500 animate-pulse',
    conectando: 'bg-sky-500 animate-pulse',
    desconectado: 'bg-slate-400',
    erro: 'bg-red-500',
  }
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${classes[status] ?? 'bg-slate-400'}`}
    />
  )
}
