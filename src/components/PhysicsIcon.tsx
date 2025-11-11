import React from 'react';

interface PhysicsIconProps {
    label: string;
    imageUrl: string;
    position: { x: number; y: number };
    angle: number;
    width: number;
    height: number;
    onDoubleClick: () => void;
}

const PhysicsIcon: React.FC<PhysicsIconProps> = ({
    label,
    imageUrl,
    position,
    angle,
    width,
    height,
    onDoubleClick,
}) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${position.x - width / 2}px, ${
            position.y - height / 2
        }px) rotate(${angle}rad)`,
        transformOrigin: 'center center',
        cursor: 'grab',
        zIndex: 100,
    };

    return (
        <div
            style={style}
            onDoubleClick={onDoubleClick}
            className="desktop-icon"
        >
            <img
                src={imageUrl}
                alt={label}
                width="32"
                height="32"
                style={{ pointerEvents: 'none' }}
            />
            <span style={{ pointerEvents: 'none' }}>{label}</span>
        </div>
    );
};

export default PhysicsIcon;
