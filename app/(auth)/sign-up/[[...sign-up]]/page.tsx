import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criar conta | Feirão Móveis',
}

const aparencia = {
  variables: {
    colorPrimary: '#b8960c',
    colorBackground: '#f8fafc',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorInputBackground: '#ffffff',
    colorInputText: '#0f172a',
    borderRadius: '0.5rem',
    fontFamily: 'var(--font-inter), sans-serif',
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none bg-transparent p-0 gap-6',
    headerTitle: 'font-playfair text-2xl text-slate-900',
    headerSubtitle: 'text-slate-500 text-sm',
    socialButtonsBlockButton:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors h-11',
    socialButtonsBlockButtonText: 'font-medium text-sm',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs',
    formFieldLabel: 'text-slate-700 text-sm font-medium',
    formFieldInput:
      'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-ouro-600 focus:border-ouro-600 h-11 rounded-lg',
    formButtonPrimary:
      'bg-ouro-600 hover:bg-ouro-700 text-white font-medium h-11 rounded-lg transition-colors',
    footerActionLink: 'text-ouro-700 hover:text-ouro-800 font-medium',
    footerActionText: 'text-slate-500 text-sm',
    formFieldSuccessText: 'text-emerald-600',
    formFieldErrorText: 'text-red-600',
    formResendCodeLink: 'text-ouro-700',
  },
}

export default function PaginaCadastro() {
  return (
    <SignUp
      appearance={aparencia}
      routing="path"
      path="/sign-up"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
    />
  )
}
