# Rotas API — Ambientação IA

Criadas na sessão de 2026-04-08. Backend completo e testável via curl/Thunder Client.

## Rotas criadas

| Arquivo | Rota | Método | Status |
|---------|------|--------|--------|
| `app/api/ambientacao/gerar/route.ts` | `/api/ambientacao/gerar` | POST | ✅ Criada |
| `app/api/ambientacao/galeria/route.ts` | `/api/ambientacao/galeria?cliente_id=` | GET | ✅ Criada |
| `app/api/ambientacao/[id]/route.ts` | `/api/ambientacao/[id]` | DELETE | ✅ Criada |
| `app/api/ambientacao/[id]/route.ts` | `/api/ambientacao/[id]` | GET | ✅ Criada |

## Libs criadas

| Arquivo | Descrição |
|---------|-----------|
| `lib/ambientacao/provider.ts` | Interface `ProviderAmbientacao` |
| `lib/ambientacao/providers/gemini.ts` | Implementação com `gemini-2.0-flash-preview-image-generation` |
| `lib/ambientacao/galeria.ts` | Substituído localStorage → chamadas às rotas API |

## Dependências instaladas
- `@google/genai` — SDK Gemini
- `zod` — validação

## Bucket Supabase
- `ambientacoes` — privado, já existe
- Paths: `{cliente_id}/{ambientacao_id}/ambiente.jpg` e `resultado.png`

## Variável de ambiente pendente
```
GOOGLE_AI_API_KEY=sua_chave_aqui   # .env.local — linha já adicionada, só falta o valor real
```

## Próximos passos (continuação do ambientacao.md seção 7)

- [ ] Atualizar `gerar()` em `components/ambientacao/ambientacao-workspace.tsx`:
  - Remover mock (setTimeout + `galeria.salvar`)
  - Substituir por `FormData` → `POST /api/ambientacao/gerar`
  - Atualizar `setResultado` com `item.resultado_url`
  - Chamar `recarregarGaleria(clienteAtivo.id)` após sucesso

- [ ] `components/ambientacao/galeria-cliente.tsx`: trocar `<a download>` por fetch+blob (signed URLs são cross-origin)

- [ ] `components/ambientacao/upload-ambiente.tsx`: validação de tamanho > 10 MB com toast

- [ ] Rota agregada `GET /api/ambientacao/contagens` — substituir o loop N+1 de contagem por cliente

- [ ] Rodar checklist de aceitação (`ambientacao.md` seção 6) com `GOOGLE_AI_API_KEY` válida
