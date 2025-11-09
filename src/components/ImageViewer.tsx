import React, { useState, useEffect } from 'react';

interface ImageViewerProps {
    imageUrl: string;
    imageName: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, imageName }) => {
    const [glitchIntensity, setGlitchIntensity] = useState(0);
    const [scanlinePosition, setScanlinePosition] = useState(0);
    const [chromaticOffset, setChromaticOffset] = useState({ x: 0, y: 0 });
    const [pixelCorruption, setPixelCorruption] = useState<
        Array<{ x: number; y: number; size: number }>
    >([]);
    const [loadingCorruption, setLoadingCorruption] = useState(50);

    useEffect(() => {
        if (loadingCorruption > 0) {
            const timer = setTimeout(() => {
                setLoadingCorruption((prev) => Math.max(0, prev - 2));
            }, 2);
            return () => clearTimeout(timer);
        }
    }, [loadingCorruption]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.85) {
                setGlitchIntensity(Math.random() * 10);
                setTimeout(
                    () => setGlitchIntensity(0),
                    100 + Math.random() * 200,
                );
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanlinePosition((prev) => (prev + 1) % 100);
        }, 50);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setChromaticOffset({
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newCorruption = Array.from(
                    { length: Math.floor(Math.random() * 5) },
                    () => ({
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        size: Math.random() * 3 + 1,
                    }),
                );
                setPixelCorruption(newCorruption);
                setTimeout(() => setPixelCorruption([]), 200);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="image-viewer-container">
            <div className="image-viewer-content">
                {loadingCorruption > 0 && (
                    <div
                        className="loading-corruption"
                        style={{
                            opacity: loadingCorruption / 100,
                        }}
                    >
                        <div className="loading-bars">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="loading-bar"
                                    style={{
                                        animationDelay: `${i * 0.05}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div
                    className="image-container"
                    style={{
                        transform: `translate(${glitchIntensity * 0.5}px, ${
                            Math.sin(Date.now() * 0.001) * glitchIntensity * 0.2
                        }px)`,
                    }}
                >
                    <img
                        src={imageUrl}
                        alt={imageName}
                        className="image-layer red-channel"
                        style={{
                            transform: `translate(${chromaticOffset.x}px, ${chromaticOffset.y}px)`,
                            opacity: 0.5,
                        }}
                    />
                    <img
                        src={imageUrl}
                        alt={imageName}
                        className="image-layer blue-channel"
                        style={{
                            transform: `translate(${-chromaticOffset.x}px, ${-chromaticOffset.y}px)`,
                            opacity: 0.5,
                        }}
                    />
                    <img
                        src={imageUrl}
                        alt={imageName}
                        className="image-layer main-image"
                    />

                    <div
                        className="scanline"
                        style={{
                            top: `${scanlinePosition}%`,
                        }}
                    />
                    <div className="scanline-overlay" />

                    {pixelCorruption.map((pixel, i) => (
                        <div
                            key={i}
                            className="corrupt-pixel"
                            style={{
                                left: `${pixel.x}%`,
                                top: `${pixel.y}%`,
                                width: `${pixel.size}px`,
                                height: `${pixel.size}px`,
                            }}
                        />
                    ))}

                    {glitchIntensity > 3 && (
                        <div
                            className="tracking-error"
                            style={{
                                top: `${Math.random() * 100}%`,
                                height: `${glitchIntensity * 5}px`,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;
