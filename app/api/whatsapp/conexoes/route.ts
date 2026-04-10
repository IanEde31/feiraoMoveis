import { NextResponse } from 'next/server'
import { getOrgScopedClient } from '@/lib/supabase/with-org'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — lista todas as conexões ativas da organização
export async function GET() {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const { data, error } = await supabase
      .from('conexoes_whatsapp')
      .select('*')
      .eq('organization_id', orgId)
      .eq('ativo', true)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const lista = data ?? []

    return NextResponse.json({ data: lista })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

// POST — cria nova conexão (provedor = baileys)
export async function POST(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const body = await req.json().catch(() => ({}))
    const nome = (body?.nome ?? '').toString().trim()
    if (!nome) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('conexoes_whatsapp')
      .insert({
        organization_id: orgId,
        nome,
        provedor: 'baileys',
        instancia: nome.toLowerCase().replace(/\s+/g, '-'),
        base_url: 'baileys://local',
        status: 'desconectado',
      })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
