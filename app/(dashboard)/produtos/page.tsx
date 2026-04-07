import { createServerClient } from '@/lib/supabase/server'
import { ListaProdutos } from '@/components/produtos/lista-produtos'

export const metadata = {
  title: 'Produtos — Feirão Móveis',
}

export default async function PaginaProdutos() {
  const supabase = createServerClient()

  const [{ data: produtos }, { data: categorias }] = await Promise.all([
    supabase
      .from('produtos')
      .select('*, categorias_produto(id, nome)')
      .order('created_at', { ascending: false }),
    supabase
      .from('categorias_produto')
      .select('*')
      .order('nome'),
  ])

  return (
    <div className="space-y-5 max-w-[1600px]">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-slate-900">
            Produtos
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Gerencie o catálogo e controle o estoque
          </p>
        </div>

        {/* Métricas rápidas */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">
              {produtos?.length ?? 0}
            </p>
            <p className="text-xs text-slate-500">produtos</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-center shadow-sm">
            <p className="text-lg font-bold text-emerald-700 tabular-nums leading-tight">
              {produtos?.filter((p) => p.ativo).length ?? 0}
            </p>
            <p className="text-xs text-slate-500">ativos</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-center shadow-sm">
            <p className="text-lg font-bold text-amber-700 tabular-nums leading-tight">
              {produtos?.filter((p) => p.estoque_atual <= p.estoque_minimo && p.estoque_minimo > 0).length ?? 0}
            </p>
            <p className="text-xs text-slate-500">críticos</p>
          </div>
        </div>
      </div>

      {/* Lista interativa (Client Component) */}
      <ListaProdutos
        produtosIniciais={produtos ?? []}
        categorias={categorias ?? []}
      />
    </div>
  )
}
