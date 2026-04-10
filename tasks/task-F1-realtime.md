## Task F1 — Reativar Realtime WhatsApp

### Contexto
- Módulo: app/(dashboard)/whatsapp/
- JWT Clerk agora emite role:authenticated — RLS pode ser satisfeita
- Polling atual: 3 intervals (5s/3s/8s) em page.tsx ou hooks adjacentes
- Supabase client: lib/supabase/client.ts

### Problema atual
Polling substitui Realtime porque JWT não emitia role:authenticated.
JWT agora corrigido. Polling precisa ser removido e Realtime reativado.

### O que fazer
1. Localizar os 3 setInterval/polling na página WhatsApp
2. Substituir por canais postgres_changes para INSERT em:
   - mensagens_whatsapp (filtro: conexao_id = X)
   - contatos_whatsapp (filtro: conexao_id = X)
3. Manter polling APENAS para QR code

### NÃO alterar
- Lógica de envio de mensagem
- Componentes de UI
- lib/supabase/server.ts

### Critério de aceite
- [ ] Zero setInterval ativos exceto QR
- [ ] Mensagem enviada do celular aparece na UI sem refresh
- [ ] Sem erro de RLS no console do browser