import { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';

export interface PhysicsObject {
    id: string;
    label: string;
    imageUrl: string;
    width: number;
    height: number;
}

export const usePhysicsEngine = (
    containerRef: React.RefObject<HTMLElement | null>,
    objects: PhysicsObject[],
) => {
    const [bodies, setBodies] = useState<Matter.Body[]>([]);
    const engineRef = useRef(Matter.Engine.create());
    const bodiesMapRef = useRef<Map<string, Matter.Body>>(new Map());

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const engine = engineRef.current;
        const world = engine.world;
        engine.gravity.y = 0.6;

        const walls = [
            Matter.Bodies.rectangle(
                container.clientWidth / 2,
                container.clientHeight + 25,
                container.clientWidth,
                50,
                { isStatic: true },
            ),
            Matter.Bodies.rectangle(
                -25,
                container.clientHeight / 2,
                50,
                container.clientHeight,
                { isStatic: true },
            ),
            Matter.Bodies.rectangle(
                container.clientWidth + 25,
                container.clientHeight / 2,
                50,
                container.clientHeight,
                { isStatic: true },
            ),
        ];
        Matter.Composite.add(world, walls);

        const mouse = Matter.Mouse.create(container);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false,
                },
            },
        });
        Matter.Composite.add(world, mouseConstraint);

        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        let animationFrameId: number;
        const update = () => {
            setBodies([...world.bodies.filter((body) => !body.isStatic)]);
            animationFrameId = requestAnimationFrame(update);
        };
        update();

        return () => {
            cancelAnimationFrame(animationFrameId);
            Matter.Runner.stop(runner);
            Matter.Engine.clear(engine);
            Matter.Composite.clear(world, false);
        };
    }, [containerRef]);

    useEffect(() => {
        const world = engineRef.current.world;
        const currentBodyIds = new Set(bodiesMapRef.current.keys());
        const newObjectIds = new Set(objects.map((obj) => obj.id));

        objects.forEach((obj) => {
            if (!currentBodyIds.has(obj.id)) {
                const body = Matter.Bodies.rectangle(
                    Math.random() *
                        (containerRef.current?.clientWidth ||
                            window.innerWidth),
                    -50,
                    obj.width,
                    obj.height,
                    {
                        restitution: 0.8 + 0.2 * (Math.random() * 2 - 1),
                        friction: 0.3 + 0.15 * (Math.random() * 2 - 1),
                        label: obj.id,
                        angle: (Math.random() - 0.5) * Math.PI,
                    },
                );
                Matter.Body.setMass(body, 1.4 + 1.1 * (Math.random() * 2 - 1));
                bodiesMapRef.current.set(obj.id, body);
                Matter.Composite.add(world, body);
            }
        });

        currentBodyIds.forEach((id) => {
            if (!newObjectIds.has(id)) {
                const body = bodiesMapRef.current.get(id);
                if (body) {
                    Matter.Composite.remove(world, body);
                    bodiesMapRef.current.delete(id);
                }
            }
        });
    }, [objects, containerRef]);

    return bodies;
};
