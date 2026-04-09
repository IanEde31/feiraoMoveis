export interface InputProviderAmbientacao {
  ambienteBuffer: Buffer
  ambienteMime: string
  produtos: Array<{ id: string; nome: string; imagem?: string | null }>
  prompt?: string
}

export interface OutputProviderAmbientacao {
  imagemBuffer: Buffer
  mime: string
  metadata?: Record<string, unknown>
}

export interface ProviderAmbientacao {
  readonly nome: string
  readonly modelo: string
  gerar(input: InputProviderAmbientacao): Promise<OutputProviderAmbientacao>
}
