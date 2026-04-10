'use client'

import { OrganizationList } from '@clerk/nextjs'

export default function SelecionarLojaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <h1 className="mb-8 font-playfair text-3xl font-semibold text-slate-900">
        Selecionar Loja
      </h1>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
      />
    </div>
  )
}
