# Reativar Realtime do WhatsApp (Supabase ⇄ Browser ⇄ Clerk JWT)

### ⚠️ Próxima sessão — começar aqui

**Reativar Realtime do WhatsApp via Clerk JWT template**

Toda a documentação e o prompt pronto para iniciar a próxima sessão estão em **`instrucoes-realtime.md`** na raiz do projeto. Resumo:
- Corrigir o JWT template `supabase` no Clerk Dashboard para emitir `role: "authenticated"` (e `aud: "authenticated"`).
- Validar que o cliente do browser (`lib/supabase/client.ts` + `useSupabaseClient`) consegue ler `contatos_whatsapp` e `mensagens_whatsapp`.
- Reverter o polling da página WhatsApp e reintroduzir os canais `postgres_changes` (a publication Realtime já está habilitada via migration).
- Validar também as outras tabelas (`produtos`, `clientes_kanban`) caso futuramente sejam acessadas pelo browser.

> Documento de continuação. Última atualização: 2026-04-07.

## Contexto — por que estamos aqui

A página `app/(dashboard)/whatsapp/page.tsx` é, hoje, a **única** parte do sistema que tenta acessar o Supabase **direto do browser** usando o JWT emitido pelo Clerk (`useSupabaseClient()` em `lib/supabase/client.ts`). Produtos e Clientes acessam o Supabase via **server client com service role**, então essa rota nunca tinha sido validada antes.

Quando ligamos a página real, descobrimos:

- O banco tinha **22 mensagens e 2 contatos** da conexão `Ian` corretamente persistidos pelo Baileys.
- O `select` feito do browser via JWT do Clerk retornava **0 linhas**.
- O Supabase Realtime, via `postgres_changes`, também não entregava nenhum evento.
- A tela ficava eternamente em "Aguardando mensagens…".

**Causa raiz:** as policies das tabelas WhatsApp são `to authenticated using (true)`. O JWT que o Clerk emite no template `supabase` **não está marcando o claim `role` como `"authenticated"`**, então o Postgres trata a conexão como `anon` e a policy bloqueia tudo. O Realtime herda o mesmo bloqueio.

## O que já foi feito (não precisa refazer)

1. **Migration `20260407000002_whatsapp_realtime_publication.sql`** — adicionou `mensagens_whatsapp`, `contatos_whatsapp` e `conexoes_whatsapp` à publication `supabase_realtime` e setou `replica identity full`. Já aplicada no projeto remoto `atteroccvajbcwxsaoqp`.
2. **Refatoração da página WhatsApp** — UI redesenhada (2 colunas, dropdown de conexões, tema claro alinhado a Produtos/Clientes).
3. **Workaround** — toda leitura passou a ir por rotas server-side (service role) com **polling**:
   - `GET /api/whatsapp/contatos?conexao_id=...` → 5s
   - `GET /api/whatsapp/mensagens?contato_id=...&desde=ISO` → 3s (incremental)
   - `GET /api/whatsapp/conexoes` → 8s
   - Os canais `postgres_changes` e o `useSupabaseClient` foram removidos da página.

O sistema **funciona** assim. O objetivo da próxima sessão é trocar polling por Realtime de verdade, com latência sub-segundo.

## O que precisa ser feito manualmente no Clerk (você, antes do prompt)

> Tudo isso é no Clerk Dashboard, **não dá para fazer via código** — depende da configuração da instância.

