# Ativação de Organizations do Clerk — Feirão Móveis

Objetivo: cada **loja de móveis** será uma **Organization** no Clerk. Os usuários da loja são membros dessa organization, e os dados (produtos, clientes, conversas de WhatsApp) ficam isolados por `organization_id`.

> ⚠️ Este documento é só um guia de ativação — **nada foi aplicado ainda**.

---

## 1. Visão geral do modelo

- 1 loja = 1 **Organization** no Clerk
- 1 usuário pode pertencer a várias lojas (útil para suporte / multi-loja)
- A **Organization Ativa** (`orgId` na sessão) determina qual loja o usuário está operando no momento
- Roles padrão: `org:admin` (dono/gerente) e `org:member` (vendedor/atendente). Custom roles opcionais (ex.: `org:vendedor`, `org:financeiro`)
- Todo dado no Supabase passa a ter coluna `organization_id` + RLS por organization

---

## 2. Passos no Dashboard do Clerk

### 2.1 Habilitar Organizations
1. Abrir **Clerk Dashboard → Organizations Settings** (https://dashboard.clerk.com/~/organizations-settings)
2. Clicar em **Enable Organizations**
3. Escolher modo:
   - **Membership required** (recomendado) → todo usuário precisa pertencer a uma loja
   - Membership optional → só se quisermos permitir usuários "soltos" (não é nosso caso)
4. Confirmar **Enable**

### 2.2 Configurações recomendadas
Na mesma página, ajustar:
- **Limit de membros por organization**: padrão 5 — subir conforme plano (até 20 sem add-on; ilimitado com B2B Authentication)
- **Personal Accounts**: **DESLIGAR** (não queremos usuários fora de loja)
- **Organization slugs**: **LIGAR** (URLs amigáveis tipo `/loja-centro/...` se quisermos)
- **Permissão de criação**: **DESLIGAR** criação por usuários comuns — só admins do sistema criam lojas (ou via Dashboard, ou via Backend API durante onboarding)
- **Default role**: `org:member`
- **Auto-create organization**: desligado (queremos controle manual no onboarding)

### 2.3 Roles & Permissions (opcional, mas recomendado)
Em **Roles & Permissions**, criar custom roles para o domínio:
- `org:gerente` — acesso total à loja
- `org:vendedor` — clientes, kanban, whatsapp; sem deletar produtos
- `org:estoquista` — produtos e estoque; sem clientes/whatsapp

Permissions custom (formato `org:<feature>:<permission>`):
- `org:produtos:create` / `:update` / `:delete`
- `org:clientes:manage`
- `org:whatsapp:send`
- `org:estoque:adjust`

Atribuir cada permission ao(s) role(s) correspondente(s).

### 2.4 JWT Template
O template `supabase` que já existe precisa incluir o `org_id` no payload para o RLS funcionar. Editar em **JWT Templates → supabase** e garantir as claims:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "org_id": "{{org.id}}",
  "org_slug": "{{org.slug}}",
  "org_role": "{{org.role}}"
}
```

---

## 3. Mudanças no código (Next.js / Clerk)

### 3.1 Middleware
Em `middleware.ts` (Clerk middleware), forçar que usuário autenticado tenha uma organization ativa. Se não tiver, redirecionar para `/selecionar-loja` (ou auto-set se só houver uma).

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/(dashboard)(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const { userId, orgId } = await auth();
    if (!userId) return auth().redirectToSignIn();
    if (!orgId) {
      return Response.redirect(new URL("/selecionar-loja", req.url));
    }
  }
});
```

### 3.2 Componentes de UI
Adicionar no `components/layout/header.tsx`:

```tsx
import { OrganizationSwitcher } from "@clerk/nextjs";

<OrganizationSwitcher
  hidePersonal
  afterCreateOrganizationUrl="/dashboard"
  afterSelectOrganizationUrl="/dashboard"
/>
```

Página nova `app/(dashboard)/selecionar-loja/page.tsx` usando `<OrganizationList hidePersonal />` para usuários sem org ativa.

Página nova `app/(dashboard)/configuracoes/loja/page.tsx` com `<OrganizationProfile />` para gerente gerenciar membros e settings.

### 3.3 Convidar membros
Fluxo recomendado: **server-side** via Backend SDK.

Nova rota `app/api/organizations/convites/route.ts`:

