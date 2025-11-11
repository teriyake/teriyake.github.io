import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SkyCapture {
    id: string;
    created_at: string;
    image_url: string;
    thumbnail_url?: string;
    view_count: number;
    layer_count?: number;
    source_coordinates?: {
        lat: number;
        lon: number;
    }[];
}

export type NewSkyCapture = Omit<SkyCapture, 'id' | 'created_at'>;
