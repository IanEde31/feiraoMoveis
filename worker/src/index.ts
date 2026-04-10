import 'dotenv/config'
import { restaurarConexoes } from './baileys/manager'
import { iniciarListenerComandos } from './comandos'

// Tratamento de erros globais — worker deve ser resiliente
process.on('uncaughtException', (err) => {
  console.error('[worker] uncaughtException:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('[worker] unhandledRejection:', reason)
})

async function main() {
  console.log('[worker] verificando variáveis de ambiente...')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não definida')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida')
  }

  console.log('[worker] restaurando conexões ativas...')
  await restaurarConexoes()

  console.log('[worker] iniciando listener de comandos...')
  await iniciarListenerComandos()

  console.log('[worker] pronto.')
}

main().catch((err) => {
  console.error('[worker] falha fatal no boot:', err)
  process.exit(1)
})
