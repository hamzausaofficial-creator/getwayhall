import {
  Children, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  motion,
  useAnimate,
  useAnimationFrame,
} from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useMouseVector } from '../../hooks/useMouseVector';

export function ImageTrail({
  children,
  newOnTop = true,
  rotationRange = 15,
  containerRef,
  animationSequence = [
    [{ scale: 1.2 }, { duration: 0.1, ease: 'circOut' }],
    [{ scale: 0 }, { duration: 0.5, ease: 'circIn' }],
  ],
  interval = 100,
}) {
  const [trail, setTrail] = useState([]);
  const lastAddedTimeRef = useRef(0);
  const { position: mousePosition } = useMouseVector(containerRef);
  const lastMousePosRef = useRef(mousePosition);
  const currentIndexRef = useRef(0);
  const childrenArray = useMemo(() => Children.toArray(children), [children]);

  const addToTrail = useCallback((mousePos) => {
    if (!childrenArray.length) return;

    const newItem = {
      id: uuidv4(),
      x: mousePos.x,
      y: mousePos.y,
      rotation: (Math.random() - 0.5) * rotationRange * 2,
      animationSequence,
      scale: 1,
      child: childrenArray[currentIndexRef.current],
    };

    currentIndexRef.current = (currentIndexRef.current + 1) % childrenArray.length;

    setTrail((prev) => (newOnTop ? [...prev, newItem] : [newItem, ...prev]));
  }, [childrenArray, rotationRange, animationSequence, newOnTop]);

  const removeFromTrail = useCallback((itemId) => {
    setTrail((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  useAnimationFrame((time) => {
    if (
      lastMousePosRef.current.x === mousePosition.x
      && lastMousePosRef.current.y === mousePosition.y
    ) {
      return;
    }
    lastMousePosRef.current = mousePosition;

    if (time - lastAddedTimeRef.current < interval) return;

    lastAddedTimeRef.current = time;
    addToTrail(mousePosition);
  });

  return (
    <div className="relative h-full w-full pointer-events-none">
      {trail.map((item) => (
        <TrailItem key={item.id} item={item} onComplete={removeFromTrail} />
      ))}
    </div>
  );
}

function TrailItem({ item, onComplete }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const sequence = item.animationSequence.map((segment) => [
      scope.current,
      ...segment,
    ]);

    let cancelled = false;
    animate(sequence).then(() => {
      if (!cancelled) onComplete(item.id);
    });

    return () => {
      cancelled = true;
    };
  }, [animate, item.animationSequence, item.id, onComplete, scope]);

  return (
    <motion.div
      ref={scope}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: item.x,
        top: item.y,
        rotate: item.rotation,
      }}
    >
      {item.child}
    </motion.div>
  );
}
