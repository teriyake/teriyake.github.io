import React, { useState, useEffect, useRef, useCallback } from 'react';
import Window from './Window';

interface Pixel {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    lifetime: number;
}

interface Crack {
    id: number;
    path: string;
    severity: number;
    x: number;
    y: number;
}

interface BurnMark {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
    age: number;
}

interface DegradableWindowProps
    extends Omit<React.ComponentProps<typeof Window>, 'style'> {
    initialPosition: { x: number; y: number };
    initialSize: { width: number; height: number };
    degradationEnabled?: boolean;
    elasticResize?: boolean;
}

const globalBurnMarks: BurnMark[] = [];
let burnMarkIdCounter = 0;

const DegradableWindow: React.FC<DegradableWindowProps> = ({
    initialPosition,
    initialSize,
    degradationEnabled = true,
    elasticResize = true,
    children,
    ...windowProps
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [health, setHealth] = useState(100);
    const [pixels, setPixels] = useState<Pixel[]>([]);
    const [cracks, setCracks] = useState<Crack[]>([]);
    const [burnMarks, setBurnMarks] = useState<BurnMark[]>(globalBurnMarks);
    const [_dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
    const [_resizeVelocity, setResizeVelocity] = useState({ w: 0, h: 0 });
    const [elasticDeformation, setElasticDeformation] = useState({
        x: 1,
        y: 1,
    });
    const [scratches, setScratches] = useState<
        Array<{ x1: number; y1: number; x2: number; y2: number }>
    >([]);
    const [cornerWear, setCornerWear] = useState(0);

    const windowRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef(position);
    const lastSize = useRef(size);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const resizeStartInfo = useRef({
        mouseX: 0,
        mouseY: 0,
        width: 0,
        height: 0,
    });
    //const velocityTracker = useRef<NodeJS.Timeout>();
    const lastBurnTime = useRef(Date.now());
    const totalDragDistance = useRef(0);
    const totalResizeAmount = useRef(0);

    const shedPixels = useCallback(
        (velocity: number, x: number, y: number) => {
            if (!degradationEnabled) return;

            const pixelCount = Math.floor(velocity / 5);
            const newPixels: Pixel[] = [];

            for (let i = 0; i < pixelCount; i++) {
                newPixels.push({
                    id: Date.now() + i,
                    x: x + (Math.random() - 0.5) * size.width,
                    y: y + (Math.random() - 0.5) * size.height,
                    vx: ((Math.random() - 0.5) * velocity) / 2,
                    vy: (Math.random() * velocity) / 2 + 2,
                    color:
                        Math.random() > 0.7
                            ? '#000080'
                            : Math.random() > 0.5
                            ? '#c0c0c0'
                            : '#ffffff',
                    size: Math.random() * 3 + 1,
                    lifetime: 100,
                });
            }

            setPixels((prev) => [...prev, ...newPixels]);

            setHealth((prev) => Math.max(0, prev - pixelCount * 0.1));
        },
        [degradationEnabled, size],
    );

    const addCrack = useCallback(
        (velocity: number) => {
            if (!degradationEnabled || velocity < 15) return;

            const crackCount = Math.floor(velocity / 15);
            const newCracks: Crack[] = [];

            for (let i = 0; i < crackCount; i++) {
                const startX = Math.random() * 100;
                const startY = Math.random() * 100;
                const length = velocity * 2 + Math.random() * 30;
                const angle = Math.random() * Math.PI * 2;

                let path = `M ${startX} ${startY}`;
                let currentX = startX;
                let currentY = startY;
                const segments = 5 + Math.floor(Math.random() * 5);

                for (let j = 0; j < segments; j++) {
                    const segmentLength = length / segments;
                    const deviation = (Math.random() - 0.5) * 20;
                    currentX += Math.cos(angle) * segmentLength + deviation;
                    currentY += Math.sin(angle) * segmentLength + deviation;
                    path += ` L ${currentX} ${currentY}`;
                }

                newCracks.push({
                    id: Date.now() + i,
                    path: path,
                    severity: Math.min(1, velocity / 50),
                    x: startX,
                    y: startY,
                });
            }

            setCracks((prev) => [...prev, ...newCracks]);
            setHealth((prev) => Math.max(0, prev - crackCount * 2));
        },
        [degradationEnabled],
    );

    const createBurnMark = useCallback(() => {
        if (!degradationEnabled) return;

        const now = Date.now();
        if (now - lastBurnTime.current > 5000) {
            const newBurnMark: BurnMark = {
                id: burnMarkIdCounter++,
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
                intensity: 0.02,
                age: 0,
            };

            globalBurnMarks.push(newBurnMark);
            setBurnMarks([...globalBurnMarks]);
            lastBurnTime.current = now;
        }
    }, [degradationEnabled, position, size]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (
                e.target === windowRef.current ||
                (e.target as HTMLElement).classList.contains('title-bar')
            ) {
                setIsDragging(true);
                dragStartOffset.current = {
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                };
            }
        },
        [position],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragStartOffset.current.x;
                const newY = e.clientY - dragStartOffset.current.y;

                const vx = newX - lastPosition.current.x;
                const vy = newY - lastPosition.current.y;
                const velocity = Math.sqrt(vx * vx + vy * vy);

                setDragVelocity({ x: vx, y: vy });
                setPosition({ x: newX, y: newY });

                totalDragDistance.current += velocity;

                if (velocity > 20 && Math.random() > 0.8) {
                    setScratches((prev) =>
                        [
                            ...prev,
                            {
                                x1: Math.random() * 100,
                                y1: Math.random() * 100,
                                x2: Math.random() * 100,
                                y2: Math.random() * 100,
                            },
                        ].slice(-10),
                    );
                }

                if (velocity > 25) {
                    shedPixels(
                        velocity,
                        newX + size.width / 2,
                        newY + size.height / 2,
                    );
                }

                setCornerWear((prev) => Math.min(1, prev + velocity * 0.0001));

                lastPosition.current = { x: newX, y: newY };
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStartInfo.current.mouseX;
                const deltaY = e.clientY - resizeStartInfo.current.mouseY;

                const newWidth = Math.max(
                    100,
                    resizeStartInfo.current.width + deltaX,
                );
                const newHeight = Math.max(
                    80,
                    resizeStartInfo.current.height + deltaY,
                );

                const vw = newWidth - lastSize.current.width;
                const vh = newHeight - lastSize.current.height;
                const velocity = Math.sqrt(vw * vw + vh * vh);

                setResizeVelocity({ w: vw, h: vh });
                setSize({ width: newWidth, height: newHeight });

                totalResizeAmount.current += velocity;

                if (velocity > 15) {
                    addCrack(velocity);
                }

                if (elasticResize) {
                    const stretchX = 1 + (vw / size.width) * 0.1;
                    const stretchY = 1 + (vh / size.height) * 0.1;
                    setElasticDeformation({ x: stretchX, y: stretchY });
                }

                lastSize.current = { width: newWidth, height: newHeight };
            }
        },
        [isDragging, isResizing, elasticResize, size, shedPixels, addCrack],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        createBurnMark();

        if (elasticResize) {
            const snapBack = setInterval(() => {
                setElasticDeformation((prev) => ({
                    x: prev.x + (1 - prev.x) * 0.2,
                    y: prev.y + (1 - prev.y) * 0.2,
                }));
            }, 50);

            setTimeout(() => clearInterval(snapBack), 500);
        }
    }, [createBurnMark, elasticResize]);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsResizing(true);
            resizeStartInfo.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                width: size.width,
                height: size.height,
            };
        },
        [size],
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setPixels((prev) =>
                prev
                    .map((pixel) => ({
                        ...pixel,
                        x: pixel.x + pixel.vx,
                        y: pixel.y + pixel.vy,
                        vy: pixel.vy + 0.5,
                        lifetime: pixel.lifetime - 1,
                    }))
                    .filter(
                        (pixel) =>
                            pixel.lifetime > 0 && pixel.y < window.innerHeight,
                    ),
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBurnMarks((prev) =>
                prev.map((mark) => ({
                    ...mark,
                    age: mark.age + 1,
                    intensity: Math.min(0.15, mark.intensity + 0.001),
                })),
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const windowStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `scaleX(${elasticDeformation.x}) scaleY(${elasticDeformation.y})`,
        transformOrigin: 'center',
        transition:
            !isDragging && !isResizing ? 'transform 0.2s ease-out' : 'none',
        cursor: isDragging ? 'move' : 'default',
        zIndex: 999,
        filter:
            health < 50
                ? `contrast(${1 - (50 - health) / 100}) brightness(${
                      1 - (50 - health) / 200
                  })`
                : 'none',
        opacity: health > 0 ? (health / 100) * 0.5 + 0.5 : 0.5,
    };

    return (
        <>
            {burnMarks.map((mark) => (
                <div
                    key={mark.id}
                    className="burn-mark"
                    style={{
                        position: 'absolute',
                        left: `${mark.x}px`,
                        top: `${mark.y}px`,
                        width: `${mark.width}px`,
                        height: `${mark.height}px`,
                        background: `rgba(0, 0, 0, ${mark.intensity})`,
                        filter: 'blur(8px)',
                        pointerEvents: 'none',
                        zIndex: 1,
                        mixBlendMode: 'multiply',
                    }}
                />
            ))}

            {pixels.map((pixel) => (
                <div
                    key={pixel.id}
                    className="falling-pixel"
                    style={{
                        position: 'absolute',
                        left: `${pixel.x}px`,
                        top: `${pixel.y}px`,
                        width: `${pixel.size}px`,
                        height: `${pixel.size}px`,
                        background: pixel.color,
                        opacity: pixel.lifetime / 100,
                        pointerEvents: 'none',
                        zIndex: 1001,
                        transform: `rotate(${pixel.lifetime * 5}deg)`,
                    }}
                />
            ))}

            <div
                ref={windowRef}
                onMouseDown={handleMouseDown}
                style={windowStyle}
            >
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1002,
                    }}
                >
                    {cracks.map((crack) => (
                        <path
                            key={crack.id}
                            d={crack.path}
                            stroke={`rgba(0, 0, 0, ${crack.severity})`}
                            strokeWidth={crack.severity * 3}
                            fill="none"
                            strokeLinecap="round"
                            style={{
                                filter: `drop-shadow(0 0 ${
                                    crack.severity * 2
                                }px rgba(0, 0, 0, 0.5))`,
                            }}
                        />
                    ))}

                    {scratches.map((scratch, i) => (
                        <line
                            key={i}
                            x1={`${scratch.x1}%`}
                            y1={`${scratch.y1}%`}
                            x2={`${scratch.x2}%`}
                            y2={`${scratch.y2}%`}
                            stroke="rgba(100, 100, 100, 0.3)"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>

                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: `${3 + cornerWear * 15}px`,
                        border: `1px solid rgba(0, 0, 0, ${
                            0.1 + cornerWear * 0.3
                        })`,
                        pointerEvents: 'none',
                    }}
                />

                <Window
                    {...windowProps}
                    title={windowProps.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        filter: cracks.length > 5 ? 'blur(0.5px)' : 'none',
                        background:
                            health < 30
                                ? `rgba(255, ${255 - (30 - health) * 5}, ${
                                      255 - (30 - health) * 5
                                  }, 0.98)`
                                : undefined,
                    }}
                    bodyStyle={{ overflowY: 'auto', overflowX: 'hidden' }}
                    statusBar={
                        <div
                            className="resize-handle"
                            onMouseDown={handleResizeStart}
                        />
                    }
                >
                    {children}
                </Window>
            </div>
        </>
    );
};

export default DegradableWindow;
