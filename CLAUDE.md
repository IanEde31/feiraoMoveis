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

### Regras Obrigatórias Antes de Desenvolver Código

**1. Verificar reuso antes de criar**
Antes de criar qualquer componente, hook, função ou utilitário, buscar no projeto se algo equivalente já existe e pode ser importado ou estendido. Usar Glob e Grep para essa verificação. Evitar duplicação de código.

**2. Analisar skills disponíveis antes de executar**
Antes de iniciar qualquer tarefa de desenvolvimento, verificar as skills disponíveis no projeto (`.claude/skills/`) para ver se há alguma aplicável. Skills como `novo-componente`, `nova-pagina`, `novo-formulario`, `nova-rota-api`, `ui-ux-pro-max`, `ckm-ui-styling` e outras devem ser consultadas e utilizadas quando relevantes para garantir consistência e qualidade.

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

**Última atualização:** 2026-04-06

### Situação Geral
MVP em andamento avançado. Dashboard, Produtos e Clientes 100% funcionais com dados reais do Supabase. Próxima etapa: integração WhatsApp.

### O que já está pronto

| Área | Status | Detalhes |
|------|--------|----------|
| Projeto Next.js | ✅ Completo | TypeScript, Tailwind, App Router |
| Autenticação | ✅ Funcional | Clerk configurado, login/cadastro funcionando |
| Tela de login | ✅ Completo | Layout two-column, tema dourado premium, responsivo |
| Migrations SQL | ✅ Aplicadas | 7 migrations no Supabase remoto (projeto `atteroccvajbcwxsaoqp`) |
| Supabase Storage | ✅ Buckets criados | `produtos` (público), `whatsapp-media` (privado), `avatares` (público) |
| JWT Template Clerk | ✅ Configurado | Template `supabase` com HS256 + JWT Secret do Supabase |
| Usuário admin | ✅ Criado | Inserido manualmente na tabela `usuarios` |
| Webhook Clerk→Supabase | ⏸️ Adiado | Configurar ao hospedar — usar ngrok em dev |
| Clientes Supabase | ✅ Criados | `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/types.ts` |
| MCP Supabase | ✅ Ativo | Configurado em `.mcp.json` |
| MCP GitHub | ✅ Ativo | Configurado em `~/.claude.json` (escopo usuário) |
| MCP Clerk | ✅ Ativo | HTTP `https://mcp.clerk.com/mcp` |
| Skills customizadas | ✅ Criadas | 10+ skills em `.claude/skills/` |
| Sidebar + Layout | ✅ Completo | `components/layout/` — Shell, Sidebar, Header; responsivo com overlay mobile |
| Dashboard | ✅ Completo (dados reais) | KPIs com variação mês-a-mês, pipeline real, estoque crítico, últimas negociações — queries Supabase reais |
| Produtos — CRUD | ✅ Completo | Grid, filtros, sheet de cadastro/edição, modal de detalhes, upload de imagem (drag & drop), gestão de estoque com histórico |
| Clientes — Kanban | ✅ Completo | dnd-kit multi-coluna, CRUD completo, modal de detalhes com timeline, busca + filtros, dados reais do Supabase |

### ⚠️ Próxima sessão — começar aqui

**WhatsApp — Tela de Chat e Gerenciador de Conexões**

**Passo 1 — Tela de Chat** (`/whatsapp`)
- Lista de conversas (contatos com última mensagem)
- Janela de mensagens em tempo real via Supabase Realtime
- Espelho das mensagens — não envia, apenas exibe o que chega via webhook
- Dados das tabelas: `contatos_whatsapp`, `mensagens_whatsapp`, `ultimas_mensagens_por_contato` (view)

**Passo 2 — Gerenciador de Conexões** (`/whatsapp/conexoes`)
- Listagem das instâncias em `conexoes_whatsapp`
- Status de cada conexão (ativo, desconectado, QR pendente)
- Adicionar nova instância (provedor, base_url, api_key)
- Exibir QR code quando necessário
- Adaptadores em `lib/whatsapp/` (uazapi, evolution, meta)

**Passo 3 — Webhook de entrada** (`/api/webhooks/whatsapp/[provider]`)
- Recebe eventos dos provedores
- Salva mensagens em `mensagens_whatsapp`
- Cria/atualiza contatos em `contatos_whatsapp`

**Passo 4 — Configurar webhook do Clerk** (ao hospedar)
- Clerk Dashboard → Webhooks → Add Endpoint
- URL: `https://SEU_DOMINIO/api/webhooks/clerk`
- Eventos: `user.created`, `user.updated`, `user.deleted`
- Copiar o Signing Secret para `CLERK_WEBHOOK_SECRET` no `.env.local`

### Estrutura de arquivos relevante

```
app/
  (auth)/                    ← login e cadastro (Clerk)
  (dashboard)/
    layout.tsx               ← importa Shell (sidebar + header)
    dashboard/page.tsx       ← KPIs + pipeline + estoque crítico (dados reais)
    produtos/page.tsx        ← grid de produtos + CRUD completo
    clientes/page.tsx        ← kanban de clientes + CRUD completo
  api/
    produtos/                ← GET/POST, [id]: GET/PUT/DELETE, [id]/estoque: POST
    clientes/                ← GET/POST, [id]: GET/PATCH/PUT/DELETE
    upload/produtos/         ← upload de imagem para Supabase Storage
    webhooks/
      clerk/                 ← sincroniza usuários Clerk → Supabase
components/
  layout/                    ← Shell, Sidebar, Header
  produtos/                  ← CardProduto, ListaProdutos, SheetProduto, ModalProduto, tipos
  clientes/                  ← KanbanBoard, KanbanColuna, KanbanCard, SheetCliente, ModalCliente, BarraPesquisa, tipos
lib/
  supabase/
    server.ts                ← service role client (Server Components / API routes)
    client.ts                ← anon key + Clerk JWT (Client Components)
    types.ts                 ← tipos gerados do schema Supabase
  whatsapp/                  ← adaptadores (a criar): uazapi.ts, evolution.ts, meta.ts, index.ts
.claude/
  skills/                    ← 10+ skills customizadas do projeto
.mcp.json                    ← MCP Supabase (project-scoped)
```
