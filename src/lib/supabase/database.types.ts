export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: { id: string; name: string; created_at: string; sheet_url: string | null };
        Insert: { id?: string; name: string; created_at?: string; sheet_url?: string | null };
        Update: { name?: string; sheet_url?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          workspace_id: string;
          display_name: string;
          email: string;
          currency: "USD" | "EUR" | "GBP" | "CAD" | "INR";
          avatar_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          workspace_id: string;
          display_name: string;
          email: string;
          currency?: "USD" | "EUR" | "GBP" | "CAD" | "INR";
          avatar_path?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          currency?: "USD" | "EUR" | "GBP" | "CAD" | "INR";
          avatar_path?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          status: "draft" | "active" | "paused" | "ended";
          daily_budget_cents: number;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          status: "draft" | "active" | "paused" | "ended";
          daily_budget_cents: number;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: "draft" | "active" | "paused" | "ended";
          daily_budget_cents?: number;
          version?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_metrics_daily: {
        Row: {
          campaign_id: string;
          day: string;
          impressions: number;
          clicks: number;
          spend_cents: number;
          conversions: number;
        };
        Insert: {
          campaign_id: string;
          day: string;
          impressions: number;
          clicks: number;
          spend_cents: number;
          conversions: number;
        };
        Update: {
          impressions?: number;
          clicks?: number;
          spend_cents?: number;
          conversions?: number;
        };
        Relationships: [];
      };
      copilot_threads: {
        Row: { id: string; workspace_id: string; user_id: string; created_at: string };
        Insert: { id?: string; workspace_id: string; user_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      copilot_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: "user" | "assistant";
          content: string;
          action_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: "user" | "assistant";
          content: string;
          action_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      proposed_actions: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          kind: "pause" | "resume" | "set_daily_budget" | "create_campaign" | "reallocate_budget";
          payload_hash: string;
          targets: Json;
          create_snapshot: Json | null;
          summary: string;
          status: "pending" | "approved" | "rejected" | "expired" | "failed";
          expires_at: string;
          result_message: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          workspace_id: string;
          user_id: string;
          kind: "pause" | "resume" | "set_daily_budget" | "create_campaign" | "reallocate_budget";
          payload_hash: string;
          targets: Json;
          create_snapshot?: Json | null;
          summary: string;
          status?: "pending" | "approved" | "rejected" | "expired" | "failed";
          expires_at: string;
          result_message?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "rejected" | "expired" | "failed";
          result_message?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          actor_name: string;
          action_id: string | null;
          what: string;
          outcome: "approved" | "rejected" | "failed" | "expired";
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          actor_name: string;
          action_id?: string | null;
          what: string;
          outcome: "approved" | "rejected" | "failed" | "expired";
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_campaign_action: {
        Args: { target_action: string };
        Returns: Json;
      };
      reject_campaign_action: {
        Args: { target_action: string };
        Returns: Json;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      set_workspace_sheet: {
        Args: { next_url: string };
        Returns: undefined;
      };
      upsert_campaign_metric: {
        Args: {
          target_campaign: string;
          metric_day: string;
          impressions: number;
          clicks: number;
          spend_cents: number;
          conversions: number;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
