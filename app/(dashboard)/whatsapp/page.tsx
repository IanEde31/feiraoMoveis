'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, MessageCircle, WifiOff } from 'lucide-react'

import { useSupabaseClient } from '@/lib/supabase/client'
import { ListaConversas } from '@/components/whatsapp/ListaConversas'
import { CabecalhoChat } from '@/components/whatsapp/CabecalhoChat'
import { AreaMensagens } from '@/components/whatsapp/AreaMensagens'
import { CampoEnvio } from '@/components/whatsapp/CampoEnvio'
import { RespostasRapidas } from '@/components/whatsapp/RespostasRapidas'
import { PainelContexto } from '@/components/whatsapp/PainelContexto'
import {
  ModalQrCode,
  ModalNovaConexao,
  ModalTransferir,
  ModalRespostaRapida,
  DrawerHistorico,
} from '@/components/whatsapp/Modais'
import { nomeExibicao, LIMITE_AGUARDANDO_MIN } from '@/components/whatsapp/helpers'
import {
  AGENTES_MOCK,
  AGENTE_LOGADO_ID,
  RESPOSTAS_RAPIDAS_MOCK,
} from '@/components/whatsapp/mock-equipe'
import type {
  Conexao,
  Contato,
  FiltroConversa,
  Mensagem,
  MetaConversa,
  RespostaRapida,
  UltimaMensagem,
} from '@/components/whatsapp/tipos'

