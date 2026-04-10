import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { NextResponse } from 'next/server'

const BUCKET = '3dmodels'
const SIGNED_URL_EXPIRY = 3600 // 1 hora

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ produtoId: string }> }
) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()
    const { produtoId } = await params

    const { data: produto, error } = await supabase
      .from('produtos')
      .select('id, nome, descricao_curta, preco_venda, modelo_3d_path, modelo_3d_ios_path')
      .eq('id', produtoId)
      .eq('organization_id', orgId)
      .single()

    if (error || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    if (!produto.modelo_3d_path) {
      return NextResponse.json({ error: 'Produto sem modelo 3D' }, { status: 404 })
    }

    // Signed URL do modelo GLB
    const { data: urlGlb, error: errGlb } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(produto.modelo_3d_path, SIGNED_URL_EXPIRY)

    if (errGlb || !urlGlb) {
      return NextResponse.json({ error: 'Falha ao gerar URL do modelo 3D' }, { status: 500 })
    }

    // Signed URL do modelo iOS (USDZ), se existir
    let signedUrlIos: string | null = null
    if (produto.modelo_3d_ios_path) {
      const { data: urlIos } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(produto.modelo_3d_ios_path, SIGNED_URL_EXPIRY)

      signedUrlIos = urlIos?.signedUrl ?? null
    }

    return NextResponse.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        descricao_curta: produto.descricao_curta,
        preco_venda: produto.preco_venda,
      },
      signedUrl: urlGlb.signedUrl,
      signedUrlIos,
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
