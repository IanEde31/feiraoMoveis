import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { ArViewer } from '@/components/ar/ar-viewer'
import { formatarPreco } from '@/components/produtos/tipos'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const BUCKET = '3dmodels'
const SIGNED_URL_EXPIRY = 3600

export default async function ArProdutoPage({
  params,
}: {
  params: Promise<{ produtoId: string }>
}) {
  const { produtoId } = await params

  let supabase, orgId
  try {
    const client = await getOrgScopedClient()
    supabase = client.supabase
    orgId = client.orgId
  } catch {
    redirect('/selecionar-loja')
  }

  const { data: produto } = await supabase
    .from('produtos')
    .select('id, nome, descricao_curta, preco_venda, modelo_3d_path, modelo_3d_ios_path')
    .eq('id', produtoId)
    .eq('organization_id', orgId)
    .single()

  if (!produto || !produto.modelo_3d_path) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Link
          href="/ar"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ouro-600 transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar para AR
        </Link>

        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
            📦
          </div>
          <h1 className="font-playfair text-xl text-slate-900 font-semibold">
            Produto sem modelo 3D
          </h1>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            Este produto ainda não possui um modelo 3D cadastrado. Adicione um arquivo .glb na tela de edição do produto.
          </p>
          <Link
            href="/produtos"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Ir para Produtos
          </Link>
        </div>
      </div>
    )
  }

  // Signed URL do GLB
  const { data: urlGlb } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(produto.modelo_3d_path, SIGNED_URL_EXPIRY)

  if (!urlGlb?.signedUrl) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-sm text-red-600">Falha ao gerar URL do modelo 3D.</p>
      </div>
    )
  }

  // Signed URL do USDZ (iOS), se existir
  let signedUrlIos: string | null = null
  if (produto.modelo_3d_ios_path) {
    const { data: urlIos } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(produto.modelo_3d_ios_path, SIGNED_URL_EXPIRY)
    signedUrlIos = urlIos?.signedUrl ?? null
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Navegação */}
      <Link
        href="/ar"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ouro-600 transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Voltar para AR
      </Link>

      {/* Info do produto */}
      <div>
        <h1 className="font-playfair text-2xl text-slate-900 font-semibold">
          {produto.nome}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-lg font-bold text-ouro-700 tabular-nums">
            {formatarPreco(produto.preco_venda)}
          </span>
          {produto.descricao_curta && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-500">{produto.descricao_curta}</span>
            </>
          )}
        </div>
      </div>

      {/* Viewer */}
      <ArViewer
        src={urlGlb.signedUrl}
        iosSrc={signedUrlIos}
        alt={`Modelo 3D — ${produto.nome}`}
        produtoId={produto.id}
      />

      <p className="text-xs text-slate-400 text-center">
        Toque em <span className="font-medium text-ouro-600">Ver no seu ambiente</span> para projetar o produto no seu espaço usando a câmera.
      </p>
    </div>
  )
}
