'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Tag as TagIcon, UserCircle2, X } from 'lucide-react'
import { PRESENCA_COR, PRESENCA_LABEL, iniciais, nomeExibicao } from './helpers'
import type { Agente, Contato, MetaConversa, NotaInterna } from './tipos'

type Props = {
  contato: Contato
  meta: MetaConversa
  agente: Agente | null
  agentes: Agente[]
  podeAtribuirOutros: boolean
  onAtribuir: (agenteId: string) => void
  onAdicionarTag: (tag: string) => void
  onRemoverTag: (tag: string) => void
  onAdicionarNota: (texto: string) => void
}

export function PainelContexto({
  contato,
  meta,
  agente,
  agentes,
  podeAtribuirOutros,
  onAtribuir,
  onAdicionarTag,
  onRemoverTag,
  onAdicionarNota,
}: Props) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-l border-slate-200 bg-slate-50/40 overflow-y-auto">
      <Secao titulo="Dados do cliente" inicial>
        <DadosCliente contato={contato} />
      </Secao>

      <Secao titulo="Tags" inicial>
        <Tags tags={meta.tags} onAdicionar={onAdicionarTag} onRemover={onRemoverTag} />
      </Secao>

      <Secao titulo="Atribuição" inicial>
        <Atribuicao
          agente={agente}
          agentes={agentes}
          podeAtribuirOutros={podeAtribuirOutros}
          onAtribuir={onAtribuir}
        />
      </Secao>

      <Secao titulo="Notas internas">
        <Notas notas={meta.notas} onAdicionar={onAdicionarNota} />
      </Secao>
    </aside>
  )
}

// ─── Wrapper colapsável ─────────────────────────────────────────────────────

function Secao({
  titulo,
  inicial,
  children,
}: {
  titulo: string
  inicial?: boolean
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(inicial ?? false)
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {titulo}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>
      {aberto && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  )
}

// ─── Dados do cliente ───────────────────────────────────────────────────────

function DadosCliente({ contato }: { contato: Contato }) {
  // TODO: integrar com tabela `clientes` para LTV / funil. Ver CLAUDE.md.
  return (
    <div className="space-y-2 text-xs">
      <Linha label="Nome" valor={nomeExibicao(contato)} />
      <Linha label="Telefone" valor={contato.numero_telefone} />
      <Linha label="Primeira conversa" valor="—" />
      <Linha label="Total de pedidos" valor="—" />
      <Linha label="LTV" valor="—" />
      <Linha label="Etapa no funil" valor="—" />
      <p className="text-[9px] italic text-slate-400 pt-1">
        Vincule este contato a um cliente para ver histórico de compras.
      </p>
    </div>
  )
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium truncate text-right">{valor}</span>
    </div>
  )
}

// ─── Tags ───────────────────────────────────────────────────────────────────

function Tags({
  tags,
  onAdicionar,
  onRemover,
}: {
  tags: string[]
  onAdicionar: (t: string) => void
  onRemover: (t: string) => void
}) {
  const [adicionando, setAdicionando] = useState(false)
  const [valor, setValor] = useState('')

  function confirmar() {
    const t = valor.trim()
    if (!t) return
    onAdicionar(t)
    setValor('')
    setAdicionando(false)
  }

  return (
    <div className="space-y-2">
      {tags.length === 0 && !adicionando && (
        <p className="text-[10px] italic text-slate-400">Nenhuma tag</p>
      )}
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-100 border border-amber-200 rounded-full pl-2 pr-1 py-0.5"
          >
            <TagIcon className="h-2.5 w-2.5" />
            {t}
            <button
              onClick={() => onRemover(t)}
              className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      {adicionando ? (
        <div className="flex gap-1">
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmar()
              if (e.key === 'Escape') {
                setAdicionando(false)
                setValor('')
              }
            }}
            placeholder="Nova tag"
            className="flex-1 text-[11px] bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-amber-400"
          />
          <button
            onClick={confirmar}
            className="text-[10px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded px-2"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdicionando(true)}
          className="w-full text-[10px] font-semibold text-amber-700 hover:bg-amber-50 border border-dashed border-amber-300 rounded py-1 transition-colors flex items-center justify-center gap-0.5"
        >
          <Plus className="h-3 w-3" /> Adicionar tag
        </button>
      )}
    </div>
  )
}

// ─── Atribuição ─────────────────────────────────────────────────────────────

function Atribuicao({
  agente,
  agentes,
  podeAtribuirOutros,
  onAtribuir,
}: {
  agente: Agente | null
  agentes: Agente[]
  podeAtribuirOutros: boolean
  onAtribuir: (id: string) => void
}) {
  const [trocando, setTrocando] = useState(false)
  const opcoes = podeAtribuirOutros ? agentes : agentes.filter((a) => a.id === agentes[0]?.id)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
        {agente ? (
          <>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                {iniciais(agente.nome)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  PRESENCA_COR[agente.presenca]
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{agente.nome}</div>
              <div className="text-[10px] text-slate-500">
                {agente.equipe} · {PRESENCA_LABEL[agente.presenca]}
              </div>
            </div>
          </>
        ) : (
          <>
            <UserCircle2 className="h-7 w-7 text-slate-300" />
            <div className="flex-1 text-[11px] text-red-600 font-semibold">Sem atribuição</div>
          </>
        )}
      </div>

      {!trocando ? (
        <button
          onClick={() => setTrocando(true)}
          className="w-full text-[10px] font-semibold text-amber-700 hover:bg-amber-50 border border-amber-200 rounded py-1.5 transition-colors"
        >
          {agente ? 'Trocar agente' : 'Atribuir'}
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {opcoes.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onAtribuir(a.id)
                setTrocando(false)
              }}
              className="w-full flex items-center gap-2 p-2 text-left hover:bg-amber-50 transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PRESENCA_COR[a.presenca]}`} />
              <span className="text-[11px] text-slate-700 truncate flex-1">{a.nome}</span>
              <span className="text-[9px] text-slate-400">{a.equipe}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notas internas ─────────────────────────────────────────────────────────

function Notas({
  notas,
  onAdicionar,
}: {
  notas: NotaInterna[]
  onAdicionar: (t: string) => void
}) {
  const [texto, setTexto] = useState('')
  const ordenadas = [...notas].sort(
    (a, b) => new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime()
  )

  function salvar() {
    if (!texto.trim()) return
    onAdicionar(texto.trim())
    setTexto('')
  }

  return (
    <div className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Anotação visível só para a equipe…"
        rows={3}
        className="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none resize-none focus:border-amber-400"
      />
      <button
        onClick={salvar}
        disabled={!texto.trim()}
        className="w-full text-[10px] font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded py-1.5 transition-colors"
      >
        Salvar nota
      </button>

      {ordenadas.length === 0 ? (
        <p className="text-[10px] italic text-slate-400 pt-1">Sem notas ainda</p>
      ) : (
        <div className="space-y-1.5 pt-1">
          {ordenadas.map((n) => (
            <div
              key={n.id}
              className="bg-amber-50/60 border border-amber-100 rounded p-2 text-[10px] text-slate-700"
            >
              <p className="whitespace-pre-wrap">{n.texto}</p>
              <div className="text-[9px] text-slate-500 mt-1">
                {n.autor} · {new Date(n.criada_em).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
