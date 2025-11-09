import React from 'react';

interface CrackOverlayProps {
    wearLevel: number;
}

const CrackOverlay: React.FC<CrackOverlayProps> = ({ wearLevel }) => {
    const crackPaths = [
        { path: 'M 10 10 L 50 40 L 45 60', threshold: 1000 },
        { path: 'M 150 20 L 120 80', threshold: 3000 },
        { path: 'M 200 150 L 180 120 L 220 100', threshold: 6000 },
        { path: 'M 20 180 L 80 170', threshold: 10000 },
    ];

    return (
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
            viewBox="0 0 250 200"
            preserveAspectRatio="none"
        >
            {crackPaths.map(
                (crack, index) =>
                    wearLevel > crack.threshold && (
                        <path
                            key={index}
                            d={crack.path}
                            stroke="rgba(0, 0, 0, 0.4)"
                            strokeWidth="0.5"
                            fill="none"
                        />
                    ),
            )}
        </svg>
    );
};

export default CrackOverlay;
