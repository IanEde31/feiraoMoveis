---
name: review-pr
description: Analisa o PR atual com foco nas convenções do projeto Feirão Móveis
allowed-tools: Bash(git diff *), Bash(git log *), Bash(git status *), Read, Glob
---

# Review de Pull Request

Analise as mudanças do branch atual em relação à main, com foco nas convenções do projeto.

## Dados do PR atual

- **Diff completo**: !`git diff main...HEAD`
- **Arquivos alterados**: !`git diff main...HEAD --name-only`
- **Commits**: !`git log main...HEAD --oneline`

## Checklist de Review

Ao analisar, verifique cada item:

### Estrutura e Arquitetura
- [ ] Páginas novas seguem a estrutura `page.tsx` + `loading.tsx` + `error.tsx`?
- [ ] Server Components usados por padrão (sem `"use client"` desnecessário)?
- [ ] Rotas de API usam `createClient` do servidor (`lib/supabase/server.ts`)?
- [ ] Componentes `ui/` do shadcn não foram editados manualmente?

### Banco de Dados
- [ ] Migrations têm `if not exists` para idempotência?
- [ ] Novas tabelas habilitam RLS?
- [ ] Tipos TypeScript foram regenerados após migrations?

### WhatsApp
- [ ] Novos provedores implementam toda a interface `WhatsAppProvider`?
- [ ] Configurações de API não estão hardcoded (devem vir do banco)?

### Qualidade
- [ ] Formulários usam React Hook Form + Zod?
- [ ] Mensagens de erro e labels estão em Português-BR?
- [ ] Sem `console.log` esquecido (apenas `console.error` com contexto)?

## Formato do feedback
Para cada problema encontrado, informe:
- **Arquivo**: `caminho/do/arquivo.tsx:linha`
- **Problema**: descrição clara
- **Sugestão**: como corrigir

Conclua com um resumo: ✅ Aprovado / ⚠️ Aprovado com ressalvas / ❌ Requer alterações
