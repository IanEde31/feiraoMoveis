# Plano 2026-04-09 — Hardening do Agente IA + Tela WhatsApp

## Contexto

A implementação inicial do agente IA WhatsApp (sessão 2026-04-08) está parcialmente funcional: recebe mensagem, chama Gemini, envia resposta, persiste no Supabase, aparece na UI em tempo (quase) real. Mas ficou cheia de gambiarras, mocks e pontos frágeis. Antes de qualquer coisa "ir pra produção", esta lista precisa ser zerada.

Este plano cobre **dois escopos**:
- `lib/whatsapp/agente/` — o agente em si
- `app/(dashboard)/whatsapp/page.tsx` + componentes — a tela de chat

E também algumas correções de infra que ficaram pendentes.

---

## Bloco A — Agente IA (`lib/whatsapp/agente/index.ts`)

### A.1 — Retry com backoff em chamadas Gemini  **[crítico]**
Hoje qualquer 503/429 do Gemini perde a resposta silenciosamente (vai pro `catch`, log no console, e o cliente fica sem resposta). Precisa:
- 3 tentativas com backoff exponencial: 1s → 2s → 4s
- Só retry para erros transitórios (503, 429, network); 400/401/404 falha imediato
- Fallback opcional para outro modelo (`gemini-2.5-flash` → `gemini-2.0-flash-001`) na última tentativa

### A.2 — Configuração persistida por conexão  **[crítico]**
Hoje está tudo hardcoded no arquivo: modelo, system prompt, delay, temperatura, palavras-chave. Mover pra banco:
- Migration nova: adicionar em `conexoes_whatsapp` as colunas `agente_modelo text`, `agente_system_prompt text`, `agente_delay_ms int default 3000`, `agente_temperatura numeric default 0.7`
- UI de edição (modal de configuração na linha da conexão, ou aba dentro do dropdown)
- Defaults sensatos quando coluna for null

### A.3 — Indicador "digitando…"  **[médio]**
Durante o delay de 3s, usar `sock.sendPresenceUpdate('composing', jid)` antes do `setTimeout` e `'paused'` logo antes do `sendMessage`. Sensação muito mais natural do lado do cliente.

### A.4 — Anti-rajada / debounce  **[médio]**
Se chegarem 3 mensagens em 5s do mesmo contato, agrupar e responder uma vez só (esperar estabilizar antes de chamar Gemini). Hoje cada mensagem dispara uma resposta — gera conversas estranhas quando o cliente manda 4 frases seguidas.

### A.5 — Logging estruturado  **[alto]**
Criar tabela `logs_agente`:
- `id`, `mensagem_origem_id`, `conexao_id`, `contato_id`
- `modelo`, `tokens_in`, `tokens_out`, `latencia_ms`
- `usou_link_ar bool`, `erro text`, `created_at`

Permite analisar custo, qualidade, taxa de erro e tempo de resposta. Sem isso, é cego.

### A.6 — Function calling do Gemini (eliminar token sentinela)  **[médio]**
Hoje uso `LINK_AR` como token mágico no prompt + heurística por palavra-chave como fallback. É frágil. Substituir por uma tool declarada via Gemini Functions:
```ts
{ name: 'enviar_link_ar', description: '...', parameters: { produto?: string } }
```
Mais robusto, e abre porta pra outras tools (consultar estoque, agendar visita).

### A.7 — Respeitar `nao_perturbar` do contato  **[rápido]**
A coluna já existe em `contatos_whatsapp`. Adicionar check no início do `responderComAgente`.

### A.8 — Opt-out por palavra-chave  **[rápido]**
Se o usuário escrever `parar`, `humano`, `atendente`, setar `contato.agente_ativo = false` e mandar uma mensagem fixa de transição ("vou chamar um consultor humano"). UX básica de bot.

### A.9 — Memória de conversa mais inteligente  **[baixo]**
Hoje pega últimas 10 mensagens cruas. Para conversas longas (>30 msgs), gerar resumo periódico via Gemini e usar `resumo + últimas N` como contexto. Reduz tokens e melhora coerência.

### A.10 — Não rodar dentro do `messages.upsert` handler  **[alto]**
Hoje o agente bloqueia o handler do Baileys por 3s + latência Gemini. Se chegarem várias mensagens em paralelo, vira gargalo. Extrair pra fila:
- **Opção rápida**: in-memory queue (Map de promises) por contato
- **Opção robusta**: tabela `agente_pendente` com worker rodando a cada 1s

### A.11 — Suporte a mídias recebidas  **[baixo]**
Hoje o agente ignora mensagens não-texto. Detectar imagem/áudio/documento e responder algo apropriado ("recebi sua imagem, vou olhar e te respondo já").

---

## Bloco B — Tela WhatsApp (`app/(dashboard)/whatsapp/page.tsx`)

### B.1 — REMOVER mocks  **[crítico]**
Hoje a página tem:
- `metaPorContato` — gerado via hash do id do contato (prioridade, status, tags fake)
- `AGENTES_MOCK` — lista hardcoded de atendentes
- `RESPOSTAS_RAPIDAS_MOCK` — array fixo de templates

Tudo isso aparece na UI como se fosse real. Criar tabelas:
- `conversas_meta` — `contato_id`, `agente_id`, `prioridade`, `status` (aberto/resolvido), `tags jsonb`, `notas text`
- `respostas_rapidas` — `id`, `titulo`, `texto`, `conexao_id`, `criada_por`
- (Reaproveitar `usuarios` existente para atendentes; só falta endpoint pra listar)

