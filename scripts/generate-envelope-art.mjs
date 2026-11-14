#!/usr/bin/env node
// 봉투 그림 12장 생성: frontend/public/designs/{design}/{rarity}.svg
// 컨트랙트 NFT 메타데이터 media("designs/{design}/{rarity 소문자}.svg")와 앱 화면(EnvelopeIllustration)이 같은 파일을 쓴다.
// 모양: 톱니 가장자리 우표. 디자인이 종이·잉크 색을, 희귀도가 띠 색과 점 개수를 정한다 (design-system/near-envelope/MASTER.md).
// 실행: node scripts/generate-envelope-art.mjs
// 소유자: D

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../frontend/public/designs");

/** design 번호 = 컨트랙트 DESIGN_COUNT 순서 (Classic, Golden, Midnight) */
const DESIGNS = [
  { name: "CLASSIC", paper: "#fafaf9", field: "#f0efed", ink: "#44403c", faint: "#a8a29e", env: "#fdfcfa" },
  { name: "GOLDEN", paper: "#fcf3e5", field: "#f6deb6", ink: "#7a4f0a", faint: "#c9a05a", env: "#fffaf0" },
  { name: "MIDNIGHT", paper: "#292524", field: "#1c1917", ink: "#e7e5e4", faint: "#78716c", env: "#3a3532" },
];

/** globals.css의 --color-{rarity} / --color-{rarity}-tint와 같은 값 */
const RARITIES = {
  basic: { label: "COMMON", band: "#e7e5e4", text: "#57534e", pips: 1 },
  rare: { label: "RARE", band: "#c3deee", text: "#2b5878", pips: 2 },
  epic: { label: "EPIC", band: "#e5d2dd", text: "#7f3b63", pips: 3 },
  legendary: { label: "LEGENDARY", band: "#f6deb6", text: "#7a4e06", pips: 4 },
};

const SEAL = "#f44e22"; // --color-stamp
const MONO = "ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace";

// 우표 본체 316x206, 그림자 여백 12px
const W = 340;
const H = 230;
const X = 12;
const Y = 12;
const BW = W - X * 2;
const BH = H - Y * 2;
const HOLE = 4.6;

/** 가장자리를 따라 일정 간격으로 뚫은 구멍 */
function perforations() {
  const out = [];
  const row = (n, at) => {
    for (let i = 0; i <= n; i++) out.push(at(i / n));
  };
  const nx = 20;
  const ny = 13;
  row(nx, (t) => [X + BW * t, Y]);
  row(nx, (t) => [X + BW * t, Y + BH]);
  row(ny, (t) => [X, Y + BH * t]);
  row(ny, (t) => [X + BW, Y + BH * t]);
  return out.map(([cx, cy]) => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${HOLE}"/>`).join("");
}

function stamp(d, rarity) {
  const c = DESIGNS[d];
  const r = RARITIES[rarity];
  // 안쪽 틀
  const fx = X + 16;
  const fy = Y + 16;
  const fw = BW - 32;
  const fh = BH - 32;
  const band = 30;
  // 봉투 선화
  const ew = 150;
  const eh = 96;
  const ex = fx + (fw - ew) / 2;
  const ey = fy + band + (fh - band - 26 - eh) / 2 + 2;
  const cx = ex + ew / 2;
  const pips = Array.from({ length: r.pips }, (_, i) => `<circle cx="${fx + fw - 14 - i * 11}" cy="${fy + band / 2}" r="3.2" fill="${r.text}"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.name} envelope, ${r.label}">
<defs>
<mask id="perf"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${perforations()}</g></mask>
</defs>
<rect x="${X}" y="${Y}" width="${BW}" height="${BH}" fill="${c.paper}" mask="url(#perf)"/>
<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${c.field}"/>
<rect x="${fx}" y="${fy}" width="${fw}" height="${band}" fill="${r.band}"/>
<rect x="${fx + 0.5}" y="${fy + 0.5}" width="${fw - 1}" height="${fh - 1}" fill="none" stroke="${c.ink}" stroke-opacity="0.55"/>
<path d="M${fx} ${fy + band}.5 H${fx + fw}" stroke="${c.ink}" stroke-opacity="0.55"/>
<text x="${fx + 12}" y="${fy + band / 2 + 4}" font-family="${MONO}" font-size="10.5" font-weight="600" letter-spacing="2" fill="${r.text}">${r.label}</text>
${pips}
<g stroke="${c.ink}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
<rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="2" fill="${c.env}"/>
<path d="M${ex} ${ey + eh} L${ex + 56} ${ey + 46} M${ex + ew} ${ey + eh} L${ex + ew - 56} ${ey + 46}" fill="none" stroke-opacity="0.6"/>
<path d="M${ex} ${ey} L${cx} ${ey + 56} L${ex + ew} ${ey}" fill="${c.env}"/>
</g>
<circle cx="${cx}" cy="${ey + 54}" r="11" fill="${SEAL}"/>
<circle cx="${cx}" cy="${ey + 54}" r="6" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="1.2"/>
<g fill="none" stroke="${c.faint}" stroke-width="1.1" stroke-opacity="0.8">
<path d="M${fx + 14} ${ey + 22} q7 -6 14 0 t14 0 M${fx + 14} ${ey + 34} q7 -6 14 0 t14 0 M${fx + 14} ${ey + 46} q7 -6 14 0 t14 0"/>
<circle cx="${fx + fw - 34}" cy="${ey + 34}" r="19" stroke-dasharray="3 3"/>
<circle cx="${fx + fw - 34}" cy="${ey + 34}" r="13"/>
</g>
<text x="${fx + 12}" y="${fy + fh - 10}" font-family="${MONO}" font-size="9.5" letter-spacing="2.2" fill="${c.ink}">NEAR ENVELOPE</text>
<text x="${fx + fw - 12}" y="${fy + fh - 10}" text-anchor="end" font-family="${MONO}" font-size="9.5" letter-spacing="2.2" fill="${c.ink}" fill-opacity="0.7">${c.name}</text>
</svg>
`;
}

for (let d = 0; d < DESIGNS.length; d++) {
  for (const rarity of Object.keys(RARITIES)) {
    const file = join(OUT, String(d), `${rarity}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, stamp(d, rarity));
  }
}
console.log(`wrote ${DESIGNS.length * Object.keys(RARITIES).length} files to ${OUT}`);
