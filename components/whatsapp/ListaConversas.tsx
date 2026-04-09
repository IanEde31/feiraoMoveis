import { RefreshCw, Users, WifiOff } from 'lucide-react'
import { BarraMetricas } from './BarraMetricas'
import { CardConversa } from './CardConversa'
import { DropdownConexao } from './DropdownConexao'
import { FiltrosConversas } from './FiltrosConversas'
import type {
  Agente,
  Conexao,
  Contato,
  FiltroConversa,
  MetaConversa,
  UltimaMensagem,
} from './tipos'

type Props = {
  // Conexões
  conexoes: Conexao[]
  conexaoSel: Conexao | null
  onSelecionarConexao: (id: string) => void
  onNovaConexao: () => void
  onConectar: (id: string) => void
  conectandoId: string | null
  // Métricas
  metricas: { abertas: number; aguardando: number; csat: number | null }
  // Filtros / busca
  filtro: FiltroConversa
  onFiltro: (f: FiltroConversa) => void
  busca: string
  onBusca: (s: string) => void
  contadores: Record<FiltroConversa, number>
  // Lista
  contatos: Contato[]
  contatoSelId: string | null
  onSelecionarContato: (id: string) => void
  ultimasPorContato: Record<string, UltimaMensagem>
  naoLidosPorContato: Record<string, number>
  metaPorContato: Record<string, MetaConversa>
  agentesPorId: Record<string, Agente>
  onRecarregar: () => void
}

export function ListaConversas({
  conexoes,
  conexaoSel,
  onSelecionarConexao,
  onNovaConexao,
  onConectar,
  conectandoId,
  metricas,
  filtro,
  onFiltro,
  busca,
  onBusca,
  contadores,
  contatos,
  contatoSelId,
  onSelecionarContato,
  ultimasPorContato,
  naoLidosPorContato,
  metaPorContato,
  agentesPorId,
  onRecarregar,
}: Props) {
  return (
    <aside className="w-[280px] shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/40">
      <DropdownConexao
        conexoes={conexoes}
        selecionada={conexaoSel}
        onSelecionar={onSelecionarConexao}
        onNova={onNovaConexao}
        onConectar={onConectar}
        conectandoId={conectandoId}
      />

      <BarraMetricas {...metricas} />

      <FiltrosConversas
        filtro={filtro}
        onFiltro={onFiltro}
        busca={busca}
        onBusca={onBusca}
        contadores={contadores}
      />

      <div className="px-3 py-1 flex justify-end border-b border-slate-100">
        <button
          onClick={onRecarregar}
          title="Recarregar"
          className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!conexaoSel && (
          <EmptyState icone={<WifiOff className="h-8 w-8 text-slate-300" />}>
            Selecione uma conexão para ver as conversas
          </EmptyState>
        )}

        {conexaoSel && contatos.length === 0 && (
          <EmptyState icone={<Users className="h-8 w-8 text-slate-300" />}>
            {busca ? 'Nenhuma conversa encontrada.' : 'Aguardando mensagens…'}
          </EmptyState>
        )}

        {contatos.map((c) => {
          const meta = metaPorContato[c.id]
          if (!meta) return null
          return (
            <CardConversa
              key={c.id}
              contato={c}
              ultima={ultimasPorContato[c.id]}
              naoLidos={naoLidosPorContato[c.id] ?? 0}
              selecionado={contatoSelId === c.id}
              onClick={() => onSelecionarContato(c.id)}
              meta={meta}
              agente={meta.agente_id ? agentesPorId[meta.agente_id] ?? null : null}
            />
          )
        })}
      </div>
    </aside>
  )
}

function EmptyState({
  icone,
  children,
}: {
  icone: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-12">
      {icone}
      <p className="text-xs text-slate-500">{children}</p>
    </div>
  )
}
