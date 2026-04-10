import { createClient } from '@supabase/supabase-js'
import { criarConexao, obterConexao } from './baileys/manager'
import { persistirMensagemEnviada } from './persistir-mensagem-enviada'

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

type Comando = {
  id: string
  tipo: string
  payload: Record<string, unknown>
}

async function processarComando(comando: Comando): Promise<{ ok: true }> {
  const { tipo, payload } = comando

  if (tipo === 'enviar_mensagem') {
    const { conexao_id, jid, texto, contato_id } = payload as {
      conexao_id: string
      jid: string
      texto: string
      contato_id: string
    }

    const conexao = obterConexao(conexao_id)
    if (!conexao || conexao.status !== 'conectado') {
      throw new Error('Conexão não encontrada ou não está conectada')
    }

    const resultado = await conexao.sock.sendMessage(jid, { text: texto })

    if (resultado?.key?.id) {
      // Busca organization_id para persistir
      const { data: conexaoDB } = await supabase
        .from('conexoes_whatsapp')
        .select('organization_id')
        .eq('id', conexao_id)
        .single()

      if (conexaoDB?.organization_id) {
        await persistirMensagemEnviada({
          supabase,
          organizationId: conexaoDB.organization_id,
          conexaoId: conexao_id,
          contatoId: contato_id,
          jid,
          meuJid: conexao.sock.user?.id ?? '',
          messageId: resultado.key.id,
          conteudo: texto,
          timestampSegundos: resultado.messageTimestamp ?? null,
        })
      }
    }

    return { ok: true }
  }

  if (tipo === 'criar_conexao') {
    const { conexao_id } = payload as { conexao_id: string }
    console.log(`[comandos] iniciando criarConexao para ${conexao_id}`)
    const entry = await criarConexao(conexao_id)
    console.log(`[comandos] criarConexao retornou status: ${entry.status}`)
    return { ok: true }
  }

  throw new Error(`Tipo desconhecido: ${tipo}`)
}

async function executarComando(comando: Comando): Promise<void> {
  // Lock atômico — só processa se ainda estiver pendente
  const { count } = await supabase
    .from('comandos_whatsapp')
    .update({ status: 'processando' } as never)
    .eq('id', comando.id)
    .eq('status', 'pendente')
    .select('id', { count: 'exact', head: true })

  if (!count) {
    console.log(`[comandos] comando ${comando.id} já foi pego por outro worker`)
    return
  }

  try {
    const resultado = await processarComando(comando)
    await supabase
      .from('comandos_whatsapp')
      .update({ status: 'concluido', resultado } as never)
      .eq('id', comando.id)
    console.log(`[comandos] ${comando.tipo} ${comando.id} concluído`)
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e)
    console.error(`[comandos] erro ao processar ${comando.tipo} ${comando.id}:`, e)
    await supabase
      .from('comandos_whatsapp')
      .update({ status: 'erro', erro } as never)
      .eq('id', comando.id)
    console.error(`[comandos] ${comando.tipo} ${comando.id} falhou:`, erro)
  }
}

export async function iniciarListenerComandos(): Promise<void> {
  // 1. Processa pendentes acumulados antes do boot
  const { data: pendentes, error } = await supabase
    .from('comandos_whatsapp')
    .select('id, tipo, payload')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[comandos] erro ao buscar pendentes no boot', error)
  } else if (pendentes?.length) {
    console.log(`[comandos] ${pendentes.length} comando(s) pendente(s) no boot`)
    for (const cmd of pendentes) {
      await executarComando(cmd as Comando)
    }
  }

  // 2. Realtime — escuta novos comandos pendentes
  supabase
    .channel('comandos_whatsapp')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comandos_whatsapp',
      },
      (event) => {
        const cmd = event.new as Comando & { status: string }
        if (cmd?.status !== 'pendente') return
        console.log(`[comandos] novo comando recebido: ${cmd.tipo} ${cmd.id}`)
        executarComando(cmd).catch((e) =>
          console.error('[comandos] erro inesperado ao executar', e)
        )
      }
    )
    .subscribe((status, err) => {
      console.log('[comandos] realtime status:', status)
      if (err) console.error('[comandos] realtime erro:', JSON.stringify(err))
    })
}
