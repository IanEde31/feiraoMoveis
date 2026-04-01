---
name: commit
description: Gera e executa um commit semântico em Português-BR baseado nas mudanças staged
allowed-tools: Bash(git diff *), Bash(git status *), Bash(git add *), Bash(git commit *)
disable-model-invocation: false
---

# Criar Commit Semântico

Analise as mudanças e crie um commit com mensagem semântica em Português-BR.

## Estado atual

- **Status**: !`git status --short`
- **Diff staged**: !`git diff --cached`
- **Diff unstaged**: !`git diff`

## Tipos de commit (Conventional Commits em PT-BR)

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem nova funcionalidade |
| `style` | Mudanças de estilo/formatação |
| `docs` | Documentação |
| `test` | Testes |
| `chore` | Tarefas de manutenção (deps, config) |
| `migration` | Nova migration do Supabase |

## Formato da mensagem

```
tipo(escopo): descrição curta em português

Corpo opcional explicando o porquê da mudança.
```

**Exemplos:**
```
feat(produtos): adiciona CRUD completo com gestão de estoque
fix(whatsapp): corrige reconexão automática após timeout
migration(clientes): adiciona tabela de histórico de interações
```

## Processo

1. Analisar o diff para entender o que mudou
2. Identificar o tipo e escopo corretos
3. Redigir mensagem clara e objetiva em Português-BR
4. Se houver arquivos não staged relevantes, perguntar se devem ser incluídos
5. Executar `git commit -m "mensagem"`

## Regras
- Mensagem no imperativo: "adiciona", "corrige", "remove" (não "adicionado", "corrigiu")
- Máximo 72 caracteres na primeira linha
- Escopo em kebab-case entre parênteses
- Nunca usar `--no-verify`
