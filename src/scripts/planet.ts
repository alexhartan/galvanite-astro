export const planet = { ready: false, x: 0, y: 0, r: 0, sunX: -1, sunY: 0 };

const RADIUS = 0.95;

export function updatePlanet(
  width: number,
  height: number,
  pose: {
    x: number;
    y: number;
    rotation: number;
    zoom: number;
    sunrise: number;
  },
  pointerX: number,
  pointerY: number,
) {
  const aspect = width / height;
  const rot = (pose.rotation * Math.PI) / 180;
  const [c, s] = [Math.cos(rot), Math.sin(rot)];
  const vx =
    (aspect + 0.13 + pointerX * 0.004 - aspect * 0.5 - pose.x) * pose.zoom;
  const vy = (1.25 + pointerY * 0.004 - 0.5 - pose.y) * pose.zoom;
  planet.x = (c * vx + s * vy + aspect * 0.5) * height;
  planet.y = (c * vy - s * vx + 0.5) * height;
  planet.r = RADIUS * pose.zoom * height;
  const p = Math.max(pose.sunrise, 0);
  const angle = ((37.7 + (3 - 37.7) * p) * Math.PI) / 180;
  const dx = -Math.cos(angle);
  const dy = -Math.sin(angle);
  planet.sunX = c * dx + s * dy;
  planet.sunY = c * dy - s * dx;
  planet.ready = true;
}
