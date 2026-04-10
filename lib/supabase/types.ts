export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ambientacoes: {
        Row: {
          ambiente_path: string
          cliente_id: string
          created_at: string
          id: string
          mensagem_erro: string | null
          metadata: Json | null
          miniatura_path: string | null
          modelo: string | null
          organization_id: string
          produtos_ids: string[]
          produtos_snapshot: Json
          prompt: string | null
          provedor: string | null
          resultado_path: string
          status: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          ambiente_path: string
          cliente_id: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          metadata?: Json | null
          miniatura_path?: string | null
          modelo?: string | null
          organization_id: string
          produtos_ids?: string[]
          produtos_snapshot?: Json
          prompt?: string | null
          provedor?: string | null
          resultado_path: string
          status?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          ambiente_path?: string
          cliente_id?: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          metadata?: Json | null
          miniatura_path?: string | null
          modelo?: string | null
          organization_id?: string
          produtos_ids?: string[]
          produtos_snapshot?: Json
          prompt?: string | null
          provedor?: string | null
          resultado_path?: string
          status?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambientacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambientacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_produto: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: Json | null
          estagio_id: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          origem: string | null
          tags: string[]
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
          vendedor_id: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          estagio_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          origem?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          estagio_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          origem?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_estagio_id_fkey"
            columns: ["estagio_id"]
            isOneToOne: false
            referencedRelation: "estagios_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_whatsapp: {
        Row: {
          agente_ativo: boolean
          api_key: string | null
          ativo: boolean
          base_url: string | null
          created_at: string
          id: string
          instancia: string | null
          nome: string
          numero_telefone: string | null
          organization_id: string
          provedor: string
          qr_code: string | null
          qr_expiracao: string | null
          session_path: string | null
          status: string
          ultima_atividade: string | null
          updated_at: string
          usuario_responsavel_id: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          agente_ativo?: boolean
          api_key?: string | null
          ativo?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          instancia?: string | null
          nome: string
          numero_telefone?: string | null
          organization_id: string
          provedor: string
          qr_code?: string | null
          qr_expiracao?: string | null
          session_path?: string | null
          status?: string
          ultima_atividade?: string | null
          updated_at?: string
          usuario_responsavel_id?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          agente_ativo?: boolean
          api_key?: string | null
          ativo?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          instancia?: string | null
          nome?: string
          numero_telefone?: string | null
          organization_id?: string
          provedor?: string
          qr_code?: string | null
          qr_expiracao?: string | null
          session_path?: string | null
          status?: string
          ultima_atividade?: string | null
          updated_at?: string
          usuario_responsavel_id?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_whatsapp_usuario_responsavel_id_fkey"
            columns: ["usuario_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_whatsapp: {
        Row: {
          agente_ativo: boolean | null
          avatar_url: string | null
          cliente_id: string | null
          conexao_id: string
          created_at: string
          id: string
          is_grupo: boolean
          jid: string
          nao_perturbar: boolean
          nome: string | null
          nome_push: string | null
          numero_telefone: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          agente_ativo?: boolean | null
          avatar_url?: string | null
          cliente_id?: string | null
          conexao_id: string
          created_at?: string
          id?: string
          is_grupo?: boolean
          jid: string
          nao_perturbar?: boolean
          nome?: string | null
          nome_push?: string | null
          numero_telefone: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          agente_ativo?: boolean | null
          avatar_url?: string | null
          cliente_id?: string | null
          conexao_id?: string
          created_at?: string
          id?: string
          is_grupo?: boolean
          jid?: string
          nao_perturbar?: boolean
          nome?: string | null
          nome_push?: string | null
          numero_telefone?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_whatsapp_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_meta: {
        Row: {
          contato_id: string | null
          created_at: string | null
          id: string
          notas: string | null
          organization_id: string
          prioridade: string | null
          status: string | null
          tags: Json | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string | null
          id?: string
          notas?: string | null
          organization_id: string
          prioridade?: string | null
          status?: string | null
          tags?: Json | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string | null
          id?: string
          notas?: string | null
          organization_id?: string
          prioridade?: string | null
          status?: string | null
          tags?: Json | null
        }
        Relationships: []
      }
      estagios_kanban: {
        Row: {
          cor: string
          created_at: string
          descricao: string | null
          eh_final: boolean
          icone: string | null
          id: string
          nome: string
          ordem: number
          tipo_final: string | null
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          descricao?: string | null
          eh_final?: boolean
          icone?: string | null
          id?: string
          nome: string
          ordem: number
          tipo_final?: string | null
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          descricao?: string | null
          eh_final?: boolean
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          tipo_final?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      historico_kanban: {
        Row: {
          cliente_id: string
          created_at: string
          estagio_anterior_id: string | null
          estagio_novo_id: string
          id: string
          observacao: string | null
          organization_id: string
          usuario_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estagio_anterior_id?: string | null
          estagio_novo_id: string
          id?: string
          observacao?: string | null
          organization_id: string
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estagio_anterior_id?: string | null
          estagio_novo_id?: string
          id?: string
          observacao?: string | null
          organization_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_kanban_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_kanban_estagio_anterior_id_fkey"
            columns: ["estagio_anterior_id"]
            isOneToOne: false
            referencedRelation: "estagios_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_kanban_estagio_novo_id_fkey"
            columns: ["estagio_novo_id"]
            isOneToOne: false
            referencedRelation: "estagios_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_kanban_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      interacoes_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string
          id: string
          organization_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao: string
          id?: string
          organization_id: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string
          id?: string
          organization_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_cliente_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_negociacao: {
        Row: {
          created_at: string
          desconto_percentual: number
          id: string
          negociacao_id: string
          organization_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number | null
        }
        Insert: {
          created_at?: string
          desconto_percentual?: number
          id?: string
          negociacao_id: string
          organization_id: string
          preco_unitario: number
          produto_id: string
          quantidade?: number
          subtotal?: number | null
        }
        Update: {
          created_at?: string
          desconto_percentual?: number
          id?: string
          negociacao_id?: string
          organization_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_negociacao_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_negociacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_agente: {
        Row: {
          conexao_id: string | null
          contato_id: string | null
          created_at: string | null
          erro: string | null
          id: string
          latencia_ms: number | null
          modelo: string | null
          organization_id: string
          sucesso: boolean | null
          tokens_usados: number | null
        }
        Insert: {
          conexao_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          latencia_ms?: number | null
          modelo?: string | null
          organization_id: string
          sucesso?: boolean | null
          tokens_usados?: number | null
        }
        Update: {
          conexao_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          latencia_ms?: number | null
          modelo?: string | null
          organization_id?: string
          sucesso?: boolean | null
          tokens_usados?: number | null
        }
        Relationships: []
      }
      mensagens_whatsapp: {
        Row: {
          conexao_id: string
          contato_id: string
          conteudo: string | null
          created_at: string
          de: string
          enviado_pela_ia: boolean | null
          enviado_por_nos: boolean
          id: string
          media_mime_type: string | null
          media_nome_arquivo: string | null
          media_url: string | null
          mensagem_reply_id: string | null
          message_id: string
          organization_id: string
          para: string
          status_entrega: string | null
          timestamp_whatsapp: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          conexao_id: string
          contato_id: string
          conteudo?: string | null
          created_at?: string
          de: string
          enviado_pela_ia?: boolean | null
          enviado_por_nos?: boolean
          id?: string
          media_mime_type?: string | null
          media_nome_arquivo?: string | null
          media_url?: string | null
          mensagem_reply_id?: string | null
          message_id: string
          organization_id: string
          para: string
          status_entrega?: string | null
          timestamp_whatsapp: string
          tipo?: string
          usuario_id?: string | null
        }
        Update: {
          conexao_id?: string
          contato_id?: string
          conteudo?: string | null
          created_at?: string
          de?: string
          enviado_pela_ia?: boolean | null
          enviado_por_nos?: boolean
          id?: string
          media_mime_type?: string | null
          media_nome_arquivo?: string | null
          media_url?: string | null
          mensagem_reply_id?: string | null
          message_id?: string
          organization_id?: string
          para?: string
          status_entrega?: string | null
          timestamp_whatsapp?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_whatsapp_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_estoque: {
        Row: {
          created_at: string
          estoque_anterior: number
          estoque_posterior: number
          id: string
          motivo: string | null
          organization_id: string
          produto_id: string
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          estoque_anterior: number
          estoque_posterior: number
          id?: string
          motivo?: string | null
          organization_id: string
          produto_id: string
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          estoque_anterior?: number
          estoque_posterior?: number
          id?: string
          motivo?: string | null
          organization_id?: string
          produto_id?: string
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_estoque_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      negociacoes: {
        Row: {
          cliente_id: string
          created_at: string
          data_fechamento: string | null
          desconto_geral: number | null
          id: string
          motivo_perda: string | null
          observacoes: string | null
          organization_id: string
          status: string
          titulo: string | null
          updated_at: string
          usuario_id: string | null
          valor_total: number | null
          valor_total_manual: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fechamento?: string | null
          desconto_geral?: number | null
          id?: string
          motivo_perda?: string | null
          observacoes?: string | null
          organization_id: string
          status?: string
          titulo?: string | null
          updated_at?: string
          usuario_id?: string | null
          valor_total?: number | null
          valor_total_manual?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fechamento?: string | null
          desconto_geral?: number | null
          id?: string
          motivo_perda?: string | null
          observacoes?: string | null
          organization_id?: string
          status?: string
          titulo?: string | null
          updated_at?: string
          usuario_id?: string | null
          valor_total?: number | null
          valor_total_manual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          descricao: string | null
          descricao_curta: string | null
          dimensoes: Json | null
          estoque_atual: number
          estoque_minimo: number
          fabricante: string | null
          id: string
          imagens: string[]
          margem_lucro: number | null
          material: string | null
          modelo_3d_ios_path: string | null
          modelo_3d_path: string | null
          nome: string
          organization_id: string
          preco_custo: number | null
          preco_venda: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          dimensoes?: Json | null
          estoque_atual?: number
          estoque_minimo?: number
          fabricante?: string | null
          id?: string
          imagens?: string[]
          margem_lucro?: number | null
          material?: string | null
          modelo_3d_ios_path?: string | null
          modelo_3d_path?: string | null
          nome: string
          organization_id: string
          preco_custo?: number | null
          preco_venda: number
          sku?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          dimensoes?: Json | null
          estoque_atual?: number
          estoque_minimo?: number
          fabricante?: string | null
          id?: string
          imagens?: string[]
          margem_lucro?: number | null
          material?: string | null
          modelo_3d_ios_path?: string | null
          modelo_3d_path?: string | null
          nome?: string
          organization_id?: string
          preco_custo?: number | null
          preco_venda?: number
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_rapidas: {
        Row: {
          conexao_id: string | null
          created_at: string | null
          criada_por: string | null
          id: string
          organization_id: string
          texto: string | null
          titulo: string | null
        }
        Insert: {
          conexao_id?: string | null
          created_at?: string | null
          criada_por?: string | null
          id?: string
          organization_id: string
          texto?: string | null
          titulo?: string | null
        }
        Update: {
          conexao_id?: string | null
          created_at?: string | null
          criada_por?: string | null
          id?: string
          organization_id?: string
          texto?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          clerk_id: string
          created_at: string
          email: string
          id: string
          nome: string | null
          nome_completo: string | null
          organization_id: string
          papel: string
          sobrenome: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          clerk_id: string
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          nome_completo?: string | null
          organization_id: string
          papel?: string
          sobrenome?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          clerk_id?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          nome_completo?: string | null
          organization_id?: string
          papel?: string
          sobrenome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      ultimas_mensagens_por_contato: {
        Row: {
          conexao_id: string | null
          contato_id: string | null
          conteudo: string | null
          enviado_por_nos: boolean | null
          mensagem_id: string | null
          nao_lidas: number | null
          organization_id: string | null
          status_entrega: string | null
          timestamp_whatsapp: string | null
          tipo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_whatsapp_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clerk_user_id: { Args: never; Returns: string }
      current_org_id: { Args: never; Returns: string }
      current_usuario_id: { Args: never; Returns: string }
      current_usuario_papel: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_ou_gerente: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
