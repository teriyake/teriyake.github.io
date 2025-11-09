import React, { useState, useEffect, useRef, useCallback } from 'react';
import Window from './Window';

interface EvasiveWindowProps
    extends Omit<React.ComponentProps<typeof Window>, 'style'> {
    initialPosition: { x: number; y: number };
    initialSize: { width: number; height: number };
}

const PERSONAL_SPACE = 400;
const EVASION_FORCE = 2.3;
const DAMPING = 0.92;
const WALL_BOUNCE = -0.4;
const EvasiveWindow: React.FC<EvasiveWindowProps> = ({
    initialPosition,
    initialSize,
    children,
    ...windowProps
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [size] = useState(initialSize);
    const velocity = useRef({ x: 0, y: 0 });
    const mousePosition = useRef({ x: -1000, y: -1000 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mousePosition.current = { x: event.clientX, y: event.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const animationFrame = useRef<number>(0);
    const runPhysicsLoop = useCallback(() => {
        const windowEl = windowRef.current;
        if (!windowEl) return;

        const rect = windowEl.getBoundingClientRect();
        const windowCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };

        const dx = windowCenter.x - mousePosition.current.x;
        const dy = windowCenter.y - mousePosition.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PERSONAL_SPACE) {
            const force = (PERSONAL_SPACE - distance) / PERSONAL_SPACE;
            const angle = Math.atan2(dy, dx);

            velocity.current.x += Math.cos(angle) * force * EVASION_FORCE;
            velocity.current.y += Math.sin(angle) * force * EVASION_FORCE;
        }

        velocity.current.x *= DAMPING;
        velocity.current.y *= DAMPING;

        let newX = position.x + velocity.current.x;
        let newY = position.y + velocity.current.y;

        if (newX < 0) {
            newX = 0;
            velocity.current.x *= WALL_BOUNCE;
        } else if (newX + size.width > window.innerWidth) {
            newX = window.innerWidth - size.width;
            velocity.current.x *= WALL_BOUNCE;
        }

        if (newY < 0) {
            newY = 0;
            velocity.current.y *= WALL_BOUNCE;
        } else if (newY + size.height > window.innerHeight) {
            newY = window.innerHeight - size.height;
            velocity.current.y *= WALL_BOUNCE;
        }

        setPosition({ x: newX, y: newY });

        animationFrame.current = requestAnimationFrame(runPhysicsLoop);
    }, [position.x, position.y, size.width, size.height]);

    useEffect(() => {
        animationFrame.current = requestAnimationFrame(runPhysicsLoop);
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [runPhysicsLoop]);

    return (
        <div
            ref={windowRef}
            style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                zIndex: 990,
            }}
        >
            <Window {...windowProps} style={{ width: '100%', height: '100%' }}>
                {children}
            </Window>
        </div>
    );
};

export default EvasiveWindow;
