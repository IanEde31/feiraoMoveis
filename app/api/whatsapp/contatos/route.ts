import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/whatsapp/contatos?conexao_id=...
// Retorna { contatos, ultimas } da conexão.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const conexaoId = searchParams.get('conexao_id')
  if (!conexaoId) {
    return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
  }

  const supabase = createServerClient()
  const [{ data: contatos, error: e1 }, { data: ultimas, error: e2 }] = await Promise.all([
    supabase
      .from('contatos_whatsapp')
      .select('*')
      .eq('conexao_id', conexaoId)
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase
      .from('ultimas_mensagens_por_contato')
      .select('*')
      .eq('conexao_id', conexaoId),
  ])

  if (e1 || e2) {
    return NextResponse.json(
      { error: e1?.message ?? e2?.message ?? 'erro' },
      { status: 500 }
    )
  }

  return NextResponse.json({ contatos: contatos ?? [], ultimas: ultimas ?? [] })
}
