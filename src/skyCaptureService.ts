import { supabase } from './supabaseClient';
import type { NewSkyCapture, SkyCapture } from './supabaseClient';

const STORAGE_BUCKET = 'sky-captures';

export async function uploadSkyCapture(
    dataUrl: string,
    metadata?: {
        layerCount?: number;
        sourceCoordinates?: { lat: number; lon: number }[];
    },
): Promise<string> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const fileName = `capture-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.png`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

    const captureData: NewSkyCapture = {
        image_url: urlData.publicUrl,
        view_count: 0,
        layer_count: metadata?.layerCount,
        source_coordinates: metadata?.sourceCoordinates,
    };

    const { error: dbError } = await supabase
        .from('sky_captures')
        .insert(captureData);

    if (dbError) {
        console.error('Error saving capture metadata:', dbError);
        throw new Error(`Failed to save capture metadata: ${dbError.message}`);
    }

    return urlData.publicUrl;
}

export async function getRecentCaptures(
    limit: number = 20,
): Promise<SkyCapture[]> {
    const { data, error } = await supabase
        .from('sky_captures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent captures:', error);
        throw new Error(`Failed to fetch captures: ${error.message}`);
    }

    return data || [];
}

export async function getRandomCapture(): Promise<SkyCapture | null> {
    const { count, error: countError } = await supabase
        .from('sky_captures')
        .select('*', { count: 'exact', head: true });

    if (countError || !count) {
        console.error('Error getting capture count:', countError);
        return null;
    }

    const randomOffset = Math.floor(Math.random() * count);

    const { data, error } = await supabase
        .from('sky_captures')
        .select('*')
        .range(randomOffset, randomOffset)
        .limit(1);

    if (error || !data || data.length === 0) {
        console.error('Error fetching random capture:', error);
        return null;
    }

    return data[0];
}

export async function incrementViewCount(captureId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_view_count', {
        capture_id: captureId,
    });

    if (error) {
        console.error('Error incrementing view count:', error);
    }
}

export async function getTotalCaptureCount(): Promise<number> {
    const { count, error } = await supabase
        .from('sky_captures')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error getting total count:', error);
        return 0;
    }

    return count || 0;
}
