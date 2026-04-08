import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/whatsapp/mensagens?contato_id=...&desde=ISO
// Retorna mensagens do contato em ordem cronológica.
// Se `desde` for informado, retorna apenas mensagens com timestamp_whatsapp > desde
// (útil para polling incremental).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const contatoId = searchParams.get('contato_id')
  const desde = searchParams.get('desde')
  if (!contatoId) {
    return NextResponse.json({ error: 'contato_id obrigatório' }, { status: 400 })
  }

  const supabase = createServerClient()
  let q = supabase
    .from('mensagens_whatsapp')
    .select('*')
    .eq('contato_id', contatoId)
    .order('timestamp_whatsapp', { ascending: true })
    .limit(500)

  if (desde) q = q.gt('timestamp_whatsapp', desde)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensagens: data ?? [] })
}
