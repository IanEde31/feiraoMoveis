'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import type { FiltrosAtivos, Origem } from './tipos'

const todasOrigens: { valor: Origem; rotulo: string }[] = [
  { valor: 'whatsapp',    rotulo: 'WhatsApp' },
  { valor: 'indicacao',   rotulo: 'Indicação' },
  { valor: 'loja_fisica', rotulo: 'Loja Física' },
  { valor: 'site',        rotulo: 'Site' },
  { valor: 'instagram',   rotulo: 'Instagram' },
  { valor: 'outro',       rotulo: 'Outro' },
]

const todasTags = ['apartamento', 'casa', 'sala', 'quarto', 'cozinha', 'escritorio', 'completo', 'premium', 'luxo', 'moderno']

interface BarraPesquisaProps {
  filtros: FiltrosAtivos
  onChange: (filtros: FiltrosAtivos) => void
  totalVisiveis: number
  totalGeral: number
}

export function BarraPesquisa({ filtros, onChange, totalVisiveis, totalGeral }: BarraPesquisaProps) {
  const [expandido, setExpandido] = useState(false)

  const temFiltroAtivo =
    filtros.busca.length > 0 ||
    filtros.origens.length > 0 ||
    filtros.tags.length > 0

  function toggleOrigem(origem: Origem) {
    const novas = filtros.origens.includes(origem)
      ? filtros.origens.filter((o) => o !== origem)
      : [...filtros.origens, origem]
    onChange({ ...filtros, origens: novas })
  }

  function toggleTag(tag: string) {
    const novas = filtros.tags.includes(tag)
      ? filtros.tags.filter((t) => t !== tag)
      : [...filtros.tags, tag]
    onChange({ ...filtros, tags: novas })
  }

  function limparTudo() {
    onChange({ busca: '', origens: [], tags: [] })
    setExpandido(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Linha principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Campo de busca */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <Search size={16} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={filtros.busca}
            onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none min-w-0"
            aria-label="Buscar clientes"
          />
          {filtros.busca && (
            <button
              onClick={() => onChange({ ...filtros, busca: '' })}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500 rounded"
              aria-label="Limpar busca"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Separador vertical */}
        <div className="h-5 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />

        {/* Botão filtros avançados */}
        <button
          onClick={() => setExpandido((v) => !v)}
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
            expandido || filtros.origens.length > 0 || filtros.tags.length > 0
              ? 'bg-ouro-50 text-ouro-700 border border-ouro-200'
              : 'text-slate-600 hover:bg-slate-100 border border-transparent',
          ].join(' ')}
          aria-expanded={expandido}
          aria-label={`Filtros avançados${temFiltroAtivo ? ` — ${filtros.origens.length + filtros.tags.length} ativo${filtros.origens.length + filtros.tags.length !== 1 ? 's' : ''}` : ''}`}
        >
          <SlidersHorizontal size={13} aria-hidden="true" />
          Filtros
          {(filtros.origens.length + filtros.tags.length) > 0 && (
            <span className="bg-ouro-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {filtros.origens.length + filtros.tags.length}
            </span>
          )}
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Limpar tudo */}
        {temFiltroAtivo && (
          <button
            onClick={limparTudo}
            className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1"
            aria-label="Limpar todos os filtros"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Painel filtros avançados */}
      {expandido && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50/50">
          {/* Origem */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Origem
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por origem">
              {todasOrigens.map(({ valor, rotulo }) => {
                const ativo = filtros.origens.includes(valor)
                return (
                  <button
                    key={valor}
                    onClick={() => toggleOrigem(valor)}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro-500',
                      ativo
                        ? 'bg-ouro-600 text-white border-ouro-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                    aria-pressed={ativo}
                  >
                    {rotulo}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tag">
              {todasTags.map((tag) => {
                const ativo = filtros.tags.includes(tag)
                return (
                  <button
                    key={tag}
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
          </div>
        </div>
      )}

      {/* Rodapé: contagem de resultados */}
      {temFiltroAtivo && (
        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Exibindo{' '}
            <span className="font-semibold text-slate-700">{totalVisiveis}</span> de{' '}
            <span className="font-semibold text-slate-700">{totalGeral}</span> clientes
          </p>
        </div>
      )}
    </div>
  )
}
