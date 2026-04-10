- 1. Onde o Baileys vive no sistema
                                                                              
  Núcleo (3 arquivos — lib/whatsapp/baileys/)

  connection.ts — cria UM socket Baileys.
  - iniciarConexao(conexaoId, onUpdate, onDisconnect) retorna uma Promise que 
  resolve quando o socket tem um QR para mostrar OU conectou de fato.
  - Usa useMultiFileAuthState apontando pra pasta local sessions/<conexaoId>/ 
  (credenciais ficam em disco).
  - Chama fetchLatestBaileysVersion() pra pegar a versão do protocolo WhatsApp
   na hora (se falhar, cai pra default).
  - Registra handlers via registrarEventos(...) (em events.ts).
  - Escuta connection.update para 3 estados:
    - QR recebido → gera PNG base64 (qrcode), grava status='aguardando_qr' +  
  qr_code no Supabase, resolve a Promise.
    - connection=open → grava status='conectado', extrai o número, limpa QR.  
    - connection=close → se foi loggedOut (401), apaga a pasta de sessão do   
  disco. Notifica o manager via onDisconnect(code, loggedOut) para decidir se 
  reconecta.

  manager.ts — mantém o MAPA de todas as conexões vivas em memória do processo
   Node.
  - Usa globalThis.__baileysConexoes para sobreviver ao Hot Module Replacement
   do Next em dev (sem isso, cada save no código mataria a conexão).
  - criarConexao(id) — se já tem conexão "conectado" no map, retorna ela;     
  senão inicia nova via connection.ts.
  - obterConexao(id) — leitura pura.
  - removerConexao(id) — chama sock.end().
  - Auto-reconnect: no callback onDisconnect, se NÃO foi logout (código 515   
  "restart required" ou qualquer outro), agenda setTimeout(1500ms) e recria o 
  socket reusando a sessão do disco. Só desiste em DisconnectReason.loggedOut.

  events.ts — handlers de eventos do socket.
  - messages.upsert (filtrando só notify/append):
    a. Upsert contato em contatos_whatsapp (onConflict conexao_id,jid).       
    b. Extrai conteúdo (conversation, extendedTextMessage.text, captions de   
  imagem/vídeo/doc).
    c. Classifica tipo
  (texto|imagem|video|audio|documento|figurinha|localizacao).
    d. Upsert mensagem em mensagens_whatsapp (onConflict
  conexao_id,message_id), usando messageTimestamp do WA como fonte canônica.  
    e. Gatilho do agente IA: se !fromMe && tipo==='texto' && !isGrupo, chama  
  responderComAgente(...) — esse é o ponto crítico, bloqueia o handler inteiro
   até a resposta voltar do Gemini.
  - contacts.upsert — sincroniza nomes de contato.

  Camada de persistência compartilhada

  lib/whatsapp/persistir-mensagem-enviada.ts — helper extraído porque o       
  Baileys NÃO re-emite messages.upsert de forma confiável para mensagens da   
  própria sessão. Então tanto o enviar/route.ts (envio manual pela UI) quanto 
  o agente/index.ts precisam inserir manualmente em mensagens_whatsapp após   
  cada sock.sendMessage(). Usa onConflict: 'conexao_id,message_id' para ser   
  idempotente (caso o evento eventualmente venha).

  Agente IA

  lib/whatsapp/agente/index.ts — consumidor do socket, chamado de dentro do   
  events.ts.
  - Checa flags: conexao.agente_ativo (obrigatório) e contato.agente_ativo !==
   false (override).
  - Puxa últimas 10 mensagens, monta contents para o Gemini, chama
  generateContent.
  - Pós-processa LINK_AR token + heurística de palavras-chave.
  - setTimeout(3000), sock.sendMessage(), persistirMensagemEnviada().

  ---
  2. Rotas API que tocam no Baileys

  Rota: app/api/whatsapp/conexoes/route.ts
  Método: GET
  O que faz: Lista conexões. Detecta "stale": se DB diz conectado mas
    obterConexao() retorna undefined, marca como desconectado.
  ────────────────────────────────────────
  Rota: app/api/whatsapp/conexoes/route.ts
  Método: POST
  O que faz: Cria linha nova com provedor='baileys'. Não inicia socket.       
  ────────────────────────────────────────
  Rota: app/api/whatsapp/conexoes/[id]/route.ts
  Método: PATCH
  O que faz: Toggle agente_ativo da conexão.
  ────────────────────────────────────────
  Rota: app/api/whatsapp/conectar/route.ts
  Método: POST
  O que faz: Inicia o socket via criarConexao(). Devolve status + QR base64.  
  ────────────────────────────────────────
  Rota: app/api/whatsapp/status/route.ts
  Método: GET
  O que faz: Lê estado do map em memória (fonte primária); se não tem, cai pro

    DB.
  ────────────────────────────────────────
  Rota: app/api/whatsapp/enviar/route.ts
  Método: POST
  O que faz: obterConexao() → sock.sendMessage() → persistirMensagemEnviada().
  ────────────────────────────────────────
  Rota: app/api/whatsapp/contatos/route.ts
  Método: GET
  O que faz: Lê contatos_whatsapp + última mensagem (service role, sem        
    Baileys).
  ────────────────────────────────────────
  Rota: app/api/whatsapp/contatos/[id]/route.ts
  Método: PATCH
  O que faz: Toggle agente_ativo do contato.
  ────────────────────────────────────────
  Rota: app/api/whatsapp/mensagens/route.ts
  Método: GET
  O que faz: Lê mensagens da conversa, suporta ?desde=ISO (polling
    incremental).

  Observação importante: as rotas contatos, mensagens, conexoes (GET) não     
  importam baileys — leem puro Supabase com service role. Só conectar, enviar 
  e status acessam o map em memória.

  ---
  3. Banco de dados — tabelas usadas

  - conexoes_whatsapp: id, nome, provedor (agora aceita baileys), instancia,  
  base_url (nullable — Baileys não usa), session_path, status, qr_code,       
  numero_telefone, ultima_atividade, agente_ativo, ativo.
  - contatos_whatsapp: id, conexao_id, jid (único com conexao_id), nome,      
  nome_push, numero_telefone, is_grupo, agente_ativo (nullable = herda),      
  nao_perturbar (ainda não checada pelo agente).
  - mensagens_whatsapp: id, conexao_id, contato_id, message_id (único com     
  conexao_id), de, para, tipo, conteudo, enviado_por_nos, status_entrega,     
  timestamp_whatsapp.

  Migrations relevantes:
  - 20260407000001_baileys_support.sql — adiciona baileys ao check de
  provedor, torna base_url/instancia nullable, adiciona session_path.
  - agente_ia_whatsapp (aplicada via MCP) — colunas agente_ativo nas duas     
  tabelas.
  - 20260407000002_whatsapp_realtime_publication.sql — adiciona as 3 tabelas à
   publication Realtime (preparada, mas Realtime ainda não reativado).        

  ---
  4. Sessões no disco

  Pasta sessions/<conexaoId>/ (em process.cwd()) — criada por
  useMultiFileAuthState. Contém:
  - creds.json — credenciais principais (Noise, Signal identity, device info) 
  - app-state-sync-key-*.json, pre-key-*.json, sender-key-*.json,
  session-*.json — material criptográfico do Signal Protocol

  Apagada automaticamente só em loggedOut. Se você deletar manualmente com o  
  socket vivo, o socket quebra na próxima ação.

  ---
  5. Frontend — quem consome

  app/(dashboard)/whatsapp/page.tsx é o único consumidor da UI. Não importa   
  baileys diretamente — só bate nas rotas API via fetch. Usa polling:
  - 5s → GET /api/whatsapp/contatos?conexao_id=... (lista + últimas msgs)     
  - 3s → GET /api/whatsapp/mensagens?contato_id=...&desde=... (incremental)   
  - 8s → GET /api/whatsapp/conexoes (status)

  Componentes em components/whatsapp/ são puramente visuais — nenhum deles    
  toca baileys.

  ---
  6. Config que habilita tudo

  next.config.ts:
  serverExternalPackages: ['baileys', 'qrcode']
  Impede o webpack de bundlar baileys (que tem deps nativas/opcionais: jimp,  
  sharp, coisas que dependem de path/fs). Sem isso, o build explode — foi o   
  bug que te travou na sessão passada com instrumentation.ts.

  Runtime de todas as rotas que tocam baileys: export const runtime = 'nodejs'
   (não Edge, obrigatório) + dynamic = 'force-dynamic'.

  ---
  7. Fluxos end-to-end

  Fluxo A — conectar um número novo
  1. UI chama POST /api/whatsapp/conexoes {nome} → cria linha
  status='desconectado'.
  2. UI chama POST /api/whatsapp/conectar {conexao_id}.
  3. manager.criarConexao → connection.iniciarConexao → makeWASocket → evento 
  qr → QR base64 devolvido na resposta.
  4. UI mostra QR, usuário escaneia → connection.update com open → DB
  atualizado.
  5. UI continua batendo /status até ver conectado.

  Fluxo B — recebimento
  1. Celular envia msg → WA relay → evento messages.upsert no socket Node.    
  2. events.ts upserta contato + mensagem.
  3. Se qualifica, chama responderComAgente (bloqueante!).
  4. Polling do front (3s) pega a nova msg.

  Fluxo C — envio manual
  1. UI → POST /api/whatsapp/enviar {conexao_id, jid, texto}.
  2. obterConexao → sock.sendMessage → persistirMensagemEnviada.

  Fluxo D — envio do agente — idêntico ao C mas disparado de dentro do handler
   messages.upsert.

  Fluxo E — restart do processo Node
  1. npm run dev reinicia → map em memória vazio.
  2. GET conexões detecta stale, atualiza DB para desconectado.
  3. Usuário precisa clicar "Conectar" manualmente. Como a sessão está em     
  disco, não precisa escanear QR de novo — reconecta direto.

  ---
  8. Pontos frágeis / gambiarras reais

  1. globalThis.__baileysConexoes — funciona em dev (HMR) e em processo único;
   morre em qualquer ambiente com múltiplos workers/serverless (Vercel, PM2   
  cluster). O Baileys precisa ser um worker dedicado, não rodar dentro do     
  Next.
  2. Auto-reconnect só em tempo de runtime do processo — se o Node reiniciar, 
  não reconecta sozinho. Tentativa anterior com instrumentation.ts quebrou    
  porque baileys não é bundlável.
  3. Agente bloqueia o handler messages.upsert — await responderComAgente     
  dentro do loop. Se chega uma rajada de 5 msgs, processamento fica
  serializado por ~10-15s. Deveria ser fila.
  4. as never espalhado nos upserts — perda de tipagem.
  5. Persistência manual duplicada (enviar + agente) porque messages.upsert   
  não re-emite para fromMe. O helper minimiza, mas a causa raiz é
  arquitetural.
  6. QR em base64 no banco — ok, mas fica "sujando" a linha depois que conecta
   (limpado, mas só no open).
  7. Nenhum handler para messages.update — não captura status de
  entrega/leitura (ack/delivered/read). O status_entrega sempre fica em       
  'entregue' ou 'enviado', nunca avança.
  8. Sem handler para mídias — imagem/áudio/video gravados com conteudo=null e
   só o tipo. Ninguém baixa o binário (seria downloadMediaMessage do baileys +
   upload pro Storage).
  9. contacts.upsert ignorado na UI — sincroniza nomes no DB, mas a tela não  
  reflete mudanças de nome.
  10. Adaptadores multi-provedor mencionados no CLAUDE.md não existem — só    
  baileys está implementado. A "interface unificada" é aspiracional.

  ---
  9. Resumo mental em uma frase

  ▎ Há UM processo Node do Next, com UM map em memória (globalThis) guardando 
  ▎ N sockets Baileys; cada socket lê credenciais de sessions/<id>/, emite    
  ▎ eventos que caem em events.ts e vão direto pro Supabase; a UI não fala com
  ▎  baileys — fala com o Supabase via rotas API que por sua vez leem do map  
  ▎ quando precisam mandar mensagem.

  O modelo mental correto pra manter o sistema é: "Baileys é um daemon        
  disfarçado rodando dentro do Next." Essa é a tensão arquitetural de fundo — 
  o Next é request/response, o Baileys é long-lived stateful. A médio prazo o 
  caminho saudável é separar em processo próprio (Opção C do plano de amanhã).