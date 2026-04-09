'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { PRESENCA_COR, PRESENCA_LABEL, formatarData, iniciais } from './helpers'
import type { Agente, Conexao, Mensagem, RespostaRapida } from './tipos'

// ─── Wrapper genérico ───────────────────────────────────────────────────────

function Sobreposicao({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function HeaderModal({ titulo, onClose }: { titulo: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <h3 className="font-playfair font-semibold text-base text-slate-900">{titulo}</h3>
      <button
        onClick={onClose}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Modal: QR Code ─────────────────────────────────────────────────────────

export function ModalQrCode({
  conexao,
  qr,
  onClose,
}: {
  conexao: Conexao | undefined
  qr: string | null
  onClose: () => void
}) {
  return (
    <Sobreposicao onClose={onClose}>
      <div className="w-[22rem] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <HeaderModal titulo="Escanear QR Code" onClose={onClose} />
        <div className="px-5 -mt-2 pb-1 text-xs text-slate-500">{conexao?.nome}</div>
        <div className="p-5 flex flex-col items-center gap-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="QR Code WhatsApp"
              className="h-52 w-52 rounded-xl bg-white border border-slate-200 p-2 shadow-sm"
            />
          ) : (
            <div className="h-52 w-52 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <p className="text-xs text-slate-500">Gerando QR Code…</p>
            </div>
          )}
          <ol className="text-[11px] text-slate-500 space-y-0.5 text-left">
            <li>1. Abra o WhatsApp no celular</li>
            <li>
              2. Toque em <strong className="text-slate-700">Aparelhos conectados</strong>
            </li>
            <li>
              3. Toque em <strong className="text-slate-700">Conectar aparelho</strong>
            </li>
            <li>4. Aponte a câmera para este QR Code</li>
          </ol>
        </div>
      </div>
    </Sobreposicao>
  )
}

// ─── Modal: Nova conexão ────────────────────────────────────────────────────

export function ModalNovaConexao({
  onClose,
  onCriar,
}: {
  onClose: () => void
  onCriar: (nome: string) => void
}) {
  const [nome, setNome] = useState('')
  return (
    <Sobreposicao onClose={onClose}>
      <div className="w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <HeaderModal titulo="Nova conexão WhatsApp" onClose={onClose} />
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Nome da instância
            </label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nome.trim()) onCriar(nome)
                if (e.key === 'Escape') onClose()
              }}
              placeholder="Ex: Vendedor João, Atendimento…"
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onCriar(nome)}
              disabled={!nome.trim()}
              className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 px-3 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </Sobreposicao>
  )
}

// ─── Modal: Transferir conversa ─────────────────────────────────────────────

export function ModalTransferir({
  agentes,
  onClose,
  onTransferir,
}: {
  agentes: Agente[]
  onClose: () => void
  onTransferir: (id: string) => void
}) {
  const [busca, setBusca] = useState('')
  const filtrados = agentes.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()))
  return (
    <Sobreposicao onClose={onClose}>
      <div className="w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <HeaderModal titulo="Transferir conversa" onClose={onClose} />
        <div className="p-4 space-y-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar agente…"
            className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white"
          />
          <div className="max-h-72 overflow-y-auto -mx-1">
            {filtrados.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Nenhum agente encontrado</p>
            ) : (
              filtrados.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onTransferir(a.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 rounded-lg text-left transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {iniciais(a.nome)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        PRESENCA_COR[a.presenca]
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{a.nome}</div>
                    <div className="text-[10px] text-slate-500">
                      {a.equipe} · {PRESENCA_LABEL[a.presenca]}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </Sobreposicao>
  )
}

// ─── Modal: Resposta rápida (criar / editar) ────────────────────────────────

export function ModalRespostaRapida({
  onClose,
  onSalvar,
}: {
  onClose: () => void
  onSalvar: (titulo: string, texto: string) => void
}) {
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const valido = titulo.trim() && texto.trim()
  return (
    <Sobreposicao onClose={onClose}>
      <div className="w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <HeaderModal titulo="Nova resposta rápida" onClose={onClose} />
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Saudação"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Texto</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              placeholder="Mensagem que será preenchida no campo de envio…"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Será salva por equipe / número conectado quando a tabela existir no banco.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => valido && onSalvar(titulo, texto)}
              disabled={!valido}
              className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 px-3 py-2 text-sm font-semibold text-white"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </Sobreposicao>
  )
}

// ─── Drawer: Histórico de conversas anteriores ──────────────────────────────

export function DrawerHistorico({
  mensagens,
  onClose,
}: {
  mensagens: Mensagem[]
  onClose: () => void
}) {
  // Agrupa por dia
  const grupos = mensagens.reduce<Record<string, Mensagem[]>>((acc, m) => {
    const dia = new Date(m.timestamp_whatsapp).toDateString()
    ;(acc[dia] ??= []).push(m)
    return acc
  }, {})
  const dias = Object.keys(grupos)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-playfair font-semibold text-base text-slate-900">Histórico</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Conversas anteriores deste contato
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {dias.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Sem histórico ainda</p>
          ) : (
            dias.map((d) => (
              <div key={d}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {formatarData(grupos[d][0].timestamp_whatsapp)}
                </div>
                <div className="space-y-1.5">
                  {grupos[d].map((m) => (
                    <div
                      key={m.id}
                      className={`text-xs p-2 rounded-lg ${
                        m.enviado_por_nos
                          ? 'bg-amber-50 border border-amber-100 text-slate-700'
                          : 'bg-slate-50 border border-slate-100 text-slate-700'
                      }`}
                    >
                      {m.conteudo ?? `[${m.tipo ?? 'mídia'}]`}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
