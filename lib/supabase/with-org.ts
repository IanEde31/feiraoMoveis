import { auth } from '@clerk/nextjs/server'
import { createServerClient } from './server'

/**
 * Retorna o orgId da organização ativa no Clerk.
 * Lança erro se o usuário não estiver autenticado ou sem organização.
 */
export async function getOrgId() {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error('Não autenticado')
  }

  if (!orgId) {
    throw new Error('Sem organização ativa')
  }

  return orgId
}

/**
 * Retorna o cliente Supabase (service role) junto com orgId e userId.
 * Uso: rotas API e Server Components que precisam filtrar por organização.
 */
export async function getOrgScopedClient() {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error('Não autenticado')
  }

  if (!orgId) {
    throw new Error('Sem organização ativa')
  }

  return {
    supabase: createServerClient(),
    orgId,
    userId,
  }
}
