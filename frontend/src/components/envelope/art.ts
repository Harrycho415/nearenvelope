// 봉투 그림의 모양·색·궤도 계산과 SVG 문자열 생성 (시안 near_envelope_stages.html의 createEnvelope를 옮김).
// 앱(EnvelopeIllustration, EnvelopeOpening)과 NFT 이미지 생성(scripts/generate-envelope-art.mjs)이 같이 쓴다.
// 스크립트가 Node 타입 제거(type stripping)로 이 파일을 바로 불러오므로 JSX·enum·경로 별칭 값 import를 쓰지 않는다.
// 희귀도가 곧 강화 단계: Common 1단계(기본) · Rare 2단계(궤도 1) · Epic 3단계(궤도 2) · Legendary 4단계(궤도 3 + 별빛).
// 소유자: D

import type { Rarity } from "@/lib/near";

/* ------------------------------- 색 ------------------------------- */

export interface Palette {
  /** 봉투 선·궤도·로고 기본색 */
  accent: string;
  /** 선 번짐·배경 빛 */
  glow: string;
  /** 궤도 입자 */
  light: string;
  core: string;
  body: [string, string];
  /** 2단계 단추 안쪽 원판 */
  disc: [string, string];
  /** 3단계 단추 바탕 */
  bezel: [string, string];
  /** 4단계 단추 다이얼 */
  dial: [string, string];
  logo3: [string, string];
  logo4: [string, string];
  /** 3단계 로고 윗변 하이라이트 */
  highlight: string;
  /** 4단계 로고 테두리 */
  contour: string;
  star: string;
}

/** design 번호 = 컨트랙트 DESIGN_COUNT 순서 (Classic, Golden, Midnight) */
export const PALETTES: Palette[] = [
  // Classic: 시안 그대로
  {
    accent: "#8AD618",
    glow: "#5FAA0F",
    light: "#AAF046",
    core: "#EBFFC8",
    body: ["#1D3211", "#101B09"],
    disc: ["#2c4616", "#12220a"],
    bezel: ["#464c44", "#121411"],
    dial: ["#1e2a1a", "#060a05"],
    logo3: ["#AFF550", "#46960A"],
    logo4: ["#C8FF78", "#50A50C"],
    highlight: "#E1FFAF",
    contour: "#101a0c",
    star: "#C8EBAA",
  },
  // Golden: 기존 Golden 봉투 색 (#3d3116 → #1c160a, 선 #b8953a / #d9b65a)
  {
    accent: "#d9b65a",
    glow: "#b8953a",
    light: "#f0d48a",
    core: "#fff4d6",
    body: ["#3d3116", "#1c160a"],
    disc: ["#4a3a14", "#1f1808"],
    bezel: ["#4c463a", "#14110c"],
    dial: ["#2e2612", "#0c0904"],
    logo3: ["#f2d88f", "#8f6c1c"],
    logo4: ["#ffe9a8", "#9c7724"],
    highlight: "#fff1c7",
    contour: "#1c160a",
    star: "#f3dfa6",
  },
  // Midnight: 기존 Midnight 봉투 색 (#18224d → #0a0f26, 선 #3f52a3 / #6276d1)
  {
    accent: "#6276d1",
    glow: "#3f52a3",
    light: "#8e9cf0",
    core: "#e3e8ff",
    body: ["#18224d", "#0a0f26"],
    disc: ["#233070", "#0c1230"],
    bezel: ["#3e4458", "#0f1218"],
    dial: ["#151d42", "#05081a"],
    logo3: ["#9aa8f5", "#34459b"],
    logo4: ["#bac4ff", "#3b4dae"],
    highlight: "#dfe5ff",
    contour: "#0a0f26",
    star: "#c3ccf5",
  },
];

export const palette = (design: number) => PALETTES[design] ?? PALETTES[0];

const PLAT_TOP = "#D6DCD6";
const PLAT_BOT = "#707670";

/* ------------------------------- 모양 ------------------------------- */

