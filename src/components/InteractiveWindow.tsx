import React, { useState, useCallback, useRef, useEffect } from 'react';
import Window from './Window';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

const Ghost: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div
        className="ghost-window"
        style={{
            position: 'absolute',
            ...style,
        }}
    />
);

interface DebrisPixel {
    id: number;
    x: number;
    y: number;
    bottom: number;
}

interface InteractiveWindowProps
    extends Omit<React.ComponentProps<typeof Window>, 'style'> {
    initialPosition: { x: number; y: number };
    initialSize: { width: number; height: number };
}

const InteractiveWindow: React.FC<InteractiveWindowProps> = ({
    initialPosition,
    initialSize,
    children,
    ...windowProps
}) => {
    const [_contentSize, setContentSize] = useState(initialSize);
    const [_debris, setDebris] = useState<DebrisPixel[]>([]);

    const handleDrag = useCallback(
        (distance: number, currentPosition: { x: number; y: number }) => {
            const currentSize = sizeRef.current;
            if (distance > 35) {
                const newDebris: DebrisPixel = {
                    id: Date.now() + Math.random(),
                    x: currentPosition.x + Math.random() * currentSize.width,
                    y: currentPosition.y + currentSize.height,
                    bottom: Math.random() * 20,
                };

                setDebris((prev) => [...prev, newDebris]);

                setTimeout(() => {
                    setDebris((prev) =>
                        prev.filter((d) => d.id !== newDebris.id),
                    );
                }, 15000);
            }
        },
        [],
    );

    const {
        position,
        ghosts: dragGhosts,
        dragHandlers,
    } = useDraggable(initialPosition, handleDrag);

    const {
        size,
        ghosts: resizeGhosts,
        resizeHandlers,
    } = useResizable({
        initialSize,
        position,
        onResizeEnd: (finalSize) => {
            setContentSize(finalSize);
        },
    });

    const sizeRef = useRef(size);
    useEffect(() => {
        sizeRef.current = size;
    }, [size]);

    const allGhosts = [
        ...dragGhosts.map((g) => ({
            id: `d-${g.id}`,
            style: {
                left: `${g.x}px`,
                top: `${g.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            },
        })),
        ...resizeGhosts.map((g) => ({
            id: `r-${g.id}`,
            style: {
                left: `${g.x}px`,
                top: `${g.y}px`,
                width: `${g.width}px`,
                height: `${g.height}px`,
            },
        })),
    ];

    return (
        <>
            {allGhosts.map((ghost) => (
                <Ghost key={ghost.id} style={ghost.style} />
            ))}

            <div
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    zIndex: 1000,
                }}
            >
                <Window
                    {...windowProps}
                    titleBarProps={{
                        ...dragHandlers,
                        style: {
                            cursor: 'move',
                        },
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {children}
                </Window>

                <div className="resize-handle" {...resizeHandlers}></div>
            </div>
        </>
    );
};

export default InteractiveWindow;
