import { ArViewer } from '@/components/ar/ar-viewer'

export default function ArPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="font-playfair text-2xl text-slate-900 font-semibold">
          Realidade Aumentada
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize o produto em 3D e toque em <span className="font-medium text-ouro-600">Ver no seu ambiente</span> para projetar no seu espaço.
        </p>
      </div>
      <ArViewer />
    </div>
  )
}