```ts
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { orgId, has } = await auth();
  if (!orgId || !has({ role: "org:admin" })) {
    return new Response("Forbidden", { status: 403 });
  }
  const { email, role = "org:member" } = await req.json();
  const invite = await clerkClient().organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress: email,
    role,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/aceitar-convite`,
  });
  return Response.json(invite);
}
```

> Limites: 250 convites/hora individuais, 50/hora para bulk.

Para vários convites de uma vez: `createOrganizationInvitationBulk()`.

### 3.4 Checagem de permissões no código
Em Server Components / Route Handlers:

```ts
const { has } = await auth();
if (!has({ permission: "org:produtos:delete" })) {
  return new Response("Forbidden", { status: 403 });
}
```

Em Client Components: hook `useAuth()` → `has(...)`.

---

## 4. Mudanças no Supabase

### 4.1 Migration: adicionar `organization_id`
Criar migration que adiciona coluna em todas as tabelas de domínio:

```sql
ALTER TABLE produtos ADD COLUMN organization_id text NOT NULL;
ALTER TABLE clientes ADD COLUMN organization_id text NOT NULL;
ALTER TABLE conexoes_whatsapp ADD COLUMN organization_id text NOT NULL;
ALTER TABLE contatos_whatsapp ADD COLUMN organization_id text NOT NULL;
ALTER TABLE mensagens_whatsapp ADD COLUMN organization_id text NOT NULL;
-- + índices
CREATE INDEX ON produtos (organization_id);
-- ... idem nas outras
```

> Para dados existentes: backfill com a `organization_id` da loja "default" antes do `NOT NULL`.

### 4.2 RLS por organization
Substituir as policies atuais (`to authenticated using(true)`) por algo como:

```sql
CREATE POLICY "org_isolation_produtos" ON produtos
  FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id'))
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id'));
```

Replicar para todas as tabelas.

### 4.3 Webhook Clerk → Supabase
Quando configurarmos o webhook (`/api/webhooks/clerk`), adicionar handlers:
- `organization.created` → criar registro em tabela `lojas` (se quisermos espelho local)
- `organizationMembership.created/deleted` → sincronizar `usuarios_lojas`
- `organizationInvitation.accepted` → opcional, log

---

## 5. Server client do Supabase

Hoje `lib/supabase/server.ts` usa **service role** (bypassa RLS). Com organizations + RLS, precisamos sempre filtrar por `organization_id` manualmente nas queries server-side, OU criar um cliente alternativo que repassa o JWT do Clerk com a claim `org_id` e respeita RLS.

Recomendação: manter service role no server, mas **sempre injetar `organization_id` do `auth().orgId`** nas queries e nos `insert`. Centralizar isso num helper:

```ts
// lib/supabase/with-org.ts
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "./server";

export async function getOrgScopedClient() {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Sem organization ativa");
  const supabase = createServerClient();
  return { supabase, orgId };
}
```

E usar em toda rota: `.eq("organization_id", orgId)` no select e `organization_id: orgId` no insert.

---

## 6. Onboarding de uma nova loja (fluxo final)

1. Admin do sistema cria a Organization no Dashboard (ou via Backend API)
2. Admin convida o **gerente da loja** por email (`org:admin`)
3. Gerente recebe email, clica no link, faz cadastro/login no Clerk
4. Gerente entra no sistema, vê o `OrganizationSwitcher` já com a loja dele
5. Gerente convida vendedores e estoquistas via `<OrganizationProfile />` ou rota custom
6. Cada novo membro só enxerga dados com `organization_id` igual ao `orgId` ativo

---

## 7. Checklist de implementação (ordem sugerida)

- [ ] Habilitar Organizations no Dashboard (passo 2.1 / 2.2)
- [ ] Criar custom roles e permissions (passo 2.3)
- [ ] Atualizar JWT template `supabase` com `org_id` (passo 2.4)
- [ ] Migration: adicionar `organization_id` em todas as tabelas + backfill (passo 4.1)
- [ ] Migration: novas RLS policies por org (passo 4.2)
- [ ] Atualizar `middleware.ts` para exigir `orgId` ativo (passo 3.1)
- [ ] Adicionar `<OrganizationSwitcher />` no header (passo 3.2)
- [ ] Página `/selecionar-loja` com `<OrganizationList />`
- [ ] Página `/configuracoes/loja` com `<OrganizationProfile />`
- [ ] Helper `getOrgScopedClient()` (passo 5)
- [ ] Refatorar todas as rotas API para filtrar por `organization_id`
- [ ] Rota de convite custom (passo 3.3) — opcional, `<OrganizationProfile />` já cobre o básico
- [ ] Configurar webhook `organization.*` (quando hospedar)
- [ ] Testar isolamento entre 2 lojas de teste

---

## 8. Pontos de atenção

- **Custo**: Clerk cobra por **MRO** (Monthly Retained Organization = org com ≥2 membros ativos). Plano free inclui 50 MROs em dev. Verificar plano antes de subir pra produção.
- **WhatsApp**: as conexões Baileys hoje são globais. Vão precisar virar por-org (a coluna `organization_id` em `conexoes_whatsapp` resolve, mas o `manager.ts` precisa carregar só as conexões da org ativa).
- **Migração de dados existentes**: tudo que está hoje no banco precisa ser atribuído a uma loja "seed" antes de aplicar `NOT NULL`.
- **Permissões no UI**: esconder botões (deletar, etc.) com base em `has({ permission: ... })` no Client Component.
