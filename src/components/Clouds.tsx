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
    onCapture: (imageDataUrl: string) => void;
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
    evolutionSpeed = 0.01,
    onCapture,
}) => {
    const [layers, setLayers] = useState<CloudLayer[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string>('');
    const [animationTime, setAnimationTime] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCaptureDialog, setShowCaptureDialog] = useState(false);

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

        const googleUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&pitch=${pitch}&heading=${heading}&fov=${fov}&key=${apiKey}`;
        const proxyUrl = 'https://my-image-proxy.terik.workers.dev';

        return `${proxyUrl}?url=${encodeURIComponent(googleUrl)}`;
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

    const calculateDynamicOpacity = (layer: CloudLayer, time: number) => {
        if (!opacityModulation) return layer.baseOpacity;

        const wave =
            Math.sin(
                time * evolutionSpeed * layer.opacityWaveFrequency +
                    layer.phaseOffset * Math.PI * 2,
            ) * layer.opacityWaveAmplitude;

        return Math.max(0.1, Math.min(1, layer.baseOpacity + wave));
    };

    const calculateDynamicScale = (layer: CloudLayer, time: number) => {
        if (!scaleModulation) return 1.0;

        const wave =
            Math.sin(
                time * evolutionSpeed * layer.scaleWaveFrequency +
                    layer.phaseOffset * Math.PI * 3,
            ) * layer.scaleWaveAmplitude;

        return 1.0 + wave;
    };

    const calculateDynamicRotation = (layer: CloudLayer, time: number) => {
        if (!rotationEnabled) return 0;

        return (time * evolutionSpeed * layer.rotationSpeed) % 360;
    };

    const calculateDynamicDrift = (layer: CloudLayer, time: number) => {
        if (!driftEnabled) return { x: 0, y: 0 };

        return {
            x: layer.driftSpeed.x * (time * evolutionSpeed * 0.01),
            y: layer.driftSpeed.y * (time * evolutionSpeed * 0.01),
        };
    };

    const handleCapture = async () => {
        if (!canvasRef.current) return;

        setIsCapturing(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            const width = canvasRef.current.offsetWidth;
            const height = canvasRef.current.offsetHeight;
            canvas.width = width;
            canvas.height = height;

            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];

                if (!layer.loaded) continue;

                const opacity = calculateDynamicOpacity(layer, animationTime);
                const scale = calculateDynamicScale(layer, animationTime);
                const rotation = calculateDynamicRotation(layer, animationTime);
                const drift = calculateDynamicDrift(layer, animationTime);

                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () =>
                        reject(new Error(`Failed to load image: ${layer.url}`));
                    img.src = layer.url;
                });

                ctx.save();

                if (i > 0) {
                    ctx.globalCompositeOperation = 'screen';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                }

                ctx.globalAlpha = opacity;

                ctx.translate(width / 2 + drift.x, height / 2 + drift.y);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(scale, scale);

                ctx.drawImage(img, -width / 2, -height / 2, width, height);

                ctx.restore();
            }

            const dataUrl = canvas.toDataURL('image/png', 0.95);

            setCapturedImage(dataUrl);
            setShowCaptureDialog(true);
        } catch (error) {
            console.error('Error capturing image:', error);
            alert('Failed to capture image. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSaveToOS = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            setShowCaptureDialog(false);
            setCapturedImage(null);
        }
    };

    const handleDownload = () => {
        if (capturedImage) {
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = 'composite-sky.png';
            link.click();
            setShowCaptureDialog(false);
            setCapturedImage(null);
        }
    };

    const handleCancelCapture = () => {
        setShowCaptureDialog(false);
        setCapturedImage(null);
    };

    useEffect(() => {
        generateLayers();
    }, []);

    useEffect(() => {
        if (enableEvolution) {
            const animate = () => {
                const now = Date.now();
                const deltaTime = now - lastFrameTimeRef.current;
                lastFrameTimeRef.current = now;

                setAnimationTime((prev) => prev + deltaTime);

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [enableEvolution]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(generateLayers, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshInterval]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
                ref={canvasRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                }}
            >
                {layers.map((layer, index) => {
                    const opacity = calculateDynamicOpacity(
                        layer,
                        animationTime,
                    );
                    const scale = calculateDynamicScale(layer, animationTime);
                    const rotation = calculateDynamicRotation(
                        layer,
                        animationTime,
                    );
                    const drift = calculateDynamicDrift(layer, animationTime);

                    return (
                        <div
                            key={layer.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                mixBlendMode: index === 0 ? 'normal' : 'screen',
                                opacity: layer.loaded ? opacity : 0,
                                transform: `translate(${drift.x}px, ${drift.y}px) scale(${scale}) rotate(${rotation}deg)`,
                                transformOrigin: 'center',
                                backgroundColor: '#87CEEB',
                                overflow: 'hidden',
                            }}
                        >
                            <img
                                src={layer.url}
                                alt={`Sky layer ${index + 1}`}
                                onLoad={() => handleImageLoad(layer.id)}
                                onError={() => handleImageError(layer.id)}
                                style={{
                                    width: '140%',
                                    height: '140%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',

                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    zIndex: 1000,
                }}
            >
                <button onClick={generateLayers} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate New Sky'}
                </button>

                <button
                    onClick={handleCapture}
                    disabled={isCapturing || layers.length === 0}
                >
                    {isCapturing ? 'Capturing...' : 'Capture Sky'}
                </button>

                {generationStatus && (
                    <div
                        style={{
                            padding: '5px 10px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            borderRadius: '4px',
                        }}
                    >
                        {generationStatus}
                    </div>
                )}
            </div>

            {showCaptureDialog && capturedImage && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div className="window" style={{ width: '400px' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">
                                Capture Complete
                            </div>
                        </div>
                        <div className="window-body">
                            <p
                                style={{
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                }}
                            >
                                What would you like to do with this memory?
                            </p>
                            <div
                                className="sunken-panel"
                                style={{ padding: '5px', marginBottom: '10px' }}
                            >
                                <img
                                    src={capturedImage}
                                    style={{ width: '100%', display: 'block' }}
                                    alt="Captured Sky"
                                />
                            </div>
                            <section
                                className="field-row"
                                style={{ justifyContent: 'center', gap: '5px' }}
                            >
                                <button onClick={handleSaveToOS}>
                                    Save to Desktop
                                </button>
                                <button onClick={handleDownload}>
                                    Download
                                </button>
                                <button onClick={handleCancelCapture}>
                                    Cancel
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clouds;
