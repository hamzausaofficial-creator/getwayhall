import { useEffect, useRef } from 'react';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function Sparkles({
  className = '',
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = '#FFFFFF',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const minParticleSize = minSize ?? size / 2.5;
    const maxParticleSize = size;
    const maxParticleSpeed = speed;
    const minParticleOpacity = minOpacity ?? opacity / 10;
    const maxParticleOpacity = opacity;

    let frameId = 0;
    let particles = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(40, Math.min(density, Math.floor((width * height) / 9000)));
      particles = Array.from({ length: count }, () => ({
        x: randomBetween(0, width),
        y: randomBetween(0, height),
        vx: randomBetween(-maxParticleSpeed, maxParticleSpeed) * 0.35,
        vy: randomBetween(-maxParticleSpeed, maxParticleSpeed) * 0.35,
        size: randomBetween(minParticleSize, maxParticleSize),
        opacity: randomBetween(minParticleOpacity, maxParticleOpacity),
        opacityDelta: randomBetween(-opacitySpeed, opacitySpeed) * 0.01,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx * (0.4 + maxParticleSpeed * 0.1);
        particle.y += particle.vy * (0.4 + maxParticleSpeed * 0.1);
        particle.opacity += particle.opacityDelta;

        if (particle.opacity <= minParticleOpacity || particle.opacity >= maxParticleOpacity) {
          particle.opacityDelta *= -1;
        }

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        ctx.globalAlpha = Math.max(minParticleOpacity, Math.min(maxParticleOpacity, particle.opacity));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement ?? canvas);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [color, density, minOpacity, minSize, minSpeed, opacity, opacitySpeed, size, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
