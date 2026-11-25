import { reducedMotion } from './env';
import { planet } from './planet';

const COUNT = 3200;
const SPIN = 0.035;
const TILT = 0.38;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const points = Array.from({ length: COUNT }, (_, i) => {
  const y = 1 - (i / (COUNT - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * GOLDEN;
  return [Math.cos(a) * r, y, Math.sin(a) * r] as const;
});

export function initDotGlobe(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  if (!ctx || !host) return;
  const color = getComputedStyle(canvas).color;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let angle = 0;
  let tiltX = 0;
  let tiltY = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false, glow: 0 };
  let visible = false;
  let frame = 0;
  let last = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw();
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!planet.ready) return;
    const box = canvas.getBoundingClientRect();
    const cx = planet.x - box.left;
    const cy = planet.y - box.top;
    const radius = planet.r;
    if (cy - radius > height || cy + radius < 0) return;
    const sun = Math.hypot(planet.sunX, planet.sunY) || 1;
    const lx = planet.sunX / sun;
    const ly = planet.sunY / sun;
    ctx.fillStyle = color;
    const ry = angle + tiltY;
    const rx = TILT + tiltX;
    const [sy, cyR] = [Math.sin(ry), Math.cos(ry)];
    const [sx, cxR] = [Math.sin(rx), Math.cos(rx)];
    for (const [px, py, pz] of points) {
      const x1 = px * cyR + pz * sy;
      const z1 = -px * sy + pz * cyR;
      const y2 = py * cxR - z1 * sx;
      const z2 = py * sx + z1 * cxR;
      if (z2 < 0) continue;
      const dotX = cx + x1 * radius;
      const dotY = cy + y2 * radius;
      if (dotY < -8 || dotY > height + 8 || dotX < -8 || dotX > width + 8)
        continue;
      const lit = Math.max(0, x1 * lx + y2 * ly) * (1 - z2 * 0.6);
      const rim = 1 - z2;
      let glow = 0;
      if (pointer.glow > 0.01) {
        const d = Math.hypot(dotX - pointer.x, dotY - pointer.y) / 160;
        glow = d < 1 ? (1 - d) * (1 - d) * pointer.glow : 0;
      }
      const alpha = Math.min(
        0.32,
        rim ** 3 * 0.14 + lit ** 1.5 * 0.3 + glow * 0.22,
      );
      if (alpha < 0.03) continue;
      const size = 1.8 + z2 * 2 + lit * 1.6 + glow * 2.4;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(dotX, dotY, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    if (!reducedMotion.matches) {
      angle += dt * SPIN;
      const ease = 1 - Math.exp(-dt * 3);
      tiltX += (pointer.ty * 0.12 - tiltX) * ease;
      tiltY += (pointer.tx * 0.18 - tiltY) * ease;
      pointer.glow += ((pointer.inside ? 1 : 0) - pointer.glow) * ease;
    }
    draw();
    if (visible) frame = requestAnimationFrame(tick);
    else last = 0;
  };

  const start = () => {
    if (!frame && visible) frame = requestAnimationFrame(tick);
  };

  host.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.tx = (pointer.x / box.width) * 2 - 1;
    pointer.ty = (pointer.y / box.height) * 2 - 1;
    pointer.inside = true;
  });
  host.addEventListener('pointerleave', () => {
    pointer.inside = false;
    pointer.tx = 0;
    pointer.ty = 0;
  });
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  resize();
}
