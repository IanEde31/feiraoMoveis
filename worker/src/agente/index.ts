import type { WASocket } from '@whiskeysockets/baileys'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'
import { persistirMensagemEnviada } from '../persistir-mensagem-enviada'

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

const MODELO = 'gemini-2.5-flash'
const TOKEN_LINK_AR = 'LINK_AR'
const PALAVRAS_CHAVE_AR = [
  'realidade aumentada',
  'ver em casa',
  'ver na minha casa',
  'no meu ambiente',
  'no meu quarto',
  'na minha sala',
  'como fica',
  'como ficaria',
  ' ar ',
  'ambiente',
]

const SYSTEM_INSTRUCTION = `Você é um consultor de vendas da Feirão Móveis, uma loja de móveis de luxo no Brasil.
Atenda em Português-BR, com tom acolhedor, consultivo e premium — nunca robótico.

Diretrizes:
- Respostas curtas (1 a 3 frases). Pergunte para entender a necessidade do cliente antes de empurrar produto.
- Foque em conforto, durabilidade, design e como o móvel transforma o ambiente.
- Quando o cliente demonstrar interesse em VISUALIZAR o produto no ambiente dele (palavras como "realidade aumentada", "ver em casa", "como fica na minha sala", "no meu ambiente", "AR"), responda com uma frase curta convidando a experimentar e escreva, em uma linha separada, EXATAMENTE o token: ${TOKEN_LINK_AR}
- Nunca invente preços, prazos de entrega ou estoque. Se perguntarem, diga que vai confirmar com a equipe.
- Não use emojis em excesso (no máximo 1 por mensagem).`

type Args = {
  conexaoId: string
  contatoId: string
  jid: string
  texto: string
  sock: WASocket
}

export async function responderComAgente({
  conexaoId,
  contatoId,
  jid,
  texto,
  sock,
}: Args): Promise<void> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.warn('[agente] GOOGLE_AI_API_KEY ausente — agente desativado')
      return
    }

    // 1. Verifica flags de ativação
    const { data: conexao } = await supabase
      .from('conexoes_whatsapp')
      .select('agente_ativo, organization_id')
      .eq('id', conexaoId)
      .single()

    if (!conexao?.agente_ativo) return

    const { data: contato } = await supabase
      .from('contatos_whatsapp')
      .select('agente_ativo, is_grupo')
      .eq('id', contatoId)
      .single()

    if (!contato) return
    if (contato.is_grupo) return // não responde em grupos
    if (contato.agente_ativo === false) return // override explícito desligado

    // 2. Carrega histórico curto
    const { data: historico } = await supabase
      .from('mensagens_whatsapp')
      .select('conteudo, enviado_por_nos, timestamp_whatsapp')
      .eq('contato_id', contatoId)
      .not('conteudo', 'is', null)
      .order('timestamp_whatsapp', { ascending: false })
      .limit(10)

    const mensagens = (historico ?? []).slice().reverse()

    // 3. Monta contents para Gemini (multi-turn)
    const contents = mensagens.map((m) => ({
      role: m.enviado_por_nos ? 'model' : 'user',
      parts: [{ text: m.conteudo ?? '' }],
    }))

    // garante que a última mensagem (a recém-recebida) está presente
    const ultima = contents[contents.length - 1]
    if (!ultima || ultima.role !== 'user' || ultima.parts[0]?.text !== texto) {
      contents.push({ role: 'user', parts: [{ text: texto }] })
    }

    // 4. Chama Gemini
    const ai = new GoogleGenAI({ apiKey })
    const resp = await ai.models.generateContent({
      model: MODELO,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    })

    const bruto = (resp.text ?? '').trim()
    if (!bruto) return

    // 5. Pós-processa: substitui token + fallback heurístico
    const linkAr = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/ar`
    let resposta = bruto

    if (resposta.includes(TOKEN_LINK_AR)) {
      resposta = resposta.replace(new RegExp(TOKEN_LINK_AR, 'g'), linkAr)
    } else {
      const txtLower = ` ${texto.toLowerCase()} `
      const querAr = PALAVRAS_CHAVE_AR.some((p) => txtLower.includes(p))
      if (querAr && !resposta.includes(linkAr)) {
        resposta = `${resposta}\n\n${linkAr}`
      }
    }

    // 6. Aguarda 3s antes de responder — sensação mais natural e evita
    //    inversão de ordem por race entre o ack do Baileys e o handler do user
    await new Promise((r) => setTimeout(r, 3000))

    // 7. Envia e persiste manualmente (Baileys não re-emite messages.upsert
    //    de forma confiável para mensagens da própria sessão)
    const resultado = await sock.sendMessage(jid, { text: resposta })
    if (resultado?.key?.id) {
      await persistirMensagemEnviada({
        supabase,
        conexaoId,
        contatoId,
        jid,
        meuJid: sock.user?.id ?? '',
        messageId: resultado.key.id,
        conteudo: resposta,
        timestampSegundos: resultado.messageTimestamp ?? null,
        organizationId: conexao.organization_id,
      })
    }
  } catch (e) {
    console.error('[agente] falha ao responder', e)
  }
}
