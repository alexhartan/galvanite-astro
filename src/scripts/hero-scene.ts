import savedCamera from './hero-camera.json';
import savedSteps from './home-steps.json';
import { reducedMotion } from './env';
import { FRAGMENT, VERTEX } from './hero-shader';

const SMOOTHING_MS = 140;
const INTRO_MS = 2200;
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

export type Stars = CameraPath['stars'];

export interface SceneStep {
  section: string;
  at: number;
  pose: CameraPose;
  stars: Stars;
}

export const defaultSteps = savedSteps as SceneStep[];

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

let steps: SceneStep[] | null = null;
let preview: { pose: CameraPose; stars: Stars } | null = null;

export function setSceneSteps(next: SceneStep[]) {
  steps = next;
  invalidate();
}

export function setScenePreview(next: typeof preview) {
  preview = next;
  invalidate();
}

export function stepScroll({ section, at }: Pick<SceneStep, 'section' | 'at'>) {
  const height = window.innerHeight;
  if (section === 'page') return at * height - height / 2;
  const box = document.getElementById(section)?.getBoundingClientRect();
  if (!box) return 0;
  return box.top + window.scrollY + at * box.height - height / 2;
}

export function stepAt(scroll: number) {
  const height = window.innerHeight;
  const line = scroll + height / 2;
  if (line < height) return { section: 'page', at: line / height };
  for (const el of document.querySelectorAll<HTMLElement>('main section[id]')) {
    const box = el.getBoundingClientRect();
    const top = box.top + window.scrollY;
    if (line >= top && line < top + box.height)
      return { section: el.id, at: (line - top) / box.height };
  }
  return { section: 'page', at: line / height };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function poseAt(list: SceneStep[], scroll: number) {
  const points = list
    .map((step) => ({ step, y: stepScroll(step) }))
    .sort((a, b) => a.y - b.y);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (scroll <= first.y)
    return { pose: first.step.pose, stars: first.step.stars };
  if (scroll >= last.y) return { pose: last.step.pose, stars: last.step.stars };
  const index = points.findIndex((point) => point.y > scroll);
  const a = points[index - 1]!;
  const b = points[index]!;
  const t = (scroll - a.y) / (b.y - a.y);
  const pose = {} as CameraPose;
  for (const key of Object.keys(a.step.pose) as (keyof CameraPose)[])
    pose[key] = lerp(a.step.pose[key], b.step.pose[key], t);
  return {
    pose,
    stars: {
      x: lerp(a.step.stars.x, b.step.stars.x, t),
      y: lerp(a.step.stars.y, b.step.stars.y, t),
      rotation: lerp(a.step.stars.rotation, b.step.stars.rotation, t),
    },
  };
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
      gl.uniform1f(uIntro, intro);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, pointerX, pointerY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

type Renderer = NonNullable<Awaited<ReturnType<typeof createRenderer>>>;

function createMirror(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  const context = target.getContext('2d');
  return () => {
    if (!context || !source.width) return;
    const ratio = source.width / source.clientWidth;
    const height = Math.round(target.clientHeight * ratio);
    if (target.width !== source.width || target.height !== height) {
      target.width = source.width;
      target.height = height;
    }
    context.drawImage(
      source,
      0,
      0,
      source.width,
      height,
      0,
      0,
      source.width,
      height,
    );
    target.toggleAttribute('data-ready', true);
  };
}

export function initHeroScene(
  canvas: HTMLCanvasElement,
  window_?: HTMLCanvasElement | null,
) {
  const mirror = window_ ? createMirror(canvas, window_) : null;
  let renderer: Renderer | null = null;
  let frameTotal = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let target = 0;
  let progress = 0;
  let scrollTarget = window.scrollY;
  let scroll = scrollTarget;
  let visible = true;
  let frame = 0;
  let last = 0;
  let started = 0;
  let scale = START_SCALE;
  let slowFrames = 0;
  let fastFrames = 0;
  let throttled = false;

  const hero = canvas.closest<HTMLElement>('[data-hero]');
  if (hero?.hasAttribute('data-scene-steps')) steps ??= defaultSteps;
  const zone = document.querySelector<HTMLElement>('[data-scene-path]');
  const zonePath = zone
    ? (JSON.parse(zone.dataset.scenePath ?? '') as CameraPath)
    : null;
  const start =
    document.querySelector<HTMLElement>('[data-scene-start]') ?? zone;
  const end = zone
    ? document.querySelector<HTMLElement>('[data-scene-end]')
    : null;
  let zoneActive = false;

  const content = hero?.querySelector<HTMLElement>('[data-hero-content]');
  const measure = () => {
    if (content) {
      const shift = reducedMotion.matches
        ? 0
        : Math.min(window.scrollY, window.innerHeight) * 0.5;
      content.style.setProperty('--shift', `${(-shift).toFixed(1)}px`);
    }
    const height = window.innerHeight;
    const box = zone ? start?.getBoundingClientRect() : undefined;
    const active = !!box && box.top < height * 1.25 && window.scrollY >= height;
    if (active !== zoneActive) {
      zoneActive = active;
      hero?.toggleAttribute('data-scene', active);
      progress = -1;
    }
    if (active) {
      if (box && end) {
        const from = box.top - height * 1.25;
        const to = end.getBoundingClientRect().top - height * 0.5;
        target = clamp01(from / (from - to));
      } else {
        target = 0;
      }
      visible = true;
    } else {
      target = clamp01(window.scrollY / height);
      visible = target < 1;
    }
    if (progress < 0) progress = target;
    scrollTarget = window.scrollY;
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
    scroll += (scrollTarget - scroll) * (still ? 1 : Math.max(ease, 0.02));
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;

    document.documentElement.style.setProperty(
      '--grid-invert',
      (zoneActive ? 1 : smoothstep(0.85, 1, target)).toFixed(4),
    );

    if (renderer) {
      const path = zoneActive && zonePath ? zonePath : camera;
      const t = easings[path.easing](progress);
      const mix = (key: keyof CameraPose) =>
        path.start[key] + (path.end[key] - path.start[key]) * t;
      const shot =
        preview ??
        (steps?.length
          ? poseAt(steps, scroll)
          : {
              pose: {
                x: mix('x'),
                y: mix('y'),
                rotation: mix('rotation'),
                zoom: mix('zoom'),
                sunrise: mix('sunrise'),
              },
              stars: path.stars,
            });
      const intro = still ? 1 : clamp01((now - started) / INTRO_MS);
      renderer.draw(
        1 - Math.pow(1 - intro, 3),
        still ? 0 : (now - started) / 1000,
        pointer.x,
        pointer.y,
        shot.pose,
        shot.stars,
      );
      mirror?.();
      canvas.toggleAttribute('data-ready', true);
    }

    const settled =
      Math.abs(target - progress) < 0.0002 &&
      Math.abs(scrollTarget - scroll) < 0.5;
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

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  update();
}
