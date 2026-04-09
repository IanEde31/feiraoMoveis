# Integração da Ambientação IA com o Banco de Dados

Roadmap para tirar a feature de **Ambientação IA** do estado atual (UI funcional + galeria em `localStorage` + geração mockada) e levar para 100% integrada com Supabase + API real de geração.

> **Estado atual:** UI completa (`app/(dashboard)/ambientacao/page.tsx`, `components/ambientacao/*`), galeria persistida em `localStorage` via `lib/ambientacao/galeria.ts`, geração simulada (`gerar()` retorna a própria foto enviada após 2s).
>
> **Objetivo final:** ambiente original e imagem gerada salvos em Supabase Storage, metadados em tabela `ambientacoes`, vinculados ao cliente, com listagem/remoção via API routes seguindo o padrão do projeto (service role no servidor).

---

## 1. Banco de dados

### 1.1. Migration — `supabase/migrations/<timestamp>_tabelas_ambientacao.sql`

Criar via skill `/nova-migration`. Conteúdo esperado:

```sql
-- Tabela principal: cada linha é uma ambientação gerada para um cliente
create table public.ambientacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,

  -- Imagens (paths dentro do bucket `ambientacoes`)
  ambiente_path text not null,           -- foto original enviada pelo vendedor
  resultado_path text not null,          -- imagem gerada pela IA
  miniatura_path text,                   -- thumbnail opcional (gerar no upload)

  -- Contexto da geração
  produtos_ids uuid[] not null default '{}',
  produtos_snapshot jsonb not null default '[]'::jsonb,
  -- ^ snapshot leve: [{ id, nome, preco_venda, imagem }] — preserva nomes
  --   mesmo se o produto for editado/deletado depois.

  provedor text,                         -- 'openai' | 'replicate' | etc.
  modelo text,                           -- ex.: 'gpt-image-1'
  prompt text,                           -- prompt usado, se aplicável
  metadata jsonb default '{}'::jsonb,    -- payload extra do provedor

  status text not null default 'pronto'
    check (status in ('processando', 'pronto', 'erro')),
  mensagem_erro text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ambientacoes_cliente_id_idx
  on public.ambientacoes (cliente_id, created_at desc);

create index ambientacoes_usuario_id_idx
  on public.ambientacoes (usuario_id);

-- Trigger updated_at (reusar função criada em 20260401000001_funcoes_utilitarias.sql)
create trigger ambientacoes_set_updated_at
  before update on public.ambientacoes
  for each row execute function public.set_updated_at();

-- RLS — alinhar com o que clientes/produtos já usam
alter table public.ambientacoes enable row level security;

create policy "leitura autenticada"
  on public.ambientacoes for select
  to authenticated using (true);

create policy "insert autenticada"
  on public.ambientacoes for insert
  to authenticated with check (true);

create policy "update autenticada"
  on public.ambientacoes for update
  to authenticated using (true);

create policy "delete autenticada"
  on public.ambientacoes for delete
  to authenticated using (true);
```

### 1.2. Bucket de Storage

Criar bucket **`ambientacoes`** no painel do Supabase (ou via MCP):

- **Visibilidade:** privado (usar URLs assinadas — vendedor pode estar mostrando dado de cliente).
- **Estrutura de paths:**
  ```
  ambientacoes/{cliente_id}/{ambientacao_id}/ambiente.jpg
  ambientacoes/{cliente_id}/{ambientacao_id}/resultado.png
  ambientacoes/{cliente_id}/{ambientacao_id}/miniatura.jpg
  ```
- **Policies:** apenas service role escreve. Leitura sempre via signed URL gerada no servidor (não expor anon).

### 1.3. Regenerar tipos

Após aplicar a migration:

```bash
# Skill /gerar-tipos — atualiza lib/supabase/types.ts
```

---

## 2. Camada de domínio — `lib/ambientacao/`

### 2.1. Substituir `lib/ambientacao/galeria.ts`

Trocar a impl `galeriaLocal` por `galeriaSupabase` (mesma interface `GaleriaStore` — nenhum componente muda):

