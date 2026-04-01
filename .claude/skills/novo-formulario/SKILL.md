---
name: novo-formulario
description: Cria um formulário completo com React Hook Form, Zod e shadcn/ui
argument-hint: "[nome-do-formulario] [campos separados por vírgula]"
allowed-tools: Read, Write, Edit, Glob
---

# Criar Novo Formulário

Gere um formulário completo com validação seguindo os padrões do projeto Feirão Móveis.

## Argumentos
- `$ARGUMENTS[0]`: nome do formulário em PascalCase (ex: `FormularioProduto`)
- `$ARGUMENTS[1]`: campos desejados (ex: `nome,preco,descricao,estoque`)

## Estrutura a gerar

### Schema de validação (Zod)
```tsx
import { z } from 'zod'

export const [nome]Schema = z.object({
  // campos inferidos dos argumentos com tipos adequados
})

export type [Nome]FormData = z.infer<typeof [nome]Schema>
```

### Componente do formulário
```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { [nome]Schema, type [Nome]FormData } from './schema'

interface [Nome]FormProps {
  defaultValues?: Partial<[Nome]FormData>
  onSubmit: (data: [Nome]FormData) => Promise<void>
}

export function [Nome]Form({ defaultValues, onSubmit }: [Nome]FormProps) {
  const form = useForm<[Nome]FormData>({
    resolver: zodResolver([nome]Schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* campos gerados */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  )
}
```

## Mapeamento de tipos de campo
- Texto curto → `Input`
- Texto longo → `Textarea`
- Número → `Input type="number"`
- Booleano → `Checkbox`
- Seleção → `Select`
- Data → `Input type="date"`

## Regras
- Schema e componente em arquivos separados (`schema.ts` + `[nome-kebab]-form.tsx`)
- Labels e mensagens de erro em Português-BR
- Mensagens de erro Zod customizadas em PT-BR (ex: `{ required_error: 'Campo obrigatório' }`)
- Sempre mostrar estado de loading no botão de submit
