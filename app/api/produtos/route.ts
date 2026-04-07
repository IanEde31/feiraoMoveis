import { createServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias_produto(id, nome)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('produtos')
    .insert({
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
}
