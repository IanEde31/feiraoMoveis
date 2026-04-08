import { NextResponse } from 'next/server'
import { obterConexao } from '@/lib/whatsapp/baileys/manager'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const conexaoId = searchParams.get('conexao_id')
  if (!conexaoId) {
    return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
  }
  const entry = obterConexao(conexaoId)
  if (entry) {
    return NextResponse.json({
      status: entry.status,
      qr: entry.qr ?? null,
      em_memoria: true,
    })
  }
  // fallback: estado persistido no banco
  const supabase = createServerClient()
  const { data } = await supabase
    .from('conexoes_whatsapp')
    .select('status, qr_code')
    .eq('id', conexaoId)
    .single()
  return NextResponse.json({
    status: data?.status ?? 'desconectado',
    qr: data?.qr_code ?? null,
    em_memoria: false,
  })
}