1. Acesse o Clerk Dashboard → instância do Feirão Móveis → **JWT Templates**.
2. Abra o template chamado **`supabase`** (já existe, foi criado quando o projeto começou).
3. Confirme o algoritmo: **HS256** com o **JWT Secret do Supabase** (Settings → API → JWT Secret no Supabase Dashboard). Se estiver vazio ou diferente, cole o valor atual.
4. No campo **Claims**, garanta que o JSON contém **exatamente** estes campos no nível raiz:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated"
   }
   ```
   Se você quiser, pode adicionar outros claims (`email`, `user_id`, etc.), mas `aud` e `role` são obrigatórios e precisam ter o valor literal `"authenticated"`. **Sem isso, o Postgres não reconhece o usuário como `authenticated` e RLS bloqueia tudo.**
5. Salve o template.
6. **Faça logout e login novamente** no app local — o JWT é cacheado pelo Clerk; sem novo login, o app continua usando o token antigo sem o claim correto.

### Como validar manualmente (opcional, mas recomendado)

1. Abra o app autenticado, vá em qualquer página, abra DevTools → Console.
2. Cole:
   ```js
   await window.Clerk.session.getToken({ template: 'supabase' })
   ```
3. Pegue o token retornado e cole em https://jwt.io.
4. Confira que o payload contém `"role": "authenticated"` e `"aud": "authenticated"`.
5. Se sim, está pronto. Se não, volte ao passo 4 acima.

## Prompt para iniciar a próxima sessão

> Cole isso em uma nova conversa do Claude Code, **depois de já ter ajustado o JWT template do Clerk** conforme as instruções acima.

````
Já corrigi o JWT template `supabase` no Clerk Dashboard. Agora ele emite `role: "authenticated"` e `aud: "authenticated"` corretamente (validei em jwt.io).

Quero reativar o Supabase Realtime na página WhatsApp e remover o polling temporário. O contexto completo do bug e da arquitetura atual está em `instrucoes-realtime.md` — leia esse arquivo antes de começar.

Tarefas:

1. **Validação do JWT** — antes de mexer em qualquer código, valide via MCP do Supabase que um usuário autenticado consegue ler `contatos_whatsapp` e `mensagens_whatsapp` (use uma policy de teste ou rode o SQL como `set role authenticated` simulando o JWT — se não conseguir, me avise antes de seguir).

2. **Refatorar `app/(dashboard)/whatsapp/page.tsx`**:
   - Reintroduzir `useSupabaseClient()` de `@/lib/supabase/client`.
   - Carregamento inicial de contatos/mensagens: trocar os fetches para `/api/whatsapp/contatos` e `/api/whatsapp/mensagens` por queries diretas via `supabase.from(...)` (mais rápido, sem hop pelo server).
   - Reintroduzir os canais `postgres_changes` para:
     - INSERT em `mensagens_whatsapp` filtrado por `conexao_id` — atualiza cache de mensagens, última mensagem do contato, contador de não-lidos e move o contato para o topo da lista.
     - INSERT/UPDATE em `contatos_whatsapp` filtrado por `conexao_id`.
     - UPDATE em `conexoes_whatsapp` (global) — atualiza status e fecha modal QR quando ficar `conectado`.
   - **Remover** os 3 setIntervals de polling (5s contatos, 3s mensagens, 8s status). Manter apenas o polling de QR Code (`/api/whatsapp/status`), que é fallback do fluxo de conexão.
   - Manter o ref `contatoSelIdRef` para evitar stale closure no handler de mensagens (já existia antes).

3. **Decidir o destino das rotas API criadas** (`app/api/whatsapp/contatos` e `app/api/whatsapp/mensagens`):
   - Se a página não for mais usá-las, deletar os arquivos.
   - Se forem úteis para outros consumidores no futuro, deixar e documentar no CLAUDE.md.
   - **Pergunte antes** de deletar, caso eu queira manter.

4. **Validação manual no fim**:
   - Rodar `npm run type-check`.
   - Me dar instruções resumidas para eu testar (mandar mensagem do celular para o número conectado e ver se aparece em tempo real, sem refresh).

5. **Atualizar `CLAUDE.md`**:
   - Mudar o status da linha "WhatsApp — Realtime" de `⚠️ Polling temporário` para `✅ Funcional`.
   - Anotar na seção "O que foi feito na última sessão" o que mudou.
   - Remover a seção "Próxima sessão — começar aqui" sobre Realtime (ou substituir pelo próximo item de roadmap, se existir).

Importante: o arquivo `instrucoes-realtime.md` pode ser deletado no fim, depois que tudo estiver funcionando e o CLAUDE.md atualizado. Me confirme antes de deletar.
````

## Arquivos relevantes para essa correção

- `app/(dashboard)/whatsapp/page.tsx` — página a ser refatorada.
- `lib/supabase/client.ts` — hook `useSupabaseClient()` que monta o cliente do browser com o JWT do Clerk.
- `app/api/whatsapp/contatos/route.ts` e `app/api/whatsapp/mensagens/route.ts` — endpoints temporários, candidatos a remoção.
- `supabase/migrations/20260407000002_whatsapp_realtime_publication.sql` — já aplicada, não mexer.
- `supabase/migrations/20260401000005_tabelas_whatsapp.sql` — onde estão as policies `to authenticated using(true)`.

## Riscos e pontos de atenção

- **Outras tabelas** (`produtos`, `clientes_kanban`, etc.) hoje só são acessadas via server client. Quando o JWT do Clerk estiver corrigido, vale a pena migrar parte dessas leituras para o browser também — mas é um trabalho separado, não fazer junto.
- **Webhook do Clerk** continua adiado (configurar ao hospedar). Não tem relação com esse bug do JWT template — o template é independente do webhook.
- Se mesmo após corrigir o template o JWT continuar sendo rejeitado, a alternativa é trocar a estratégia para **Supabase Auth com terceiros via Clerk** (Third-Party Auth integration), que substitui o template manual. Isso muda a forma como o `lib/supabase/client.ts` autentica — só ir por esse caminho se o template HS256 não funcionar.
