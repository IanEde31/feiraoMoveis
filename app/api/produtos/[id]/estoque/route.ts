import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { NextResponse } from 'next/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const { id } = await params
    const body = await req.json()

    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, estoque_atual')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (produtoError || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const delta = Number(body.quantidade) // positivo = entrada, negativo = saída
    const novoEstoque = produto.estoque_atual + delta

    if (novoEstoque < 0) {
      return NextResponse.json(
        { error: `Estoque insuficiente. Atual: ${produto.estoque_atual} unidade(s).` },
        { status: 400 }
      )
    }

    // Registrar movimento (imutável)
    const { error: movimentoError } = await supabase.from('movimentos_estoque').insert({
      produto_id: id,
      organization_id: orgId,
      tipo: body.tipo,
      quantidade: delta,
      estoque_anterior: produto.estoque_atual,
      estoque_posterior: novoEstoque,
      motivo: body.motivo || null,
    })

    if (movimentoError) {
      return NextResponse.json({ error: movimentoError.message }, { status: 500 })
    }

    // Atualizar estoque do produto
    const { data: atualizado, error: updateError } = await supabase
      .from('produtos')
      .update({ estoque_atual: novoEstoque })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, categorias_produto(id, nome)')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json(atualizado)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
