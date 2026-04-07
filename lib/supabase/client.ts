'use client'

import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'
import { useMemo } from 'react'
import type { Database } from './types'

/**
 * Hook que retorna um cliente Supabase autenticado com o JWT do Clerk.
 * Usar em Client Components — respeita o RLS.
 *
 * Exemplo:
 *   const supabase = useSupabaseClient()
 *   const { data } = await supabase.from('produtos').select()
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()

  return useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: async (url, options = {}) => {
              const token = await getToken({ template: 'supabase' })
              const headers = new Headers(options?.headers)
              if (token) headers.set('Authorization', `Bearer ${token}`)
              return fetch(url, { ...options, headers })
            },
          },
        }
      ),
    [getToken]
  )
}
