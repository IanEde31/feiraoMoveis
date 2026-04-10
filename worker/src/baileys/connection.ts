import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys'
import path from 'path'
import { rm } from 'fs/promises'
import qrcode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import { registrarEventos } from './events'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      accessToken: async () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
  }
)

export type ConexaoAtiva = {
  sock: WASocket
  qr?: string
  status: 'conectando' | 'aguardando_qr' | 'conectado' | 'desconectado'
}

/**
 * Inicia um único socket Baileys.
 *
 * @param conexaoId   ID da conexão no banco
 * @param onUpdate    Chamado sempre que o status muda (manager atualiza o Map)
 * @param onDisconnect Chamado quando a conexão fecha; manager decide se reconecta
 */
export function iniciarConexao(
  conexaoId: string,
  organizationId: string,
  onUpdate: (entry: ConexaoAtiva) => void,
  onDisconnect: (code: number | undefined, loggedOut: boolean) => void
): Promise<ConexaoAtiva> {
  return new Promise(async (resolve, reject) => {
    try {
      const sessionDir = path.join(process.cwd(), 'sessions', conexaoId)
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

      const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
        version: undefined as unknown as [number, number, number],
        isLatest: false,
      }))
      console.log(`[baileys] versao WA=${version?.join('.')} latest=${isLatest}`)

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: true,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
      })
      console.log(`[baileys] socket criado: ${conexaoId}`)

      const entry: ConexaoAtiva = { sock, status: 'conectando' }
      let resolved = false

      sock.ev.on('creds.update', saveCreds)
      registrarEventos(conexaoId, organizationId, sock)

      sock.ev.on('connection.update', async (u) => {
        const { qr, connection, lastDisconnect } = u

        if (qr) {
          const qrBase64 = await qrcode.toDataURL(qr)
          entry.qr = qrBase64
          entry.status = 'aguardando_qr'
          onUpdate(entry)
          await supabase
            .from('conexoes_whatsapp')
            .update({ status: 'aguardando_qr', qr_code: qrBase64 } as never)
            .eq('id', conexaoId)
          if (!resolved) {
            resolved = true
            resolve(entry)
          }
        }

        if (connection === 'open') {
          entry.qr = undefined
          entry.status = 'conectado'
          onUpdate(entry)
          const numero = sock.user?.id?.split(':')[0]?.split('@')[0] ?? null
          await supabase
            .from('conexoes_whatsapp')
            .update({
              status: 'conectado',
              qr_code: null,
              numero_telefone: numero,
              ultima_atividade: new Date().toISOString(),
            } as never)
            .eq('id', conexaoId)
          console.log(`[baileys] conectado: ${conexaoId} (${numero})`)
          if (!resolved) {
            resolved = true
            resolve(entry)
          }
        }

        if (connection === 'close') {
          const code = (lastDisconnect?.error as any)?.output?.statusCode
          const loggedOut = code === DisconnectReason.loggedOut
          console.log(`[baileys] socket fechado: ${conexaoId} code=${code} loggedOut=${loggedOut}`)

          if (loggedOut) {
            // Sessão inválida — apagar do disco para forçar novo QR
            await rm(sessionDir, { recursive: true, force: true }).catch(() => {})
            console.log(`[baileys] sessão apagada: ${sessionDir}`)
            entry.status = 'desconectado'
            onUpdate(entry)
            await supabase
              .from('conexoes_whatsapp')
              .update({ status: 'desconectado', qr_code: null } as never)
              .eq('id', conexaoId)
          }

          // Notifica o manager. Ele decide se reconecta (515) ou não (401).
          onDisconnect(code, loggedOut)

          if (!resolved) {
            resolved = true
            if (loggedOut) {
              reject(new Error(`Sessão encerrada pelo WhatsApp (code=${code})`))
            } else {
              // 515 ou outro: resolve para liberar o POST /conectar;
              // o manager vai recriar o socket em background.
              resolve(entry)
            }
          }
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
