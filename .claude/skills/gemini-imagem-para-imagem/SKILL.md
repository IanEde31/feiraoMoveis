---
name: gemini-imagem-para-imagem
description: Gera nova imagem a partir de texto + imagem(ns) de referência usando Gemini API — ideal para editar fotos de produtos, criar variações de ambientes e composições
argument-hint: "[contexto-de-uso] [quantidade-de-imagens?: 1-14]"
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Gemini — Texto + Imagem para Imagem

Implemente geração de imagem usando imagens de referência + prompt de texto com a Gemini API.

## Argumentos
- `$ARGUMENTS[0]`: caso de uso (ex: `trocar fundo de produto`, `composição de sala com móveis`, `variação de cor`)
- `$ARGUMENTS[1]`: quantidade máxima de imagens de referência esperadas (padrão: `1`, máximo: `14`)

## Modelo
```
gemini-2.0-flash-preview-image-generation
```

## Casos de uso no Feirão Móveis
- Gerar foto de produto com fundo diferente
- Criar composição de sala com múltiplos móveis
- Gerar variação de cor/acabamento de um produto
- Criar foto de ambiente a partir de referências de móveis separados

## Instalação
```bash
npm install @google/genai
```

Adicionar ao `.env.local`:
```
GOOGLE_AI_API_KEY=sua_chave_aqui
```

## Padrão de Rota API

Criar em `app/api/gemini/imagem-para-imagem/route.ts`:

```typescript
import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const imagemSchema = z.object({
  data: z.string(), // base64
  mimeType: z.string().default("image/jpeg"),
})

const schema = z.object({
  prompt: z.string().min(1),
  imagens: z.array(imagemSchema).min(1).max(14),
  aspectRatio: z.string().default("1:1"),
  imageSize: z.enum(["512", "1K", "2K", "4K"]).default("1K"),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt, imagens, aspectRatio, imageSize } = schema.parse(body)

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

  // Monta partes: texto + imagens de referência
  const contents: unknown[] = [{ text: prompt }]
  for (const img of imagens) {
    contents.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio, imageSize },
    },
  })

  const partes = response.candidates?.[0]?.content?.parts ?? []
  const resultado: { texto?: string; imagemBase64?: string; mimeType?: string } = {}

  for (const parte of partes) {
    if (parte.text) resultado.texto = parte.text
    else if (parte.inlineData) {
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

## Padrão de Hook

Criar em `lib/gemini/useImagemParaImagem.ts`:

```typescript
import { useMutation } from "@tanstack/react-query"

interface ImagemReferencia {
  data: string   // base64
  mimeType?: string
}

interface ImagemParaImagemParams {
  prompt: string
  imagens: ImagemReferencia[]
  aspectRatio?: string
  imageSize?: "512" | "1K" | "2K" | "4K"
}

// Utilitário: converte File para base64
export async function fileParaBase64(file: File): Promise<ImagemReferencia> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove o prefixo "data:image/jpeg;base64,"
      const base64 = result.split(",")[1]
      resolve({ data: base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useImagemParaImagem() {
  return useMutation({
    mutationFn: async (params: ImagemParaImagemParams) => {
      const res = await fetch("/api/gemini/imagem-para-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Falha ao processar imagem")
      return res.json() as Promise<{ texto?: string; imagemBase64: string; mimeType: string }>
    },
  })
}
```

## Uso em componente — troca de fundo de produto

```tsx
"use client"
import { useImagemParaImagem, fileParaBase64 } from "@/lib/gemini/useImagemParaImagem"
import { useRef } from "react"

export function TrocaFundoProduto() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate, data, isPending } = useImagemParaImagem()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const imagem = await fileParaBase64(file)
    mutate({
      prompt: "Mantenha o móvel exatamente igual, mas substitua o fundo por um ambiente elegante de sala de estar com iluminação suave e tons neutros.",
      imagens: [imagem],
      aspectRatio: "4:3",
      imageSize: "2K",
    })
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <button onClick={() => inputRef.current?.click()} disabled={isPending}>
        {isPending ? "Processando..." : "Trocar Fundo com IA"}
      </button>
      {data?.imagemBase64 && (
        <img src={`data:${data.mimeType};base64,${data.imagemBase64}`} alt="Resultado" />
      )}
    </div>
  )
}
```

## Uso com múltiplas imagens — composição de ambiente

```tsx
// Envia até 14 imagens de móveis separados para compor uma sala
mutate({
  prompt: "Crie uma foto realista de uma sala de estar de luxo usando esses móveis. Composição harmoniosa, iluminação natural.",
  imagens: [sofaBase64, mesaBase64, esteiraBase64], // até 14 itens
  aspectRatio: "16:9",
  imageSize: "2K",
})
```

## Notas
- Ordem importa: o modelo presta mais atenção nas primeiras imagens
- Para edição precisa (ex: só trocar cor), seja específico no prompt
- Imagens de referência devem ser `image/jpeg`, `image/png` ou `image/webp`
- Limite de tamanho por imagem: ~4MB recomendado
