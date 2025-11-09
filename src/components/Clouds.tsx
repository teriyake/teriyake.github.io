import React, { useState, useEffect, useRef } from 'react';

interface CloudLayer {
    id: number;
    lat: number;
    lon: number;
    url: string;
    opacity: number;
    loaded: boolean;
}

interface CloudsProps {
    apiKey: string;
    layerCount?: number;
    refreshInterval?: number;
}

const Clouds: React.FC<CloudsProps> = ({
    apiKey,
    layerCount = 4,
    refreshInterval = 300000,
}) => {
    const [layers, setLayers] = useState<CloudLayer[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const generateRandomCoordinate = () => {
        const lat = Math.random() * 120 - 60;

        const lon = Math.random() * 360 - 180;

        return { lat, lon };
    };

    const generateStreetViewURL = (lat: number, lon: number) => {
        const pitch = 85 + Math.random() * 10;

        const heading = Math.random() * 360;

        const fov = 90;

        const size = '640x640';

        return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&pitch=${pitch}&heading=${heading}&fov=${fov}&key=${apiKey}`;
    };

    const generateLayers = () => {
        setIsGenerating(true);

        const newLayers: CloudLayer[] = [];

        for (let i = 0; i < layerCount; i++) {
            const { lat, lon } = generateRandomCoordinate();

            const opacity = 0.3 + (i / layerCount) * 0.5;

            newLayers.push({
                id: Date.now() + i,
                lat,
                lon,
                url: generateStreetViewURL(lat, lon),
                opacity,
                loaded: false,
            });
        }

        setLayers(newLayers);
        setIsGenerating(false);
    };

    const handleImageLoad = (layerId: number) => {
        setLayers((prev) =>
            prev.map((layer) =>
                layer.id === layerId ? { ...layer, loaded: true } : layer,
            ),
        );
    };

    const handleImageError = (layerId: number) => {
        setLayers((prev) =>
            prev.map((layer) => {
                if (layer.id === layerId) {
                    const { lat, lon } = generateRandomCoordinate();
                    return {
                        ...layer,
                        lat,
                        lon,
                        url: generateStreetViewURL(lat, lon),
                        loaded: false,
                    };
                }
                return layer;
            }),
        );
    };

    useEffect(() => {
        generateLayers();
    }, []);

    useEffect(() => {
        if (refreshInterval && refreshInterval > 0) {
            const interval = setInterval(() => {
                generateLayers();
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval]);

    const loadedCount = layers.filter((l) => l.loaded).length;
    const isFullyLoaded = loadedCount === layerCount;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#87CEEB',
                overflow: 'hidden',
            }}
        >
            {!isFullyLoaded && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '20px',
                        border: '2px solid #000',
                        fontFamily: 'Pixelated MS Sans Serif, sans-serif',
                        fontSize: '14px',
                        zIndex: 1000,
                    }}
                >
                    Loading skies... {loadedCount}/{layerCount}
                </div>
            )}

            <div
                ref={canvasRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}
            >
                {layers.map((layer, index) => (
                    <img
                        key={layer.id}
                        src={layer.url}
                        alt={`Sky layer ${index + 1} from ${layer.lat.toFixed(
                            2,
                        )}, ${layer.lon.toFixed(2)}`}
                        onLoad={() => handleImageLoad(layer.id)}
                        onError={() => handleImageError(layer.id)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: layer.loaded ? layer.opacity : 0,
                            transition: 'opacity 2s ease-in-out',
                            mixBlendMode: 'normal',
                        }}
                    />
                ))}
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    padding: '8px 12px',
                    fontFamily: 'Pixelated MS Sans Serif, sans-serif',
                    fontSize: '11px',
                    maxWidth: '200px',
                    lineHeight: '1.4',
                    display: 'none',
                }}
            >
                <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                    Composite Sky
                </div>
                {layers.map((layer, index) => (
                    <div key={layer.id} style={{ fontSize: '10px' }}>
                        Layer {index + 1}: {layer.lat.toFixed(2)}°,{' '}
                        {layer.lon.toFixed(2)}°
                    </div>
                ))}
            </div>

            <button
                onClick={generateLayers}
                disabled={isGenerating}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '6px 12px',
                    fontFamily: 'Pixelated MS Sans Serif, sans-serif',
                    fontSize: '12px',
                    backgroundColor: '#c0c0c0',
                    border: '2px outset #fff',
                    cursor: isGenerating ? 'wait' : 'pointer',
                }}
            >
                {isGenerating ? 'Generating...' : 'New Sky'}
            </button>
        </div>
    );
};

export default Clouds;