/** NEAR 로고 (100 x 100 상자) */
const NEAR_PATH =
  "M90.99 99.72 L85.14 99.71 L81.69 98.42 L79.65 96.82 L20.64 26.20 L16.28 21.40 L15.65 21.51 L15.31 22.67 L15.49 78.49 L15.70 78.77 L16.57 78.69 L37.21 60.86 L38.66 60.37 L39.94 60.76 L40.56 61.63 L40.71 62.79 L40.31 63.95 L33.53 74.13 L19.39 95.06 L17.73 96.93 L15.99 98.31 L13.95 99.20 L12.21 99.75 L9.59 99.82 L8.68 99.71 L5.23 98.39 L2.62 96.26 L0.75 93.31 L0.29 91.58 L0.00 91.31 L-0.14 90.12 L-0.15 9.88 L0.00 8.40 L1.30 5.23 L3.44 2.62 L5.23 1.30 L8.56 0.00 L13.08 -0.13 L14.48 0.00 L17.73 1.17 L19.99 2.91 L80.52 75.40 L82.69 77.91 L83.43 78.31 L84.25 77.91 L84.29 77.03 L84.23 21.22 L84.01 20.92 L83.14 20.86 L81.98 21.77 L62.24 38.95 L61.05 39.34 L59.59 38.93 L58.91 37.79 L58.85 36.92 L59.49 35.47 L71.60 17.44 L80.45 4.36 L81.98 2.66 L83.72 1.33 L85.76 0.51 L87.50 -0.04 L90.12 -0.11 L91.03 0.00 L94.48 1.32 L97.09 3.45 L98.96 6.40 L99.42 8.13 L99.71 8.40 L99.85 9.59 L99.83 90.41 L98.96 93.31 L97.09 96.26 L94.48 98.39 L90.99 99.72Z";

/** 설계 좌표 (480 x 300) */
export const VIEWBOX = "0 0 480 300";
/** 궤도 한 바퀴 (ms) */
export const PERIOD = 8000;
/** 첫 화면·NFT 이미지·움직임 줄이기 설정에서 보이는 장면 */
export const START_TIME = PERIOD * 0.1;
/** 궤도 꼬리 조각 수 */
export const SEG = 36;

const RECT = { x: 97, y: 63, w: 282, h: 175, r: 13 };
const CX = RECT.x + RECT.w / 2;
const CY = RECT.y + RECT.h / 2;
const BTN = { x: 238, y: 159 };
const FLAP_LINES = [
  [99, 71, 220, 152],
  [377, 71, 256, 152],
  [101, 234, 195, 152],
  [281, 152, 376, 233],
];

/** 봉인 단추만 그릴 때의 viewBox (4단계 바깥 테두리 r=29까지 들어감) */
export const SEAL_VIEWBOX = `${BTN.x - 30} ${BTN.y - 30} 60 60`;
/** 봉투 본체 너비 대비 봉인 상자(60) 비율, 본체 높이 대비 단추 중심 위치 */
export const SEAL_LAYOUT = { width: 60 / RECT.w, top: (BTN.y - RECT.y) / RECT.h };

export type Stage = 1 | 2 | 3 | 4;

export interface Orbit {
  rx: number;
  ry: number;
  tilt: number;
  phase: number;
  trail: number;
  size: number;
}

interface StageConfig {
  orbits: Orbit[];
  ring: number;
  halo: number;
  under: number;
  stars: number;
}

export const STAGES: Record<Stage, StageConfig> = {
  1: { orbits: [], ring: 0, halo: 0, under: 0, stars: 0 },
  2: { orbits: [{ rx: 180, ry: 54, tilt: -8, phase: 0, trail: 1.0, size: 1 }], ring: 0.45, halo: 0, under: 0, stars: 0 },
  3: {
    orbits: [
      { rx: 180, ry: 54, tilt: -8, phase: 0, trail: 1.2, size: 1 },
      { rx: 188, ry: 62, tilt: 9, phase: Math.PI, trail: 1.2, size: 1 },
    ],
    ring: 0.5,
    halo: 0.04,
    under: 0.16,
    stars: 0,
  },
  4: {
    orbits: [
      { rx: 180, ry: 54, tilt: -8, phase: 0, trail: 1.5, size: 1.15 },
      { rx: 188, ry: 62, tilt: 9, phase: (2 * Math.PI) / 3, trail: 1.5, size: 1.15 },
      { rx: 197, ry: 46, tilt: -1, phase: (4 * Math.PI) / 3, trail: 1.5, size: 1.15 },
    ],
    ring: 0.55,
    halo: 0.07,
    under: 0.3,
    stars: 16,
  },
};

