import { getOrgScopedClient } from '@/lib/supabase/with-org'
import { Sparkles } from 'lucide-react'
import { AmbientacaoWorkspace } from '@/components/ambientacao/ambientacao-workspace'

export const metadata = {
  title: 'Ambientação IA — Feirão Móveis',
}

export default async function PaginaAmbientacao() {
  const { supabase, orgId } = await getOrgScopedClient()

  const [{ data: produtos }, { data: categorias }, { data: clientes }] = await Promise.all([
    supabase
      .from('produtos')
      .select('*, categorias_produto(id, nome)')
      .eq('ativo', true)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase.from('categorias_produto').select('*').order('nome'),
    supabase
      .from('clientes')
      .select('id, nome, telefone')
      .eq('organization_id', orgId)
      .order('nome'),
  ])

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ouro-400 to-ouro-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Sparkles className="text-white" size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-semibold text-slate-900">
              Ambientação IA
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Mostre ao cliente como os móveis vão ficar no ambiente dele
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-ouro-50 border border-ouro-200">
          <span className="w-1.5 h-1.5 rounded-full bg-ouro-500 animate-pulse" />
          <span className="text-xs font-medium text-ouro-800">
            Beta — powered by IA
          </span>
        </div>
      </div>

      <AmbientacaoWorkspace
        produtos={produtos ?? []}
        categorias={categorias ?? []}
        clientes={clientes ?? []}
      />
    </div>
  )
}
