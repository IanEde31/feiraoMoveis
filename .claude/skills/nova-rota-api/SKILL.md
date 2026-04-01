---
name: nova-rota-api
description: Cria um route handler Next.js com validação Zod, cliente Supabase e tratamento de erros padronizado
argument-hint: "[caminho-da-rota] [metodos: GET,POST,PUT,DELETE]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Nova Rota de API

Gere um route handler Next.js seguindo os padrões do projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: caminho da rota (ex: `produtos` → cria em `app/api/produtos/route.ts`)
- `$ARGUMENTS[1]`: métodos HTTP necessários (ex: `GET,POST`)

## Estrutura base

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Schema de validação do body (para POST/PUT)
const bodySchema = z.object({
  // campos aqui
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // lógica aqui

    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('[GET /api/[rota]]', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // lógica aqui

    return NextResponse.json({ data: null }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/[rota]]', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

## Padrão de resposta
- Sucesso: `{ data: T }`
- Erro de validação: `{ error: string, details?: object }` com status 400
- Não encontrado: `{ error: string }` com status 404
- Erro interno: `{ error: 'Erro interno do servidor' }` com status 500

## Regras
- Sempre usar `createClient` de `@/lib/supabase/server` (nunca o cliente browser)
- Validar body com `safeParse` antes de processar
- Mensagens de erro em Português-BR
- Log de erros com contexto `[MÉTODO /api/rota]`
- Rotas de webhook em `app/api/webhooks/` usam service role key
