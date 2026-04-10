import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const { searchParams } = new URL(req.url)

    let query = supabase
      .from('produtos')
      .select('*, categorias_produto(id, nome)')
      .eq('organization_id', orgId)

    if (searchParams.get('com_modelo_3d') === 'true') {
      query = query.not('modelo_3d_path', 'is', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('produtos')
      .insert({
        organization_id: orgId,
        nome: body.nome,
        sku: body.sku || null,
        descricao_curta: body.descricao_curta || null,
        descricao: body.descricao || null,
        preco_venda: Number(body.preco_venda),
        preco_custo: body.preco_custo ? Number(body.preco_custo) : null,
        estoque_atual: Number(body.estoque_atual ?? 0),
        estoque_minimo: Number(body.estoque_minimo ?? 0),
        categoria_id: body.categoria_id || null,
        material: body.material || null,
        fabricante: body.fabricante || null,
        dimensoes: body.dimensoes || null,
        imagens: body.imagens ?? [],
        ativo: body.ativo ?? true,
      })
      .select('*, categorias_produto(id, nome)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
