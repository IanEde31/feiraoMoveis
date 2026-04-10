import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { NextResponse } from 'next/server'

const MAX_SIZE = 80 * 1024 * 1024 // 80 MB
const MIME_PERMITIDOS = ['model/gltf-binary', 'application/octet-stream']
const BUCKET = '3dmodels'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const { id: produtoId } = await params

    const formData = await req.formData()
    const arquivo = formData.get('arquivo') as File | null

    if (!arquivo) {
      return NextResponse.json({ error: 'Campo "arquivo" obrigatório' }, { status: 400 })
    }

    if (!MIME_PERMITIDOS.includes(arquivo.type)) {
      return NextResponse.json(
        { error: `MIME não suportado: ${arquivo.type}. Aceitos: ${MIME_PERMITIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    if (arquivo.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de 25 MB (${(arquivo.size / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 }
      )
    }

    // Verificar se o produto existe e pertence à organização
    const { data: produto, error: errProduto } = await supabase
      .from('produtos')
      .select('id, modelo_3d_path')
      .eq('id', produtoId)
      .eq('organization_id', orgId)
      .single()

    if (errProduto || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Remover modelo anterior se existir
    if (produto.modelo_3d_path) {
      await supabase.storage.from(BUCKET).remove([produto.modelo_3d_path])
    }

    const path = `${orgId}/${produtoId}/${Date.now()}.glb`
    const buffer = Buffer.from(await arquivo.arrayBuffer())

    const { error: errUpload } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: 'model/gltf-binary',
        upsert: false,
      })

    if (errUpload) {
      return NextResponse.json({ error: `Falha no upload: ${errUpload.message}` }, { status: 500 })
    }

    const { error: errUpdate } = await supabase
      .from('produtos')
      .update({ modelo_3d_path: path })
      .eq('id', produtoId)
      .eq('organization_id', orgId)

    if (errUpdate) {
      return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    return NextResponse.json({ modelo_3d_path: path })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const { id: produtoId } = await params

    const { data: produto, error: errProduto } = await supabase
      .from('produtos')
      .select('modelo_3d_path')
      .eq('id', produtoId)
      .eq('organization_id', orgId)
      .single()

    if (errProduto || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    if (produto.modelo_3d_path) {
      await supabase.storage.from(BUCKET).remove([produto.modelo_3d_path])
    }

    const { error: errUpdate } = await supabase
      .from('produtos')
      .update({ modelo_3d_path: null })
      .eq('id', produtoId)
      .eq('organization_id', orgId)

    if (errUpdate) {
      return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
