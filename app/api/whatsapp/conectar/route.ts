import { NextResponse } from 'next/server'
import { criarConexao } from '@/lib/whatsapp/baileys/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { conexao_id } = await req.json()
    if (!conexao_id) {
      return NextResponse.json({ error: 'conexao_id obrigatório' }, { status: 400 })
    }
    const entry = await criarConexao(conexao_id)
    return NextResponse.json({
      status: entry.status,
      qr: entry.qr ?? null,
    })
  } catch (e: any) {
    console.error('[api/whatsapp/conectar]', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
