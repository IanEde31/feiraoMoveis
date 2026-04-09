---
name: nova-pagina
description: Cria uma nova página no App Router do Next.js com estrutura completa (page, loading, error) e componentes separados em components/
argument-hint: "[nome-da-pagina] [rota-opcional]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Nova Página

Crie uma nova página no Next.js App Router seguindo as convenções do projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: nome da página em kebab-case (ex: `relatorios`)
- `$ARGUMENTS[1]`: rota pai opcional (ex: `dashboard` → gera em `app/(dashboard)/`)

## Filosofia de estrutura

O `page.tsx` deve ser **fino**: responsável apenas por buscar dados (fetch server-side) e compor os componentes. Toda a lógica de UI, estado e interatividade fica em `components/[nome-da-pagina]/`.

Isso garante:
- `app/` como descrição da rota, não como repositório de lógica
- Componentes reutilizáveis e testáveis de forma isolada
- Fácil navegação — quem mantém a UI sabe onde olhar

## Arquivos a criar

### 1. Componentes em `components/$ARGUMENTS[0]/`

**`components/$ARGUMENTS[0]/[NomePagina]View.tsx`** — componente raiz da página (Client Component se precisar de estado/interatividade, Server Component caso contrário):
```tsx
// Exemplo: componente principal que recebe os dados e renderiza a UI
// Adicionar "use client" apenas se precisar de hooks/interatividade

import type { [TipoDado] } from '@/lib/supabase/types'

interface [NomePagina]ViewProps {
  dados: [TipoDado][]
}

export function [NomePagina]View({ dados }: [NomePagina]ViewProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-playfair text-2xl font-bold text-slate-900">[Nome Legível]</h1>
      {/* conteúdo da página */}
    </div>
  )
}
```

Crie sub-componentes adicionais no mesmo diretório conforme necessário (ex: `[NomePagina]Card.tsx`, `[NomePagina]Sheet.tsx`, `[NomePagina]Modal.tsx`).

### 2. `app/(dashboard)/$ARGUMENTS[0]/page.tsx` — fino, apenas orquestra

```tsx
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { [NomePagina]View } from '@/components/$ARGUMENTS[0]/[NomePagina]View'

export const metadata: Metadata = {
  title: '[Nome Legível] | Feirão Móveis',
}

export default async function [NomePagina]Page() {
  const supabase = createClient()

  const { data: dados } = await supabase
    .from('[tabela]')
    .select('*')
    .order('created_at', { ascending: false })

  return <[NomePagina]View dados={dados ?? []} />
}
```

### 3. `app/(dashboard)/$ARGUMENTS[0]/loading.tsx`
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### 4. `app/(dashboard)/$ARGUMENTS[0]/error.tsx`
```tsx
'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-destructive">Erro ao carregar a página.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
```

## Regras
- `page.tsx` é Server Component por padrão (sem `"use client"`) — fetch de dados acontece aqui
- Componentes com estado ou hooks do browser recebem `"use client"` dentro de `components/`
- Nomear componentes com PascalCase baseado na rota (ex: rota `relatorios` → `RelatoriosView`)
- A pasta `components/[nome-da-pagina]/` agrupa todos os sub-componentes da funcionalidade
- Textos e labels em Português-BR
- Importar sempre via `@/` (path alias)
- Seguir o padrão visual do projeto: `font-playfair` para títulos, `amber-500` para acentos, `slate-*` para texto e bordas
