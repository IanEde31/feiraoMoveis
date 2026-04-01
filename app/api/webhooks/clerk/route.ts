import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role — bypassa RLS para operações de sistema
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type ClerkUserEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
    deleted?: boolean
  }
}

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Headers do webhook ausentes' }, { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Webhook Clerk] CLERK_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 })
  }

  const payload = await req.text()

  let evento: ClerkUserEvent
  try {
    const wh = new Webhook(secret)
    evento = wh.verify(payload, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch (err) {
    console.error('[Webhook Clerk] Assinatura inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const { type, data } = evento

  try {
    if (type === 'user.created' || type === 'user.updated') {
      const emailPrincipal = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address

      if (!emailPrincipal) {
        return NextResponse.json({ error: 'Email principal não encontrado' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('usuarios')
        .upsert(
          {
            clerk_id:   data.id,
            email:      emailPrincipal,
            nome:       data.first_name ?? null,
            sobrenome:  data.last_name ?? null,
            avatar_url: data.image_url ?? null,
          },
          { onConflict: 'clerk_id', ignoreDuplicates: false }
        )

      if (error) {
        console.error(`[Webhook Clerk] Erro ao ${type}:`, error)
        return NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 })
      }

      console.log(`[Webhook Clerk] Usuário sincronizado: ${data.id} (${type})`)
    }

    if (type === 'user.deleted') {
      const { error } = await supabaseAdmin
        .from('usuarios')
        .update({ ativo: false })
        .eq('clerk_id', data.id)

      if (error) {
        console.error('[Webhook Clerk] Erro ao desativar usuário:', error)
        return NextResponse.json({ error: 'Erro ao desativar usuário' }, { status: 500 })
      }

      console.log(`[Webhook Clerk] Usuário desativado: ${data.id}`)
    }

    return NextResponse.json({ sucesso: true })
  } catch (err) {
    console.error('[Webhook Clerk] Erro inesperado:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
