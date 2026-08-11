import { supabase } from "@/integrations/supabase/client";

// Untyped table accessor. The generated client enforces literal table names and
// strict insert payloads, which friction the generic collection hooks.
// Runtime behavior is unchanged — Row Level Security still governs every read
// and write server-side; nothing here bypasses access control.
type AnySupabaseClient = {
  // The generated client uses literal table overloads; these two dynamic
  // accessors intentionally bridge the generic data layer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};
export const from = (table: string) =>
  (supabase as unknown as AnySupabaseClient).from(table);
export const rpc = (fn: string, args?: Record<string, unknown>) =>
  (supabase as unknown as AnySupabaseClient).rpc(fn, args);
