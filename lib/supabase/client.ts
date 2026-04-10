'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'
import { useRef } from 'react'
import type { Database } from './types'

// Singleton: referência ao getToken mais recente, atualizada a cada render do hook
let _getToken: (() => Promise<string | null>) | null = null

let _client: SupabaseClient<Database> | null = null

function getBrowserClient(): SupabaseClient<Database> {
  if (_client) return _client
  _client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          const token = _getToken ? await _getToken() : null
          const headers = new Headers(options?.headers)
          if (token) headers.set('Authorization', `Bearer ${token}`)
          return fetch(url, { ...options, headers })
        },
      },
      realtime: {
        accessToken: async () => {
          return (await _getToken?.()) ?? ''
        },
      },
    },
  )
  return _client
}

/**
 * Hook que retorna um cliente Supabase autenticado com o JWT do Clerk.
 * Usar em Client Components — respeita o RLS.
 * Retorna sempre a mesma instância (singleton) para evitar múltiplos GoTrueClient.
 *
 * Exemplo:
 *   const supabase = useSupabaseClient()
 *   const { data } = await supabase.from('produtos').select()
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()
  // Mantém _getToken sempre apontando para a versão mais recente do Clerk
  _getToken = () => getToken({ template: 'supabase' })
  return getBrowserClient()
}
