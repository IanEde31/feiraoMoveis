# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Idioma e Comunicação

Sempre se comunique com o usuário em **Português-BR**. Todo o desenvolvimento do sistema (nomes de variáveis de domínio, comentários, mensagens de UI, documentação) deve ser feito em **Português-BR**.

## Regra de Atualização deste Arquivo

**Atualizar o CLAUDE.md é obrigatório:**
- No início de cada nova sessão — verificar se o estado atual bate com o descrito e corrigir se necessário
- Após concluir qualquer funcionalidade ou etapa relevante
- Após aplicar migrations ou alterações no banco de dados
- Após instalar novas dependências ou ferramentas

A seção **Estado do Desenvolvimento** abaixo deve refletir sempre a realidade atual do projeto.

## Visão Geral do Projeto

**Feirão Móveis** — sistema de gestão para loja de móveis de luxo. Funcionalidades do MVP: dashboard com métricas, kanban de clientes, espelho em tempo real do WhatsApp, gerenciador de conexão com API do WhatsApp (multi-provedor) e CRUD completo de produtos com estoque.

## Stack Tecnológica

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui (primitivos Radix UI)
- **Banco de dados**: Supabase (PostgreSQL + Realtime + Storage)
- **Autenticação**: Clerk
- **Estado do servidor**: TanStack Query
- **Estado global**: Zustand
- **Formulários**: React Hook Form + Zod
- **Kanban**: dnd-kit
- **Gráficos**: Recharts

## Comandos

```bash
npm run dev          # Inicia o servidor de desenvolvimento em localhost:3000
npm run build        # Build de produção
npm run start        # Inicia o servidor de produção
npm run lint         # ESLint
npm run type-check   # Verificação TypeScript sem emissão
```

## Arquitetura

### Roteamento (Next.js App Router)
- `app/(auth)/` — páginas públicas de autenticação (login e cadastro via Clerk)
- `app/(dashboard)/` — todas as páginas protegidas; o middleware do Clerk protege todo esse grupo
- `app/api/` — rotas de API; em especial `app/api/webhooks/whatsapp/[provider]/` recebe eventos dos provedores de WhatsApp

### Clientes Supabase
Dois clientes separados devem ser mantidos:
- `lib/supabase/server.ts` — usa `SUPABASE_SERVICE_ROLE_KEY`; exclusivo para Server Components e rotas de API
- `lib/supabase/client.ts` — usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`; para Client Components com RLS

### Integração WhatsApp
Múltiplos provedores são suportados por uma interface de adaptador unificada em `lib/whatsapp/`:
- `uazapi.ts` — provedor Uazapi
- `evolution.ts` — provedor Evolution API
- `meta.ts` — provedor oficial Meta (WhatsApp Business API)
- `index.ts` — exporta uma factory que retorna o adaptador correto com base no provedor ativo salvo no Supabase

As mensagens do WhatsApp são armazenadas no Supabase e sincronizadas com a UI via Supabase Realtime. A tela de chat é um espelho das mensagens, não um sistema de mensagens independente.

### Convenções Principais
- Server Components por padrão; adicionar `"use client"` apenas para componentes que precisam de interatividade ou hooks do browser
- `components/ui/` — primitivos gerados automaticamente pelo shadcn/ui; não editar manualmente
- `components/` — componentes de funcionalidades
- Schemas Zod ficam junto das funcionalidades que os utilizam (não em uma pasta global `/schemas`)
- Todos os tipos do banco de dados são gerados pelo Supabase e ficam em `lib/supabase/types.ts`

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```

As variáveis específicas de cada provedor WhatsApp são armazenadas no banco de dados (configuração por instância), não como variáveis de ambiente estáticas, pois o usuário pode configurar múltiplas conexões.

---

## Estado do Desenvolvimento

**Última atualização:** 2026-04-01

### Situação Geral
MVP em construção. Layout do dashboard funcional com sidebar e métricas mock. Schema do banco criado mas **ainda não aplicado** ao Supabase remoto.

### O que já está pronto

