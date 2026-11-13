import savedCamera from './hero-camera.json';
import { FRAGMENT, VERTEX } from './hero-shader';

const SMOOTHING_MS = 140;
const INTRO_MS = 2200;
const MAX_DPR = 1.5;

export interface CameraPose {
  x: number;
  y: number;
  rotation: number;
  zoom: number;
  sunrise: number;
}

export type CameraEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface CameraPath {
  start: CameraPose;
  end: CameraPose;
  easing: CameraEasing;
  stars: { x: number; y: number; rotation: number };
}

export const defaultCamera = savedCamera as CameraPath;

const easings: Record<CameraEasing, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t * t * (3 - 2 * t),
};

let camera = defaultCamera;
let invalidate = () => {};

export function setHeroCamera(path: CameraPath) {
  camera = path;
  invalidate();
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (min: number, max: number, value: number) => {
  const t = clamp01((value - min) / (max - min));
  return t * t * (3 - 2 * t);
};

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const program = gl && createProgram(gl);
  if (!gl || !program) return null;

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uRes = uniform('uRes');
  const uPointer = uniform('uPointer');
  const uProgress = uniform('uProgress');
  const uSun = uniform('uSun');
  const uStars = uniform('uStars');
  const uStarRot = uniform('uStarRot');
  const uIntro = uniform('uIntro');
  const uTime = uniform('uTime');
  const uCamPan = uniform('uCamPan');
  const uCamRot = uniform('uCamRot');
  const uCamZoom = uniform('uCamZoom');

  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    },
    draw(
      progress: number,
      intro: number,
      time: number,
      pointerX: number,
      pointerY: number,
      pose: CameraPose,
      stars: CameraPath['stars'],
    ) {
      gl.uniform2f(uStars, stars.x, stars.y);
      gl.uniform1f(uStarRot, stars.rotation);
      gl.uniform2f(uCamPan, pose.x, pose.y);
      gl.uniform1f(uCamRot, (pose.rotation * Math.PI) / 180);
      gl.uniform1f(uCamZoom, pose.zoom);
      gl.uniform1f(uSun, pose.sunrise);
      gl.uniform1f(uProgress, progress);
      gl.uniform1f(uIntro, intro);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, pointerX, pointerY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export function initHeroScene(hero: HTMLElement, canvas: HTMLCanvasElement) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = createRenderer(canvas);
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let target = 0;
  let progress = 0;
  let visible = true;
  let frame = 0;
  let last = 0;
  let started = 0;

  const measure = () => {
    const range = hero.offsetHeight - window.innerHeight;
    target = clamp01(-hero.getBoundingClientRect().top / range);
  };

  const render = (now: number) => {
    frame = 0;
    started ||= now;
    const still = reducedMotion.matches || !visible;
    const ease = still
      ? 1
      : 1 - Math.exp(-(now - (last || now)) / SMOOTHING_MS);
    last = now;
    progress += (target - progress) * (still ? 1 : Math.max(ease, 0.02));
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;

    hero.style.setProperty('--hero-progress', progress.toFixed(4));
    hero.style.setProperty(
      '--hero-wash',
      smoothstep(0.38, 0.9, progress).toFixed(4),
    );
    document.documentElement.style.setProperty(
      '--grid-invert',
      smoothstep(0.6, 0.95, progress).toFixed(4),
    );
    hero.style.setProperty(
      '--hero-content',
      (1 - smoothstep(0.72, 0.92, progress)).toFixed(4),
    );

    if (renderer) {
      const { start, end } = camera;
      const t = easings[camera.easing](progress);
      const mix = (key: keyof CameraPose) =>
        start[key] + (end[key] - start[key]) * t;
      const intro = still ? 1 : clamp01((now - started) / INTRO_MS);
      renderer.draw(
        progress,
        1 - Math.pow(1 - intro, 3),
        still ? 0 : (now - started) / 1000,
        pointer.x,
        pointer.y,
        {
          x: mix('x'),
          y: mix('y'),
          rotation: mix('rotation'),
          zoom: mix('zoom'),
          sunrise: mix('sunrise'),
        },
        camera.stars,
      );
      canvas.toggleAttribute('data-ready', true);
    }

    const settled = Math.abs(target - progress) < 0.0002;
    if (visible && !document.hidden && !(settled && (still || !renderer))) {
      schedule();
    } else {
      last = 0;
    }
  };

  const schedule = () => {
    frame ||= requestAnimationFrame(render);
  };

  const update = () => {
    measure();
    schedule();
  };

  invalidate = update;

  if (renderer) {
    renderer.resize();
    new ResizeObserver(() => {
      renderer.resize();
      update();
    }).observe(canvas);
    window.addEventListener(
      'pointermove',
      (event) => {
        if (reducedMotion.matches || event.pointerType !== 'mouse') return;
        pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }

  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    update();
  }).observe(hero);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  update();
}
