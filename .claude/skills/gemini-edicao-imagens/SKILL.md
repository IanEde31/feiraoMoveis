---
name: gemini-edicao-imagens
description: Edição de imagens em múltiplas etapas via chat com Gemini API — cada turno refina a imagem anterior sem perder contexto
argument-hint: "[contexto-de-uso] [etapas-exemplo?: 'criar > traduzir > adicionar logo']"
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Gemini — Edição de Imagens em Múltiplas Etapas

Implemente um fluxo de edição iterativa de imagens usando sessão de chat com a Gemini API. Cada mensagem refina a imagem gerada anteriormente — o modelo mantém contexto entre os turnos.

## Argumentos
- `$ARGUMENTS[0]`: caso de uso (ex: `editor de fotos de produto`, `gerador de infográficos iterativo`, `criador de banners`)
- `$ARGUMENTS[1]`: descrição do fluxo de etapas esperado (ex: `criar imagem > adicionar texto > ajustar cores`)

## Modelo
```
gemini-2.0-flash-preview-image-generation
```

## Diferença para geração simples
| Geração simples | Edição multi-etapas (chat) |
|-----------------|---------------------------|
| Chamada única   | Sessão persistente com histórico |
| Sem memória     | Cada turno conhece as imagens anteriores |
| `generateContent` | `chats.create()` + `chat.sendMessage()` |

## Instalação
```bash
npm install @google/genai
```

Adicionar ao `.env.local`:
```
GOOGLE_AI_API_KEY=sua_chave_aqui
```

## Padrão de Rota API

### Iniciar sessão de edição
Criar em `app/api/gemini/edicao/iniciar/route.ts`:

```typescript
import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Armazenamento em memória de sessões (substituir por Redis em produção)
// Em produção, serializar o histórico do chat e armazenar em banco
const sessoes = new Map<string, ReturnType<GoogleGenAI["chats"]["create"]>>()

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

const schema = z.object({
  promptInicial: z.string().min(1),
  aspectRatio: z.string().default("1:1"),
  imageSize: z.enum(["512", "1K", "2K", "4K"]).default("1K"),
  comGrounding: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { promptInicial, aspectRatio, imageSize, comGrounding } = schema.parse(body)

  // Cria nova sessão de chat com capacidade de gerar imagens
  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio, imageSize },
  }
  if (comGrounding) config.tools = [{ googleSearch: {} }]

  const chat = ai.chats.create({
    model: "gemini-2.0-flash-preview-image-generation",
    config,
  })

  // Primeira mensagem — gera imagem inicial
  const response = await chat.sendMessage({ message: promptInicial })

  const sessaoId = crypto.randomUUID()
  sessoes.set(sessaoId, chat)

  const partes = response.candidates?.[0]?.content?.parts ?? []
  const resultado: { texto?: string; imagemBase64?: string; mimeType?: string } = {}
  for (const parte of partes) {
    if (parte.text) resultado.texto = parte.text
    else if (parte.inlineData) {
      resultado.imagemBase64 = parte.inlineData.data
      resultado.mimeType = parte.inlineData.mimeType
    }
  }

  return NextResponse.json({ sessaoId, ...resultado })
}
```

### Continuar edição (próximos turnos)
Criar em `app/api/gemini/edicao/continuar/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
// Importar o mapa de sessões do módulo de iniciar (em produção: Redis/DB)
import { sessoes } from "../iniciar/route"

const schema = z.object({
  sessaoId: z.string().uuid(),
  instrucao: z.string().min(1),
  imageSize: z.enum(["512", "1K", "2K", "4K"]).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessaoId, instrucao, imageSize } = schema.parse(body)

  const chat = sessoes.get(sessaoId)
  if (!chat) {
    return NextResponse.json({ erro: "Sessão não encontrada ou expirada" }, { status: 404 })
  }

  const msgConfig = imageSize
    ? { config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize } } }
    : undefined

  const response = await chat.sendMessage({ message: instrucao, ...msgConfig })

  const partes = response.candidates?.[0]?.content?.parts ?? []
  const resultado: { texto?: string; imagemBase64?: string; mimeType?: string } = {}
  for (const parte of partes) {
    if (parte.text) resultado.texto = parte.text
    else if (parte.inlineData) {
      resultado.imagemBase64 = parte.inlineData.data
      resultado.mimeType = parte.inlineData.mimeType
    }
  }

  return NextResponse.json(resultado)
}
```

## Hook para edição iterativa

Criar em `lib/gemini/useEdicaoImagens.ts`:

```typescript
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

interface EtapaEdicao {
  instrucao: string
  imagemBase64: string
  mimeType: string
  texto?: string
}

export function useEdicaoImagens() {
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<EtapaEdicao[]>([])

  const iniciar = useMutation({
    mutationFn: async (params: {
      promptInicial: string
      aspectRatio?: string
      imageSize?: "512" | "1K" | "2K" | "4K"
    }) => {
      const res = await fetch("/api/gemini/edicao/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Falha ao iniciar sessão")
      return res.json() as Promise<{ sessaoId: string; imagemBase64: string; mimeType: string; texto?: string }>
    },
    onSuccess: (data) => {
      setSessaoId(data.sessaoId)
      setHistorico([{ instrucao: "Imagem inicial", imagemBase64: data.imagemBase64, mimeType: data.mimeType, texto: data.texto }])
    },
  })

  const continuar = useMutation({
    mutationFn: async (instrucao: string) => {
      if (!sessaoId) throw new Error("Nenhuma sessão ativa")
      const res = await fetch("/api/gemini/edicao/continuar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessaoId, instrucao }),
      })
      if (!res.ok) throw new Error("Falha ao continuar edição")
      return res.json() as Promise<{ imagemBase64: string; mimeType: string; texto?: string }>
    },
    onSuccess: (data, instrucao) => {
      setHistorico((prev) => [...prev, { instrucao, imagemBase64: data.imagemBase64, mimeType: data.mimeType, texto: data.texto }])
    },
  })

  const reiniciar = () => {
    setSessaoId(null)
    setHistorico([])
  }

  const imagemAtual = historico[historico.length - 1]

  return { iniciar, continuar, reiniciar, historico, imagemAtual, sessaoId }
}
```

## Exemplo de uso — Editor de foto de produto

```tsx
"use client"
import { useState } from "react"
import { useEdicaoImagens } from "@/lib/gemini/useEdicaoImagens"

export function EditorFotoProduto({ nomeProduto }: { nomeProduto: string }) {
  const [instrucao, setInstrucao] = useState("")
  const { iniciar, continuar, reiniciar, historico, imagemAtual } = useEdicaoImagens()

  return (
    <div className="flex gap-6">
      {/* Painel de controle */}
      <div className="w-80 space-y-4">
        {!imagemAtual ? (
          <button
            onClick={() =>
              iniciar.mutate({
                promptInicial: `Foto de produto de luxo: ${nomeProduto}. Fundo branco, iluminação de estúdio profissional.`,
                aspectRatio: "1:1",
                imageSize: "2K",
              })
            }
            disabled={iniciar.isPending}
          >
            {iniciar.isPending ? "Criando imagem inicial..." : "Gerar Foto Inicial"}
          </button>
        ) : (
          <>
            <textarea
              value={instrucao}
              onChange={(e) => setInstrucao(e.target.value)}
              placeholder="Ex: Adicione reflexo no chão, mude o fundo para madeira escura, adicione planta decorativa ao lado..."
              rows={3}
            />
            <button
              onClick={() => { continuar.mutate(instrucao); setInstrucao("") }}
              disabled={continuar.isPending || !instrucao.trim()}
            >
              {continuar.isPending ? "Editando..." : "Aplicar Edição"}
            </button>
            <button onClick={reiniciar} variant="outline">Começar de Novo</button>
          </>
        )}

        {/* Histórico de edições */}
        {historico.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Histórico de edições:</p>
            {historico.map((etapa, i) => (
              <p key={i} className="text-xs text-slate-500">
                {i + 1}. {etapa.instrucao}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Imagem atual */}
      {imagemAtual && (
        <div className="flex-1">
          <img
            src={`data:${imagemAtual.mimeType};base64,${imagemAtual.imagemBase64}`}
            alt="Imagem editada"
            className="rounded-xl shadow-lg w-full"
          />
          {imagemAtual.texto && (
            <p className="mt-2 text-sm text-slate-600">{imagemAtual.texto}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

## Exemplos de fluxos de edição encadeada

```typescript
// Fluxo: infográfico em etapas
await iniciar.mutateAsync({ promptInicial: "Crie um infográfico sobre o processo de venda de móveis" })
await continuar.mutateAsync("Traduza todos os textos para Português-BR")
await continuar.mutateAsync("Adicione o logo da empresa no canto superior direito")
await continuar.mutateAsync("Mude o esquema de cores para dourado e cinza escuro")

// Fluxo: banner promocional
await iniciar.mutateAsync({ promptInicial: "Banner de promoção de sofás de couro, desconto 30%" })
await continuar.mutateAsync("Adicione uma moldura elegante e aumente o contraste")
await continuar.mutateAsync("Inclua o texto 'Válido até domingo' no rodapé")
```

## Notas de produção
- Em produção, substituir o `Map` em memória por **Redis** com TTL de ~30 minutos por sessão
- Alternativa sem servidor de sessão: serializar o `history` do chat e reenviá-lo a cada requisição
- Máximo de ~20 turnos por sessão antes de truncar contexto antigo
- Grounding com Google Search disponível via `comGrounding: true` na inicialização
