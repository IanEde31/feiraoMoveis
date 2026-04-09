import { GoogleGenAI } from '@google/genai'
import type { Part } from '@google/genai'
import type { ProviderAmbientacao, InputProviderAmbientacao, OutputProviderAmbientacao } from '../provider'

const MODELO = 'gemini-3.1-flash-image-preview'

function construirPrompt(
  nomesProdutos: string[],
  promptCustom?: string
): string {
  if (promptCustom) return promptCustom

  const listaProdutos = nomesProdutos.join(', ')
  return (
    `Você é um especialista em design de interiores de alto padrão. ` +
    `Usando a foto do ambiente fornecida como base, crie uma composição realista e elegante ` +
    `que incorpore os seguintes móveis de luxo no espaço: ${listaProdutos}. ` +
    `Mantenha a iluminação, perspectiva e proporções originais do ambiente. ` +
    `A composição deve parecer uma fotografia real de um showroom premium, ` +
    `com os móveis perfeitamente integrados ao espaço existente.`
  )
}

async function urlParaBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
    return { data: buffer.toString('base64'), mimeType: mimeType.split(';')[0] }
  } catch {
    return null
  }
}

export const geminiProvider: ProviderAmbientacao = {
  nome: 'gemini',
  modelo: MODELO,

  async gerar(input: InputProviderAmbientacao): Promise<OutputProviderAmbientacao> {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

    const prompt = construirPrompt(
      input.produtos.map((p) => p.nome),
      input.prompt
    )

    // Monta partes: texto + foto do ambiente + fotos dos produtos (até 13)
    const contents: Part[] = [{ text: prompt }]

    // Foto do ambiente (primeira — modelo presta mais atenção)
    contents.push({
      inlineData: {
        mimeType: input.ambienteMime,
        data: input.ambienteBuffer.toString('base64'),
      },
    })

    // Fotos dos produtos (busca remota, ignora falhas)
    const imagensProdutos = await Promise.all(
      input.produtos
        .filter((p) => p.imagem)
        .slice(0, 13) // limite: 14 total, 1 já usada pelo ambiente
        .map((p) => urlParaBase64(p.imagem!))
    )

    for (const img of imagensProdutos) {
      if (img) {
        contents.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
      }
    }

    const response = await ai.models.generateContent({
      model: MODELO,
      contents: [{ role: 'user', parts: contents }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const partes = response.candidates?.[0]?.content?.parts ?? []
    let imagemBase64: string | undefined
    let mimeResult = 'image/png'
    const metadataExtra: Record<string, unknown> = {}

    for (const parte of partes) {
      const p = parte as Record<string, unknown>
      if (p.inlineData) {
        const id = p.inlineData as Record<string, unknown>
        imagemBase64 = id.data as string
        mimeResult = (id.mimeType as string) ?? 'image/png'
      } else if (p.text) {
        metadataExtra.texto = p.text
      }
    }

    if (!imagemBase64) {
      throw new Error('Gemini não retornou imagem. Verifique o prompt e as imagens enviadas.')
    }

    return {
      imagemBuffer: Buffer.from(imagemBase64, 'base64'),
      mime: mimeResult,
      metadata: { modelo: MODELO, ...metadataExtra },
    }
  },
}
