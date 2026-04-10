import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sharp from 'sharp'
import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { geminiProvider } from '@/lib/ambientacao/providers/gemini'
import type { Json } from '@/lib/supabase/types'

// MIME types aceitos nativamente pelo Supabase Storage
const MIMES_SUPORTADOS = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const BUCKET = 'ambientacoes'
const SIGNED_URL_EXPIRY = 3600 // 1 hora

const gerarSchema = z.object({
  cliente_id: z.string().uuid('cliente_id inválido'),
  produtos: z.array(z.string().uuid()).min(1, 'Selecione ao menos 1 produto'),
})

export async function POST(req: NextRequest) {
  try {
    // --- 1. Parse multipart/form-data ---
    const formData = await req.formData()
    const clienteId = formData.get('cliente_id')?.toString() ?? ''
    const produtosRaw = formData.getAll('produtos[]').map(String)
    const ambienteFile = formData.get('ambiente')

    const parsed = gerarSchema.safeParse({ cliente_id: clienteId, produtos: produtosRaw })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    if (!(ambienteFile instanceof File)) {
      return NextResponse.json({ error: 'Imagem do ambiente obrigatória' }, { status: 400 })
    }
    if (ambienteFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem do ambiente deve ter no máximo 10 MB' }, { status: 400 })
    }

    const { supabase, orgId } = await getOrgScopedClient()
    const { cliente_id, produtos: produtosIds } = parsed.data

    // --- 2. Verificar se cliente existe ---
    const { data: cliente, error: clienteErr } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('organization_id', orgId)
      .eq('id', cliente_id)
      .single()

    if (clienteErr || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // --- 3. Buscar produtos e montar snapshot ---
    const { data: produtos, error: produtosErr } = await supabase
      .from('produtos')
      .select('id, nome, preco_venda, imagens')
      .eq('organization_id', orgId)
      .in('id', produtosIds)

    if (produtosErr || !produtos?.length) {
      return NextResponse.json({ error: 'Nenhum produto válido encontrado' }, { status: 404 })
    }

    const produtosSnapshot = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      preco_venda: p.preco_venda,
      imagem: (p.imagens as string[])?.[0] ?? null,
    }))

    // --- 4. Preparar buffers ---
    const ambientacaoId = crypto.randomUUID()
    let ambienteBuffer: Buffer = Buffer.from(await ambienteFile.arrayBuffer())
    let ambienteMime = ambienteFile.type || 'image/jpeg'

    // Converter formatos não suportados pelo Supabase Storage (ex.: AVIF, HEIC) para JPEG
    if (!MIMES_SUPORTADOS.has(ambienteMime)) {
      ambienteBuffer = await sharp(ambienteBuffer).jpeg({ quality: 92 }).toBuffer()
      ambienteMime = 'image/jpeg'
    }

    // --- 5. Upload da imagem original do ambiente ---
    const ambienteExt = ambienteMime.includes('png') ? 'png' : 'jpg'
    const ambientePath = `${cliente_id}/${ambientacaoId}/ambiente.${ambienteExt}`
    const { error: uploadAmbErr } = await supabase.storage
      .from(BUCKET)
      .upload(ambientePath, ambienteBuffer, { contentType: ambienteMime, upsert: false })

    if (uploadAmbErr) {
      console.error('[POST /api/ambientacao/gerar] upload ambiente:', uploadAmbErr)
      return NextResponse.json({ error: 'Falha no upload da imagem de ambiente' }, { status: 500 })
    }

    // --- 6. Chamar o provedor de IA ---
    let resultadoBuffer: Buffer
    let resultadoMime: string
    let metadataProvider: Record<string, unknown> = {}
    let statusFinal: 'pronto' | 'erro' = 'pronto'
    let mensagemErro: string | null = null

    try {
      const saida = await geminiProvider.gerar({
        ambienteBuffer,
        ambienteMime,
        produtos: produtosSnapshot.map((p) => ({ id: p.id, nome: p.nome, imagem: p.imagem })),
      })
      resultadoBuffer = saida.imagemBuffer
      resultadoMime = saida.mime
      metadataProvider = saida.metadata ?? {}
    } catch (iaErr) {
      console.error('[POST /api/ambientacao/gerar] provider error:', iaErr)
      statusFinal = 'erro'
      mensagemErro = iaErr instanceof Error ? iaErr.message : 'Falha desconhecida no provedor de IA'
      // Placeholder para resultado em caso de erro
      resultadoBuffer = ambienteBuffer
      resultadoMime = ambienteMime
    }

    // --- 7. Upload do resultado ---
    const resultadoExt = resultadoMime.includes('png') ? 'png' : 'jpg'
    const resultadoPath = `${cliente_id}/${ambientacaoId}/resultado.${resultadoExt}`
    const { error: uploadResErr } = await supabase.storage
      .from(BUCKET)
      .upload(resultadoPath, resultadoBuffer, { contentType: resultadoMime, upsert: false })

    if (uploadResErr) {
      console.error('[POST /api/ambientacao/gerar] upload resultado:', uploadResErr)
      return NextResponse.json({ error: 'Falha no upload do resultado' }, { status: 500 })
    }

    // --- 8. Insert na tabela ---
    const { data: row, error: insertErr } = await supabase
      .from('ambientacoes')
      .insert({
        id: ambientacaoId,
        organization_id: orgId,
        cliente_id,
        ambiente_path: ambientePath,
        resultado_path: resultadoPath,
        produtos_ids: produtosIds,
        produtos_snapshot: produtosSnapshot,
        provedor: geminiProvider.nome,
        modelo: geminiProvider.modelo,
        metadata: metadataProvider as Json,
        status: statusFinal,
        mensagem_erro: mensagemErro,
      })
      .select('id, created_at')
      .single()

    if (insertErr || !row) {
      console.error('[POST /api/ambientacao/gerar] insert:', insertErr)
      return NextResponse.json({ error: 'Falha ao salvar ambientação' }, { status: 500 })
    }

    // --- 9. Gerar signed URLs ---
    const [{ data: urlAmbiente }, { data: urlResultado }] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUrl(ambientePath, SIGNED_URL_EXPIRY),
      supabase.storage.from(BUCKET).createSignedUrl(resultadoPath, SIGNED_URL_EXPIRY),
    ])

    if (statusFinal === 'erro') {
      return NextResponse.json(
        { error: mensagemErro, status: 'erro', id: row.id },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        id: row.id,
        ambiente_url: urlAmbiente?.signedUrl ?? null,
        resultado_url: urlResultado?.signedUrl ?? null,
        miniatura_url: urlResultado?.signedUrl ?? null,
        produtos_nomes: produtosSnapshot.map((p) => p.nome),
        criada_em: row.created_at,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
