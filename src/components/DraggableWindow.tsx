import React from 'react';
import Window from './Window';
import { useDraggable } from '../hooks/useDraggable';

interface GhostProps {
    x: number;
    y: number;
    width: string | number;
    height: string | number;
}

const Ghost: React.FC<GhostProps> = ({ x, y, width, height }) => (
    <div
        className="ghost-window"
        style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width,
            height,
        }}
    />
);

interface DraggableWindowProps extends React.ComponentProps<typeof Window> {
    initialPosition: { x: number; y: number };
    width: string | number;
    height: string | number;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
    initialPosition,
    width,
    height,
    children,
    ...windowProps
}) => {
    const { position, ghosts, dragHandlers } = useDraggable(initialPosition);

    return (
        <>
            {ghosts.map((ghost) => (
                <Ghost
                    key={ghost.id}
                    x={ghost.x}
                    y={ghost.y}
                    width={width}
                    height={height}
                />
            ))}

            <div
                {...dragHandlers}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width,
                    cursor: 'move',
                    zIndex: '999',
                }}
            >
                <Window {...windowProps}>{children}</Window>
            </div>
        </>
    );
};

export default DraggableWindow;
