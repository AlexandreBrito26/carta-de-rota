import { useEffect, useRef } from "react";

// Fundo de carta náutica: grade de meridianos e paralelos, sondagens,
// rosa dos ventos e uma rota que se desenha sozinha com um navio percorrendo o trajeto.
const ROUTE = [
  [0.06, 0.82], [0.18, 0.64], [0.32, 0.7], [0.46, 0.42],
  [0.6, 0.5], [0.74, 0.24], [0.9, 0.3], [0.97, 0.12],
];

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: cs.getPropertyValue("--ink").trim() || "#0f2d3f",
    sea: cs.getPropertyValue("--sea").trim() || "#1c6a8c",
    brass: cs.getPropertyValue("--brass").trim() || "#9a6b14",
  };
}

// Interpolação Catmull-Rom: a rota passa pelos pontos com curvas suaves
function catmull(p0: number[], p1: number[], p2: number[], p3: number[], t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1].map((i) =>
    0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3),
  );
}

// Amostra a rota inteira em pontos (em coordenadas normalizadas)
function sampleRoute(steps = 40): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const p0 = ROUTE[Math.max(0, i - 1)];
    const p1 = ROUTE[i];
    const p2 = ROUTE[i + 1];
    const p3 = ROUTE[Math.min(ROUTE.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) pts.push(catmull(p0, p1, p2, p3, s / steps));
  }
  pts.push(ROUTE[ROUTE.length - 1]);
  return pts;
}

// Sondagens fixas, geradas com semente para não mudarem a cada render
function soundings(count: number) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    depth: Math.round(4 + rand() * 60),
  }));
}

export default function ChartBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const path = sampleRoute();
    const marks = soundings(38);
    let palette = readPalette();
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;

    // Rosa dos ventos: 8 pontas, em losango
    function rose(cx: number, cy: number, r: number, angle: number) {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(angle);
      ctx!.globalAlpha = 0.12;
      ctx!.strokeStyle = palette.ink;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(0, 0, r, 0, Math.PI * 2);
      ctx!.stroke();
      for (let i = 0; i < 4; i++) {
        ctx!.rotate(Math.PI / 4);
        ctx!.beginPath();
        ctx!.moveTo(0, -r);
        ctx!.lineTo(r * 0.08, 0);
        ctx!.lineTo(0, r);
        ctx!.lineTo(-r * 0.08, 0);
        ctx!.closePath();
        ctx!.fillStyle = i % 2 === 0 ? palette.brass : palette.sea;
        ctx!.globalAlpha = 0.12;
        ctx!.fill();
      }
      ctx!.restore();
    }

    function draw(time: number) {
      const c = ctx!;
      c.clearRect(0, 0, width, height);

      // Grade de meridianos e paralelos
      c.save();
      c.strokeStyle = palette.ink;
      c.lineWidth = 1;
      c.globalAlpha = 0.05;
      const step = Math.max(56, Math.min(96, width / 12));
      for (let x = (width % step) / 2; x < width; x += step) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, height);
        c.stroke();
      }
      for (let y = (height % step) / 2; y < height; y += step) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(width, y);
        c.stroke();
      }
      c.restore();

      // Sondagens: números de profundidade em alguns nós da grade
      c.save();
      c.fillStyle = palette.ink;
      c.globalAlpha = 0.07;
      c.font = "11px ui-monospace, monospace";
      for (const m of marks) {
        c.fillText(String(m.depth), m.x * width, m.y * height);
      }
      c.restore();

      // Rosa dos ventos no canto superior direito, girando devagar
      const rr = Math.min(width, height) * 0.13;
      rose(width - rr * 1.15, rr * 1.15, rr, reduce ? 0 : time * 0.00004);

      // Rota: desenhada até o fim e depois o navio recomeça
      const total = path.length;
      const cycle = reduce ? 0.55 : ((time * 0.00012) % 1);
      const drawn = Math.max(2, Math.floor(total * (cycle < 0.7 ? cycle / 0.7 : 1)));
      c.save();
      c.lineCap = "round";
      c.lineJoin = "round";
      c.setLineDash([6, 8]);
      c.strokeStyle = palette.sea;
      c.globalAlpha = 0.5;
      c.lineWidth = 2.5;
      c.beginPath();
      path.slice(0, drawn).forEach(([x, y], i) => {
        const px = x * width;
        const py = y * height;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      });
      c.stroke();
      c.restore();

      // Navio: segue a ponta da rota e deixa um rastro curto
      const head = path[drawn - 1];
      const hx = head[0] * width;
      const hy = head[1] * height;
      const prev = path[Math.max(0, drawn - 3)];
      const angle = Math.atan2((head[1] - prev[1]) * height, (head[0] - prev[0]) * width);
      c.save();
      c.translate(hx, hy);
      c.rotate(angle);
      c.globalAlpha = 0.85;
      c.fillStyle = palette.brass;
      c.beginPath();
      c.moveTo(9, 0);
      c.lineTo(-6, -5);
      c.lineTo(-4, 0);
      c.lineTo(-6, 5);
      c.closePath();
      c.fill();
      c.restore();

      // Farol no fim da rota
      const end = path[total - 1];
      c.save();
      c.globalAlpha = 0.25 + 0.15 * Math.sin(time * 0.003);
      c.fillStyle = palette.brass;
      c.beginPath();
      c.arc(end[0] * width, end[1] * height, 5 + 2 * Math.sin(time * 0.003), 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (now - last < 1000 / 30) return; // 30 fps são suficientes para um fundo
      last = now;
      draw(now);
    }

    // Quando o tema muda, relê as cores da paleta
    const observer = new MutationObserver(() => {
      palette = readPalette();
      draw(performance.now());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    function onVisibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduce) frame = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="chart-bg" aria-hidden="true" />;
}
