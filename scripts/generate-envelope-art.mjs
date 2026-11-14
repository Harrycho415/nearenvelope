#!/usr/bin/env node
// 봉투 그림 12장 생성: frontend/public/designs/{design}/{rarity}.svg
// 컨트랙트 NFT 메타데이터 media("designs/{design}/{rarity 소문자}.svg")와 앱 화면(EnvelopeIllustration)이 같은 파일을 쓴다.
// 실행: node scripts/generate-envelope-art.mjs
// 소유자: D

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../frontend/public/designs");

/** design 번호 = 컨트랙트 DESIGN_COUNT 순서 (Classic, Golden, Midnight) */
const DESIGNS = [
  { top: "#1f1f1f", bottom: "#111111", stroke: "#4a4a4a", flap: "#5c5c5c" },
  { top: "#3d3116", bottom: "#1c160a", stroke: "#b8953a", flap: "#d9b65a" },
  { top: "#18224d", bottom: "#0a0f26", stroke: "#3f52a3", flap: "#6276d1" },
];

/** globals.css의 --color-rare / epic / legendary와 같은 값 */
const RARITIES = {
  basic: { seal: "#8a8a86", glow: 0 },
  rare: { seal: "#4da3ff", glow: 0.45 },
  epic: { seal: "#b57bff", glow: 0.6 },
  legendary: { seal: "#ffc83d", glow: 0.85 },
};

// 봉투 본체 290x180, 빛 번짐을 위해 사방 25px 여백
const W = 340;
const H = 230;
const X = 25;
const Y = 25;

function sparkle(cx, cy, r, color) {
  const s = r * 0.28;
  return `<path d="M${cx} ${cy - r} L${cx + s} ${cy - s} L${cx + r} ${cy} L${cx + s} ${cy + s} L${cx} ${cy + r} L${cx - s} ${cy + s} L${cx - r} ${cy} L${cx - s} ${cy - s} Z" fill="${color}"/>`;
}

function envelope(d, rarity) {
  const c = DESIGNS[d];
  const r = RARITIES[rarity];
  const cx = X + 145;
  const sealY = Y + 99;
  const glow =
    r.glow > 0
      ? `<rect x="${X}" y="${Y}" width="290" height="180" rx="16" fill="none" stroke="${r.seal}" stroke-width="6" opacity="${r.glow}" filter="url(#glow)"/>`
      : "";
  const ring =
    r.glow > 0
      ? `<rect x="${X + 1}" y="${Y + 1}" width="288" height="178" rx="15" fill="none" stroke="${r.seal}" stroke-opacity="${r.glow}" stroke-width="1.5"/>`
      : "";
  const sparkles =
    rarity === "legendary"
      ? [sparkle(X + 30, Y + 30, 7, r.seal), sparkle(X + 262, Y + 44, 5, r.seal), sparkle(X + 250, Y + 150, 6, r.seal)].join("")
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Envelope">
<defs>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset="1" stop-color="${c.bottom}"/></linearGradient>
<radialGradient id="seal" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="0.45" stop-color="${r.seal}"/><stop offset="1" stop-color="${r.seal}" stop-opacity="0.75"/></radialGradient>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
${glow}
<rect x="${X}" y="${Y}" width="290" height="180" rx="16" fill="url(#body)" stroke="${c.stroke}" stroke-width="2"/>
<g fill="none" stroke="${c.flap}" stroke-width="2.2" stroke-linecap="round">
<path d="M${X + 4} ${Y + 8} L${cx - 18} ${sealY - 4} M${X + 286} ${Y + 8} L${cx + 18} ${sealY - 4}"/>
<path d="M${X + 4} ${Y + 174} L${X + 100} ${Y + 92} M${X + 286} ${Y + 174} L${X + 190} ${Y + 92}"/>
</g>
${ring}
<circle cx="${cx}" cy="${sealY}" r="19" fill="url(#seal)" stroke="${c.bottom}" stroke-width="2"/>
<circle cx="${cx}" cy="${sealY}" r="11" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="1.5"/>
${sparkles}
</svg>
`;
}

for (let d = 0; d < DESIGNS.length; d++) {
  for (const rarity of Object.keys(RARITIES)) {
    const file = join(OUT, String(d), `${rarity}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, envelope(d, rarity));
  }
}
console.log(`wrote ${DESIGNS.length * Object.keys(RARITIES).length} files to ${OUT}`);
