import { Loader2, Send } from 'lucide-react'

type Props = {
  valor: string
  onChange: (s: string) => void
  onEnviar: () => void
  enviando: boolean
}

export function CampoEnvio({ valor, onChange, onEnviar, enviando }: Props) {
  return (
    <div className="shrink-0 px-4 py-3 border-t border-slate-200 bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onEnviar()
        }}
        className="flex items-end gap-2"
      >
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite uma mensagem…"
          className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:bg-white border border-transparent focus:border-slate-200 transition-all"
          disabled={enviando}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onEnviar()
            }
          }}
        />
        <button
          type="submit"
          disabled={enviando || !valor.trim()}
          className="h-10 w-10 shrink-0 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white shadow-sm"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
