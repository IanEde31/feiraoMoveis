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

# Ambientação IA (Gemini)
GOOGLE_AI_API_KEY=sua_chave_aqui
```

As variáveis específicas de cada provedor WhatsApp são armazenadas no banco de dados (configuração por instância), não como variáveis de ambiente estáticas, pois o usuário pode configurar múltiplas conexões.

---

## Estado do Desenvolvimento

**Última atualização:** 2026-04-08

### Situação Geral
MVP em andamento avançado. Dashboard, Produtos, Clientes, WhatsApp (chat + conexões via Baileys) e Ambientação IA funcionais. Ambientação integrada ao Supabase (Storage + tabela `ambientacoes`) com geração via Gemini. Real-time temporariamente substituído por polling — ver `instrucoes-realtime.md` para reativar via Supabase Realtime.

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
| WhatsApp — Baileys | ✅ Funcional | Conexões multi-instância via Baileys, recebimento de mensagens, envio, persistência em `mensagens_whatsapp`/`contatos_whatsapp` |
| WhatsApp — Tela de Chat | ✅ Funcional | Layout 2 colunas, dropdown de troca/criação de conexão, lista de conversas com últimas mensagens, chat com envio. Tema claro alinhado a Produtos/Clientes |
| WhatsApp — Realtime | ⚠️ Polling temporário | Substituído por polling (5s contatos / 3s mensagens / 8s status). Ver `instrucoes-realtime.md` para reativar Supabase Realtime |
| Ambientação IA | ✅ Integrada ao Supabase | Geração via Gemini (`gemini-2.0-flash-preview-image-generation`), Storage privado `ambientacoes`, rotas API server-side, galeria por cliente. Pendente: `GOOGLE_AI_API_KEY` real |

### O que foi feito na última sessão (2026-04-08)

**Ambientação IA — integração completa (remoção do localStorage + mock)**

1. **`lib/ambientacao/galeria.ts`** — implementação já estava correta (chama rotas API, nunca localStorage). Confirmado.
2. **`components/ambientacao/ambientacao-workspace.tsx`** — `gerar()` substituído: agora monta `FormData` e chama `POST /api/ambientacao/gerar` real. `galeria.salvar()` manual removido (responsabilidade da rota). `setResultado` atualizado com `item.resultado_url` e `item.criada_em` da resposta.
3. **`components/ambientacao/galeria-cliente.tsx`** — botão de download substituído de `<a download>` para `fetch → blob → createObjectURL` (compatível com signed URLs cross-origin do Supabase).
4. **`components/ambientacao/upload-ambiente.tsx`** — validação de tamanho >10MB adicionada com mensagem de erro inline (padrão do projeto).
5. **CLAUDE.md** — Variáveis de ambiente (`GOOGLE_AI_API_KEY`) e tabela de status atualizados.

**Pendências para uso real**
- Definir `GOOGLE_AI_API_KEY=<chave_real>` no `.env.local` e rodar checklist de aceitação (`ambientacao.md` seção 6).
- Rota agregada `GET /api/ambientacao/contagens` — eliminar loop N+1 de contagem por cliente no workspace.

### O que foi feito na sessão (2026-04-07)

**WhatsApp — refatoração completa da página + correção do bug "mensagens não aparecem"**

1. **Diagnóstico**: a página era a única usando o cliente Supabase do **browser** (`useSupabaseClient` + JWT do Clerk). Produtos e Clientes usam server client com service role, então o caminho RLS via JWT do Clerk nunca tinha sido validado. O JWT que o Clerk emite para o template `supabase` não está sendo aceito pelo Postgres como `role: authenticated`, então as policies `to authenticated using(true)` retornavam **0 linhas**. Como resultado, o banco tinha 22 mensagens e 2 contatos, mas a UI mostrava "Aguardando mensagens…". Pelo mesmo motivo, o Realtime via `postgres_changes` também não entregava eventos.

2. **Migration**: `20260407000002_whatsapp_realtime_publication.sql` — adiciona `mensagens_whatsapp`, `contatos_whatsapp` e `conexoes_whatsapp` à publication `supabase_realtime` e seta `replica identity full`. Necessária para quando o Realtime for reativado.

3. **Refatoração de UI** (`app/(dashboard)/whatsapp/page.tsx`):
   - Tema claro alinhado ao padrão do sistema (Produtos/Clientes) — `bg-white`, bordas `slate-200`, título `font-playfair`, acentos `amber-500`.
   - Layout reduzido de **3 colunas para 2**: removida a coluna lateral de Conexões.
   - **Dropdown de conexão** no topo da coluna de conversas (estilo "user switcher"): troca rápida entre números, mostra status com dot colorido, e item "+ Adicionar nova conexão" abre o modal de criação.
   - Botão "Conectar / Ver QR Code" aparece abaixo do dropdown quando a conexão selecionada está offline.

4. **Novas rotas API server-side** (service role, sem RLS):
   - `app/api/whatsapp/contatos/route.ts` — `GET ?conexao_id=...` retorna `{ contatos, ultimas }`.
   - `app/api/whatsapp/mensagens/route.ts` — `GET ?contato_id=...&desde=ISO` retorna mensagens (suporta polling incremental via `desde`).

5. **Página agora usa polling no lugar do Realtime do browser** (que está bloqueado por RLS+JWT):
   - 5s — recarrega lista de contatos / últimas mensagens.
   - 3s — busca mensagens novas da conversa aberta (incremental, só puxa o que é mais novo que a última `timestamp_whatsapp` em cache).
   - 8s — atualiza status das conexões.
   - Removido `useSupabaseClient` e os 2 canais Realtime do browser.

**Outras pendências**

- **Webhook do Clerk** (`/api/webhooks/clerk`) — configurar ao hospedar (Dashboard → Webhooks → Add Endpoint, eventos `user.created/updated/deleted`, copiar Signing Secret para `CLERK_WEBHOOK_SECRET`).
- **Adaptadores extras de WhatsApp** (uazapi, evolution, meta) — hoje só Baileys está implementado em `lib/whatsapp/baileys/`. Quando houver demanda, criar adaptadores adicionais seguindo a mesma interface.

### Estrutura de arquivos relevante

```
app/
  (auth)/                    ← login e cadastro (Clerk)
  (dashboard)/
    layout.tsx               ← importa Shell (sidebar + header)
    dashboard/page.tsx       ← KPIs + pipeline + estoque crítico (dados reais)
    produtos/page.tsx        ← grid de produtos + CRUD completo
    clientes/page.tsx        ← kanban de clientes + CRUD completo
    whatsapp/page.tsx        ← chat 2-colunas com dropdown de conexões (polling)
  api/
    produtos/                ← GET/POST, [id]: GET/PUT/DELETE, [id]/estoque: POST
    clientes/                ← GET/POST, [id]: GET/PATCH/PUT/DELETE
    upload/produtos/         ← upload de imagem para Supabase Storage
    whatsapp/
      conexoes/              ← GET lista / POST cria conexão Baileys
      conectar/              ← POST inicia instância e devolve QR
      status/                ← GET status/QR de uma conexão
      contatos/              ← GET ?conexao_id → { contatos, ultimas }   (server, service role)
      mensagens/             ← GET ?contato_id&desde → mensagens          (server, service role)
      enviar/                ← POST envia mensagem via Baileys
    webhooks/
      clerk/                 ← sincroniza usuários Clerk → Supabase
    ambientacao/
      gerar/                 ← POST multipart/form-data → upload + Gemini + insert Supabase
      galeria/               ← GET ?cliente_id → lista com signed URLs
      [id]/                  ← GET (detalhes) + DELETE (remove Storage + tabela)
components/
  layout/                    ← Shell, Sidebar, Header
  produtos/                  ← CardProduto, ListaProdutos, SheetProduto, ModalProduto, tipos
  clientes/                  ← KanbanBoard, KanbanColuna, KanbanCard, SheetCliente, ModalCliente, BarraPesquisa, tipos
  ambientacao/               ← AmbientacaoWorkspace, GaleriaCliente, UploadAmbiente, SeletorProdutos, SeletorCliente, PainelResultado, tipos
lib/
  supabase/
    server.ts                ← service role client (Server Components / API routes)
    client.ts                ← anon key + Clerk JWT (Client Components) — RLS bloqueado, ver instrucoes-realtime.md
    types.ts                 ← tipos gerados do schema Supabase
  whatsapp/
    baileys/                 ← connection.ts, events.ts, manager.ts (única implementação ativa hoje)
  ambientacao/
    galeria.ts               ← GaleriaStore interface + impl que chama as rotas API
    provider.ts              ← interface ProviderAmbientacao
    providers/gemini.ts      ← implementação Gemini 2.0 Flash image generation
.claude/
  skills/                    ← 10+ skills customizadas do projeto
.mcp.json                    ← MCP Supabase (project-scoped)
```
