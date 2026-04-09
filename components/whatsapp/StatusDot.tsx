import type { StatusConexao } from './tipos'

const CLASSES: Record<StatusConexao, string> = {
  conectado: 'bg-emerald-500',
  aguardando_qr: 'bg-amber-500 animate-pulse',
  conectando: 'bg-sky-500 animate-pulse',
  desconectado: 'bg-slate-400',
  erro: 'bg-red-500',
}

export function StatusDot({ status }: { status: StatusConexao }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
        CLASSES[status] ?? 'bg-slate-400'
      }`}
    />
  )
}
