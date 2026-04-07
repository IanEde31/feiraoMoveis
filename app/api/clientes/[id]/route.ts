import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: historico, error } = await supabase
    .from('historico_kanban')
    .select('id, created_at, estagio_anterior_id, estagio_novo_id, observacao')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ historico: historico ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  if (!body.estagio_id || typeof body.estagio_id !== 'string') {
    return NextResponse.json({ error: 'estagio_id é obrigatório' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('clientes')
    .update({ estagio_id: body.estagio_id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  if (!body.nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nome: body.nome.trim(),
      telefone: body.telefone?.trim() || null,
      email: body.email?.trim() || null,
      cpf_cnpj: body.cpf_cnpj?.trim() || null,
      estagio_id: body.estagio_id,
      origem: body.origem || null,
      tags: body.tags ?? [],
      valor_estimado: body.valor_estimado ? Number(body.valor_estimado) : null,
      observacoes: body.observacoes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