| Área | Status | Detalhes |
|------|--------|----------|
| Projeto Next.js | ✅ Completo | TypeScript, Tailwind, App Router, shadcn/ui base |
| Autenticação | ✅ Funcional | Clerk configurado, login/cadastro funcionando |
| Tela de login | ✅ Completo | Layout two-column, tema dourado premium, responsivo |
| Schema do banco | ✅ Criado | Migrations SQL em `supabase/migrations/` |
| Webhook Clerk→Supabase | ✅ Criado | `app/api/webhooks/clerk/route.ts` — sincroniza usuários |
| MCP Supabase | ✅ Instalado | Configurado em `.mcp.json` — ativo na próxima sessão |
| MCP GitHub | ✅ Instalado | Configurado em `~/.claude.json` (escopo usuário) |
| MCP Clerk | ✅ Instalado | HTTP `https://mcp.clerk.com/mcp` — ativo na próxima sessão |
| Skills customizadas | ✅ Criadas | 10 skills em `.claude/skills/` |
| Sidebar + Layout | ✅ Completo | `components/layout/` — Shell, Sidebar, Header; responsivo com overlay mobile |
| Dashboard | ✅ Completo (mock) | KPIs, pipeline kanban, estoque crítico, últimas negociações — dados mock |
| Tela Clientes / Kanban | ✅ Completo (mock) | dnd-kit multi-coluna, busca + filtros (origem, tags), summary bar, drag overlay |

### ⚠️ Próxima sessão — começar aqui

**Passo 0 — Continuar o MVP de UI**
- CRUD de Produtos (`/produtos`) — listagem em grid/tabela, formulário de cadastro, upload de imagem
- Depois substituir dados mock (dashboard + clientes) por queries Supabase reais

**Passo 1 — Aplicar migrations via MCP Supabase** (o MCP estará disponível após reiniciar)

Usar os tools do MCP para executar cada arquivo de `supabase/migrations/` na ordem:
1. `20260401000001_funcoes_utilitarias.sql`
2. `20260401000002_tabela_usuarios.sql`
3. `20260401000003_tabelas_produtos.sql`
4. `20260401000004_tabelas_clientes_kanban.sql`
5. `20260401000005_tabelas_whatsapp.sql`
6. `20260401000006_dados_iniciais.sql`

**Passo 2 — Criar buckets no Supabase Storage** (via MCP ou dashboard)
- `produtos` → público
- `whatsapp-media` → autenticado
- `avatares` → público

**Passo 3 — Configurar JWT Template no Clerk** (manual — ver `supabase/README.md`)
- Clerk Dashboard → JWT Templates → New template: `supabase`
- Usar o JWT Secret do Supabase como signing key
- Isso é necessário para o RLS funcionar com o Clerk

**Passo 4 — Promover primeiro usuário a admin**
```sql
update public.usuarios set papel = 'admin' where email = 'SEU_EMAIL';
```

**Passo 5 — Configurar webhook do Clerk**
- Clerk Dashboard → Webhooks → Add Endpoint
- URL: `https://SEU_DOMINIO/api/webhooks/clerk`
- Eventos: `user.created`, `user.updated`, `user.deleted`
- Copiar o Signing Secret para `CLERK_WEBHOOK_SECRET` no `.env.local`

**Passo 6 — Configurar clientes Supabase no Next.js**
Criar `lib/supabase/server.ts` e `lib/supabase/client.ts` usando o token JWT do Clerk

### Funcionalidades do MVP a desenvolver (por prioridade)

1. **Dashboard** — métricas: faturamento, clientes por estágio, estoque crítico, negociações abertas
2. **Kanban de clientes** — drag-and-drop entre estágios, cards com info resumida
3. **CRUD de produtos** — listagem, cadastro, edição, upload de imagens, controle de estoque
4. **Tela de chat WhatsApp** — lista de conversas, janela de mensagens, tempo real via Supabase Realtime
5. **Gerenciador de conexões WhatsApp** — QR code, status, adicionar/remover instâncias

### Estrutura de arquivos relevante

```
app/
  (auth)/          ← login e cadastro (Clerk)
  (dashboard)/
    layout.tsx     ← importa Shell (sidebar + header)
    dashboard/     ← dashboard com KPIs, pipeline, estoque crítico
  api/
    webhooks/
      clerk/       ← sincroniza usuários Clerk → Supabase
components/
  layout/
    shell.tsx      ← "use client" — controla estado mobile da sidebar
    sidebar.tsx    ← "use client" — navegação lateral dark/gold
    header.tsx     ← "use client" — header com título dinâmico
supabase/
  migrations/      ← 6 arquivos SQL (não aplicados ainda)
  README.md        ← instruções de configuração Clerk+Supabase
.claude/
  skills/          ← 10 skills customizadas do projeto
.mcp.json          ← MCP Supabase (project-scoped)
```
