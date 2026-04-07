import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }
  if (!body.estagio_id) {
    return NextResponse.json({ error: 'Estágio é obrigatório' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: body.nome.trim(),
      telefone: body.telefone?.trim() || null,
      email: body.email?.trim() || null,
      cpf_cnpj: body.cpf_cnpj?.trim() || null,
      estagio_id: body.estagio_id,
      origem: body.origem || null,
      tags: body.tags ?? [],
      valor_estimado: body.valor_estimado ? Number(body.valor_estimado) : null,
      observacoes: body.observacoes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
