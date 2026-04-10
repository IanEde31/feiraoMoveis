# Plano AR — Quinta-feira 09/04

## Contexto
Hoje (08/04) foi criado o protótipo da página `/ar` com `<model-viewer>` carregando um GLB hardcoded do bucket `3dmodels` do Supabase. Próximo passo: transformar o protótipo em uma feature real, conectada ao catálogo de produtos, permitindo que o cliente/vendedor selecione qualquer produto que tenha modelo 3D disponível e visualize em AR.

## Objetivo principal
Permitir selecionar, dentre os produtos cadastrados, aqueles que possuem modelo 3D (`.glb`) e abrir a visualização AR para qualquer um deles.

---

## Etapa 1 — Banco de dados

### 1.1 Migration: adicionar coluna `modelo_3d_path` em `produtos`
Arquivo: `supabase/migrations/<timestamp>_produtos_modelo_3d.sql`

```sql
alter table produtos
  add column if not exists modelo_3d_path text,
  add column if not exists modelo_3d_ios_path text; -- USDZ opcional p/ iOS Quick Look

comment on column produtos.modelo_3d_path is 'Path no bucket 3dmodels (.glb). Null = sem AR.';
comment on column produtos.modelo_3d_ios_path is 'Path opcional .usdz para AR no iOS.';

create index if not exists idx_produtos_com_modelo_3d
  on produtos ((modelo_3d_path is not null))
  where modelo_3d_path is not null;
```

### 1.2 Bucket `3dmodels`
- Já existe. Confirmar policies: leitura via signed URL gerada no servidor (mesmo padrão do bucket `ambientacoes`).
- Definir limite de tamanho razoável (ex.: 25MB) e MIME types `model/gltf-binary`, `model/vnd.usdz+zip`.

### 1.3 Regenerar tipos
Rodar a skill `/gerar-tipos` para atualizar `lib/supabase/types.ts`.

---

## Etapa 2 — Backend (rotas API)

### 2.1 `app/api/produtos/[id]/modelo-3d/route.ts` (novo)
- `POST` (multipart): faz upload de `.glb` (e opcionalmente `.usdz`) ao bucket `3dmodels`, salva path em `produtos.modelo_3d_path`. Service role.
- `DELETE`: remove o arquivo do Storage e zera a coluna.

### 2.2 `app/api/ar/[produtoId]/route.ts` (novo)
- `GET`: retorna `{ produto, signedUrl, signedUrlIos }` — gera signed URL (validade 1h) para o GLB/USDZ. 404 se produto não tem modelo.

### 2.3 Estender `app/api/produtos/route.ts`
- Aceitar query `?com_modelo_3d=true` para filtrar apenas produtos com `modelo_3d_path is not null` (usado pela tela de seleção AR).

---

## Etapa 3 — Frontend

### 3.1 Refatorar `components/ar/ar-viewer.tsx`
- Receber props `src`, `iosSrc`, `alt` em vez de URL hardcoded.
- Adicionar prop `iosSrc` no `<model-viewer ios-src={iosSrc}>` para Quick Look no iOS.
- Estados de loading e erro (skeleton enquanto o GLB carrega; toast de erro se falhar).
- Botão "Compartilhar link AR" (copia URL `/ar/[id]` para clipboard) — útil pro vendedor mandar pelo WhatsApp.

### 3.2 Nova rota dinâmica `app/(dashboard)/ar/[produtoId]/page.tsx`
- Server Component: busca produto via API `/api/ar/[id]`, passa signed URLs ao `ArViewer`.
- Mostra nome, preço e descrição do produto ao lado/abaixo do viewer.

### 3.3 Tela de listagem `app/(dashboard)/ar/page.tsx` (refatorar)
- Substituir o viewer hardcoded por uma **galeria de produtos com modelo 3D**.
- Reusar `CardProduto` (`components/produtos/`) com badge "AR disponível".
- Busca + filtro por categoria (reusar `BarraPesquisa` se aplicável).
- Click no card → navega para `/ar/[produtoId]`.
- Empty state quando nenhum produto tem modelo 3D ainda, com CTA "Adicionar modelo 3D" levando para a tela de Produtos.

### 3.4 Integrar upload no CRUD de Produtos
- Em `components/produtos/SheetProduto.tsx`, adicionar campo "Modelo 3D (.glb)" com drag & drop (reusar padrão do upload de imagem).
- Indicador visual no `CardProduto` quando o produto tem modelo (ícone `Box` dourado).

