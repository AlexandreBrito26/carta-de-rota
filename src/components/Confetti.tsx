import { useEffect, useRef } from "react";

const COLORS = ["#c9a24b", "#1c6a8c", "#4ade80", "#f2e6c9", "#f87171", "#7fb2ff"];

interface Burst {
  x?: number;
  y?: number;
  power?: number;
}

// Dispara uma explosão de confete de qualquer lugar do app
export function celebrate({ x, y, power = 70 }: Burst = {}) {
  window.dispatchEvent(
    new CustomEvent("carta:celebrate", {
      detail: { x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight / 3, power },
    }),
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
}

export default function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let particles: Particle[] = [];
    let frame = 0;
    let last = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(window.innerWidth * dpr);
      canvas!.height = Math.floor(window.innerHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function step(now: number) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
      for (const p of particles) {
        p.vy += 900 * dt; // gravidade
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
        ctx!.save();
        ctx!.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      if (particles.length > 0) frame = requestAnimationFrame(step);
      else {
        frame = 0;
        last = 0;
        ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    function onCelebrate(e: Event) {
      if (document.documentElement.dataset.effects === "off") return;
      const { x, y, power } = (e as CustomEvent<Required<Burst>>).detail;
      for (let i = 0; i < power; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const speed = 380 + Math.random() * 520;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 12,
          w: 6 + Math.random() * 6,
          h: 4 + Math.random() * 4,
          color: COLORS[i % COLORS.length],
          life: 1.8 + Math.random() * 0.9,
        });
      }
      if (!frame) frame = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("carta:celebrate", onCelebrate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("carta:celebrate", onCelebrate);
    };
  }, []);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