```ts
// lib/ambientacao/galeria.ts
import type { ItemGaleria } from '@/components/ambientacao/tipos'

export interface GaleriaStore {
  listar(clienteId: string): Promise<ItemGaleria[]>
  salvar(item: Omit<ItemGaleria, 'id' | 'criada_em'>): Promise<ItemGaleria>
  remover(id: string): Promise<void>
}

// Impl client-side: chama as API routes (não acessa Supabase direto)
export const galeria: GaleriaStore = {
  async listar(clienteId) {
    const res = await fetch(`/api/ambientacao/galeria?cliente_id=${clienteId}`)
    if (!res.ok) throw new Error('Falha ao listar galeria')
    const { itens } = await res.json()
    return itens
  },
  async salvar() {
    throw new Error('Use POST /api/ambientacao/gerar para criar uma ambientação')
  },
  async remover(id) {
    const res = await fetch(`/api/ambientacao/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Falha ao remover')
  },
}
```

> **Importante:** o `salvar()` deixa de existir como operação solta — agora tudo passa pela rota `/api/ambientacao/gerar`, que faz upload + chamada à IA + insert atômico.

### 2.2. Criar `lib/ambientacao/provider.ts`

Abstração do provedor de IA (mesmo padrão de `lib/whatsapp/`):

```ts
// lib/ambientacao/provider.ts
export interface ProviderAmbientacao {
  gerar(input: {
    ambienteBuffer: Buffer
    ambienteMime: string
    produtos: Array<{ id: string; nome: string; imagem?: string | null }>
    prompt?: string
  }): Promise<{ imagemBuffer: Buffer; mime: string; metadata?: Record<string, unknown> }>
}

