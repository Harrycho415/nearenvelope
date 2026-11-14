// 봉투 개봉 연출: 봉인(NEAR 단추)이 떨어지고 → 덮개가 젖혀지고 → 편지가 디자인 빛과 함께 올라온다.
// 색·선·봉인 단추는 봉투 그림(art.ts, EnvelopeIllustration)과 같다. 움직임은 globals.css의 env-open-*.
// (next.config의 *.css 규칙 때문에 CSS 모듈을 쓸 수 없다)
// 움직임 줄이기 설정이면 바로 열린 상태로 보인다.
// 소유자: D

"use client";

import { useId, type CSSProperties } from "react";

import type { Rarity } from "@/lib/near";

import { palette, SEAL_LAYOUT, SEAL_VIEWBOX, sealSvgInner, stageOf } from "./art";

/** 연출 길이 (globals.css env-open-* 애니메이션과 맞춤) */
export const OPEN_MS = 2600;

/** 단계가 높을수록 열릴 때 빛이 세다 */
const GLOW_ALPHA = { 1: 0.3, 2: 0.45, 3: 0.6, 4: 0.75 } as const;

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

// 봉투 그림의 덮개 선(art.ts FLAP_LINES)을 290 x 180 봉투 좌표로 옮긴 값.
// 윗선은 덮개 삼각형(clip-path) 가장자리 위에 그린다: 선 굵기의 절반만 안쪽에 남으므로 굵게 그리고, 단추 자리 앞에서 멈춘다.
const FLAP_TOP = "M0 0 L126.5 91.1 M290 0 L163.5 91.1";
const FLAP_BOTTOM = "M4.1 175.9 L100.8 91.5 M189.2 91.5 L286.9 174.9";

export function EnvelopeOpening({
  design = 0,
  rarity = "Basic",
  className = "",
}: {
  design?: number;
  rarity?: Rarity;
  className?: string;
}) {
  const c = palette(design);
  const p = `op${useId().replace(/[^a-zA-Z0-9]/g, "")}_`;
  const vars = {
    "--top": c.body[0],
    "--bottom": c.body[1],
    "--stroke": c.accent,
    "--flap-fill": c.body[1],
    "--glow": rgba(c.glow, GLOW_ALPHA[stageOf(rarity)]),
    "--seal-w": `${SEAL_LAYOUT.width * 100}%`,
    "--seal-top": `${SEAL_LAYOUT.top * 100}%`,
  } as CSSProperties;

  return (
    <div className={className} role="img" aria-label="An envelope opening">
      <div className="env-open-stage" style={vars}>
        <div className="env-open-back" />
        <div className="env-open-flap">
          <svg viewBox="0 0 290 104.4" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            <path d={FLAP_TOP} fill="none" stroke={c.glow} strokeWidth={7} strokeLinecap="round" opacity={0.45} />
            <path d={FLAP_TOP} fill="none" stroke={c.accent} strokeWidth={3.2} strokeLinecap="round" />
          </svg>
        </div>
        <div className="env-open-letter" style={{ zIndex: 1 }}>
          <div className="env-open-line" style={{ width: "55%", marginTop: 0 }} />
          <div className="env-open-line" />
          <div className="env-open-line" />
          <div className="env-open-line" style={{ width: "70%" }} />
        </div>
        {/* 앞주머니: 좌우·아래 삼각형이 편지 아래쪽을 가린다 */}
        <svg className="env-open-pocket" viewBox="0 0 290 180" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`${p}body`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={180}>
              <stop offset={0} stopColor={c.body[0]} />
              <stop offset={1} stopColor={c.body[1]} />
            </linearGradient>
            <filter id={`${p}glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={3} />
            </filter>
          </defs>
          <path d="M0 2 L145 98 L0 178 Z M290 2 L145 98 L290 178 Z M0 179 L145 90 L290 179 Z" fill={`url(#${p}body)`} />
          {/* 윗변은 뒤판(.env-open-back)이 그린다: 올라온 편지 위로 선이 지나가지 않게 */}
          <g fill="none" strokeLinecap="round">
            <g stroke={c.glow} strokeWidth={3} filter={`url(#${p}glow)`}>
              <path d={FLAP_BOTTOM} />
              <path d="M1 17 V163 Q1 179 17 179 H273 Q289 179 289 163 V17" />
            </g>
            <g stroke={c.accent} strokeWidth={1.6}>
              <path d={FLAP_BOTTOM} />
              <path d="M1 17 V163 Q1 179 17 179 H273 Q289 179 289 163 V17" />
            </g>
          </g>
        </svg>
        <div className="env-open-seal">
          <svg
            viewBox={SEAL_VIEWBOX}
            className="block h-full w-full"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: sealSvgInner(design, rarity, `${p}s`) }}
          />
        </div>
      </div>
    </div>
  );
}
