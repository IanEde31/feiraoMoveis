import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { formatarPreco } from '@/components/produtos/tipos'
import { Package, Box } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ArPage() {
  let supabase, orgId
  try {
    const client = await getOrgScopedClient()
    supabase = client.supabase
    orgId = client.orgId
  } catch {
    redirect('/selecionar-loja')
  }

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, descricao_curta, preco_venda, imagens, modelo_3d_path, categorias_produto(id, nome)')
    .eq('organization_id', orgId)
    .not('modelo_3d_path', 'is', null)
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  const lista = produtos ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-playfair text-2xl text-slate-900 font-semibold">
          Realidade Aumentada
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Produtos com modelo 3D disponível para visualização em AR.
        </p>
      </div>

      {lista.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Box size={28} className="text-slate-300" aria-hidden="true" />
          </div>
          <h2 className="font-playfair text-lg text-slate-900 font-semibold">
            Nenhum produto com modelo 3D
          </h2>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            Adicione um arquivo .glb na edição de um produto para que ele apareça aqui.
          </p>
          <Link
            href="/produtos"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-ouro-600 hover:bg-ouro-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Ir para Produtos
          </Link>
        </div>
      ) : (
        /* Grid de produtos */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((produto) => {
            const imagemPrincipal = (produto.imagens as string[] | null)?.[0] ?? null
            const categoria = produto.categorias_produto as { id: string; nome: string } | null

            return (
              <Link
                key={produto.id}
                href={`/ar/${produto.id}`}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                {/* Imagem */}
                <div className="relative aspect-[4/3] bg-slate-100 flex-shrink-0 overflow-hidden">
                  {imagemPrincipal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagemPrincipal}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
                      <Package size={32} className="text-slate-300" aria-hidden="true" />
                      <span className="text-xs text-slate-400">Sem imagem</span>
                    </div>
                  )}

                  {/* Badge AR */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-ouro-100 text-ouro-700 border border-ouro-300 backdrop-blur-sm">
                      <Box size={10} aria-hidden="true" />
                      AR
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5 flex flex-col gap-2 flex-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {produto.nome}
                    </p>
                    {categoria && (
                      <span className="text-xs text-slate-400 mt-1 block truncate">
                        {categoria.nome}
                      </span>
                    )}
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-ouro-700 tabular-nums">
                      {formatarPreco(produto.preco_venda)}
                    </span>
                    <span className="text-xs text-ouro-600 font-medium group-hover:underline">
                      Ver em AR →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
