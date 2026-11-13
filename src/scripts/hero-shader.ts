export const VERTEX = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const FRAGMENT = `
precision highp float;

uniform vec2 uRes;
uniform vec2 uPointer;
uniform vec2 uCamPan;
uniform float uCamRot;
uniform float uCamZoom;
uniform float uProgress;
uniform float uSun;
uniform vec2 uStars;
uniform float uStarRot;
uniform float uIntro;
uniform float uTime;

const float RADIUS = 0.95;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(17.3, 9.1);
    amplitude *= 0.5;
  }
  return value;
}

float band(float x, float w) {
  x /= w;
  return exp(-x * x);
}

float stars(vec2 uv, float scale) {
  vec2 grid = uv * scale;
  vec2 id = floor(grid);
  float seed = hash(id);
  vec2 offset = (vec2(hash(id + 7.1), hash(id + 13.7)) - 0.5) * 0.7;
  float d = length(fract(grid) - 0.5 - offset);
  float brightness = pow(max(seed - 0.78, 0.0) / 0.22, 3.0);
  float twinkle = 0.7 + 0.3 * sin(uTime * (0.6 + seed * 2.0) + seed * 40.0);
  return brightness * twinkle * smoothstep(0.07, 0.0, d);
}

vec3 ghost(vec2 q, vec2 pos, float r, float fill, float edge, vec3 tint) {
  float d = length(q - pos);
  float w = r * 0.04;
  vec3 ring = vec3(band(d - r * 1.03, w), band(d - r, w), band(d - r * 0.97, w));
  float disc = smoothstep(r, r * 0.2, d);
  return (disc * fill + ring * edge) * tint;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 screen = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes.y;
  vec2 pivot = vec2(aspect * 0.5, 0.5);
  float camCos = cos(uCamRot);
  float camSin = sin(uCamRot);
  vec2 view = (screen - pivot) / uCamZoom;
  vec2 q = vec2(camCos * view.x - camSin * view.y, camSin * view.x + camCos * view.y) + pivot + uCamPan;
  float p = max(uSun, 0.0);
  float dusk = clamp(1.0 + uSun, 0.0, 1.0);
  float rise = smoothstep(0.0, 0.6, p);

  vec2 centre = vec2(aspect + 0.13, 1.25) + uPointer * 0.004;
  vec2 rel = q - centre;
  float dist = length(rel);
  float d = dist - RADIUS;
  vec2 normal = rel / dist;

  float angle = radians(mix(26.5, 3.0, p));
  vec2 sunDir = vec2(-cos(angle), -sin(angle));
  float lift = mix(-0.05, -0.006, uIntro) + 0.05 * rise - 0.09 * (1.0 - dusk);
  vec2 sun = centre + sunDir * (RADIUS + lift);
  vec2 toSun = q - sun;
  float ds = length(toSun);
  vec2 sunView = (sun - pivot - uCamPan) * uCamZoom;
  vec2 sunScreen = vec2(camCos * sunView.x + camSin * sunView.y, camCos * sunView.y - camSin * sunView.x) + pivot;
  vec2 lens = screen - sunScreen;
  float breath = 1.0 + 0.05 * sin(uTime * 0.7) + 0.025 * sin(uTime * 1.9);
  float emerge = smoothstep(-0.035, 0.035, lift);
  float power = breath * (0.2 * dusk + 0.8 * emerge) * (1.0 + 2.0 * p + 3.0 * p * p);
  float lit = 0.03 + 0.97 * pow(max(dot(normal, sunDir), 0.0), mix(3.5, 1.0, rise));
  float glow = (0.25 + 0.75 * uIntro) * (0.2 + 0.8 * dusk);

  float skyCos = cos(uCamRot * uStarRot);
  float skySin = sin(uCamRot * uStarRot);
  vec2 skyUv = vec2(skyCos * view.x - skySin * view.y, skySin * view.x + skyCos * view.y) + pivot + uCamPan * uStars + uPointer * 0.002;
  float diagonal = clamp(screen.x / aspect * 0.7 + (1.0 - screen.y) * 0.3, 0.0, 1.0);
  vec3 col = mix(vec3(0.008, 0.011, 0.028), vec3(0.022, 0.036, 0.09), diagonal);
  col += vec3(0.025, 0.045, 0.12) * smoothstep(0.35, 0.85, fbm(skyUv * 1.7 + 4.0));
  float scatter = exp(-ds * mix(5.0, 1.5, rise)) * power;
  float starlight = stars(skyUv, 46.0) + 0.55 * stars(skyUv + 3.7, 110.0);
  col += vec3(0.8, 0.88, 1.0) * starlight * 1.5 * (1.0 - smoothstep(0.02, 0.4, p)) / (1.0 + scatter * 6.0);
  col += vec3(0.12, 0.3, 0.8) * scatter * 1.3;
  col += vec3(0.05, 0.13, 0.36) * rise * power * 0.1;

  float height = max(d, 0.0);
  vec3 air = mix(vec3(0.1, 0.32, 1.0), vec3(0.55, 0.8, 1.0), exp(-height * 60.0));
  float shell = exp(-height * mix(22.0, 8.0, p)) * 0.9 + exp(-height * 90.0) * 0.8;
  col += air * shell * lit * glow * (0.5 + 1.6 * p);

  if (d < 0.002) {
    float z = sqrt(max(RADIUS * RADIUS - dist * dist, 0.0));
    vec3 n3 = vec3(rel, z) / RADIUS;
    float behind = radians(mix(80.0, 50.0, rise));
    vec3 light = vec3(sunDir * cos(behind), -sin(behind));
    float day = smoothstep(-0.06, 0.28, dot(n3, light));

    vec2 surface = n3.xy / (1.0 + n3.z) * 2.4 + vec2(uTime * 0.003, 0.0);
    float land = fbm(surface * 3.0 + 11.0);
    float clouds = fbm(surface * 6.5 + land * 1.6);
    vec3 albedo = mix(vec3(0.02, 0.09, 0.27), vec3(0.07, 0.13, 0.13), smoothstep(0.5, 0.6, land));
    albedo = mix(albedo, vec3(0.7, 0.8, 0.92), smoothstep(0.45, 0.78, clouds) * 0.85);

    vec3 planet = vec3(0.004, 0.006, 0.016);
    planet += vec3(0.012, 0.022, 0.06) * exp(d * 2.5);
    planet += albedo * day * glow * (1.1 + 2.0 * p);
    planet += vec3(0.1, 0.36, 0.9) * exp(d * mix(11.0, 5.0, p)) * lit * glow * (1.8 + 1.6 * p);
    col = mix(col, planet, smoothstep(0.0015, -0.0015, d));
  }

  float rim = band(d, mix(0.003, 0.011, p)) * (0.1 + lit) * (glow + 2.0 * p);
  col += vec3(0.72, 0.89, 1.0) * rim * 1.5;
  col += vec3(0.45, 0.7, 1.0) * band(d, 0.035) * lit * p * 1.2;
  col += vec3(1.0, 0.55, 0.25) * band(d, 0.012) * exp(-ds * 9.0) * power * 0.9;

  float occlusion = mix(smoothstep(-0.03, 0.012, d), 1.0, clamp(2.2 * p, 0.0, 1.0));
  float core = band(ds, 0.016 + 0.3 * p);
  float halo = 1.0 / (1.0 + pow(ds / (0.04 + 0.3 * p), 2.0));
  col += vec3(1.0, 0.97, 0.94) * (core * 2.6 + halo * 0.4) * power * occlusion;

  float theta = atan(lens.y, lens.x);
  float spikes = pow(abs(cos(theta * 3.0 + 0.5)), 90.0) * 0.7 + pow(abs(cos(theta * 2.0 - 0.3)), 240.0) * 0.5;
  float fine = 0.5 + 0.5 * sin(theta * 26.0 + 2.0 * sin(theta * 7.0 + uTime * 0.12));
  float rays = (spikes + fine * fine * 0.22) * exp(-ds * mix(11.0, 3.2, rise));
  col += vec3(0.78, 0.88, 1.0) * rays * power * 0.5 * occlusion;
  float streak = exp(-abs(lens.y) * mix(190.0, 80.0, p)) * exp(-abs(lens.x) * mix(4.0, 2.2, rise));
  col += vec3(0.4, 0.62, 1.0) * streak * power * 0.32;

  vec2 axis = pivot + uPointer * 0.05 - sunScreen;
  float flare = uIntro * breath * emerge;
  float spread = smoothstep(0.2, 0.6, p);
  vec3 pink = vec3(1.0, 0.8, 0.86);
  vec3 flares = ghost(screen, sunScreen + axis * 0.25 * p, 0.04 + 0.42 * p, 0.05, 0.18, pink);
  flares += ghost(screen, sunScreen + axis * 0.04 * p, 0.35 * p, 0.04, 0.2 * rise, pink);
  flares += ghost(screen, sunScreen + axis * 0.45, 0.17, 0.18, 0.28, vec3(0.9, 0.9, 1.0)) * spread;
  flares += ghost(screen, sunScreen + axis * 0.72, 0.035, 0.5, 0.3, vec3(0.5, 1.0, 0.9)) * spread;
  flares += ghost(screen, sunScreen + axis * 1.2, 0.225, 0.26, 0.32, pink) * spread;
  flares += ghost(screen, sunScreen + axis * 1.55, 0.06, 0.3, 0.3, vec3(0.75, 0.7, 1.0)) * spread;
  flares += ghost(screen, sunScreen - axis * 0.25, 0.17, 0.14, 0.24, vec3(0.9, 0.92, 1.0)) * spread;
  col += flares * flare;

  col *= 1.0 - 0.35 * smoothstep(0.6, 1.5, length((screen - pivot) / pivot));

  col = 1.0 - exp(-col * 1.2);
  float exposure = clamp((uProgress - 0.42) / 0.5, 0.0, 1.0);
  float wash = max(smoothstep(0.0, 1.0, exposure * 1.9 - length(lens) * 0.38), smoothstep(0.88, 0.97, uProgress));
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), wash * 0.4);
  col = mix(col, vec3(1.0), wash);
  col += (hash(gl_FragCoord.xy + mod(floor(uTime * 24.0), 64.0) * 17.0) - 0.5) * 0.03 * (1.0 - wash);

  gl_FragColor = vec4(col, 1.0);
}`;
