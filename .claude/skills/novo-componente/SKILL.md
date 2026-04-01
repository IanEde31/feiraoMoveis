---
name: novo-componente
description: Cria um novo componente React com tipagem TypeScript seguindo os padrões do projeto
argument-hint: "[nome-do-componente] [tipo: ui|feature|layout]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Novo Componente

Crie um componente React tipado seguindo as convenções do projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: nome do componente em PascalCase (ex: `CardProduto`)
- `$ARGUMENTS[1]`: tipo — `ui` (genérico/reutilizável), `feature` (específico de funcionalidade), `layout` (estrutura de página)

## Destinos por tipo
- `ui` → `components/[nome-kebab].tsx`
- `feature` → `components/[dominio]/[nome-kebab].tsx` (detectar domínio pelo nome)
- `layout` → `components/layout/[nome-kebab].tsx`

## Estrutura do componente

```tsx
import { cn } from '@/lib/utils'

interface [NomeComponente]Props {
  className?: string
  // props específicas aqui
}

export function [NomeComponente]({ className, ...props }: [NomeComponente]Props) {
  return (
    <div className={cn('', className)}>
      {/* conteúdo */}
    </div>
  )
}
```

## Regras
- Exportação nomeada (não default export)
- Interface de props sempre definida, com `className?: string` opcional
- Usar `cn()` de `@/lib/utils` para mesclar classes
- `"use client"` somente se usar hooks ou eventos
- Props e comentários em Português-BR
- Sem lógica de negócio em componentes `ui`
