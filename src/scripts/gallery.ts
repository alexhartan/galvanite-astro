const RAMP_MS = 600;

export function initGallery(track: HTMLElement) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  const animation = track.getAnimations()[0];
  if (!animation) return;
  let target = 1;
  let rate = 1;
  let last = 0;
  let frame = 0;
  const step = (now: number) => {
    const dt = Math.min(now - last, 50);
    last = now;
    rate += (target - rate) * (1 - Math.exp((-dt * 5) / RAMP_MS));
    if (Math.abs(target - rate) < 0.002) rate = target;
    animation.playbackRate = rate;
    frame = rate === target ? 0 : requestAnimationFrame(step);
  };
  const ramp = (value: number) => {
    target = value;
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };
  track.addEventListener('pointerenter', () => ramp(0));
  track.addEventListener('pointerleave', () => ramp(1));
}
