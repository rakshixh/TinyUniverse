'use client';

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Asteroid {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  vertices: { x: number; y: number }[];
}

const STAR_COLORS = [
  'rgba(255, 255, 255, ',
  'rgba(254, 240, 138, ', // Yellowish (#fef08a)
  'rgba(186, 230, 253, ', // Bluish (#bae6fd)
  'rgba(245, 243, 255, ', // Purplish (#f5f3ff)
];

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Handle high DPI screens
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initElements();
    };

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let asteroids: Asteroid[] = [];

    const initElements = () => {
      // Density-based star count
      const starCount = Math.floor((width * height) / 8000);
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }

      // Generate 4 to 8 asteroids
      const asteroidCount = 4 + Math.floor(Math.random() * 4);
      asteroids = [];
      for (let i = 0; i < asteroidCount; i++) {
        const size = 5 + Math.random() * 10;
        const numPoints = 8 + Math.floor(Math.random() * 5);
        const vertices = [];
        
        // Generate irregular polygon vertices
        for (let j = 0; j < numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const r = size * (0.75 + Math.random() * 0.4);
          vertices.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
          });
        }

        asteroids.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          speedX: (Math.random() * 0.15 + 0.05) * (Math.random() < 0.5 ? 1 : -1),
          speedY: (Math.random() * 0.15 + 0.05) * (Math.random() < 0.5 ? 1 : -1),
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() * 0.005 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
          vertices,
        });
      }

      shootingStars = [];
    };

    const spawnShootingStar = () => {
      // Spawn from top or right edges to fall left/down
      const spawnFromTop = Math.random() < 0.5;
      const x = spawnFromTop ? Math.random() * width : width;
      const y = spawnFromTop ? 0 : Math.random() * (height * 0.6);
      
      const angle = Math.PI * 0.75 + (Math.random() * 0.15 - 0.075); // Diagonal down-left (~135 deg)
      const speed = 15 + Math.random() * 12;
      const maxLife = 25 + Math.floor(Math.random() * 20);

      shootingStars.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: 40 + Math.random() * 50,
        speed,
        alpha: 0.8 + Math.random() * 0.2,
        life: 0,
        maxLife,
      });
    };

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Twinkling Stars
      stars.forEach((star) => {
        // Pulse alpha
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${star.alpha.toFixed(2)})`;
        ctx.fill();
      });

      // 2. Spawn and Draw Shooting Stars
      if (Math.random() < 0.0012 && shootingStars.length < 2) {
        spawnShootingStar();
      }

      shootingStars.forEach((s, idx) => {
        s.x += s.dx;
        s.y += s.dy;
        s.life++;

        // Fade out towards the end of life
        const lifeRatio = s.life / s.maxLife;
        const currentAlpha = s.alpha * (1 - lifeRatio);

        if (s.life >= s.maxLife || s.x < -s.length || s.y > height + s.length) {
          shootingStars.splice(idx, 1);
          return;
        }

        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          s.x,
          s.y,
          s.x - s.dx * (s.length / s.speed),
          s.y - s.dy * (s.length / s.speed)
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha.toFixed(2)})`);
        grad.addColorStop(0.3, `rgba(147, 197, 253, ${(currentAlpha * 0.6).toFixed(2)})`); // Light blue tint tail
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x - s.dx * (s.length / s.speed),
          s.y - s.dy * (s.length / s.speed)
        );
        ctx.stroke();
      });

      // 3. Draw Moving Asteroids
      asteroids.forEach((ast) => {
        ast.x += ast.speedX;
        ast.y += ast.speedY;
        ast.rotation += ast.rotSpeed;

        // Wrap around edges
        const margin = ast.size * 2;
        if (ast.x < -margin) ast.x = width + margin;
        if (ast.x > width + margin) ast.x = -margin;
        if (ast.y < -margin) ast.y = height + margin;
        if (ast.y > height + margin) ast.y = -margin;

        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);

        // Draw asteroid body
        ctx.beginPath();
        ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
        for (let i = 1; i < ast.vertices.length; i++) {
          ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
        }
        ctx.closePath();

        // Dark celestial stone fill
        ctx.fillStyle = 'rgba(20, 18, 24, 0.85)';
        ctx.fill();

        // Faint outline highlight to make it pop against dark space
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}
