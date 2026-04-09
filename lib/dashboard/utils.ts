export function formatarSaudacao(hora: number): string {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function formatarData(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

export function formatarPreco(valor: number): string {
  if (valor >= 1_000_000)
    return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 1_000)
    return `R$ ${(valor / 1_000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(valor)
}

export function calcularVariacao(
  atual: number,
  anterior: number,
): { texto: string; tendencia: 'alta' | 'baixa' | 'neutro' } {
  if (anterior === 0 && atual === 0) return { texto: '—', tendencia: 'neutro' }
  if (anterior === 0) return { texto: `+${atual}`, tendencia: 'alta' }
  const pct = ((atual - anterior) / anterior) * 100
  if (Math.abs(pct) < 0.5) return { texto: '0%', tendencia: 'neutro' }
  return {
    texto: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`,
    tendencia: pct > 0 ? 'alta' : 'baixa',
  }
}

export function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Agora há pouco'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ontem'
  if (d < 7) return `há ${d} dias`
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}
