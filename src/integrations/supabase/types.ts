export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          domain: string | null
          id: string
          service: string
          username: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          domain?: string | null
          id?: string
          service: string
          username?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          domain?: string | null
          id?: string
          service?: string
          username?: string | null
        }
        Relationships: []
      }
      document_access: {
        Row: {
          access_type: string
          created_at: string | null
          document_id: string | null
          id: string
          query_text: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          query_text?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          query_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      document_content: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_content_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string
          filename: string
          id: string
          last_processed_date: string | null
          project_id: string | null
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          upload_date: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          last_processed_date?: string | null
          project_id?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          last_processed_date?: string | null
          project_id?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_logs: {
        Row: {
          created_at: string | null
          document_id: string | null
          event_type: string
          id: string
          message: string | null
          processing_time: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          event_type: string
          id?: string
          message?: string | null
          processing_time?: number | null
          status: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          event_type?: string
          id?: string
          message?: string | null
          processing_time?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          project_id: string | null
          type: string
          uploaded_at: string
        }
        Insert: {
          content?: Json | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          project_id?: string | null
          type: string
          uploaded_at?: string
        }
        Update: {
          content?: Json | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          document_id: string | null
          document_type: string
          embedding: string | null
          id: string
          project_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          document_id?: string | null
          document_type: string
          embedding?: string | null
          id?: string
          project_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          document_id?: string | null
          document_type?: string
          embedding?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_context: {
        Row: {
          created_at: string
          document_ids: string[] | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          document_ids?: string[] | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          document_ids?: string[] | null
          id?: string
          project_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          bitbucket_url: string | null
          created_at: string
          details: string | null
          google_drive_url: string | null
          id: string
          jira_url: string | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          bitbucket_url?: string | null
          created_at?: string
          details?: string | null
          google_drive_url?: string | null
          id?: string
          jira_url?: string | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          bitbucket_url?: string | null
          created_at?: string
          details?: string | null
          google_drive_url?: string | null
          id?: string
          jira_url?: string | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_artifacts: {
        Row: {
          code_content: string | null
          created_at: string
          id: string
          lld_content: string | null
          project_id: string | null
          sprint_id: string | null
          story_id: string
          test_content: string | null
          updated_at: string
        }
        Insert: {
          code_content?: string | null
          created_at?: string
          id?: string
          lld_content?: string | null
          project_id?: string | null
          sprint_id?: string | null
          story_id: string
          test_content?: string | null
          updated_at?: string
        }
        Update: {
          code_content?: string | null
          created_at?: string
          id?: string
          lld_content?: string | null
          project_id?: string | null
          sprint_id?: string | null
          story_id?: string
          test_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_document_chunks: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter?: Json
        }
        Returns: {
          id: string
          document_id: string
          chunk_text: string
          chunk_index: number
          document_title: string
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter?: Json
        }
        Returns: {
          id: string
          project_id: string
          document_id: string
          document_type: string
          chunk_text: string
          chunk_index: number
          document_name: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