const STAGE_OF: Record<Rarity, Stage> = { Basic: 1, Rare: 2, Epic: 3, Legendary: 4 };
export const stageOf = (rarity: Rarity): Stage => STAGE_OF[rarity] ?? 1;

function orbitPoint(o: Orbit, t: number): [number, number] {
  const c = Math.cos((o.tilt * Math.PI) / 180);
  const s = Math.sin((o.tilt * Math.PI) / 180);
  const x = o.rx * Math.cos(t);
  const y = o.ry * Math.sin(t);
  return [CX + x * c - y * s, CY + x * s + y * c];
}

/** 타원 아래쪽 절반 = 봉투 앞 */
const isFront = (t: number) => Math.sin(t) > 0;

function ringPath(o: Orbit, front: boolean) {
  let d = "";
  for (let i = 0; i <= 180; i++) {
    const [x, y] = orbitPoint(o, (front ? 0 : Math.PI) + (Math.PI * i) / 180);
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

/** 4단계 별 위치 (시드 고정) */
const STARS = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars: { x: number; y: number; r: number; d: string; delay: string }[] = [];
  while (stars.length < STAGES[4].stars) {
    const x = 10 + rnd() * 460;
    const y = 10 + rnd() * 280;
    if (x > RECT.x - 8 && x < RECT.x + RECT.w + 8 && y > RECT.y - 8 && y < RECT.y + RECT.h + 8) continue;
    const r = 0.55 + rnd() * 0.4;
    const d = `${rnd() < 0.5 ? 4 : 8}s`;
    const delay = `${(-rnd() * 8).toFixed(2)}s`;
    stars.push({ x, y, r, d, delay });
  }
  return stars;
})();

export type Attrs = Record<string, number>;

/**
 * 시안 update(time)와 같은 계산. 궤도 하나의 꼬리 조각·머리 속성(SVG 속성 이름)을 앞/뒤 쪽별로 돌려준다.
 * 지금 보이지 않는 쪽은 opacity 0.
 */
export function particleFrame(o: Orbit, time: number) {
  const t = o.phase + (2 * Math.PI * (time % PERIOD)) / PERIOD;
  const segs: Record<"back" | "front", Attrs[]> = { back: [], front: [] };
  for (let k = 0; k < SEG; k++) {
    const ta = t - (o.trail * (k + 1)) / SEG;
    const tb = t - (o.trail * k) / SEG;
    const [x1, y1] = orbitPoint(o, ta);
    const [x2, y2] = orbitPoint(o, tb);
    const f = Math.pow(1 - k / SEG, 1.6);
    const dp = 0.75 + 0.25 * Math.sin(tb);
    const fr = isFront((ta + tb) / 2);
    const base = { x1, y1, x2, y2, "stroke-width": (0.4 + 1.6 * f) * dp };
    segs.front.push({ ...base, opacity: fr ? 0.75 * f : 0 });
    segs.back.push({ ...base, opacity: fr ? 0 : 0.75 * f });
  }
  const [x, y] = orbitPoint(o, t);
  const dp = 0.75 + 0.25 * Math.sin(t);
  const fr = isFront(t);
  const head = (on: boolean) => {
    const v = on ? 1 : 0;
    return {
      halo: { cx: x, cy: y, r: 9 * o.size * dp, opacity: v * dp },
      body: { cx: x, cy: y, r: 2.2 * o.size * dp, opacity: v },
      core: { cx: x, cy: y, r: 1.0 * o.size * dp, opacity: v * 0.95 },
    };
  };
  return { segs, head: { front: head(fr), back: head(!fr) } };
}

/* ------------------------------- SVG 문자열 ------------------------------- */

type TagAttrs = Record<string, string | number | undefined>;

const num = (v: number) => String(Math.round(v * 1000) / 1000);

function tag(name: string, attrs: TagAttrs, children = ""): string {
  let a = "";
  for (const k in attrs) {
    const v = attrs[k];
    if (v !== undefined) a += ` ${k}="${typeof v === "number" ? num(v) : v}"`;
  }
  return children ? `<${name}${a}>${children}</${name}>` : `<${name}${a}/>`;
}

