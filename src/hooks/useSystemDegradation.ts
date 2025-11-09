import { useState, useEffect, useCallback, useRef } from 'react';

interface SystemDamage {
    totalPixelsLost: number;
    totalCracks: number;
    totalBurnMarks: number;
    totalDragDistance: number;
    totalCollisions: number;
    systemTemperature: number;
    memoryLeaks: number;
    corruptedSectors: Array<{ x: number; y: number; radius: number }>;
}

interface DamageEvent {
    type: 'pixel_loss' | 'crack' | 'burn' | 'collision' | 'memory_leak';
    severity: number;
    position: { x: number; y: number };
    timestamp: number;
}

export const useSystemDegradation = () => {
    const [damage, setDamage] = useState<SystemDamage>({
        totalPixelsLost: 0,
        totalCracks: 0,
        totalBurnMarks: 0,
        totalDragDistance: 0,
        totalCollisions: 0,
        systemTemperature: 20,
        memoryLeaks: 0,
        corruptedSectors: [],
    });

    const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
    const [systemHealth, setSystemHealth] = useState(100);
    const [criticalFailure, setCriticalFailure] = useState(false);

    const accumulatedDamage = useRef(0);

    const addDamageEvent = useCallback((event: DamageEvent) => {
        setDamageEvents((prev) => [...prev.slice(-50), event]);

        switch (event.type) {
            case 'pixel_loss':
                setDamage((prev) => ({
                    ...prev,
                    totalPixelsLost: prev.totalPixelsLost + event.severity,
                }));
                break;
            case 'crack':
                setDamage((prev) => ({
                    ...prev,
                    totalCracks: prev.totalCracks + 1,
                }));
                break;
            case 'burn':
                setDamage((prev) => ({
                    ...prev,
                    totalBurnMarks: prev.totalBurnMarks + 1,
                }));
                break;
            case 'collision':
                setDamage((prev) => ({
                    ...prev,
                    totalCollisions: prev.totalCollisions + 1,
                    systemTemperature: Math.min(
                        100,
                        prev.systemTemperature + event.severity * 0.5,
                    ),
                }));
                break;
            case 'memory_leak':
                setDamage((prev) => ({
                    ...prev,
                    memoryLeaks: prev.memoryLeaks + 1,
                }));
                break;
        }

        accumulatedDamage.current += event.severity;

        if (event.severity > 20) {
            setDamage((prev) => ({
                ...prev,
                corruptedSectors: [
                    ...prev.corruptedSectors,
                    {
                        x: event.position.x,
                        y: event.position.y,
                        radius: event.severity * 2,
                    },
                ].slice(-30),
            }));
        }
    }, []);

    const addDragDistance = useCallback((distance: number) => {
        setDamage((prev) => ({
            ...prev,
            totalDragDistance: prev.totalDragDistance + distance,
        }));
    }, []);

    useEffect(() => {
        const healthReduction =
            damage.totalPixelsLost * 0.01 +
            damage.totalCracks * 2 +
            damage.totalBurnMarks * 0.5 +
            damage.totalCollisions * 0.3 +
            damage.memoryLeaks * 5 +
            damage.totalDragDistance * 0.0001;

        const newHealth = Math.max(0, 100 - healthReduction);
        setSystemHealth(newHealth);

        if (newHealth <= 0 && !criticalFailure) {
            setCriticalFailure(true);
            triggerSystemFailure();
        }
    }, [damage, criticalFailure]);

    useEffect(() => {
        const cooldownInterval = setInterval(() => {
            setDamage((prev) => ({
                ...prev,
                systemTemperature: Math.max(20, prev.systemTemperature - 0.5),
            }));
        }, 1000);

        return () => clearInterval(cooldownInterval);
    }, []);

    useEffect(() => {
        if (systemHealth < 30 && systemHealth > 0) {
            const failureInterval = setInterval(() => {
                if (Math.random() > 0.7) {
                    addDamageEvent({
                        type: 'memory_leak',
                        severity: Math.random() * 10,
                        position: {
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                        },
                        timestamp: Date.now(),
                    });
                }
            }, 3000);

            return () => clearInterval(failureInterval);
        }
    }, [systemHealth, addDamageEvent]);

    const triggerSystemFailure = useCallback(() => {
        const blueScreen = document.createElement('div');
        blueScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #0000ff;
      color: white;
      font-family: monospace;
      padding: 50px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: glitch 0.1s infinite;
    `;

        blueScreen.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">:(</div>
      <div style="font-size: 24px; margin-bottom: 40px;">Your PC ran into a problem and needs to restart.</div>
      <div style="font-size: 14px;">
        CRITICAL_INTERFACE_DEGRADATION<br/>
        Total pixels lost: ${damage.totalPixelsLost}<br/>
        Total cracks: ${damage.totalCracks}<br/>
        System temperature: ${damage.systemTemperature}°C<br/>
        Memory leaks: ${damage.memoryLeaks}
      </div>
      <div style="margin-top: 40px; font-size: 12px;">
        Press any key to continue degradation_
      </div>
    `;

        document.body.appendChild(blueScreen);

        const handleKeyPress = () => {
            document.body.removeChild(blueScreen);
            window.removeEventListener('keypress', handleKeyPress);

            setCriticalFailure(false);
            setSystemHealth(50);
            setDamage((prev) => ({
                ...prev,
                memoryLeaks: Math.floor(prev.memoryLeaks / 2),
                systemTemperature: 20,
            }));
        };

        window.addEventListener('keypress', handleKeyPress);
    }, [damage]);

    const getSystemEffects = useCallback(() => {
        const effects = [];

        if (damage.systemTemperature > 60) {
            effects.push('heat-haze');
        }

        if (damage.memoryLeaks > 5) {
            effects.push('memory-corruption');
        }

        if (damage.totalCracks > 20) {
            effects.push('structural-failure');
        }

        if (systemHealth < 20) {
            effects.push('critical-degradation');
        }

        return effects;
    }, [damage, systemHealth]);

    const getSystemCSS = useCallback(() => {
        return `
      body {
        filter: 
          ${
              damage.systemTemperature > 70
                  ? `hue-rotate(${damage.systemTemperature - 70}deg)`
                  : ''
          }
          ${
              damage.memoryLeaks > 10
                  ? `contrast(${1 + damage.memoryLeaks * 0.01})`
                  : ''
          }
          ${systemHealth < 50 ? `brightness(${0.5 + systemHealth / 100})` : ''};
        transform: ${
            damage.totalCracks > 30
                ? `skew(${Math.sin(Date.now() * 0.001) * 0.5}deg)`
                : ''
        };
      }
      
      ${damage.corruptedSectors
          .map(
              (sector, i) => `
        .corrupted-sector-${i} {
          position: fixed;
          left: ${sector.x}px;
          top: ${sector.y}px;
          width: ${sector.radius}px;
          height: ${sector.radius}px;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255, 0, 0, 0.2) 2px,
            rgba(255, 0, 0, 0.2) 4px
          );
          pointer-events: none;
          z-index: 9999;
          animation: sector-glitch 0.5s infinite;
        }
      `,
          )
          .join('')}
      
      @keyframes sector-glitch {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      
      ${
          systemHealth < 30
              ? `
        * {
          animation: degradation-shake ${
              10 - systemHealth / 3
          }s infinite !important;
        }
        
        @keyframes degradation-shake {
          0%, 100% { transform: translateX(0); }
          ${Array.from(
              { length: 10 },
              (_, i) => `
            ${i * 10}% { transform: translateX(${
                (Math.random() - 0.5) * 2
            }px); }
          `,
          ).join('')}
        }
      `
              : ''
      }
    `;
    }, [damage, systemHealth]);

    return {
        damage,
        systemHealth,
        criticalFailure,
        addDamageEvent,
        addDragDistance,
        getSystemEffects,
        getSystemCSS,
        damageEvents,
    };
};

export default useSystemDegradation;
