export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      links: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          tags: string[];
          is_pinned: boolean;
          row_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          tags?: string[];
          is_pinned?: boolean;
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          tags?: string[];
          is_pinned?: boolean;
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      keywords: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          tags: string[];
          row_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          tags?: string[];
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          tags?: string[];
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      keyword_entries: {
        Row: {
          id: string;
          keyword_id: string;
          title: string | null;
          content: string;
          row_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword_id: string;
          title?: string | null;
          content: string;
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          keyword_id?: string;
          title?: string | null;
          content?: string;
          row_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "keyword_entries_keyword_id_fkey";
            columns: ["keyword_id"];
            isOneToOne: false;
            referencedRelation: "keywords";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
