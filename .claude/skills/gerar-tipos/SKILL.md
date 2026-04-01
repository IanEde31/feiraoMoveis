---
name: gerar-tipos
description: Gera os tipos TypeScript a partir do schema do Supabase e atualiza lib/supabase/types.ts
allowed-tools: Bash(npx supabase gen types *), Bash(npm run *), Read, Write
---

# Gerar Tipos TypeScript do Supabase

Atualize os tipos TypeScript gerados automaticamente pelo Supabase CLI.

## Passos

1. Verificar se o Supabase CLI está instalado:
```bash
npx supabase --version
```

2. Gerar os tipos apontando para o projeto local ou remoto:

**Projeto local (Supabase rodando localmente):**
```bash
npx supabase gen types typescript --local > lib/supabase/types.ts
```

**Projeto remoto (usando project-id):**
```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > lib/supabase/types.ts
```

3. Após gerar, adicionar o cabeçalho ao arquivo:
```ts
// Este arquivo é gerado automaticamente pelo Supabase CLI.
// NÃO edite manualmente — rode /gerar-tipos para atualizar.
// Última atualização: [data atual]
```

## Verificação
Após gerar, verificar se há erros de tipo no projeto:
```bash
npm run type-check
```

## Uso dos tipos gerados
```ts
import type { Database } from '@/lib/supabase/types'

type Produto = Database['public']['Tables']['produtos']['Row']
type NovoProduto = Database['public']['Tables']['produtos']['Insert']
type AtualizarProduto = Database['public']['Tables']['produtos']['Update']
```

## Regras
- Rodar após TODA migration aplicada
- Nunca editar `lib/supabase/types.ts` manualmente
- Commitar o arquivo gerado junto com a migration correspondente
