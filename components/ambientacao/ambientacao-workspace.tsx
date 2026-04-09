'use client'

import { useCallback, useEffect, useState } from 'react'
import { ImageIcon, Package, Sparkles } from 'lucide-react'
import { UploadAmbiente } from './upload-ambiente'
import { SeletorProdutos } from './seletor-produtos'
import { PainelResultado } from './painel-resultado'
import { SeletorCliente } from './seletor-cliente'
import { GaleriaCliente } from './galeria-cliente'
import { LightboxGaleria } from './lightbox-galeria'
import { galeria } from '@/lib/ambientacao/galeria'
import type {
  AmbienteImagem,
  ClienteResumo,
  EstadoGeracao,
  ItemGaleria,
  Produto,
  ResultadoAmbientacao,
} from './tipos'
import type { CategoriaProduto } from '@/components/produtos/tipos'

interface AmbientacaoWorkspaceProps {
  produtos: Produto[]
  categorias: CategoriaProduto[]
  clientes: ClienteResumo[]
}

const CHAVE_CLIENTE_ATIVO = 'feirao:ambientacao:clienteAtivo'

export function AmbientacaoWorkspace({
  produtos,
  categorias,
  clientes,
}: AmbientacaoWorkspaceProps) {
  const [clienteAtivo, setClienteAtivo] = useState<ClienteResumo | null>(null)
  const [ambiente, setAmbiente] = useState<AmbienteImagem | null>(null)
  const [selecionados, setSelecionados] = useState<Produto[]>([])
  const [estado, setEstado] = useState<EstadoGeracao>('idle')
  const [resultado, setResultado] = useState<ResultadoAmbientacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [itensGaleria, setItensGaleria] = useState<ItemGaleria[]>([])
  const [carregandoGaleria, setCarregandoGaleria] = useState(false)
  const [contagemPorCliente, setContagemPorCliente] = useState<Record<string, number>>({})
  const [lightboxIndice, setLightboxIndice] = useState<number | null>(null)

  const podeGerar = !!ambiente && selecionados.length > 0 && !!clienteAtivo

  // Restaurar cliente ativo da última sessão
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.localStorage.getItem(CHAVE_CLIENTE_ATIVO)
    if (id) {
      const c = clientes.find((x) => x.id === id)
      if (c) setClienteAtivo(c)
    }
  }, [clientes])

  // Persistir escolha do cliente
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (clienteAtivo) window.localStorage.setItem(CHAVE_CLIENTE_ATIVO, clienteAtivo.id)
    else window.localStorage.removeItem(CHAVE_CLIENTE_ATIVO)
  }, [clienteAtivo])

  // Carregar contagem por cliente (uma vez) para mostrar badges no popover
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const entradas: Record<string, number> = {}
      for (const c of clientes) {
        const itens = await galeria.listar(c.id)
        if (itens.length > 0) entradas[c.id] = itens.length
      }
      if (!cancelado) setContagemPorCliente(entradas)
    })()
    return () => {
      cancelado = true
    }
  }, [clientes])

  // Carregar galeria do cliente ativo
  const recarregarGaleria = useCallback(async (clienteId: string) => {
    setCarregandoGaleria(true)
    try {
      const itens = await galeria.listar(clienteId)
      setItensGaleria(itens)
      setContagemPorCliente((prev) => ({ ...prev, [clienteId]: itens.length }))
    } finally {
      setCarregandoGaleria(false)
    }
  }, [])

  useEffect(() => {
    if (!clienteAtivo) {
      setItensGaleria([])
      return
    }
    void recarregarGaleria(clienteAtivo.id)
  }, [clienteAtivo, recarregarGaleria])

  // Ao trocar de cliente, limpa o canvas para evitar misturar contextos
  const trocarCliente = useCallback((c: ClienteResumo | null) => {
    setClienteAtivo(c)
    setAmbiente(null)
    setSelecionados([])
    setResultado(null)
    setEstado('idle')
    setErro(null)
  }, [])

  const alternarProduto = useCallback((p: Produto) => {
    setSelecionados((prev) =>
      prev.find((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, p]
    )
  }, [])

  const gerar = useCallback(async () => {
    if (!ambiente || selecionados.length === 0 || !clienteAtivo) return
    setErro(null)
    setEstado('enviando')

    try {
      const fd = new FormData()
      fd.append('cliente_id', clienteAtivo.id)
      fd.append('ambiente', ambiente.arquivo)
      selecionados.forEach((p) => fd.append('produtos[]', p.id))

      setEstado('gerando')
      const res = await fetch('/api/ambientacao/gerar', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Falha ao gerar ambientação')
      }
      const item = await res.json()

      setResultado({ id: item.id, url: item.resultado_url, geradaEm: item.criada_em, jaAdicionada: false })
      setEstado('pronto')
    } catch (e) {
      console.error(e)
      setErro(e instanceof Error ? e.message : 'Falha ao se comunicar com o serviço de ambientação.')
      setEstado('erro')
    }
  }, [ambiente, selecionados, clienteAtivo])

  const baixar = useCallback(async () => {
    if (!resultado) return
    try {
      const blob = await fetch(resultado.url).then((r) => r.blob())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ambientacao-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      console.error('Falha ao baixar ambientação')
    }
  }, [resultado])

  const adicionarAGaleria = useCallback(async () => {
    if (!resultado || !clienteAtivo) return
    await recarregarGaleria(clienteAtivo.id)
    setResultado((prev) => prev ? { ...prev, jaAdicionada: true } : prev)
  }, [resultado, clienteAtivo, recarregarGaleria])

  const descartarFoto = useCallback(async () => {
    if (!resultado) return
    try {
      await galeria.remover(resultado.id)
      if (clienteAtivo) await recarregarGaleria(clienteAtivo.id)
    } catch {
      console.error('Falha ao descartar ambientação')
    }
    setResultado(null)
    setEstado('idle')
  }, [resultado, clienteAtivo, recarregarGaleria])

  const abrirItemGaleria = useCallback((item: ItemGaleria) => {
    const indice = itensGaleria.findIndex((i) => i.id === item.id)
    setLightboxIndice(indice >= 0 ? indice : 0)
  }, [itensGaleria])

  const removerItemGaleria = useCallback(
    async (item: ItemGaleria) => {
      await galeria.remover(item.id)
      if (clienteAtivo) await recarregarGaleria(clienteAtivo.id)
    },
    [clienteAtivo, recarregarGaleria]
  )

  return (
    <div className="space-y-5">
      {/* Barra de contexto — seletor de cliente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <SeletorCliente
          clientes={clientes}
          clienteAtivo={clienteAtivo}
          contagemPorCliente={contagemPorCliente}
          aoSelecionar={trocarCliente}
        />
        <div className="hidden sm:block w-px h-10 bg-slate-200" />
        <p className="text-xs text-slate-500 leading-relaxed sm:flex-1">
          {clienteAtivo
            ? 'Tudo o que você gerar agora será salvo automaticamente na galeria deste cliente. Troque a qualquer momento no seletor ao lado.'
            : 'Escolha um cliente para começar — todas as ambientações ficam organizadas por cliente.'}
        </p>
      </div>

      {/* Workspace principal */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        {/* Coluna esquerda — entradas */}
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <CabecalhoEtapa
              numero={1}
              icone={<ImageIcon size={15} aria-hidden="true" />}
              titulo="Ambiente do cliente"
              descricao="Envie uma foto do espaço onde os móveis serão colocados"
              concluida={!!ambiente}
            />
            <div className="mt-4">
              <UploadAmbiente ambiente={ambiente} aoSelecionar={setAmbiente} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[520px]">
            <CabecalhoEtapa
              numero={2}
              icone={<Package size={15} aria-hidden="true" />}
              titulo="Selecione os produtos"
              descricao="Escolha os móveis do estoque que serão compostos no ambiente"
              concluida={selecionados.length > 0}
            />
            <div className="mt-4 flex-1 min-h-0">
              <SeletorProdutos
                produtos={produtos}
                categorias={categorias}
                selecionados={selecionados}
                aoAlternar={alternarProduto}
                aoLimpar={() => setSelecionados([])}
              />
            </div>
          </section>
        </div>

        {/* Coluna direita — resultado */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[640px]">
            <CabecalhoEtapa
              numero={3}
              icone={<Sparkles size={15} aria-hidden="true" />}
              titulo="Geração com IA"
              descricao="Pré-visualize, regere ou baixe a ambientação"
              concluida={estado === 'pronto'}
            />
            <div className="mt-4 flex-1 min-h-0">
              <PainelResultado
                estado={estado}
                resultado={resultado}
                mensagemErro={erro ?? (!clienteAtivo ? 'Selecione um cliente primeiro' : null)}
                podeGerar={podeGerar}
                qtdProdutos={selecionados.length}
                aoGerar={gerar}
                aoBaixar={baixar}
                aoAdicionarGaleria={adicionarAGaleria}
                aoDescartar={descartarFoto}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Galeria do cliente */}
      <GaleriaCliente
        cliente={clienteAtivo}
        itens={itensGaleria}
        carregando={carregandoGaleria}
        aoAbrir={abrirItemGaleria}
        aoRemover={removerItemGaleria}
      />

      {/* Lightbox */}
      {lightboxIndice !== null && itensGaleria.length > 0 && (
        <LightboxGaleria
          itens={itensGaleria}
          indiceAtivo={lightboxIndice}
          aoFechar={() => setLightboxIndice(null)}
          aoNavegar={setLightboxIndice}
        />
      )}
    </div>
  )
}

function CabecalhoEtapa({
  numero,
  icone,
  titulo,
  descricao,
  concluida,
}: {
  numero: number
  icone: React.ReactNode
  titulo: string
  descricao: string
  concluida: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold tabular-nums shadow-sm border transition-colors',
          concluida
            ? 'bg-gradient-to-br from-ouro-500 to-ouro-600 text-white border-ouro-600'
            : 'bg-slate-50 text-slate-500 border-slate-200',
        ].join(' ')}
      >
        {numero}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icone}</span>
          <h3 className="font-playfair text-base font-semibold text-slate-900">
            {titulo}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>
      </div>
    </div>
  )
}
