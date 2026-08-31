import React, { useEffect, useRef } from 'react';
import { SylviaState } from '../types';

interface StarFieldProps {
  sylviaState: SylviaState;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  speedX: number;
  speedY: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export const StarField: React.FC<StarFieldProps> = ({ sylviaState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    const STAR_COUNT = Math.min(260, Math.floor((width * height) / 4500));
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    const colors = [
      '#ffffff',
      '#e0e7ff', // soft indigo
      '#c7d2fe', // lilac
      '#a5b4fc', // violet
      '#bae6fd', // light cyan
      '#fbcfe8', // faint rose
    ];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.2,
          alpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initStars();

    let lastShootingStarTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient background
      const bgGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      
      // Dynamic ambient tint based on Sylvia state
      let centerNebula = 'rgba(15, 23, 42, 0.95)';
      let midNebula = 'rgba(8, 14, 28, 0.98)';

      if (sylviaState === 'THINKING' || sylviaState === 'ANALYZING') {
        centerNebula = 'rgba(25, 20, 55, 0.95)';
        midNebula = 'rgba(10, 15, 35, 0.98)';
      } else if (sylviaState === 'WORKING') {
        centerNebula = 'rgba(15, 30, 60, 0.95)';
        midNebula = 'rgba(8, 18, 38, 0.98)';
      } else if (sylviaState === 'WAITING_FOR_APPROVAL') {
        centerNebula = 'rgba(38, 25, 10, 0.95)';
        midNebula = 'rgba(18, 14, 10, 0.98)';
      } else if (sylviaState === 'ERROR') {
        centerNebula = 'rgba(38, 12, 18, 0.95)';
        midNebula = 'rgba(20, 8, 12, 0.98)';
      }

      bgGradient.addColorStop(0, centerNebula);
      bgGradient.addColorStop(0.5, midNebula);
      bgGradient.addColorStop(1, '#030712');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Activity multiplier
      const isDynamic = sylviaState === 'THINKING' || sylviaState === 'ANALYZING' || sylviaState === 'WORKING';
      const speedMultiplier = isDynamic ? 2.2 : 1.0;

      // Draw and animate stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Twinkle
        star.alpha += star.twinkleSpeed * (isDynamic ? 2 : 1);
        if (star.alpha > 0.95 || star.alpha < 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Slight drift
        star.x += star.speedX * speedMultiplier;
        star.y += star.speedY * speedMultiplier;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.shadowBlur = star.size > 1.2 ? 6 : 0;
        ctx.shadowColor = star.color;
        ctx.fill();
      }

      // Constellation connection lines (subtle pairs)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < stars.length; i += 3) {
        for (let j = i + 1; j < Math.min(i + 4, stars.length); j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = isDynamic ? 'rgba(165, 180, 252, 0.16)' : 'rgba(148, 163, 184, 0.06)';
            ctx.globalAlpha = (1 - dist / 85) * (isDynamic ? 0.35 : 0.15);
            ctx.stroke();
          }
        }
      }

      // Random shooting stars
      const now = Date.now();
      if (now - lastShootingStarTime > 4000 && Math.random() < 0.3) {
        lastShootingStarTime = now;
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * (height * 0.4),
          length: Math.random() * 80 + 50,
          speed: Math.random() * 8 + 6,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
          opacity: 1,
          life: 0,
          maxLife: 35,
        });
      }

      // Render shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity = 1 - ss.life / ss.maxLife;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        grad.addColorStop(0.3, `rgba(165, 180, 252, ${ss.opacity * 0.7})`);
        grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#818cf8';
        ctx.globalAlpha = ss.opacity;
        ctx.stroke();

        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [sylviaState]);

  return (
    <canvas
      ref={canvasRef}
      id="sylvia-starfield-canvas"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
