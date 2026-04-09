---
name: gemini-texto
description: Integra geração de texto com a Gemini API (Google GenAI) usando @google/genai no projeto Next.js
argument-hint: "[prompt-ou-contexto] [modelo?: flash|pro]"
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Gemini — Geração de Texto

Implemente geração de texto usando a Gemini API no projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: descrição do que gerar (ex: `descrição de produto`, `resposta automática para cliente`)
- `$ARGUMENTS[1]`: modelo — `flash` (rápido, padrão) ou `pro` (raciocínio avançado)

## Modelos disponíveis
| Alias    | Model ID                        | Uso              |
|----------|---------------------------------|------------------|
| `flash`  | `gemini-2.0-flash`              | Padrão, rápido   |
| `pro`    | `gemini-2.0-pro`                | Raciocínio avançado |

## Instalação
```bash
npm install @google/genai
```

Adicionar ao `.env.local`:
```
GOOGLE_AI_API_KEY=sua_chave_aqui
```

## Padrão de Rota API (Server-side)

Criar em `app/api/gemini/texto/route.ts`:

```typescript
import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  prompt: z.string().min(1),
  modelo: z.enum(["flash", "pro"]).default("flash"),
})

const MODELOS = {
  flash: "gemini-2.0-flash",
  pro: "gemini-2.0-pro",
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt, modelo } = schema.parse(body)

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

  const response = await ai.models.generateContent({
    model: MODELOS[modelo],
    contents: prompt,
  })

  return NextResponse.json({ texto: response.text })
}
```

## Padrão de Hook (Client-side)

Criar em `lib/gemini/useGerarTexto.ts`:

```typescript
import { useMutation } from "@tanstack/react-query"

interface GerarTextoParams {
  prompt: string
  modelo?: "flash" | "pro"
}

export function useGerarTexto() {
  return useMutation({
    mutationFn: async ({ prompt, modelo = "flash" }: GerarTextoParams) => {
      const res = await fetch("/api/gemini/texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelo }),
      })
      if (!res.ok) throw new Error("Falha ao gerar texto")
      const data = await res.json()
      return data.texto as string
    },
  })
}
```

## Uso em componente

```tsx
"use client"
import { useGerarTexto } from "@/lib/gemini/useGerarTexto"

export function BotaoGerarDescricao({ nomeProduto }: { nomeProduto: string }) {
  const { mutate, data, isPending } = useGerarTexto()

  return (
    <div>
      <button
        onClick={() => mutate({ prompt: `Gere uma descrição de venda para o produto: ${nomeProduto}` })}
        disabled={isPending}
      >
        {isPending ? "Gerando..." : "Gerar Descrição com IA"}
      </button>
      {data && <p>{data}</p>}
    </div>
  )
}
```

## Regras
- Chave de API sempre em variável de ambiente, nunca no client
- Chamadas à Gemini API somente em rotas API (`app/api/`) ou Server Components
- Usar TanStack Query (`useMutation`) para gerenciar estado de loading/erro no client
- Validar input com Zod antes de chamar a API
- Tratar erros com `try/catch` e retornar status HTTP adequado