### 3.5 Atalho na tela do Produto
- No `ModalProduto`, se `modelo_3d_path` existir, exibir botão "Ver em AR" que abre `/ar/[id]` em nova aba.

---

## Etapa 4 — Compartilhamento e mobile

### 4.1 Página pública `/ar-publico/[token]` (opcional, fase 2)
- Permitir gerar um link público temporário (signed token) para mandar ao cliente final via WhatsApp sem exigir login.
- Reusar a tabela existente ou criar `ar_compartilhamentos` com `produto_id`, `token`, `expira_em`.
- Botão "Gerar link para cliente" no `ArViewer` — copia link público.

### 4.2 Integração com WhatsApp
- No chat de WhatsApp, ao enviar mensagem sobre um produto que tem AR, oferecer botão "Enviar link AR" que insere a URL pública na mensagem.

### 4.3 PWA / fullscreen mobile
- Garantir que `/ar/[id]` em mobile use praticamente toda a viewport (já está em `70vh`, talvez subir para `85vh` no mobile).
- Testar com `viewport-fit=cover` no metadata.

---

## Etapa 5 — Qualidade e melhorias técnicas

- **Loading do model-viewer**: hoje o script é injetado no `useEffect`. Migrar para `next/script` com `strategy="lazyOnload"` para SSR-friendly.
- **Pré-aquecer câmera**: usar atributos `loading="eager"` e `reveal="auto"` no `<model-viewer>`.
- **Poster**: gerar um poster (PNG) do modelo automaticamente após upload (via `model-viewer` headless ou screenshot do `<canvas>`) e armazenar em `modelo_3d_poster_path`. Mostrar antes do GLB carregar.
- **Analytics**: contar quantas vezes cada produto foi visualizado em AR (tabela `ar_visualizacoes` ou coluna `views_ar` em produtos).
- **Acessibilidade**: alt text dinâmico baseado no nome do produto.
- **Validação iOS**: documentar fluxo USDZ — provavelmente vamos adiar até ter um produto piloto.

---

## Ordem sugerida para amanhã

1. ✅ Migration `produtos_modelo_3d` + regenerar tipos  *(15 min)*
2. ✅ Rota `POST /api/produtos/[id]/modelo-3d` + integração no `SheetProduto`  *(45 min)*
3. ✅ Rota `GET /api/ar/[produtoId]` com signed URL  *(20 min)*
4. ✅ Refatorar `ArViewer` aceitando props  *(15 min)*
5. ✅ Página `/ar/[produtoId]`  *(20 min)*
6. ✅ Refatorar `/ar` para galeria de produtos com modelo 3D  *(40 min)*
7. ✅ Badge "AR disponível" em `CardProduto` + botão "Ver em AR" no `ModalProduto`  *(20 min)*
8. ⏭️ Subir 1–2 GLBs reais via UI e validar fluxo end-to-end no celular
9. ⏭️ (Se sobrar tempo) Compartilhamento público fase 2

---

## Arquivos que serão tocados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<ts>_produtos_modelo_3d.sql` | criar |
| `lib/supabase/types.ts` | regenerar |
| `app/api/produtos/[id]/modelo-3d/route.ts` | criar |
| `app/api/ar/[produtoId]/route.ts` | criar |
| `app/api/produtos/route.ts` | estender (filtro `com_modelo_3d`) |
| `app/(dashboard)/ar/page.tsx` | refatorar (galeria) |
| `app/(dashboard)/ar/[produtoId]/page.tsx` | criar |
| `components/ar/ar-viewer.tsx` | refatorar (props) |
| `components/produtos/SheetProduto.tsx` | adicionar upload GLB |
| `components/produtos/CardProduto.tsx` | badge AR |
| `components/produtos/ModalProduto.tsx` | botão "Ver em AR" |

---

## Verificação ao final
- Cadastrar produto novo com GLB pelo `SheetProduto` → arquivo aparece no bucket `3dmodels` e `modelo_3d_path` populado.
- `/ar` lista o produto com badge.
- `/ar/[id]` abre o viewer correto.
- No celular Android, "Ver no seu ambiente" abre o Scene Viewer com o produto certo.
- `npm run type-check` e `npm run lint` limpos.
