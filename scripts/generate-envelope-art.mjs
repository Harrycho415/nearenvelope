#!/usr/bin/env node
// 봉투 그림 12장 생성: frontend/public/designs/{design}/{rarity}.svg
// 컨트랙트 NFT 메타데이터 media("designs/{design}/{rarity 소문자}.svg")가 이 파일을 가리킨다.
// 그림은 앱과 같은 art.ts로 만든다 (궤도 입자는 멈춘 한 장면, 빛 숨쉬기·별 반짝임은 SVG 안 CSS로 움직임).
// 실행: node scripts/generate-envelope-art.mjs   (Node 22.18+ : .ts 파일을 타입 제거로 바로 불러온다)
// 소유자: D

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { standaloneEnvelopeSvg } from "../frontend/src/components/envelope/art.ts";
import { DESIGN_NAMES } from "../frontend/src/components/envelope/designs.ts";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../frontend/public/designs");
const RARITIES = ["Basic", "Rare", "Epic", "Legendary"];

let count = 0;
DESIGN_NAMES.forEach((name, design) => {
  for (const rarity of RARITIES) {
    const file = join(OUT, String(design), `${rarity.toLowerCase()}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, standaloneEnvelopeSvg(design, rarity, `${name} envelope, ${rarity}`));
    count++;
  }
});
console.log(`wrote ${count} files to ${OUT}`);