// Implementações possíveis:
// - lib/ambientacao/providers/openai.ts        (gpt-image-1 / DALL-E edit)
// - lib/ambientacao/providers/replicate.ts     (modelos de inpainting / SDXL)
// - lib/ambientacao/providers/decor8.ts        (API especializada em decoração)
// index.ts faz a factory baseada em env: AMBIENTACAO_PROVIDER=openai|replicate|...
```

**Decisão pendente:** qual provedor usar. Sugestões a avaliar:
- **OpenAI `gpt-image-1`** — bom para edição com máscara, fácil de plugar.
- **Replicate (SDXL inpainting / Flux)** — mais barato, mais controle.
- **Decor8 / Collov / Reroom AI** — APIs especializadas em decoração de interiores, retornam resultados mais realistas para móveis.

---

## 3. API Routes — `app/api/ambientacao/`

Seguir o padrão de `app/api/produtos/` e `app/api/clientes/` (service role via `createServerClient`, validação Zod, erros padronizados). Usar a skill `/nova-rota-api`.

### 3.1. `POST /api/ambientacao/gerar`

**Recebe:** `multipart/form-data` com `cliente_id`, `ambiente` (File), `produtos[]` (string[]).

**Fluxo:**
1. Validar com Zod (cliente existe? produtos existem e estão ativos?).
2. Gerar `ambientacao_id` (uuid) antecipadamente.
3. Upload do ambiente original para `ambientacoes/{cliente_id}/{ambientacao_id}/ambiente.jpg`.
4. Buscar dados dos produtos (nome, imagem principal, preço) — montar `produtos_snapshot`.
5. Chamar `provider.gerar({ ambienteBuffer, produtos })`.
6. Upload do resultado para `ambientacoes/{cliente_id}/{ambientacao_id}/resultado.png`.
7. (Opcional) gerar miniatura com `sharp` (resize 400px) → `miniatura.jpg`.
8. `insert` na tabela `ambientacoes` com todos os paths.
9. Gerar signed URLs (validade ~1h) e devolver ao cliente:
   ```json
   {
     "id": "...",
     "ambiente_url": "https://...signed",
     "resultado_url": "https://...signed",
     "miniatura_url": "https://...signed",
     "produtos_nomes": ["Sofá Velvet", "Mesa Lateral"],
     "criada_em": "2026-04-08T..."
   }
   ```

**Tratamento de erro:** se a chamada à IA falhar, salvar linha com `status='erro'` + `mensagem_erro` para o vendedor ver no histórico (ajuda a diagnosticar).

### 3.2. `GET /api/ambientacao/galeria?cliente_id=...`

- Lista `ambientacoes` do cliente, ordenadas `created_at desc`.
- Para cada item, gera signed URLs (miniatura + resultado).
- Retorna `{ itens: ItemGaleria[] }`.
- **Cache:** considerar `Cache-Control: private, max-age=60` para evitar regerar signed URLs a cada navegação.

### 3.3. `DELETE /api/ambientacao/[id]`

1. Buscar a linha (precisa dos paths).
2. Deletar os 3 objetos do Storage (`ambiente`, `resultado`, `miniatura`).
3. Deletar a linha da tabela.
4. Retornar `204`.

### 3.4. (Opcional) `GET /api/ambientacao/[id]`

Retorna detalhes de uma ambientação específica — útil quando o vendedor compartilhar um link direto no futuro.

---

## 4. Ajustes nos componentes

A interface dos componentes **não muda** — só a origem dos dados. Os pontos a tocar:

### 4.1. `components/ambientacao/ambientacao-workspace.tsx`

- **Remover** a lógica de salvar manualmente após `gerar()` (passa a ser responsabilidade da rota).
- **`gerar()`** vira:
  ```ts
  const fd = new FormData()
  fd.append('cliente_id', clienteAtivo.id)
  fd.append('ambiente', ambiente.arquivo)
  selecionados.forEach((p) => fd.append('produtos[]', p.id))

  const res = await fetch('/api/ambientacao/gerar', { method: 'POST', body: fd })
  if (!res.ok) throw new Error((await res.json()).error)
  const item = await res.json()

  setResultado({ url: item.resultado_url, geradaEm: item.criada_em })
  setEstado('pronto')
  await recarregarGaleria(clienteAtivo.id)
  ```
- **Remover** `CHAVE_CLIENTE_ATIVO` do `localStorage`? Pode manter — é UX legítima de "lembrar último cliente". Não tem nada a ver com persistência de dados.
- **Contagens por cliente** (`contagemPorCliente`): hoje busca uma a uma. Trocar por uma rota agregada `GET /api/ambientacao/contagens` que retorna `{ [cliente_id]: number }` em uma única query.

### 4.2. `components/ambientacao/galeria-cliente.tsx`

- O `download` direto via `<a href={item.resultado_url} download>` só funciona com URLs same-origin. Como signed URLs do Supabase são cross-origin, trocar para um handler que faz `fetch` + `blob` + `URL.createObjectURL`.

### 4.3. `components/ambientacao/upload-ambiente.tsx`

- Adicionar validação de tamanho (atualmente não tem): rejeitar `> 10 MB` com toast.
- Considerar comprimir client-side (ex.: `browser-image-compression`) antes do upload — economiza banda e API calls.

---

## 5. Variáveis de ambiente

Adicionar em `.env.local` e documentar no README:

```
# Provedor de ambientação IA (escolher um)
AMBIENTACAO_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Ou Replicate
# AMBIENTACAO_PROVIDER=replicate
# REPLICATE_API_TOKEN=...
```

Atualizar `CLAUDE.md` (seção "Variáveis de Ambiente").

---

## 6. Testes manuais (checklist de aceitação)

- [ ] Selecionar cliente A → enviar foto → escolher 2 produtos → gerar → resultado aparece.
- [ ] Recarregar página → galeria do cliente A continua lá.
- [ ] Trocar para cliente B → galeria muda → gerar nova → galeria de B recebe a nova; A continua intacta.
- [ ] Badge de contagem no popover bate com a galeria.
- [ ] Remover item → some da galeria E do Storage (verificar pelo painel Supabase).
- [ ] Deletar cliente → ambientações são removidas em cascata (`on delete cascade`).
- [ ] Editar nome de produto após geração → galeria continua mostrando o nome **antigo** (snapshot).
- [ ] Forçar erro do provedor → linha fica com `status='erro'`, mensagem aparece no painel de resultado.
- [ ] Signed URLs expiram após 1h e são regeradas no próximo `GET /galeria`.
- [ ] Tentar acessar bucket direto sem signed URL → bloqueado (privado).

---

## 7. Ordem sugerida de execução

1. **Decidir provedor de IA** (item bloqueador — define o resto).
2. Criar migration + bucket + regenerar tipos. *(skills `/nova-migration` e `/gerar-tipos`)*
3. Implementar `lib/ambientacao/provider.ts` + provider escolhido. Testar isolado num script.
4. Criar `POST /api/ambientacao/gerar` (sem provider real ainda — devolver a foto enviada como mock).
5. Criar `GET /api/ambientacao/galeria` e `DELETE /api/ambientacao/[id]`.
6. Trocar `lib/ambientacao/galeria.ts` para a impl que chama as rotas.
7. Ajustar `gerar()` no workspace + remover save manual.
8. Plugar o provider real no `POST /gerar`.
9. Rodar checklist de aceitação.
10. Atualizar `CLAUDE.md` (seção "Estado do Desenvolvimento") e remover este `ambientacao.md` (ou movê-lo para `docs/`).

---

## 8. Considerações futuras (fora do escopo desta integração)

- **Histórico de gerações por produto** — saber em quantas ambientações um produto apareceu (cross-sell insight).
- **Compartilhar via WhatsApp** — botão direto no item da galeria que envia pelo Baileys para o telefone do cliente.
- **Versões/variações** — gerar 3 opções por vez e deixar o vendedor escolher.
- **Anotações** — vendedor escreve uma observação por ambientação ("cliente preferiu o sofá cinza").
- **Limite de quota por usuário/mês** — geração de imagem é cara; controlar custos.