export default function WhatsAppPage() {
  // ─── Estado: dados reais ──────────────────────────────────────────────────
  const [conexoes, setConexoes] = useState<Conexao[]>([])
  const [conexaoSelId, setConexaoSelId] = useState<string | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [contatoSelId, setContatoSelId] = useState<string | null>(null)
  const [mensagensPorContato, setMensagensPorContato] = useState<Record<string, Mensagem[]>>({})
  const [ultimasPorContato, setUltimasPorContato] = useState<Record<string, UltimaMensagem>>({})
  const [naoLidosPorContato, setNaoLidosPorContato] = useState<Record<string, number>>({})

  // ─── Estado: equipe / atribuição (mock — ver CLAUDE.md) ───────────────────
  const [metaPorContato, setMetaPorContato] = useState<Record<string, MetaConversa>>({})
  const [respostasRapidas, setRespostasRapidas] = useState<RespostaRapida[]>(RESPOSTAS_RAPIDAS_MOCK)
  const agentes = AGENTES_MOCK
  const agenteLogado = agentes.find((a) => a.id === AGENTE_LOGADO_ID) ?? null
  const podeAtribuirOutros = !!agenteLogado?.is_gerente
  const agentesPorId = useMemo(
    () => Object.fromEntries(agentes.map((a) => [a.id, a])),
    [agentes]
  )

  // ─── Estado: UI ───────────────────────────────────────────────────────────
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroConversa>('todas')
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregandoMsgs, setCarregandoMsgs] = useState(false)
  const [qrModal, setQrModal] = useState<{ conexaoId: string; qr: string | null } | null>(null)
  const [novoConexaoModal, setNovoConexaoModal] = useState(false)
  const [transferirModal, setTransferirModal] = useState(false)
  const [historicoDrawer, setHistoricoDrawer] = useState(false)
  const [novaRespostaModal, setNovaRespostaModal] = useState(false)
  const [conectando, setConectando] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = useSupabaseClient()

  function notificar(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Carregar conexões ────────────────────────────────────────────────────
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

  useEffect(() => {
    carregarConexoes()
  }, [carregarConexoes])

  // ─── Carregar contatos + últimas mensagens ────────────────────────────────
  const carregarContatos = useCallback(
    async (conexaoId: string, opcoes?: { manterSelecao?: boolean }) => {
      const r = await fetch(`/api/whatsapp/contatos?conexao_id=${conexaoId}`, { cache: 'no-store' })
      const j = await r.json()
      const listaContatos: Contato[] = j.contatos ?? []
      const listaUltimas: UltimaMensagem[] = j.ultimas ?? []

      setContatos(listaContatos)
      if (!opcoes?.manterSelecao) setContatoSelId(null)

      const ultimasMap: Record<string, UltimaMensagem> = {}
      for (const u of listaUltimas) if (u.contato_id) ultimasMap[u.contato_id] = u
      setUltimasPorContato(ultimasMap)

      setNaoLidosPorContato((prev) => {
        const nova = { ...prev }
        for (const u of listaUltimas) {
          if (u.contato_id && !(u.contato_id in nova)) nova[u.contato_id] = u.nao_lidas ?? 0
        }
        return nova
      })

      // Cria meta padrão para contatos novos (mock)
      setMetaPorContato((prev) => {
        const nova = { ...prev }
        for (const c of listaContatos) {
          if (!nova[c.id]) {
            // distribuição mock determinística baseada no id
            const hash = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length - 1)
            const prioridade =
              hash % 5 === 0 ? 'urgente' : hash % 3 === 0 ? 'baixa' : 'normal'
            const semAg = hash % 4 === 0
            nova[c.id] = {
              contato_id: c.id,
              agente_id: semAg ? null : AGENTES_MOCK[hash % AGENTES_MOCK.length].id,
              prioridade: prioridade as MetaConversa['prioridade'],
              status: hash % 6 === 0 ? 'novo' : 'aguardando',
              tags: [],
              notas: [],
            }
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

  // ─── Mensagens da conversa selecionada ────────────────────────────────────
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
    () => (contatoSelId ? mensagensPorContato[contatoSelId] ?? [] : []),
    [mensagensPorContato, contatoSelId]
  )

  // ─── Realtime: contatos (recarrega ao detectar mudança) ────────────────────
  useEffect(() => {
    if (!conexaoSelId) return
    const canal = supabase
      .channel(`whatsapp-contatos-${conexaoSelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contatos_whatsapp',
          filter: `conexao_id=eq.${conexaoSelId}`,
        },
        () => {
          carregarContatos(conexaoSelId, { manterSelecao: true })
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME STATUS contatos]', status)
      })
    return () => { supabase.removeChannel(canal) }
  }, [conexaoSelId, carregarContatos])

  // ─── Realtime: mensagens (insere direto no estado sem re-fetch) ────────────
  useEffect(() => {
    if (!contatoSelId || !conexaoSelId) return
    const canal = supabase
      .channel(`whatsapp-mensagens-${contatoSelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mensagens_whatsapp' },
        (payload) => console.log('[REALTIME WILDCARD]', payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp',
          filter: `conexao_id=eq.${conexaoSelId}`,
        },
        (payload) => {
          console.log('[REALTIME]', payload)
          const nova = payload.new as Mensagem
          if (nova.contato_id !== contatoSelId) return
          setMensagensPorContato((prev) => {
            const existentes = prev[contatoSelId] ?? []
            if (existentes.some((m) => m.id === nova.id)) return prev
            return { ...prev, [contatoSelId]: [...existentes, nova] }
          })
        }
      )
      .subscribe((status, err) => {
        console.log('[REALTIME STATUS mensagens]', status, err ?? '')
      })
    return () => { supabase.removeChannel(canal) }
  }, [contatoSelId, conexaoSelId])

  // ─── Polling: status conexões (8s) ────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => carregarConexoes(), 8000)
    return () => clearInterval(t)
  }, [carregarConexoes])

  // ─── Polling: QR fallback ─────────────────────────────────────────────────
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

  // ─── Ações de conexão ─────────────────────────────────────────────────────
  async function criarNovaConexao(nome: string) {
    if (!nome.trim()) return
    const r = await fetch('/api/whatsapp/conexoes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const j = await r.json()
    setNovoConexaoModal(false)
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

  // ─── Ações de meta (mock local) ───────────────────────────────────────────
  function atualizarMeta(contatoId: string, patch: Partial<MetaConversa>) {
    setMetaPorContato((prev) => ({
      ...prev,
      [contatoId]: { ...prev[contatoId], ...patch },
    }))
  }

  function atribuir(contatoId: string, agenteId: string) {
    atualizarMeta(contatoId, { agente_id: agenteId })
    const ag = agentesPorId[agenteId]
    notificar(`Conversa atribuída a ${ag?.nome ?? 'agente'}`)
  }

  function adicionarTag(contatoId: string, tag: string) {
    const meta = metaPorContato[contatoId]
    if (!meta || meta.tags.includes(tag)) return
    atualizarMeta(contatoId, { tags: [...meta.tags, tag] })
  }

  function removerTag(contatoId: string, tag: string) {
    const meta = metaPorContato[contatoId]
    if (!meta) return
    atualizarMeta(contatoId, { tags: meta.tags.filter((t) => t !== tag) })
  }

  function adicionarNota(contatoId: string, texto: string) {
    const meta = metaPorContato[contatoId]
    if (!meta) return
    atualizarMeta(contatoId, {
      notas: [
        ...meta.notas,
        {
          id: crypto.randomUUID(),
          autor: agenteLogado?.nome ?? 'Você',
          texto,
          criada_em: new Date().toISOString(),
        },
      ],
    })
  }

  function resolver(contatoId: string) {
    atualizarMeta(contatoId, { status: 'resolvido' })
    notificar('Conversa marcada como resolvida')
  }

  // ─── Agente IA: toggles ───────────────────────────────────────────────────
  async function alternarAgenteConexao(ativo: boolean) {
    if (!conexaoSelId) return
    setConexoes((prev) =>
      prev.map((c) => (c.id === conexaoSelId ? { ...c, agente_ativo: ativo } : c))
    )
    try {
      await fetch(`/api/whatsapp/conexoes/${conexaoSelId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agente_ativo: ativo }),
      })
      notificar(ativo ? 'Agente IA ativado nesta conexão' : 'Agente IA desativado')
    } catch {
      notificar('Erro ao atualizar agente')
    }
  }

  async function alternarAgenteContato(valor: boolean | null) {
    if (!contatoSelId) return
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoSelId ? { ...c, agente_ativo: valor } : c))
    )
    try {
      await fetch(`/api/whatsapp/contatos/${contatoSelId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agente_ativo: valor }),
      })
    } catch {
      notificar('Erro ao atualizar agente')
    }
  }

  function adicionarRespostaRapida(titulo: string, texto: string) {
    setRespostasRapidas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), titulo, texto, conexao_id: conexaoSelId },
    ])
    setNovaRespostaModal(false)
  }

  // ─── Derivados ────────────────────────────────────────────────────────────
  const contatoSel = useMemo(
    () => contatos.find((c) => c.id === contatoSelId) ?? null,
    [contatos, contatoSelId]
  )
  const conexaoSel = useMemo(
    () => conexoes.find((c) => c.id === conexaoSelId) ?? null,
    [conexoes, conexaoSelId]
  )
  const metaSel = contatoSelId ? metaPorContato[contatoSelId] : null
  const agenteSel = metaSel?.agente_id ? agentesPorId[metaSel.agente_id] ?? null : null

  // Contatos ordenados (recente primeiro)
  const contatosOrdenados = useMemo(() => {
    return [...contatos].sort((a, b) => {
      const tA = ultimasPorContato[a.id]?.timestamp_whatsapp
      const tB = ultimasPorContato[b.id]?.timestamp_whatsapp
      if (!tA && !tB) return 0
      if (!tA) return 1
      if (!tB) return -1
      return new Date(tB).getTime() - new Date(tA).getTime()
    })
  }, [contatos, ultimasPorContato])

  // Aplica filtro de aba + busca
  function passaFiltro(c: Contato, f: FiltroConversa): boolean {
    const meta = metaPorContato[c.id]
    if (!meta) return false
    if (meta.status === 'resolvido') return false
    if (f === 'minhas') return meta.agente_id === AGENTE_LOGADO_ID
    if (f === 'sem_atribuicao') return !meta.agente_id
    if (f === 'urgente') return meta.prioridade === 'urgente'
    return true
  }

  const contatosFiltrados = useMemo(() => {
    let lista = contatosOrdenados.filter((c) => passaFiltro(c, filtro))
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter(
        (c) => nomeExibicao(c).toLowerCase().includes(q) || c.numero_telefone.includes(q)
      )
    }
    return lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contatosOrdenados, filtro, busca, metaPorContato])

  const contadores = useMemo(() => {
    const c: Record<FiltroConversa, number> = { todas: 0, minhas: 0, sem_atribuicao: 0, urgente: 0 }
    for (const ct of contatosOrdenados) {
      ; (['todas', 'minhas', 'sem_atribuicao', 'urgente'] as FiltroConversa[]).forEach((f) => {
        if (passaFiltro(ct, f)) c[f]++
      })
    }
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contatosOrdenados, metaPorContato])

  // Métricas: abertas / aguardando há mais de X min / CSAT (sem dados)
  const metricas = useMemo(() => {
    const limiteMs = LIMITE_AGUARDANDO_MIN * 60_000
    const agora = Date.now()
    let aguardando = 0
    let abertas = 0
    for (const c of contatosOrdenados) {
      const meta = metaPorContato[c.id]
      if (!meta || meta.status === 'resolvido') continue
      abertas++
      const u = ultimasPorContato[c.id]
      if (u && !u.enviado_por_nos && u.timestamp_whatsapp) {
        if (agora - new Date(u.timestamp_whatsapp).getTime() > limiteMs) aguardando++
      }
    }
    return { abertas, aguardando, csat: null as number | null }
  }, [contatosOrdenados, metaPorContato, ultimasPorContato])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 max-w-[1600px]">
      {/* Barra Agente IA */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-800">Agente IA</span>
        </div>

        {conexaoSel ? (
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber-500"
              checked={!!conexaoSel.agente_ativo}
              onChange={(e) => alternarAgenteConexao(e.target.checked)}
            />
            <span>
              Ativo na conexão <strong className="text-slate-800">{conexaoSel.nome}</strong>
            </span>
            {conexaoSel.agente_ativo && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                IA ON
              </span>
            )}
          </label>
        ) : (
          <span className="text-xs text-slate-400">Selecione uma conexão</span>
        )}

        {contatoSel && (
          <div className="flex items-center gap-2 ml-auto text-xs text-slate-600">
            <span>Nesta conversa:</span>
            <select
              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              value={
                contatoSel.agente_ativo === null || contatoSel.agente_ativo === undefined
                  ? 'herda'
                  : contatoSel.agente_ativo
                    ? 'on'
                    : 'off'
              }
              onChange={(e) => {
                const v = e.target.value
                alternarAgenteContato(v === 'herda' ? null : v === 'on')
              }}
            >
              <option value="herda">Herdar da conexão</option>
              <option value="on">Forçar ligado</option>
              <option value="off">Silenciar agente</option>
            </select>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex h-[calc(100dvh-14rem)] min-h-[32rem]">
        {/* COLUNA ESQUERDA */}
        <ListaConversas
          conexoes={conexoes}
          conexaoSel={conexaoSel}
          onSelecionarConexao={setConexaoSelId}
          onNovaConexao={() => setNovoConexaoModal(true)}
          onConectar={conectar}
          conectandoId={conectando}
          metricas={metricas}
          filtro={filtro}
          onFiltro={setFiltro}
          busca={busca}
          onBusca={setBusca}
          contadores={contadores}
          contatos={contatosFiltrados}
          contatoSelId={contatoSelId}
          onSelecionarContato={setContatoSelId}
          ultimasPorContato={ultimasPorContato}
          naoLidosPorContato={naoLidosPorContato}
          metaPorContato={metaPorContato}
          agentesPorId={agentesPorId}
          onRecarregar={() => conexaoSelId && carregarContatos(conexaoSelId)}
        />

        {/* COLUNA CENTRAL */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {!contatoSel || !metaSel ? (
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
              <CabecalhoChat
                contato={contatoSel}
                meta={metaSel}
                onTransferir={() => setTransferirModal(true)}
                onHistorico={() => setHistoricoDrawer(true)}
                onResolver={() => resolver(contatoSel.id)}
              />
              <AreaMensagens mensagens={mensagensAtivas} carregando={carregandoMsgs} />
              <RespostasRapidas
                respostas={respostasRapidas}
                onSelecionar={(t) => setInput(t)}
                onNova={() => setNovaRespostaModal(true)}
              />
              <CampoEnvio
                valor={input}
                onChange={setInput}
                onEnviar={enviar}
                enviando={enviando}
              />
            </>
          )}
        </section>

        {/* COLUNA DIREITA */}
        {contatoSel && metaSel && (
          <PainelContexto
            contato={contatoSel}
            meta={metaSel}
            agente={agenteSel}
            agentes={agentes}
            podeAtribuirOutros={podeAtribuirOutros}
            onAtribuir={(id) => atribuir(contatoSel.id, id)}
            onAdicionarTag={(t) => adicionarTag(contatoSel.id, t)}
            onRemoverTag={(t) => removerTag(contatoSel.id, t)}
            onAdicionarNota={(t) => adicionarNota(contatoSel.id, t)}
          />
        )}
      </div>

      {/* MODAIS / DRAWERS */}
      {qrModal && (
        <ModalQrCode
          conexao={conexoes.find((c) => c.id === qrModal.conexaoId)}
          qr={qrModal.qr}
          onClose={() => setQrModal(null)}
        />
      )}
      {novoConexaoModal && (
        <ModalNovaConexao
          onClose={() => setNovoConexaoModal(false)}
          onCriar={criarNovaConexao}
        />
      )}
      {transferirModal && contatoSel && (
        <ModalTransferir
          agentes={
            podeAtribuirOutros ? agentes : agentes.filter((a) => a.id === AGENTE_LOGADO_ID)
          }
          onClose={() => setTransferirModal(false)}
          onTransferir={(id) => {
            atribuir(contatoSel.id, id)
            setTransferirModal(false)
          }}
        />
      )}
      {historicoDrawer && contatoSel && (
        <DrawerHistorico
          mensagens={mensagensAtivas}
          onClose={() => setHistoricoDrawer(false)}
        />
      )}
      {novaRespostaModal && (
        <ModalRespostaRapida
          onClose={() => setNovaRespostaModal(false)}
          onSalvar={adicionarRespostaRapida}
        />
      )}

      {/* Toast simples */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}
