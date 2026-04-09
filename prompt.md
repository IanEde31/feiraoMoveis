Você é um desenvolvedor sênior especialista em UX. No arquivo @app\(dashboard)\whatsapp\page.tsx você vai encontrar o código atual da tela de WhatsApp. Refatore completamente para suportar equipes com múltiplos vendedores, gerentes e agentes.

## Contexto do sistema
- Tela de espelho de conversas WhatsApp em tempo real
- Componentes existentes no arquivo @app\(dashboard)\whatsapp\page.tsx devem ser movidos para a pasta @components\whatsapp

## Mudanças solicitadas

### 1. Layout geral — migrar para 3 colunas
- Coluna esquerda (280px): lista de conversas com filtros
- Coluna central (flex): área de chat
- Coluna direita (240px): painel de contexto do cliente
- Manter sidebar de navegação existente

### 2. Barra de métricas (topo da coluna esquerda)
Adicionar 3 indicadores em tempo real:
- Total de conversas abertas
- Conversas aguardando resposta (sem reply do agente há mais de X minutos)
- CSAT médio do dia (se disponível, senão omitir)

### 3. Filtros de conversas
Adicionar abas de filtro rápido logo abaixo das métricas:
- "Todas" — padrão
- "Minhas" — filtra pelo agente logado
- "Sem atribuição" — conversas sem agente responsável
- "Urgente" — conversas marcadas como prioridade alta
Manter o campo de busca existente

### 4. Cards de conversa — enriquecer as informações
Cada item da lista deve exibir:
- Avatar com iniciais + indicador de prioridade (ponto colorido: vermelho = urgente, amarelo = normal, verde = baixo)
- Nome do contato + preview da última mensagem
- Hora + badge de status (novo, aguardando, resolvido)
- Nome do agente responsável + equipe/setor (abaixo do preview)
- Indicador visual de online/ocupado/ausente do agente

### 5. Cabeçalho do chat
Substituir o cabeçalho simples por:
- Avatar + nome + número do contato
- Botão "Transferir" — abre modal para selecionar agente disponível
- Botão "Histórico" — abre painel/drawer com conversas anteriores desse contato
- Botão "Resolver" — marca a conversa como resolvida e move para arquivo

### 6. Respostas rápidas
Acima do campo de digitação, adicionar uma barra fina(pequena) de respostas rápidas:
- Exibir até 4 chips horizontais configuráveis (ex: "Saudação", "Prazo entrega", "Formas de pagamento")
- Ao clicar, preenche o campo de texto com o conteúdo da resposta
- Botão "+ Nova" que abre um modal para criar/editar respostas rápidas
- Respostas rápidas devem ser salvas por equipe/número conectado

### 7. Painel de contexto (nova coluna direita)
Implementar 5 seções colapsáveis:

**Dados do cliente**
- Nome, telefone, data da primeira conversa
- Total de pedidos + LTV (valor total gasto) — buscar da entidade Cliente se existir
- Etapa atual no funil de vendas

**Tags**
- Lista de tags associadas ao contato
- Botão para adicionar/remover tags
- Tags devem ser salvas no cadastro do contato

**Atribuição**
- Exibir agente atual responsável pela conversa
- Botão "Trocar" — abre dropdown com agentes disponíveis
- Ao trocar, registrar no histórico da conversa

**Notas internas**
- Textarea para anotações visíveis apenas para a equipe
- Botão "Salvar nota"
- Exibir notas anteriores em ordem cronológica

### 8. Atribuição de conversas
- Conversas novas sem agente devem aparecer com badge "Sem atribuição" em destaque
- Gerentes devem conseguir atribuir qualquer conversa para qualquer agente
- Agentes só visualizam e atribuem para si mesmos
- Ao atribuir, enviar notificação interna para o agente (toast ou badge)

## Regras de implementação
- Não quebrar o funcionamento atual da conexão WebSocket/polling de mensagens
- Manter compatibilidade com o seletor de número conectado existente (dropdown)
- Todas as novas seções devem ter estados de loading e empty state tratados
- Responsividade: em telas menores que 1024px, ocultar a coluna direita; abaixo de 768px, comportamento mobile com navegação por abas
- Usar os mesmos tokens de cor e componentes do design system atual 

## O que NÃO mudar
- Lógica de conexão e autenticação do WhatsApp
- Estrutura de rotas existente
- Sidebar de navegação principal

## Entregáveis esperados
1. Listar todos os arquivos que serão criados ou modificados antes de começar
2. Implementar as mudanças de forma incremental, componente por componente
3. Para cada dado novo (LTV, funil, notas, tags), verificar se já existe no banco/API antes de criar novas tabelas — e caso não encontre, liste no arquivo @CLAUDE.md para a próxima sessão
4. Ao final, listar o que foi implementado e o que ficou pendente por falta de dados na API