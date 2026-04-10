import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { supabase, orgId } = await getOrgScopedClient()

    const formData = await req.formData()
    const arquivo = formData.get('arquivo') as File | null

    if (!arquivo) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const nomeArquivo = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`

    const buffer = Buffer.from(await arquivo.arrayBuffer())

    const { data, error } = await supabase.storage
      .from('produtos')
      .upload(nomeArquivo, buffer, {
        contentType: arquivo.type,
        upsert: false,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage
      .from('produtos')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
