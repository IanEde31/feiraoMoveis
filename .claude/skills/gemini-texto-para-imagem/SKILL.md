---
name: gemini-texto-para-imagem
description: Gera imagens a partir de texto usando Gemini API (Google GenAI) com suporte a aspect ratio, resolução e grounding
argument-hint: "[descricao-do-que-gerar] [aspecto?: 1:1|16:9|9:16|4:3] [resolucao?: 512|1K|2K|4K]"
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Gemini — Geração de Imagem a partir de Texto

Implemente geração de imagem via texto usando a Gemini API no projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: contexto de uso (ex: `foto de produto`, `banner promocional`, `avatar de cliente`)
- `$ARGUMENTS[1]`: aspect ratio padrão — `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2` (padrão: `1:1`)
- `$ARGUMENTS[2]`: resolução — `512`, `1K`, `2K`, `4K` (padrão: `1K`)

## Modelo
```
gemini-2.0-flash-preview-image-generation
```

## Aspect Ratios suportados
`1:1` · `1:4` · `1:8` · `2:3` · `3:2` · `3:4` · `4:1` · `4:3` · `4:5` · `5:4` · `8:1` · `9:16` · `16:9` · `21:9`

## Instalação
```bash
npm install @google/genai
```

Adicionar ao `.env.local`:
```
GOOGLE_AI_API_KEY=sua_chave_aqui
```

## Padrão de Rota API

Criar em `app/api/gemini/gerar-imagem/route.ts`:

```typescript
import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  prompt: z.string().min(1),
  aspectRatio: z.string().default("1:1"),
  imageSize: z.enum(["512", "1K", "2K", "4K"]).default("1K"),
  comGrounding: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt, aspectRatio, imageSize, comGrounding } = schema.parse(body)

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio, imageSize },
  }

  if (comGrounding) {
    config.tools = [{ googleSearch: {} }]
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: prompt,
    config,
  })

  const partes = response.candidates?.[0]?.content?.parts ?? []
  const resultado: { texto?: string; imagemBase64?: string; mimeType?: string } = {}

  for (const parte of partes) {
    if (parte.text) {
      resultado.texto = parte.text
    } else if (parte.inlineData) {
      resultado.imagemBase64 = parte.inlineData.data
      resultado.mimeType = parte.inlineData.mimeType
    }
  }

  if (!resultado.imagemBase64) {
    return NextResponse.json({ erro: "Nenhuma imagem gerada" }, { status: 422 })
  }

  return NextResponse.json(resultado)
}
```

## Padrão de Hook (Client-side)

Criar em `lib/gemini/useGerarImagem.ts`:

```typescript
import { useMutation } from "@tanstack/react-query"

interface GerarImagemParams {
  prompt: string
  aspectRatio?: string
  imageSize?: "512" | "1K" | "2K" | "4K"
  comGrounding?: boolean
}

interface GerarImagemResult {
  texto?: string
  imagemBase64: string
  mimeType: string
}

export function useGerarImagem() {
  return useMutation({
    mutationFn: async (params: GerarImagemParams): Promise<GerarImagemResult> => {
      const res = await fetch("/api/gemini/gerar-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Falha ao gerar imagem")
      return res.json()
    },
  })
}
```

## Uso em componente

```tsx
"use client"
import { useGerarImagem } from "@/lib/gemini/useGerarImagem"

export function GeradorImagemProduto({ nomeProduto }: { nomeProduto: string }) {
  const { mutate, data, isPending, isError } = useGerarImagem()

  return (
    <div>
      <button
        onClick={() =>
          mutate({
            prompt: `Foto de produto para loja de móveis de luxo: ${nomeProduto}. Fundo branco, iluminação profissional.`,
            aspectRatio: "1:1",
            imageSize: "2K",
          })
        }
        disabled={isPending}
      >
        {isPending ? "Gerando..." : "Gerar Foto com IA"}
      </button>

      {isError && <p className="text-red-500">Erro ao gerar imagem</p>}

      {data?.imagemBase64 && (
        <img
          src={`data:${data.mimeType};base64,${data.imagemBase64}`}
          alt="Imagem gerada"
          className="mt-4 rounded-lg"
        />
      )}
    </div>
  )
}
```

## Notas importantes
- Todas as imagens geradas incluem marca d'água SynthID (invisível)
- `comGrounding: true` ativa Google Search para contexto em tempo real (ex: clima, eventos)
- Resolução `4K` consome mais cota — usar `2K` como padrão para UI
- A resposta pode conter partes de texto E imagem — processar ambas