const logo = (size: number, attrs: TagAttrs = {}) =>
  tag("path", {
    d: NEAR_PATH,
    transform: `translate(${num(BTN.x - size / 2)} ${num(BTN.y - size / 2)}) scale(${size / 100})`,
    ...attrs,
  });

const linGrad = (id: string, top: string, bottom: string) =>
  tag(
    "linearGradient",
    { id, x1: 0, y1: 0, x2: 0, y2: 1 },
    tag("stop", { offset: 0, "stop-color": top }) + tag("stop", { offset: 1, "stop-color": bottom }),
  );

const radGrad = (id: string, color: string, opacity: number) =>
  tag(
    "radialGradient",
    { id },
    tag("stop", { offset: 0, "stop-color": color, "stop-opacity": opacity }) +
      tag("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }),
  );

const FILTER_BOX = { x: "-50%", y: "-50%", width: "200%", height: "200%" };

const glowFilter = (id: string, wide: number, tight: number) =>
  tag(
    "filter",
    { id, ...FILTER_BOX },
    tag("feGaussianBlur", { stdDeviation: wide, result: "a" }) +
      tag("feGaussianBlur", { in: "SourceGraphic", stdDeviation: tight, result: "b" }) +
      tag("feMerge", {}, tag("feMergeNode", { in: "b" }) + tag("feMergeNode", { in: "a" })),
  );

const blurFilter = (id: string, s: number) => tag("filter", { id, ...FILTER_BOX }, tag("feGaussianBlur", { stdDeviation: s }));

const circle = (r: number, attrs: TagAttrs) => tag("circle", { cx: BTN.x, cy: BTN.y, r, ...attrs });

/** 가운데 단추 (NEAR 로고). 단계마다 모양이 다르다. p = id 접두어 */
function button(stage: Stage, c: Palette, p: string): string {
  const url = (id: string) => `url(#${p}${id})`;
  let defs = glowFilter(`${p}lg`, 2.5, 0.4) + blurFilter(`${p}gl`, 1.5);
  let body = "";

  if (stage === 1) {
    defs += linGrad(`${p}f1`, "#b6b6b6", "#707070");
    body =
      circle(20.2, { fill: "#0a0a0a" }) +
      circle(19, { fill: url("f1") }) +
      circle(15.2, { fill: "none", stroke: "#808080", "stroke-width": 0.6 }) +
      logo(17.5, { fill: "#181818" });
  }

  if (stage === 2) {
    defs +=
      glowFilter(`${p}rg`, 3, 1) +
      linGrad(`${p}f2`, "#b6b6b6", "#707070") +
      linGrad(`${p}d2`, c.disc[0], c.disc[1]) +
      tag("clipPath", { id: `${p}lc` }, logo(17));
    const outline = logo(17, { fill: "none", stroke: c.accent, "stroke-width": 2.2 / 0.17 });
    body =
      circle(22.7, { fill: "none", stroke: c.accent, "stroke-width": 1.3 }) +
      circle(22.7, { fill: "none", stroke: c.accent, "stroke-width": 1.3, filter: url("rg"), class: "env-breathe" }) +
      circle(20.7, { fill: "#0a0a0a" }) +
      circle(19.5, { fill: url("f2") }) +
      circle(16.1, { fill: "#0e0e0c" }) +
      circle(15.6, { fill: url("d2") }) +
      circle(15.6, { fill: "none", stroke: c.accent, "stroke-width": 0.8 }) +
      // 로고 모양으로 자른 굵은 선 = 안쪽 테두리
      tag("g", { "clip-path": url("lc") }, outline) +
      tag("g", { "clip-path": url("lc"), filter: url("lg"), class: "env-breathe", opacity: 0.8 }, outline);
  }

  if (stage === 3) {
    defs +=
      linGrad(`${p}f3`, c.bezel[0], c.bezel[1]) +
      linGrad(`${p}lf3`, c.logo3[0], c.logo3[1]) +
      tag("clipPath", { id: `${p}lc` }, logo(19)) +
      tag("clipPath", { id: `${p}top` }, tag("rect", { x: BTN.x - 20, y: BTN.y - 20, width: 40, height: 20 }));
    body =
      circle(24.4, { fill: "none", stroke: PLAT_TOP, "stroke-width": 1, opacity: 0.85 }) +
      circle(22.2, { fill: "#060705" }) +
      circle(21, { fill: url("f3") }) +
      circle(18, { fill: "none", stroke: "#969e96", "stroke-width": 0.5 }) +
      logo(19, { fill: c.accent, filter: url("lg"), class: "env-breathe" }) +
      logo(19, { fill: url("lf3") }) +
      // 로고 윗변의 얇은 빛
      tag(
        "g",
        { "clip-path": url("top") },
        tag(
          "g",
          { "clip-path": url("lc") },
          logo(19, { fill: "none", stroke: c.highlight, "stroke-width": 0.9 / 0.19, opacity: 0.55 }),
        ),
      );
  }

  if (stage === 4) {
    const r = 23;
    defs +=
      linGrad(`${p}bv`, PLAT_TOP, PLAT_BOT) + linGrad(`${p}f4`, c.dial[0], c.dial[1]) + linGrad(`${p}lf4`, c.logo4[0], c.logo4[1]);
    let ticks = "";
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI * 2) / 48;
      const major = i % 12 === 0;
      const r0 = r * (major ? 0.8 : 0.85);
      const r1 = r * 0.93;
      ticks += tag("line", {
        x1: BTN.x + Math.cos(a) * r0,
        y1: BTN.y + Math.sin(a) * r0,
        x2: BTN.x + Math.cos(a) * r1,
        y2: BTN.y + Math.sin(a) * r1,
        stroke: "#C4CCC4",
        "stroke-width": 0.56,
        opacity: major ? 0.95 : 0.5,
      });
    }
    const s = 0.185;
    body =
      circle(r + 6, { fill: "none", stroke: PLAT_TOP, "stroke-width": 0.8, opacity: 0.9 }) +
      circle(r + 3.2, { fill: "#060705" }) +
      circle(r + 2.2, { fill: url("bv") }) +
      circle(r, { fill: url("f4") }) +
      ticks +
      circle(r * 0.76, { fill: "none", stroke: c.accent, "stroke-width": 0.6, opacity: 0.9 }) +
      logo(18.5, { fill: "none", stroke: c.accent, "stroke-width": 4.0 / s, opacity: 0.55 }) +
      logo(18.5, { fill: "none", stroke: c.contour, "stroke-width": 2.4 / s }) +
      logo(18.5, { fill: c.accent, filter: url("lg"), class: "env-breathe" }) +
      logo(18.5, { fill: url("lf4") });
  }

  // 단추 위 은은한 광택
  const rr = { 1: 19, 2: 19.5, 3: 21, 4: 23 }[stage];
  const gloss = tag("ellipse", {
    cx: BTN.x,
    cy: BTN.y - rr * 0.55,
    rx: rr * 0.6,
    ry: rr * 0.3,
    fill: "#fff",
    opacity: stage <= 2 ? 0.1 : 0.07,
    filter: url("gl"),
  });

  return tag("g", {}, tag("defs", {}, defs) + body + gloss);
}

