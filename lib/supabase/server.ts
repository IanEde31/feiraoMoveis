import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Cliente Supabase para Server Components e Route Handlers.
 * Usa a service role key — bypassa o RLS.
 * NUNCA expor ao cliente.
 */
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