### B.2 — Persistir features mockadas  **[crítico — depende de B.1]**
- "Atribuir / Transferir" → grava `conversas_meta.agente_id`
- "Resolver" → grava `status = 'resolvido'`
- Tags / Notas → CRUD real
- Respostas rápidas → CRUD na tabela nova
- Endpoints novos em `app/api/whatsapp/conversas-meta/` e `app/api/whatsapp/respostas-rapidas/`

### B.3 — Indicador visual de mensagem enviada pela IA  **[rápido]**
Adicionar coluna `enviado_pela_ia bool` em `mensagens_whatsapp` (default false). Agente seta true ao persistir. Bolha do chat ganha badge "🤖 IA" / borda dourada / qualquer marcador discreto.

### B.4 — Reativar Realtime  **[alto]**
Polling atual (5s contatos / 3s mensagens / 8s status) gera carga e tem latência ruim. Seguir `instrucoes-realtime.md` que está pendente. Bloqueador conhecido: JWT do Clerk não é aceito como `role: authenticated` pelo Postgres → policies retornam zero linhas. Alternativa: fazer subscribe via cliente server-side num endpoint SSE/WebSocket próprio.

### B.5 — Auto-reconnect Baileys após restart  **[alto]**
Hoje, depois de cada `npm run dev`, o usuário precisa clicar "Conectar" manualmente. Tentei `instrumentation.ts` e quebrou webpack (baileys + jimp/sharp não são bundláveis). Opções:
- **A**: rota cron interna (vercel/cron ou node-cron) que reconcilia sockets faltantes a cada 1min
- **B**: middleware leve que ao primeiro request de `/whatsapp` chama `/api/whatsapp/conectar` para conexões marcadas `conectado` mas sem socket vivo
- **C** ⭐: script Node separado fora do Next.js, mantém os sockets vivos e o Next só lê do Supabase. Arquitetura mais saudável a médio prazo. **Recomendado.**

### B.6 — Toggle do agente mais visível  **[rápido]**
Hoje é uma checkbox + select escondidos numa barra superior fina. Mover o toggle por-conversa pro `CabecalhoChat`, com badge dourado quando ativo. Toggle global da conexão pode ficar onde está.

### B.7 — Notificações de erro do agente na UI  **[médio]**
Quando `responderComAgente` falha (Gemini 503, network, etc), só vai pro console. Adicionar:
- Toast/banner na UI quando uma falha for detectada (via tabela `logs_agente` da A.5)
- Badge na conversa: "última tentativa de IA falhou às HH:MM"

### B.8 — Type assertions `as never`  **[rápido]**
Espalhadas em vários lugares (`enviar/route.ts`, `conexoes/route.ts`, `events.ts`). Substituir pelos tipos corretos do Supabase. Investigar por que o tipo gerado não bate (provavelmente RLS + colunas opcionais).

---

## Bloco C — Infra / correções menores

### C.1 — Casing de arquivos
Erros pré-existentes de TS1261 (`shell.tsx` vs `Shell.tsx`, `sidebar.tsx` vs `Sidebar.tsx`, `header.tsx` vs `Header.tsx`). Corrigir num commit isolado com `git mv`.

### C.2 — Revisar e seguir `instrucoes-realtime.md`
Pré-requisito do B.4.

### C.3 — Atualizar `CLAUDE.md`
Estado do Desenvolvimento da sessão de 2026-04-08 (agente IA implementado, persistência manual, bugs de timestamp resolvidos).

### C.4 — Variável `GOOGLE_AI_API_KEY` no `.env.local`
Confirmar que está setada e válida (a key atual está dando 503 com frequência — possivelmente quota free tier).

---

## Ordem de execução sugerida

1. **C.1** (casing) — rápido, desbloqueia type-check limpo
2. **A.7 + A.8** (nao_perturbar + opt-out) — quick wins de ~30min cada
3. **A.1** (retry com backoff) — tira o agente da lista de "frágil"
4. **A.2** (config persistida) — destrava todo o resto do bloco A
5. **B.1 + B.2** (eliminar mocks e persistir features da tela)
6. **B.3** (badge IA) — depende de migration, fácil
7. **A.3** (typing indicator) + **A.5** (logs estruturados)
8. **B.7** (notificações de erro) — depende de A.5
9. **A.4** (debounce) + **A.10** (queue)
10. **B.4** (reativar Realtime) — elimina os 3 polls
11. **B.5** (auto-reconnect) — investigar opção C com calma
12. **A.6** (function calling) + **A.9** (memória) + **A.11** (mídias) — refinos finais
13. **B.8** (limpar `as never`) + **B.6** (mover toggle) — polish

---

## Checklist de "pronto para produção"

- [ ] Zero mocks na UI
- [ ] Zero hardcoded no agente (tudo configurável por conexão)
- [ ] Retry + logging cobrindo 100% das chamadas Gemini
- [ ] Realtime ativo (polling removido)
- [ ] Auto-reconnect funcionando após restart
- [ ] Type-check limpo, sem `as never` espalhado
- [ ] Tabela `logs_agente` populada com dados reais de uma semana
- [ ] Documentação em `CLAUDE.md` reflete o estado real
