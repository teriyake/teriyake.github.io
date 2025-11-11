import React, { useEffect, useState } from 'react';
import { useSkyCaptureGallery } from '../hooks/useSkyCaptureGallery';
import type { SkyCapture } from '../supabaseClient';

interface SkyGalleryProps {
    onSelectCapture: (capture: SkyCapture) => void;
}

export const SkyGallery: React.FC<SkyGalleryProps> = ({ onSelectCapture }) => {
    const {
        recentCaptures,
        randomCapture,
        totalCount,
        isLoading,
        error,
        loadRecentCaptures,
        loadRandomCapture,
    } = useSkyCaptureGallery();

    const [viewMode, setViewMode] = useState<'recent' | 'random'>('recent');

    useEffect(() => {
        if (viewMode === 'recent') {
            loadRecentCaptures(12);
        }
    }, [viewMode, loadRecentCaptures]);

    const handleRandomClick = () => {
        setViewMode('random');
        loadRandomCapture();
    };

    const handleRecentClick = () => {
        setViewMode('recent');
    };

    return (
        <div className="window-body" style={{ padding: '10px' }}>
            <div className="field-row" style={{ marginBottom: '10px' }}>
                <button
                    onClick={handleRecentClick}
                    disabled={viewMode === 'recent'}
                >
                    Recent Skies
                </button>
                <button
                    onClick={handleRandomClick}
                    style={{ marginLeft: '5px' }}
                >
                    Random Sky
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                    {totalCount} {totalCount === 1 ? 'sky' : 'skies'} captured
                    by www friends
                </span>
            </div>

            {error && (
                <div className="status-bar" style={{ marginBottom: '10px' }}>
                    <p className="status-bar-field" style={{ color: 'red' }}>
                        Error: {error}
                    </p>
                </div>
            )}

            {isLoading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    Loading skies...
                </div>
            )}

            {viewMode === 'recent' && !isLoading && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '10px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                    }}
                >
                    {recentCaptures.map((capture) => (
                        <div
                            key={capture.id}
                            onClick={() => onSelectCapture(capture)}
                            style={{
                                cursor: 'pointer',
                                border: '2px solid #000',
                                padding: '4px',
                                background: '#c0c0c0',
                                position: 'relative',
                            }}
                        >
                            <img
                                src={capture.image_url}
                                alt="Captured sky"
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    objectFit: 'cover',
                                    imageRendering: 'pixelated',
                                }}
                            />
                            <div
                                style={{
                                    fontSize: '10px',
                                    marginTop: '4px',
                                    textAlign: 'center',
                                }}
                            >
                                {new Date(
                                    capture.created_at,
                                ).toLocaleDateString()}
                            </div>
                            <div
                                style={{
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    color: '#666',
                                }}
                            >
                                {capture.view_count}{' '}
                                {capture.view_count === 1 ? 'view' : 'views'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewMode === 'random' && !isLoading && randomCapture && (
                <div style={{ textAlign: 'center' }}>
                    <div
                        onClick={() => onSelectCapture(randomCapture)}
                        style={{
                            cursor: 'pointer',
                            display: 'inline-block',
                            border: '2px solid #000',
                            padding: '8px',
                            background: '#c0c0c0',
                        }}
                    >
                        <img
                            src={randomCapture.image_url}
                            alt="Random captured sky"
                            style={{
                                maxWidth: '400px',
                                maxHeight: '400px',
                                objectFit: 'contain',
                                imageRendering: 'pixelated',
                            }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                            Captured on{' '}
                            {new Date(
                                randomCapture.created_at,
                            ).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Viewed {randomCapture.view_count}{' '}
                            {randomCapture.view_count === 1 ? 'time' : 'times'}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'random' && !isLoading && !randomCapture && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    No captures available yet. Be the first to capture a sky!
                </div>
            )}
        </div>
    );
};
