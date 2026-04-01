# Schema do Banco de Dados — Feirão Móveis

## Visão Geral

```
usuarios              ← espelho do Clerk (populado via webhook)
│
├── produtos          ← catálogo com estoque
│   ├── categorias_produto
│   └── movimentos_estoque   ← auditoria imutável
│
├── clientes          ← funil de vendas (Kanban)
│   ├── estagios_kanban      ← estágios configuráveis
│   ├── historico_kanban     ← auditoria imutável de movimentações
│   ├── interacoes_cliente   ← ligações, visitas, etc.
│   └── negociacoes
│       └── itens_negociacao
│
└── whatsapp
    ├── conexoes_whatsapp    ← instâncias (uazapi / evolution / meta)
    ├── contatos_whatsapp    ← um contato por instância (JID único)
    └── mensagens_whatsapp   ← espelho das mensagens
```

---

## Papéis de Usuário (RLS)

| Papel      | Acesso |
|------------|--------|
| `admin`    | Tudo — incluindo gestão de usuários, papéis e configurações |
| `gerente`  | Todos os dados de negócio; sem gestão de usuários |
| `vendedor` | Próprios clientes/negociações; produtos (leitura); WhatsApp |
| `operador` | WhatsApp (leitura + envio); produtos (leitura) |

O primeiro usuário criado deve ser promovido a `admin` manualmente no Supabase Dashboard ou via SQL:
```sql
update public.usuarios set papel = 'admin' where email = 'seu@email.com';
```

---

## Integração Clerk + Supabase

### Como funciona

1. O Clerk emite um JWT com o `userId` no campo `sub`
2. O Next.js cria o cliente Supabase passando o token JWT do Clerk
3. O Supabase valida o JWT e injeta as claims em `request.jwt.claims`
4. As funções `clerk_user_id()` e `current_usuario_id()` leem esse valor
5. As políticas RLS usam essas funções para filtrar dados

### Configuração necessária (Clerk Dashboard)

1. Acesse **Clerk Dashboard → JWT Templates**
2. Crie um novo template chamado `supabase`
3. Configure o signing key com o **JWT Secret** do Supabase (`Settings → API → JWT Secret`)
4. Use este template ao criar o cliente Supabase no servidor:
   ```ts
   const token = await currentUser() // ou getToken({ template: 'supabase' })
   ```

### Configuração necessária (Supabase Dashboard)

Em **Authentication → Settings → JWT Secret**, o secret deve bater com o configurado no Clerk JWT Template.

### Webhook para sincronização de usuários

- URL: `https://SEU_DOMINIO/api/webhooks/clerk`
- Eventos: `user.created`, `user.updated`, `user.deleted`
- Header verificado: `CLERK_WEBHOOK_SECRET` (configurar no `.env.local`)
- Configurar em: **Clerk Dashboard → Webhooks → Add Endpoint**

---

## Tabelas Principais

### `usuarios`
Espelho dos usuários do Clerk. **Nunca criar diretamente** — use o webhook.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `clerk_id` | text | ID do Clerk (`user_xxxx`). Referência principal para RLS |
| `papel` | text | `admin`, `gerente`, `vendedor`, `operador` |
| `nome_completo` | text | Coluna gerada: `nome + sobrenome` ou `email` |

### `produtos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `sku` | text | Código interno único |
| `preco_custo` | numeric | Usado para calcular `margem_lucro` (coluna gerada) |
| `estoque_atual` | integer | Atualizado via `movimentos_estoque` |
| `imagens` | text[] | Array de URLs do Supabase Storage (bucket: `produtos`) |
| `dimensoes` | jsonb | `{largura, altura, profundidade, peso, unidade}` |

### `clientes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `telefone` | text | Formato E.164 sem `+`: `5511999990000` |
| `endereco` | jsonb | `{cep, logradouro, numero, complemento, bairro, cidade, estado}` |
| `estagio_id` | uuid | Posição atual no Kanban |
| `valor_estimado` | numeric | Valor potencial do negócio |

### `conexoes_whatsapp`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `provedor` | text | `uazapi`, `evolution`, `meta` |
| `instancia` | text | Nome/ID da instância no provedor |
| `api_key` | text | **Criptografar na aplicação antes de salvar** |
| `qr_code` | text | Base64 do QR code. Válido até `qr_expiracao` |

### `mensagens_whatsapp`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `message_id` | text | ID original no WhatsApp (único por conexão) |
| `jid` | text | WhatsApp JID: `5511999@s.whatsapp.net` |
| `enviado_por_nos` | boolean | `true` = enviado pela equipe da loja |
| `timestamp_whatsapp` | timestamptz | Horário original (não o de inserção) |

---

## Views

### `ultimas_mensagens_por_contato`
Última mensagem de cada conversa + contador de não lidas.
Usada para renderizar a lista de chats.

---

## Buckets no Supabase Storage

| Bucket | Acesso | Uso |
|--------|--------|-----|
| `produtos` | Público | Imagens dos produtos |
| `whatsapp-media` | Autenticado | Mídias recebidas/enviadas via WhatsApp |
| `avatares` | Público | Fotos de perfil de contatos |

Criar manualmente no **Supabase Dashboard → Storage → New Bucket**.

---

## Funções SQL Helper

| Função | Retorna | Descrição |
|--------|---------|-----------|
| `public.clerk_user_id()` | text | `clerk_id` do JWT atual |
| `public.current_usuario_id()` | uuid | UUID interno do usuário atual |
| `public.current_usuario_papel()` | text | Papel do usuário atual |
| `public.is_admin()` | boolean | `true` se papel = `admin` |
| `public.is_admin_ou_gerente()` | boolean | `true` se papel = `admin` ou `gerente` |

---

## Aplicando as Migrations

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Linkar ao projeto remoto
npx supabase link --project-ref atteroccvajbcwxsaoqp

# Aplicar todas as migrations
npx supabase db push

# Gerar tipos TypeScript
npx supabase gen types typescript --project-id atteroccvajbcwxsaoqp > lib/supabase/types.ts
```
