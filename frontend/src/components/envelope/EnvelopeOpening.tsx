// 봉투 개봉 연출: 봉인이 떨어지고 → 덮개가 젖혀지고 → 편지가 희귀도 빛과 함께 올라온다.
// 색은 public/designs/ 그림(scripts/generate-envelope-art.mjs)과 같은 값. 스타일은 globals.css의 env-open-*.
// (next.config의 *.css 규칙 때문에 CSS 모듈을 쓸 수 없다)
// 움직임 줄이기 설정이면 바로 열린 상태로 보인다.
// 소유자: D

import type { CSSProperties } from "react";

import type { Rarity } from "@/lib/near";

/** 연출 길이 (globals.css env-open-* 애니메이션과 맞춤) */
export const OPEN_MS = 2600;

/** design 번호 = 컨트랙트 DESIGN_COUNT 순서 (Classic, Golden, Midnight) */
const DESIGNS = [
  { top: "#1f1f1f", bottom: "#111111", stroke: "#4a4a4a", flap: "#5c5c5c" },
  { top: "#3d3116", bottom: "#1c160a", stroke: "#b8953a", flap: "#d9b65a" },
  { top: "#18224d", bottom: "#0a0f26", stroke: "#3f52a3", flap: "#6276d1" },
];

const RARITY: Record<Rarity, { seal: string; glow: string }> = {
  Basic: { seal: "#8a8a86", glow: "rgb(163 255 71 / 0.25)" },
  Rare: { seal: "#4da3ff", glow: "rgb(77 163 255 / 0.55)" },
  Epic: { seal: "#b57bff", glow: "rgb(181 123 255 / 0.6)" },
  Legendary: { seal: "#ffc83d", glow: "rgb(255 200 61 / 0.7)" },
};

export function EnvelopeOpening({
  design = 0,
  rarity = "Basic",
  className = "",
}: {
  design?: number;
  rarity?: Rarity;
  className?: string;
}) {
  const c = DESIGNS[design] ?? DESIGNS[0];
  const r = RARITY[rarity];
  const vars = {
    "--top": c.top,
    "--bottom": c.bottom,
    "--stroke": c.stroke,
    "--flap-fill": c.bottom,
    "--seal": r.seal,
    "--glow": r.glow,
  } as CSSProperties;

  return (
    <div className={className} role="img" aria-label="An envelope opening">
      <div className="env-open-stage" style={vars}>
        <div className="env-open-back" />
        <div className="env-open-flap" />
        <div className="env-open-letter" style={{ zIndex: 1 }}>
          <div className="env-open-line" style={{ width: "55%", marginTop: 0 }} />
          <div className="env-open-line" />
          <div className="env-open-line" />
          <div className="env-open-line" style={{ width: "70%" }} />
        </div>
        {/* 앞주머니: 좌우·아래 삼각형이 편지 아래쪽을 가린다 */}
        <svg className="env-open-pocket" viewBox="0 0 290 180" preserveAspectRatio="none" aria-hidden>
          <path d="M0 2 L145 98 L0 178 Z M290 2 L145 98 L290 178 Z" fill={c.bottom} />
          <path d="M0 179 L145 90 L290 179 Z" fill={c.top} />
          <g fill="none" stroke={c.flap} strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 174 L100 92 M286 174 L190 92" />
          </g>
          {/* 윗변은 뒤판(.env-open-back)이 그린다: 올라온 편지 위로 선이 지나가지 않게 */}
          <path
            d="M1 17 V163 Q1 179 17 179 H273 Q289 179 289 163 V17"
            fill="none"
            stroke={c.stroke}
            strokeWidth="2"
          />
        </svg>
        <div className="env-open-seal" />
      </div>
    </div>
  );
}