/** 궤도 입자 한 벌 (뒤 또는 앞). START_TIME 장면으로 그린다. data-*는 EnvelopeIllustration이 움직일 때 찾는 표시. */
function particles(o: Orbit, orbit: number, side: "back" | "front", c: Palette, haloFill: string): string {
  const frame = particleFrame(o, START_TIME);
  const head = frame.head[side];
  const segs = frame.segs[side].map((a) => tag("line", { ...a, stroke: c.light, "stroke-linecap": "round" })).join("");
  return tag(
    "g",
    { "data-orbit": orbit, "data-side": side },
    segs +
      tag("circle", { "data-part": "halo", ...head.halo, fill: haloFill }) +
      tag("circle", { "data-part": "body", ...head.body, fill: c.light }) +
      tag("circle", { "data-part": "core", ...head.core, fill: c.core }),
  );
}

/** 봉투 그림의 <svg> 안쪽 (viewBox = VIEWBOX). p = 문서 안에서 겹치지 않는 id 접두어 */
export function envelopeSvgInner(design: number, rarity: Rarity, p: string): string {
  const stage = stageOf(rarity);
  const cfg = STAGES[stage];
  const c = palette(design);
  const url = (id: string) => `url(#${p}${id})`;

  let defs =
    linGrad(`${p}body`, c.body[0], c.body[1]) + radGrad(`${p}ph`, c.glow, 0.55) + glowFilter(`${p}g`, 8, 3) + glowFilter(`${p}pg`, 1.6, 0.3);
  if (cfg.halo) defs += radGrad(`${p}h`, c.glow, cfg.halo * 2.2);
  if (cfg.under) defs += radGrad(`${p}u`, c.glow, cfg.under * 2.2);

  // 배경 빛, 별
  let out = tag("defs", {}, defs);
  if (cfg.halo) out += tag("ellipse", { cx: CX, cy: CY, rx: 190, ry: 125, fill: url("h") });
  if (cfg.under) out += tag("ellipse", { cx: CX, cy: RECT.y + RECT.h + 6, rx: 135, ry: 14, fill: url("u"), class: "env-breathe" });
  if (cfg.stars) {
    out += STARS.map((s) =>
      tag("circle", { cx: s.x, cy: s.y, r: s.r, fill: c.star, class: "env-star", style: `--d:${s.d};--delay:${s.delay}` }),
    ).join("");
  }

  // 궤도 뒤쪽 절반 + 봉투 뒤로 지나가는 입자
  out += tag(
    "g",
    {},
    cfg.orbits.map((o) => tag("path", { d: ringPath(o, false), fill: "none", stroke: c.accent, "stroke-width": 0.5, opacity: cfg.ring * 0.45 })).join(""),
  );
  out += tag("g", { filter: url("pg") }, cfg.orbits.map((o, i) => particles(o, i, "back", c, url("ph"))).join(""));

  // 봉투 본체 + 선 (번짐 → 선)
  const lines =
    tag("rect", { x: RECT.x, y: RECT.y, width: RECT.w, height: RECT.h, rx: RECT.r }) +
    FLAP_LINES.map(([x1, y1, x2, y2]) => tag("line", { x1, y1, x2, y2 })).join("");
  out += tag("rect", { x: RECT.x, y: RECT.y, width: RECT.w, height: RECT.h, rx: RECT.r, fill: url("body") });
  out += tag(
    "g",
    { fill: "none", stroke: c.glow, "stroke-width": 1.6, "stroke-linecap": "round", filter: url("g"), class: "env-breathe" },
    lines,
  );
  out += tag("g", { fill: "none", stroke: c.accent, "stroke-width": 1.6, "stroke-linecap": "round" }, lines);

  // 궤도 앞쪽 절반 + 입자
  out += tag(
    "g",
    {},
    cfg.orbits.map((o) => tag("path", { d: ringPath(o, true), fill: "none", stroke: c.accent, "stroke-width": 0.55, opacity: cfg.ring })).join(""),
  );
  out += tag("g", { filter: url("pg") }, cfg.orbits.map((o, i) => particles(o, i, "front", c, url("ph"))).join(""));

  return out + button(stage, c, p);
}

