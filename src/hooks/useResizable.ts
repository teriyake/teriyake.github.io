import { useState, useCallback, useEffect, useRef } from 'react';

interface Ghost {
    id: number;
    width: number;
    height: number;
    x: number;
    y: number;
}

interface ResizableProps {
    initialSize: { width: number; height: number };
    position: { x: number; y: number };
    minSize?: { width: number; height: number };
    onResizeEnd?: (size: { width: number; height: number }) => void;
}

interface ResizableHook {
    size: { width: number; height: number };
    isResizing: boolean;
    ghosts: Ghost[];
    totalResizeAmount: number;
    resizeHandlers: {
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    };
}

export const useResizable = ({
    initialSize,
    position,
    minSize = { width: 150, height: 100 },
    onResizeEnd,
}: ResizableProps): ResizableHook => {
    const [size, setSize] = useState(initialSize);
    const [isResizing, setIsResizing] = useState(false);
    const [totalResizeAmount, setTotalResizeAmount] = useState(0);
    const [ghosts, setGhosts] = useState<Ghost[]>([]);

    const positionRef = useRef(position);
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const resizeStartInfo = useRef({
        initialMouseX: 0,
        initialMouseY: 0,
        initialWidth: 0,
        initialHeight: 0,
    });
    const lastGhost = useRef({ ...initialSize, ...position });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsResizing(true);
            resizeStartInfo.current = {
                initialMouseX: e.clientX,
                initialMouseY: e.clientY,
                initialWidth: size.width,
                initialHeight: size.height,
            };

            lastGhost.current = { ...size, ...positionRef.current };
        },
        [size],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartInfo.current.initialMouseX;
            const deltaY = e.clientY - resizeStartInfo.current.initialMouseY;

            setTotalResizeAmount(
                (prev) => prev + Math.abs(deltaX) + Math.abs(deltaY),
            );

            const newWidth = Math.max(
                minSize.width,
                resizeStartInfo.current.initialWidth + deltaX,
            );
            const newHeight = Math.max(
                minSize.height,
                resizeStartInfo.current.initialHeight + deltaY,
            );

            setSize({ width: newWidth, height: newHeight });

            const distanceMoved = Math.sqrt(
                Math.pow(deltaX, 2) + Math.pow(deltaY, 2),
            );
            if (distanceMoved > 30) {
                const newGhost = {
                    id: Date.now(),
                    width: lastGhost.current.width,
                    height: lastGhost.current.height,
                    x: positionRef.current.x,
                    y: positionRef.current.y,
                };
                setGhosts((prev) => [...prev, newGhost]);
                lastGhost.current = {
                    width: newWidth,
                    height: newHeight,
                    ...positionRef.current,
                };

                setTimeout(() => {
                    setGhosts((prev) =>
                        prev.filter((ghost) => ghost.id !== newGhost.id),
                    );
                }, 500);
            }
        },
        [minSize],
    );

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        if (onResizeEnd) {
            setSize((currentSize) => {
                onResizeEnd(currentSize);
                return currentSize;
            });
        }
    }, [onResizeEnd]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return {
        size,
        isResizing,
        ghosts,
        totalResizeAmount,
        resizeHandlers: {
            onMouseDown: handleMouseDown,
        },
    };
};
