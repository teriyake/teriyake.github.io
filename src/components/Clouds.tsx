import React, { useState, useEffect, useRef } from 'react';

interface CloudLayer {
    id: number;
    lat: number;
    lon: number;
    url: string;
    baseOpacity: number;
    loaded: boolean;
    driftSpeed: { x: number; y: number };
    opacityWaveFrequency: number;
    opacityWaveAmplitude: number;
    scaleWaveFrequency: number;
    scaleWaveAmplitude: number;
    rotationSpeed: number;
    phaseOffset: number;
}

interface CloudsProps {
    apiKey: string;
    layerCount?: number;
    refreshInterval?: number;
    searchRadius?: number;
    enableEvolution?: boolean;
    driftEnabled?: boolean;
    opacityModulation?: boolean;
    scaleModulation?: boolean;
    rotationEnabled?: boolean;
    evolutionSpeed?: number;
}

const Clouds: React.FC<CloudsProps> = ({
    apiKey,
    layerCount = 4,
    refreshInterval = 300000,
    searchRadius = 50000,
    enableEvolution = true,
    driftEnabled = false,
    opacityModulation = true,
    scaleModulation = true,
    rotationEnabled = false,
    evolutionSpeed = 1.0,
}) => {
    const [layers, setLayers] = useState<CloudLayer[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [_generationStatus, setGenerationStatus] = useState<string>('');
    const [animationTime, setAnimationTime] = useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);

    const animationFrameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(Date.now());

    const generateRandomCoordinate = () => {
        const lat = Math.random() * 120 - 60;

        const lon = Math.random() * 360 - 180;

        return { lat, lon };
    };

    const checkStreetViewAvailability = async (
        lat: number,
        lon: number,
    ): Promise<{
        available: boolean;
        actualLat?: number;
        actualLon?: number;
    }> => {
        try {
            const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&radius=${searchRadius}&key=${apiKey}`;

            const response = await fetch(metadataUrl);
            const data = await response.json();

            if (data.status === 'OK') {
                return {
                    available: true,
                    actualLat: data.location.lat,
                    actualLon: data.location.lng,
                };
            }

            return { available: false };
        } catch (error) {
            console.error('Error checking Street View availability:', error);
            return { available: false };
        }
    };

    const generateStreetViewURL = (lat: number, lon: number) => {
        const pitch = 88 + Math.random() * 4;

        const heading = Math.random() * 360;

        const fov = 90;

        const size = '640x640';

        return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&pitch=${pitch}&heading=${heading}&fov=${fov}&key=${apiKey}`;
    };

    const findValidStreetViewLocation = async (
        maxAttempts = 50,
    ): Promise<{ lat: number; lon: number } | null> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const { lat, lon } = generateRandomCoordinate();
            const result = await checkStreetViewAvailability(lat, lon);

            if (result.available && result.actualLat && result.actualLon) {
                return {
                    lat: result.actualLat,
                    lon: result.actualLon,
                };
            }

            setGenerationStatus(
                `Searching for skies... attempt ${attempt + 1}`,
            );
        }

        return null;
    };

    const generateEvolutionParams = (layerIndex: number) => {
        const seed = layerIndex / layerCount;

        return {
            driftSpeed: {
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 5,
            },
            opacityWaveFrequency: 0.02 + seed * 0.1,
            opacityWaveAmplitude: 0.07 + Math.random() * 0.2,
            scaleWaveFrequency: 0.01 + seed * 0.005,
            scaleWaveAmplitude: 0.01 + Math.random() * 0.03,
            rotationSpeed: (Math.random() - 0.5) * 0.5,
            phaseOffset: Math.random(),
        };
    };

    const generateLayers = async () => {
        setIsGenerating(true);
        setGenerationStatus('Generating new composite sky...');

        const newLayers: CloudLayer[] = [];

        for (let i = 0; i < layerCount; i++) {
            setGenerationStatus(`Finding sky ${i + 1} of ${layerCount}...`);

            const location = await findValidStreetViewLocation();

            if (!location) {
                console.warn(
                    `Could not find valid Street View location for layer ${
                        i + 1
                    }`,
                );
                continue;
            }

            const baseOpacity = 0.5 + 0.2 * (Math.random() * 2 - 1);
            const evolutionParams = generateEvolutionParams(i);

            newLayers.push({
                id: Date.now() + i,
                lat: location.lat,
                lon: location.lon,
                url: generateStreetViewURL(location.lat, location.lon),
                baseOpacity,
                loaded: false,
                ...evolutionParams,
            });
        }

        setLayers(newLayers);
        setIsGenerating(false);
        setGenerationStatus('');
    };

    const handleImageLoad = (layerId: number) => {
        setLayers((prev) =>
            prev.map((layer) =>
                layer.id === layerId ? { ...layer, loaded: true } : layer,
            ),
        );
    };

    const handleImageError = async (layerId: number) => {
        console.warn(
            `Image failed to load for layer ${layerId}, finding new location...`,
        );

        const location = await findValidStreetViewLocation();

        if (location) {
            setLayers((prev) =>
                prev.map((layer) => {
                    if (layer.id === layerId) {
                        return {
                            ...layer,
                            lat: location.lat,
                            lon: location.lon,
                            url: generateStreetViewURL(
                                location.lat,
                                location.lon,
                            ),
                            loaded: false,
                        };
                    }
                    return layer;
                }),
            );
        }
    };

    useEffect(() => {
        if (!enableEvolution) return;

        const animate = () => {
            const now = Date.now();
            const deltaTime = (now - lastFrameTimeRef.current) / 1000;
            lastFrameTimeRef.current = now;

            setAnimationTime((prev) => prev + deltaTime * evolutionSpeed);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enableEvolution, evolutionSpeed]);

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

    const getLayerStyle = (layer: CloudLayer): React.CSSProperties => {
        if (!enableEvolution || !layer.loaded) {
            return {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '120%',
                height: '120%',
                objectFit: 'cover',
                opacity: layer.loaded ? layer.baseOpacity : 0,
                transform: 'translate(-50%, -50%)',
                transition: 'opacity 2s ease-in-out',
                mixBlendMode: 'normal',
            };
        }

        const t = animationTime + layer.phaseOffset * 100;

        let opacity = layer.baseOpacity;
        if (opacityModulation) {
            const opacityWave = Math.sin(
                t * layer.opacityWaveFrequency * Math.PI * 2,
            );
            opacity =
                layer.baseOpacity + opacityWave * layer.opacityWaveAmplitude;
            opacity = Math.max(0.05, Math.min(0.95, opacity));
        }

        let translateX = 0;
        let translateY = 0;
        if (driftEnabled) {
            const driftRangeX = window.innerWidth * 0.05;
            const driftRangeY = window.innerHeight * 0.05;
            translateX =
                ((layer.driftSpeed.x * animationTime) % (driftRangeX * 2)) -
                driftRangeX;
            translateY =
                ((layer.driftSpeed.y * animationTime) % (driftRangeY * 2)) -
                driftRangeY;
        }

        const baseScale = 1.4;
        let scaleModulation_value = 0;
        if (scaleModulation) {
            const scaleWave = Math.sin(
                t * layer.scaleWaveFrequency * Math.PI * 2,
            );
            scaleModulation_value = scaleWave * layer.scaleWaveAmplitude;
        }

        const finalScale = baseScale * (1 + scaleModulation_value);

        let rotation = 0;
        if (rotationEnabled) {
            rotation = (layer.rotationSpeed * animationTime) % 360;
        }

        const transform = `
            translate(-50%, -50%)
            translate(${translateX}px, ${translateY}px) 
            scale(${finalScale}) 
            rotate(${rotation}deg)
        `;

        return {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity,
            transform,
            transformOrigin: 'center center',
            mixBlendMode: 'hard-light',
        };
    };

    const loadedCount = layers.filter((l) => l.loaded).length;
    const isFullyLoaded = loadedCount === layerCount && !isGenerating;

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
            {(!isFullyLoaded || isGenerating) && (
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
                        style={getLayerStyle(layer)}
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