/** 봉인 단추만 (viewBox = SEAL_VIEWBOX). 받기 화면 개봉 연출에서 쓴다. */
export function sealSvgInner(design: number, rarity: Rarity, p: string): string {
  return button(stageOf(rarity), palette(design), p);
}

/** 빛 숨쉬기·별 반짝임. 앱은 globals.css에 같은 규칙이 있고, NFT 이미지(단독 SVG)는 이 문자열을 넣는다. */
export const ENVELOPE_KEYFRAMES =
  "@keyframes env-breathe{0%,100%{opacity:.78}50%{opacity:1}}.env-breathe{animation:env-breathe 8s ease-in-out infinite}" +
  "@keyframes env-twinkle{0%,100%{opacity:.15}50%{opacity:.75}}.env-star{animation:env-twinkle var(--d,6s) ease-in-out infinite;animation-delay:var(--delay,0s)}" +
  "@media (prefers-reduced-motion:reduce){.env-breathe,.env-star{animation:none}}";

/** NFT 메타데이터 media용 단독 SVG 문서 (어두운 배경 포함: 밝은 지갑 화면에서도 빛이 보이게) */
export function standaloneEnvelopeSvg(design: number, rarity: Rarity, label: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" role="img" aria-label="${label}">` +
    `<style>${ENVELOPE_KEYFRAMES}</style>` +
    tag("rect", { width: 480, height: 300, fill: "#161616" }) +
    envelopeSvgInner(design, rarity, "e_") +
    "</svg>\n"
  );
}
