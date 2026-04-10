import { NextRequest, NextResponse } from 'next/server'
import { getOrgScopedClient } from '@/lib/supabase/with-org'

const BUCKET = 'ambientacoes'
const SIGNED_URL_EXPIRY = 3600 // 1 hora

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, orgId } = await getOrgScopedClient()

    const { data: row, error } = await supabase
      .from('ambientacoes')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Ambientação não encontrada' }, { status: 404 })
    }

    const [{ data: urlAmbiente }, { data: urlResultado }] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUrl(row.ambiente_path, SIGNED_URL_EXPIRY),
      supabase.storage.from(BUCKET).createSignedUrl(row.resultado_path, SIGNED_URL_EXPIRY),
    ])

    return NextResponse.json({
      ...row,
      ambiente_url: urlAmbiente?.signedUrl ?? null,
      resultado_url: urlResultado?.signedUrl ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, orgId } = await getOrgScopedClient()

    // --- 1. Buscar a linha para obter os paths ---
    const { data: row, error: fetchErr } = await supabase
      .from('ambientacoes')
      .select('ambiente_path, resultado_path, miniatura_path')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Ambientação não encontrada' }, { status: 404 })
    }

    // --- 2. Deletar arquivos do Storage ---
    const paths = [
      row.ambiente_path,
      row.resultado_path,
      row.miniatura_path,
    ].filter(Boolean) as string[]

    if (paths.length > 0) {
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove(paths)
      if (storageErr) {
        console.error('[DELETE /api/ambientacao/[id]] storage remove:', storageErr)
        // Continua para deletar a linha mesmo se o Storage falhar
      }
    }

    // --- 3. Deletar a linha da tabela ---
    const { error: deleteErr } = await supabase.from('ambientacoes').delete().eq('organization_id', orgId).eq('id', id)

    if (deleteErr) {
      console.error('[DELETE /api/ambientacao/[id]] delete row:', deleteErr)
      return NextResponse.json({ error: 'Falha ao remover ambientação' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
