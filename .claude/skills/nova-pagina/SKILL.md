---
name: nova-pagina
description: Cria uma nova página no App Router do Next.js com estrutura completa (page, loading, error)
argument-hint: "[nome-da-pagina] [rota-opcional]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Nova Página

Crie uma nova página no Next.js App Router seguindo as convenções do projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: nome da página em kebab-case (ex: `lista-produtos`)
- `$ARGUMENTS[1]`: rota pai opcional (ex: `dashboard` → gera em `app/(dashboard)/`)

## Estrutura a criar

Para uma página chamada `$ARGUMENTS[0]` dentro de `app/(dashboard)/`:

### `app/(dashboard)/$ARGUMENTS[0]/page.tsx`
```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '[Nome Legível] | Feirão Móveis',
}

export default function [NomePagina]Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">[Nome Legível]</h1>
    </div>
  )
}
```

### `app/(dashboard)/$ARGUMENTS[0]/loading.tsx`
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

### `app/(dashboard)/$ARGUMENTS[0]/error.tsx`
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
- Sempre usar Server Component para `page.tsx` (sem `"use client"`)
- Nomear o componente com PascalCase baseado na rota
- Textos e labels em Português-BR
- Importar de `@/` (path alias)
