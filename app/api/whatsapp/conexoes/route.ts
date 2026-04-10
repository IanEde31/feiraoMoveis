import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { obterConexao } from '@/lib/whatsapp/baileys/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — lista todas as conexões, corrigindo status stale (socket morto mas DB diz conectado)
export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('conexoes_whatsapp')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lista = data ?? []

  // Detecta conexões que o banco julga conectadas mas o socket não existe em memória
  const stale = lista.filter(
    (c) => c.status === 'conectado' && !obterConexao(c.id)
  )
  if (stale.length > 0) {
    await supabase
      .from('conexoes_whatsapp')
      .update({ status: 'desconectado' } as never)
      .in('id', stale.map((c) => c.id))
    for (const c of stale) c.status = 'desconectado'
  }

  return NextResponse.json({ data: lista })
}

// POST — cria nova conexão (provedor = baileys)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const nome = (body?.nome ?? '').toString().trim()
  if (!nome) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('conexoes_whatsapp')
    .insert({
      nome,
      provedor: 'baileys',
      instancia: nome.toLowerCase().replace(/\s+/g, '-'),
      base_url: 'baileys://local',
      status: 'desconectado',
    } as never)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
