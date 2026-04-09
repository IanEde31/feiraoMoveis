import type { ItemGaleria } from '@/components/ambientacao/tipos'

export interface GaleriaStore {
  listar(clienteId: string): Promise<ItemGaleria[]>
  salvar(item: Omit<ItemGaleria, 'id' | 'criada_em'>): Promise<ItemGaleria>
  remover(id: string): Promise<void>
}

// Implementação que chama as API routes (não acessa Supabase diretamente no browser)
export const galeria: GaleriaStore = {
  async listar(clienteId) {
    const res = await fetch(`/api/ambientacao/galeria?cliente_id=${clienteId}`)
    if (!res.ok) throw new Error('Falha ao listar galeria')
    const { itens } = await res.json()
    return itens as ItemGaleria[]
  },

  async salvar() {
    // Geração e persistência passam exclusivamente por POST /api/ambientacao/gerar
    throw new Error('Use POST /api/ambientacao/gerar para criar uma ambientação')
  },

  async remover(id) {
    const res = await fetch(`/api/ambientacao/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Falha ao remover ambientação')
  },
}
