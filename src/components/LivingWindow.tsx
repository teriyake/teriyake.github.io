import React, { useState, useEffect, useRef } from 'react';
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

interface LivingWindowProps
    extends Omit<React.ComponentProps<typeof Window>, 'style'> {
    initialPosition: { x: number; y: number };
    width: number;
    height: number;
    breathingIntensity?: number;
    hungerEnabled?: boolean;
    mouseReactive?: boolean;
}

const LivingWindow: React.FC<LivingWindowProps> = ({
    initialPosition,
    width,
    height,
    breathingIntensity = 5,
    hungerEnabled = false,
    mouseReactive = true,
    children,
    ...windowProps
}) => {
    const { position, ghosts, dragHandlers } = useDraggable(initialPosition);
    const [breathPhase, setBreathPhase] = useState(0);
    const [heartbeat, setHeartbeat] = useState(0);
    const [isDisturbed, _setIsDisturbed] = useState(false);
    const [mouseDistance, setMouseDistance] = useState(1000);
    const [hunger, setHunger] = useState(0);
    const [lastFed, setLastFed] = useState(Date.now());
    const [isFeeding, setIsFeeding] = useState(false);
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mouseReactive) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (windowRef.current) {
                const rect = windowRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - centerX, 2) +
                        Math.pow(e.clientY - centerY, 2),
                );
                setMouseDistance(distance);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseReactive, position]);

    useEffect(() => {
        if (!hungerEnabled) return;

        const hungerInterval = setInterval(() => {
            const timeSinceFeeding = Date.now() - lastFed;
            const hungerRate = timeSinceFeeding / 1000;
            setHunger((prev) => Math.min(100, prev + hungerRate * 0.1));
        }, 100);

        return () => clearInterval(hungerInterval);
    }, [hungerEnabled, lastFed]);

    const handleFeed = () => {
        if (hungerEnabled && hunger > 20) {
            setIsFeeding(true);
            setHunger(0);
            setLastFed(Date.now());
            setTimeout(() => setIsFeeding(false), 1000);
        }
    };

    const actualIntensity =
        breathingIntensity +
        hunger / 20 +
        (mouseDistance < 100 ? (100 - mouseDistance) / 20 : 0);

    useEffect(() => {
        const speed = hunger > 50 ? 30 : 50;
        const breathInterval = setInterval(() => {
            setBreathPhase((prev) => prev + 0.05 * (1 + hunger / 100));
        }, speed);
        return () => clearInterval(breathInterval);
    }, [hunger]);

    useEffect(() => {
        const heartbeatPattern = () => {
            setHeartbeat(1);
            setTimeout(() => setHeartbeat(0.3), 100);
            setTimeout(() => setHeartbeat(0.8), 200);
            setTimeout(() => setHeartbeat(0), 400);
        };

        const baseInterval = 2000;
        const interval =
            baseInterval - hunger * 10 - (mouseDistance < 200 ? 500 : 0);
        const timer = setInterval(heartbeatPattern, Math.max(500, interval));
        return () => clearInterval(timer);
    }, [hunger, mouseDistance]);

    const breathingScale = actualIntensity / 10;
    const nervousness = mouseDistance < 150 ? (150 - mouseDistance) / 150 : 0;

    const deformation = {
        scaleX:
            1 +
            (Math.sin(breathPhase) * 0.02 +
                Math.sin(breathPhase * 1.7) * 0.01) *
                breathingScale +
            nervousness * Math.sin(breathPhase * 10) * 0.005,
        scaleY:
            1 +
            (Math.sin(breathPhase * 0.9 + 1) * 0.025 +
                Math.sin(breathPhase * 2.1) * 0.008) *
                breathingScale +
            nervousness * Math.cos(breathPhase * 10) * 0.005,
        skewX:
            Math.sin(breathPhase * 1.3) * 0.5 * breathingScale +
            (isFeeding ? Math.sin(Date.now() * 0.01) * 2 : 0),
        skewY:
            Math.sin(breathPhase * 0.7 + 0.5) * 0.3 * breathingScale +
            (isFeeding ? Math.cos(Date.now() * 0.01) * 2 : 0),
        pulse: heartbeat * breathingScale * 0.01,
        jitter: nervousness * (Math.random() - 0.5) * 2,
    };

    const hungerColor = {
        r: Math.floor(255 - hunger),
        g: Math.floor(255 - hunger * 2),
        b: Math.floor(255 - hunger * 1.5),
    };

    const filterId = `organic-enhanced-${position.x}-${position.y}`;

    return (
        <>
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id={filterId}>
                        <feTurbulence
                            baseFrequency={
                                isDisturbed || isFeeding
                                    ? '0.08 0.09'
                                    : `${0.02 + nervousness * 0.02} ${
                                          0.03 + nervousness * 0.02
                                      }`
                            }
                            numOctaves="4"
                            result="turbulence"
                            seed={Math.floor(breathPhase)}
                        >
                            <animate
                                attributeName="baseFrequency"
                                dur={`${4 - hunger / 50}s`}
                                values={`${0.02 + hunger / 500} ${
                                    0.03 + hunger / 500
                                };${0.04 + hunger / 200} ${
                                    0.06 + hunger / 200
                                };${0.02 + hunger / 500} ${
                                    0.03 + hunger / 500
                                }`}
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="turbulence"
                            scale={
                                (isDisturbed ? 8 : 3) * breathingScale +
                                (isFeeding ? 15 : 0)
                            }
                        >
                            <animate
                                attributeName="scale"
                                dur={`${3.5 - hunger / 40}s`}
                                values={`${
                                    (2 + hunger / 20) * breathingScale
                                };${(5 + hunger / 10) * breathingScale};${
                                    (3 + hunger / 20) * breathingScale
                                };${(2 + hunger / 20) * breathingScale}`}
                                repeatCount="indefinite"
                            />
                        </feDisplacementMap>

                        <feColorMatrix
                            type="matrix"
                            values={`${1 - hunger / 200} 0 0 0 ${
                                Math.sin(breathPhase) * 0.02 + hunger / 1000
                            }
                      0 ${1 - hunger / 150} 0 0 ${
                          Math.sin(breathPhase + 2) * 0.01
                      }
                      0 0 ${1 - hunger / 100} 0 ${
                          Math.sin(breathPhase + 4) * 0.01
                      }
                      0 0 0 1 0`}
                        />

                        {isFeeding && (
                            <feGaussianBlur stdDeviation="2">
                                <animate
                                    attributeName="stdDeviation"
                                    values="0;3;0"
                                    dur="0.5s"
                                    repeatCount="indefinite"
                                />
                            </feGaussianBlur>
                        )}
                    </filter>
                </defs>
            </svg>

            {ghosts.map((ghost) => (
                <Ghost
                    key={ghost.id}
                    x={ghost.x}
                    y={ghost.y}
                    width={width}
                    height={height}
                />
            ))}

            {/*
      {ghosts.map((ghost, index) => (
        <div
          key={ghost.id}
          className="ghost-window flesh-ghost"
          style={{
            position: "absolute",
            left: `${ghost.x}px`,
            top: `${ghost.y}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${15 + index * 2}px ${10 + index}px ${
              12 + index * 1.5
            }px ${8 + index * 2}px`,
            opacity: 0.3 - index * 0.05,
            filter: `blur(${2 + index}px) hue-rotate(${hunger}deg)`,
            border: `1px solid rgba(${hungerColor.r}, 0, 0, 0.3)`,
          }}
        />
      ))}
        */}

            <div
                {...dragHandlers}
                ref={windowRef}
                onClick={handleFeed}
                className={`living-window-container ${
                    mouseDistance < 150 ? 'mouse-near' : ''
                } ${hunger > 80 ? 'highly-alive' : ''}`}
                style={{
                    position: 'absolute',
                    left: `${position.x + deformation.jitter}px`,
                    top: `${position.y + deformation.jitter}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: isFeeding ? 'wait' : hunger > 50 ? 'help' : 'move',
                    zIndex: 999,
                    transform: `
            scaleX(${deformation.scaleX + deformation.pulse}) 
            scaleY(${deformation.scaleY + deformation.pulse})
            skewX(${deformation.skewX}deg)
            skewY(${deformation.skewY}deg)
            rotate(${isFeeding ? Math.sin(Date.now() * 0.01) * 5 : 0}deg)
          `,
                    transformOrigin: `${
                        50 + Math.sin(breathPhase * 0.5) * 10
                    }% ${50 + Math.cos(breathPhase * 0.7) * 10}%`,
                    filter: `url(#${filterId}) ${
                        hunger > 70 ? 'saturate(0.8) contrast(1.1)' : ''
                    }`,
                    transition:
                        isDisturbed || isFeeding
                            ? 'none'
                            : 'transform 0.1s ease-out',
                    borderRadius: `${
                        15 + Math.sin(breathPhase) * 5 + hunger / 10
                    }px ${10 + Math.sin(breathPhase + 1) * 3}px ${
                        12 + Math.sin(breathPhase + 2) * 4
                    }px ${8 + Math.sin(breathPhase + 3) * 6 + hunger / 10}px`,
                    boxShadow: `
            0 ${2 + heartbeat * 5}px ${10 + heartbeat * 20}px rgba(${
                hungerColor.r
            }, 0, 0, ${0.2 + heartbeat * 0.3}),
            inset 0 0 ${20 * breathingScale + hunger / 5}px rgba(255, ${
                255 - hunger * 2
            }, ${255 - hunger * 2}, ${0.02 + Math.sin(breathPhase) * 0.01}),
            ${isFeeding ? `0 0 40px rgba(255, 100, 100, 0.6)` : ''}
          `,
                }}
            >
                <div
                    className="vein-network"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        opacity: 0.1 * breathingScale + hunger / 200,
                        background: `
              repeating-linear-gradient(
                ${45 + Math.sin(breathPhase) * 5}deg,
                transparent,
                transparent ${10 - hunger / 20}px,
                rgba(${128 + hunger}, 0, 0, ${0.1 + hunger / 500}) ${
                    10 - hunger / 20
                }px,
                rgba(${128 + hunger}, 0, 0, ${0.1 + hunger / 500}) ${
                    11 - hunger / 20
                }px
              ),
              repeating-linear-gradient(
                ${-45 + Math.cos(breathPhase) * 5}deg,
                transparent,
                transparent ${15 - hunger / 15}px,
                rgba(${100 + hunger / 2}, 0, 0, ${0.05 + hunger / 400}) ${
                    15 - hunger / 15
                }px,
                rgba(${100 + hunger / 2}, 0, 0, ${0.05 + hunger / 400}) ${
                    16 - hunger / 15
                }px
              )
            `,
                        borderRadius: 'inherit',
                        animation:
                            hunger > 50
                                ? `blood-flow ${
                                      10 - hunger / 20
                                  }s infinite linear`
                                : 'none',
                    }}
                />

                {isFeeding && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle, rgba(0,0,0,0.8) 0%, transparent 70%)',
                            animation: 'feeding-gulp 1s ease-out',
                            pointerEvents: 'none',
                        }}
                    />
                )}

                <Window
                    {...windowProps}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: `rgba(${hungerColor.r}, ${hungerColor.g}, ${hungerColor.b}, 0.98)`,
                    }}
                >
                    {children}
                </Window>
            </div>

            <style>{`
        @keyframes feeding-gulp {
          0% {
            width: 40px;
            height: 40px;
            opacity: 1;
          }
          100% {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
      `}</style>
        </>
    );
};

export default LivingWindow;
