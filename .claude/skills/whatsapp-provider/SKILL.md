---
name: whatsapp-provider
description: Scaffolda um novo adaptador de provedor WhatsApp seguindo a interface unificada do projeto
argument-hint: "[nome-do-provedor: uazapi|evolution|meta]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Adaptador de Provedor WhatsApp

Gere um novo adaptador para integração com provedor de WhatsApp no padrão do projeto Feirão Móveis.

## Argumento
- `$ARGUMENTS[0]`: nome do provedor (ex: `uazapi`, `evolution`, `meta`)

## Interface unificada (em `lib/whatsapp/types.ts`)

Todo adaptador deve implementar esta interface:

```ts
export interface WhatsAppProvider {
  // Conexão
  gerarQRCode(): Promise<{ qrcode: string; status: string }>
  verificarStatus(): Promise<{ conectado: boolean; numero?: string }>
  desconectar(): Promise<void>

  // Mensagens
  enviarMensagem(para: string, texto: string): Promise<{ id: string }>
  enviarImagem(para: string, imagemUrl: string, legenda?: string): Promise<{ id: string }>

  // Contatos
  buscarContatos(): Promise<Contato[]>
  buscarHistorico(contato: string, limite?: number): Promise<Mensagem[]>
}
```

## Estrutura do adaptador (`lib/whatsapp/[provedor].ts`)

```ts
import type { WhatsAppProvider, Contato, Mensagem } from './types'

interface [Provedor]Config {
  baseUrl: string
  apiKey: string
  instancia: string
}

export class [Provedor]Adapter implements WhatsAppProvider {
  private config: [Provedor]Config

  constructor(config: [Provedor]Config) {
    this.config = config
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // header de autenticação específico do provedor
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`[${endpoint}] Erro ${response.status}: ${await response.text()}`)
    }

    return response.json()
  }

  async gerarQRCode() {
    // implementação específica do provedor
    throw new Error('Não implementado')
  }

  // ... demais métodos
}
```

## Atualizar factory (`lib/whatsapp/index.ts`)

Após criar o adaptador, registrar na factory:

```ts
export function criarProvedor(tipo: string, config: unknown): WhatsAppProvider {
  switch (tipo) {
    case 'uazapi': return new UzapiAdapter(config as UzapiConfig)
    case 'evolution': return new EvolutionAdapter(config as EvolutionConfig)
    case 'meta': return new MetaAdapter(config as MetaConfig)
    default: throw new Error(`Provedor desconhecido: ${tipo}`)
  }
}
```

## Regras
- Cada adaptador é independente — sem imports entre adaptadores
- Erros devem incluir contexto do endpoint para facilitar debug
- Configuração (baseUrl, apiKey) vem sempre do banco de dados, nunca de env vars estáticas
- Mensagens de erro em Português-BR
