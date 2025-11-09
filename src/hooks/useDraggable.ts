import { useState, useCallback, useEffect, useRef } from 'react';

interface Ghost {
    id: number;
    x: number;
    y: number;
}

interface DraggableHook {
    position: { x: number; y: number };
    ghosts: Ghost[];
    totalDistance: number;
    dragHandlers: {
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    };
}

export const useDraggable = (
    initialPosition: {
        x: number;
        y: number;
    },
    onDrag?: (distance: number, newPosition: { x: number; y: number }) => void,
): DraggableHook => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [totalDistance, setTotalDistance] = useState(0);
    const [ghosts, setGhosts] = useState<Ghost[]>([]);

    const dragStartOffset = useRef({ x: 0, y: 0 });
    const lastGhostPosition = useRef(initialPosition);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            setIsDragging(true);
            dragStartOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            const newX = e.clientX - dragStartOffset.current.x;
            const newY = e.clientY - dragStartOffset.current.y;
            const newPosition = { x: newX, y: newY };
            setPosition(newPosition);

            const distanceMoved = Math.sqrt(
                Math.pow(newX - lastGhostPosition.current.x, 2) +
                    Math.pow(newY - lastGhostPosition.current.y, 2),
            );
            setTotalDistance((prev) => prev + distanceMoved);

            if (onDrag) onDrag(distanceMoved, newPosition);

            if (distanceMoved > 20) {
                const newGhost = {
                    id: Date.now(),
                    x: lastGhostPosition.current.x,
                    y: lastGhostPosition.current.y,
                };
                setGhosts((prev) => [...prev, newGhost]);
                lastGhostPosition.current = { x: newX, y: newY };

                setTimeout(() => {
                    setGhosts((prev) =>
                        prev.filter((ghost) => ghost.id !== newGhost.id),
                    );
                }, 700);
            }
        },
        [onDrag],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return {
        position,
        ghosts,
        totalDistance,
        dragHandlers: { onMouseDown: handleMouseDown },
    };
};
