import { useState, useCallback, useEffect } from 'react';
import {
    uploadSkyCapture,
    getRecentCaptures,
    getRandomCapture,
    getTotalCaptureCount,
    incrementViewCount,
} from '../skyCaptureService';
import type { SkyCapture } from '../supabaseClient';

export function useSkyCaptureGallery() {
    const [recentCaptures, setRecentCaptures] = useState<SkyCapture[]>([]);
    const [randomCapture, setRandomCapture] = useState<SkyCapture | null>(null);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRecentCaptures = useCallback(async (limit: number = 20) => {
        setIsLoading(true);
        setError(null);

        try {
            const captures = await getRecentCaptures(limit);
            setRecentCaptures(captures);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load captures',
            );
            console.error('Error loading recent captures:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadRandomCapture = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const capture = await getRandomCapture();
            setRandomCapture(capture);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load random capture',
            );
            console.error('Error loading random capture:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadTotalCount = useCallback(async () => {
        try {
            const count = await getTotalCaptureCount();
            setTotalCount(count);
        } catch (err) {
            console.error('Error loading total count:', err);
        }
    }, []);

    useEffect(() => {
        loadTotalCount();
    }, [loadTotalCount]);

    return {
        recentCaptures,
        randomCapture,
        totalCount,
        isLoading,
        error,
        loadRecentCaptures,
        loadRandomCapture,
        loadTotalCount,
    };
}

export function useSkyCaptureUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const upload = useCallback(
        async (
            dataUrl: string,
            metadata?: {
                layerCount?: number;
                sourceCoordinates?: { lat: number; lon: number }[];
            },
        ) => {
            setIsUploading(true);
            setUploadError(null);
            setUploadedUrl(null);

            try {
                const url = await uploadSkyCapture(dataUrl, metadata);
                setUploadedUrl(url);
                return url;
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to upload capture';
                setUploadError(errorMessage);
                throw err;
            } finally {
                setIsUploading(false);
            }
        },
        [],
    );

    const reset = useCallback(() => {
        setUploadError(null);
        setUploadedUrl(null);
    }, []);

    return {
        upload,
        isUploading,
        uploadError,
        uploadedUrl,
        reset,
    };
}

export function useSkyCapture(captureId: string | null) {
    const [hasTrackedView, setHasTrackedView] = useState(false);

    useEffect(() => {
        if (captureId && !hasTrackedView) {
            incrementViewCount(captureId);
            setHasTrackedView(true);
        }
    }, [captureId, hasTrackedView]);

    return { hasTrackedView };
}
