import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface InventoryItem {
  id: string;
  user_id: string;
  barcode: string;
  product: string;
  colour: string | null;
  size: string | null;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  inventory_item_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

export interface GoogleSheetsSync {
  id: string;
  user_id: string;
  sheet_id: string | null;
  sheet_name: string | null;
  last_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}
