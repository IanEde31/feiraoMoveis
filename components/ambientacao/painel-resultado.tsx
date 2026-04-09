'use client'

import { Sparkles, Download, RefreshCw, AlertCircle, Wand2, ImageIcon, BookImage, Trash2, Check } from 'lucide-react'
import type { EstadoGeracao, ResultadoAmbientacao } from './tipos'

interface PainelResultadoProps {
  estado: EstadoGeracao
  resultado: ResultadoAmbientacao | null
  mensagemErro?: string | null
  podeGerar: boolean
  qtdProdutos: number
  aoGerar: () => void
  aoBaixar: () => void
  aoAdicionarGaleria: () => void
  aoDescartar: () => void
}

export function PainelResultado({
  estado,
  resultado,
  mensagemErro,
  podeGerar,
  qtdProdutos,
  aoGerar,
  aoBaixar,
  aoAdicionarGaleria,
  aoDescartar,
}: PainelResultadoProps) {
  const carregando = estado === 'enviando' || estado === 'gerando'
  const rotuloCarregando =
    estado === 'enviando' ? 'Enviando imagem...' : 'Gerando ambientação...'

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-playfair text-lg font-semibold text-slate-900">
            Pré-visualização
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A imagem gerada aparecerá aqui
          </p>
        </div>
        {resultado && estado === 'pronto' && (
          <button
            onClick={aoBaixar}
            className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download size={13} aria-hidden="true" />
            Baixar
          </button>
        )}
      </div>

      <div className="flex-1 min-h-[320px] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm overflow-hidden flex items-center justify-center relative">
        {/* Estado: pronto */}
        {estado === 'pronto' && resultado && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resultado.url}
            alt="Ambientação gerada"
            className="w-full h-full object-contain"
          />
        )}

        {/* Estado: carregando */}
        {carregando && (
          <div className="flex flex-col items-center text-center px-6">
            <div className="relative w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-ouro-400/30 to-ouro-600/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-ouro-400 to-ouro-600 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white animate-pulse" size={28} aria-hidden="true" />
              </div>
            </div>
            <p className="font-playfair text-base font-semibold text-slate-800">
              {rotuloCarregando}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Nossa IA está compondo os móveis no ambiente. Isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* Estado: erro */}
        {estado === 'erro' && (
          <div className="flex flex-col items-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-3">
              <AlertCircle className="text-red-600" size={26} aria-hidden="true" />
            </div>
            <p className="font-semibold text-slate-800">Não foi possível gerar a imagem</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              {mensagemErro ?? 'Tente novamente em instantes.'}
            </p>
            <button
              onClick={aoGerar}
              className="mt-4 h-9 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado: idle */}
        {estado === 'idle' && (
          <div className="flex flex-col items-center text-center px-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
              <ImageIcon size={26} className="text-slate-300" aria-hidden="true" />
            </div>
            <p className="font-playfair text-base text-slate-600 font-medium">
              Aguardando ambiente e produtos
            </p>
            <p className="text-xs mt-1 max-w-xs">
              Envie a foto do ambiente e selecione ao menos um produto para começar.
            </p>
          </div>
        )}
      </div>

      {/* Botões de ação pós-geração */}
      {estado === 'pronto' && resultado && (
        <div className="mt-3 flex gap-2">
          {resultado.jaAdicionada ? (
            <div className="flex-1 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Check size={14} aria-hidden="true" />
              Salvo na galeria
            </div>
          ) : (
            <button
              onClick={aoAdicionarGaleria}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-ouro-500 to-ouro-600 text-white text-xs font-semibold hover:from-ouro-600 hover:to-ouro-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <BookImage size={14} aria-hidden="true" />
              Adicionar à galeria
            </button>
          )}
          <button
            onClick={aoDescartar}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-medium hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} aria-hidden="true" />
            Descartar
          </button>
        </div>
      )}

      {/* Botão gerar */}
      {estado !== 'pronto' && (
        <div className="mt-4">
          <button
            onClick={aoGerar}
            disabled={!podeGerar || carregando}
            className={[
              'w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm',
              podeGerar && !carregando
                ? 'bg-gradient-to-r from-ouro-500 to-ouro-600 text-white hover:from-ouro-600 hover:to-ouro-700 hover:shadow-md active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200',
            ].join(' ')}
          >
            <Wand2 size={16} aria-hidden="true" />
            {carregando
              ? rotuloCarregando
              : qtdProdutos > 0
              ? `Gerar ambientação com ${qtdProdutos} ${qtdProdutos === 1 ? 'produto' : 'produtos'}`
              : 'Gerar ambientação'}
          </button>
        </div>
      )}
    </div>
  )
}
