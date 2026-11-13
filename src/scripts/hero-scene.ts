import savedCamera from './hero-camera.json';
import { FRAGMENT, VERTEX } from './hero-shader';

const SMOOTHING_MS = 140;
const INTRO_MS = 2200;
const FADE_START = 0.72;
const FADE_END = 0.92;
const MAX_DPR = 1.5;
const SLOW_FRAME_MS = 40;
const TARGET_FRAME_MS = 20;
const SCALE_STEP = 0.7;
const MIN_SCALE = 0.3;
const START_SCALE = 0.5;
const FAST_FRAMES = 30;

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
  return program;
}

function linked(gl: WebGLRenderingContext, program: WebGLProgram) {
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  return new Promise<boolean>((resolve) => {
    const check = () => {
      if (
        parallel &&
        !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)
      ) {
        requestAnimationFrame(check);
        return;
      }
      resolve(gl.getProgramParameter(program, gl.LINK_STATUS));
    };
    check();
  });
}

async function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const program = gl && createProgram(gl);
  if (!gl || !program || !(await linked(gl, program))) return null;

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
    resize(scale = 1) {
      const dpr = Math.min(window.devicePixelRatio, MAX_DPR) * scale;
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

type Renderer = NonNullable<Awaited<ReturnType<typeof createRenderer>>>;

export function initHeroScene(hero: HTMLElement, canvas: HTMLCanvasElement) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: Renderer | null = null;
  let frameTotal = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let target = 0;
  let progress = 0;
  let visible = true;
  let frame = 0;
  let last = 0;
  let started = 0;
  let scale = START_SCALE;
  let slowFrames = 0;
  let fastFrames = 0;
  let throttled = false;

  const measure = () => {
    const range = hero.offsetHeight - window.innerHeight;
    target = clamp01(-hero.getBoundingClientRect().top / range);
  };

  const render = (now: number) => {
    frame = 0;
    if (renderer) started ||= now;
    const still = reducedMotion.matches || !visible;
    const ease = still
      ? 1
      : 1 - Math.exp(-(now - (last || now)) / SMOOTHING_MS);
    const delta = last ? now - last : 0;
    last = now;
    if (renderer && !still && delta > 0 && delta < 1000) {
      const slow = delta > SLOW_FRAME_MS;
      slowFrames = slow ? slowFrames + 1 : 0;
      frameTotal = slow ? frameTotal + delta : 0;
      fastFrames = delta < TARGET_FRAME_MS ? fastFrames + 1 : 0;
      if (!throttled && fastFrames >= FAST_FRAMES && scale < 1) {
        scale = 1;
        renderer.resize(scale);
      }
      if (slowFrames >= 2 && scale > MIN_SCALE) {
        throttled = true;
        const fit = Math.sqrt((TARGET_FRAME_MS * slowFrames) / frameTotal);
        scale = Math.max(MIN_SCALE, scale * Math.min(fit, SCALE_STEP));
        slowFrames = 0;
        frameTotal = 0;
        renderer.resize(scale);
      }
    }
    progress += (target - progress) * (still ? 1 : Math.max(ease, 0.02));
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;

    hero.style.setProperty(
      '--hero-shift',
      clamp01(progress / FADE_START).toFixed(4),
    );
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
      (1 - smoothstep(FADE_START, FADE_END, progress)).toFixed(4),
    );
    hero.style.setProperty(
      '--hero-finale',
      smoothstep(FADE_START, FADE_END, progress).toFixed(4),
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

  createRenderer(canvas).then((ready) => {
    if (!ready) return;
    renderer = ready;
    ready.resize(scale);
    new ResizeObserver(() => {
      ready.resize(scale);
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
    update();
  });

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
