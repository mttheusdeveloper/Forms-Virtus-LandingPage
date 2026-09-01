import { createClient } from '@supabase/supabase-js';
import type { RawRow } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file (see .env.example).');
}

export const sb = createClient(url, anonKey);

export async function fetchTable(name: string): Promise<RawRow[]> {
  const { data, error } = await sb.from(name).select('*');
  if (error) {
    console.warn('Erro em', name, error.message);
    return [];
  }
  return (data as RawRow[]) || [];
}
