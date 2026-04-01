export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Painel esquerdo — branding (oculto em mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 p-12 relative overflow-hidden">
        {/* Gradiente dourado sutil no fundo */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 30% 70%, #b8960c 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #7d6214 0%, transparent 50%)',
          }}
        />

        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #b8960c 0, #b8960c 1px, transparent 0, transparent 50%)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        {/* Conteúdo do painel */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ouro-600 flex items-center justify-center">
              <span className="text-white font-playfair font-bold text-lg">F</span>
            </div>
            <span className="text-white font-playfair text-xl font-semibold tracking-wide">
              Feirão Móveis
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-white font-playfair text-4xl font-bold leading-tight">
            Gestão inteligente para o seu negócio de{' '}
            <span className="text-ouro-400">alto padrão</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Controle seus produtos, clientes e vendas em um único lugar.
            Desenvolvido para lojas de móveis de luxo.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ouro-600" />
              <span>Dashboard completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ouro-600" />
              <span>WhatsApp integrado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ouro-600" />
              <span>Kanban de clientes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-12">
        {/* Logo visível apenas em mobile */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-ouro-600 flex items-center justify-center">
            <span className="text-white font-playfair font-bold text-base">F</span>
          </div>
          <span className="font-playfair text-xl font-semibold text-slate-900">
            Feirão Móveis
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}
