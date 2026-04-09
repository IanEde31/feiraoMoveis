import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const BUCKET = 'ambientacoes'
const SIGNED_URL_EXPIRY = 3600 // 1 hora

const querySchema = z.object({
  cliente_id: z.string().uuid('cliente_id inválido'),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const parsed = querySchema.safeParse({ cliente_id: searchParams.get('cliente_id') })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetro cliente_id obrigatório e deve ser UUID válido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { cliente_id } = parsed.data

    const { data: rows, error } = await supabase
      .from('ambientacoes')
      .select(
        'id, cliente_id, resultado_path, miniatura_path, produtos_ids, produtos_snapshot, created_at, status'
      )
      .eq('cliente_id', cliente_id)
      .eq('status', 'pronto')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/ambientacao/galeria]', error)
      return NextResponse.json({ error: 'Erro ao buscar galeria' }, { status: 500 })
    }

    // Gerar signed URLs em paralelo
    const itens = await Promise.all(
      (rows ?? []).map(async (row) => {
        const pathParaMiniatura = row.miniatura_path ?? row.resultado_path
        const [{ data: urlResultado }, { data: urlMiniatura }] = await Promise.all([
          supabase.storage.from(BUCKET).createSignedUrl(row.resultado_path, SIGNED_URL_EXPIRY),
          supabase.storage.from(BUCKET).createSignedUrl(pathParaMiniatura, SIGNED_URL_EXPIRY),
        ])

        const snapshot = (row.produtos_snapshot ?? []) as Array<{ nome: string }>
        const nomes = snapshot.map((p) => p.nome)

        return {
          id: row.id,
          cliente_id: row.cliente_id,
          resultado_url: urlResultado?.signedUrl ?? '',
          miniatura_url: urlMiniatura?.signedUrl ?? '',
          produtos_ids: row.produtos_ids ?? [],
          produtos_nomes: nomes,
          criada_em: row.created_at,
        }
      })
    )

    return NextResponse.json(
      { itens },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/ambientacao/galeria]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
