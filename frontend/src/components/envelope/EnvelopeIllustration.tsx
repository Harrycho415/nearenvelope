"use client";

// 봉투 그림. 모양·색은 art.ts(시안 near_envelope_stages.html), 여기서는 궤도 입자만 움직인다.
// 희귀도가 곧 강화 단계: Common 1단계 · Rare 2단계(궤도 1) · Epic 3단계(궤도 2) · Legendary 4단계(궤도 3 + 별빛).
// 크기는 부모 너비를 따른다 (480 x 300). 처음엔 START_TIME 장면이 그려져 있고(서버 렌더 포함),
// 화면에 보일 때만 움직인다(모든 봉투가 requestAnimationFrame 하나를 공유). 움직임 줄이기 설정이면 멈춘 장면 그대로.
// 빛 숨쉬기·별 반짝임은 globals.css의 env-breathe / env-star.
// 소유자: D

import { useEffect, useId, useMemo, useRef } from "react";

import type { Rarity } from "@/lib/near";

import { envelopeSvgInner, particleFrame, stageOf, STAGES, VIEWBOX, type Attrs, type Orbit } from "./art";
import { designName } from "./designs";

/* ------------------------------- 애니메이션 루프 (전체 공유) ------------------------------- */

const frames = new Set<(time: number) => void>();
let raf = 0;

function tick(now: number) {
  frames.forEach((draw) => draw(now));
  raf = frames.size ? requestAnimationFrame(tick) : 0;
}

function subscribe(draw: (time: number) => void) {
  frames.add(draw);
  if (!raf) raf = requestAnimationFrame(tick);
  return () => {
    frames.delete(draw);
  };
}

interface ParticleSet {
  segs: SVGLineElement[];
  halo: SVGCircleElement;
  body: SVGCircleElement;
  core: SVGCircleElement;
}

/** art.ts가 data-orbit / data-side / data-part로 표시해 둔 입자 요소를 찾는다 */
function collect(svg: SVGSVGElement, orbit: number, side: "back" | "front"): ParticleSet {
  const g = svg.querySelector(`g[data-orbit="${orbit}"][data-side="${side}"]`)!;
  return {
    segs: Array.from(g.querySelectorAll("line")),
    halo: g.querySelector('[data-part="halo"]')!,
    body: g.querySelector('[data-part="body"]')!,
    core: g.querySelector('[data-part="core"]')!,
  };
}

function set(el: Element, attrs: Attrs) {
  for (const k in attrs) el.setAttribute(k, String(attrs[k]));
}

function drawParticles(parts: { o: Orbit; back: ParticleSet; front: ParticleSet }[], time: number) {
  for (const { o, back, front } of parts) {
    const frame = particleFrame(o, time);
    for (const [side, s] of [
      ["back", back],
      ["front", front],
    ] as const) {
      s.segs.forEach((line, k) => set(line, frame.segs[side][k]));
      set(s.halo, frame.head[side].halo);
      set(s.body, frame.head[side].body);
      set(s.core, frame.head[side].core);
    }
  }
}

/* ------------------------------- 봉투 ------------------------------- */

export function EnvelopeIllustration({
  design = 0,
  rarity = "Basic",
  className = "",
}: {
  design?: number;
  rarity?: Rarity;
  className?: string;
}) {
  // url(#id)에 쓸 수 있게 영숫자만 남긴다
  const p = `env${useId().replace(/[^a-zA-Z0-9]/g, "")}_`;
  const inner = useMemo(() => envelopeSvgInner(design, rarity, p), [design, rarity, p]);
  const orbits = STAGES[stageOf(rarity)].orbits;
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || orbits.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parts = orbits.map((o, i) => ({ o, back: collect(svg, i, "back"), front: collect(svg, i, "front") }));
    const draw = (time: number) => drawParticles(parts, time);

    // 화면에 보일 때만 루프에 참여
    let unsubscribe: (() => void) | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) unsubscribe ??= subscribe(draw);
      else {
        unsubscribe?.();
        unsubscribe = null;
      }
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
      unsubscribe?.();
    };
  }, [orbits, inner]);

  return (
    <svg
      ref={ref}
      viewBox={VIEWBOX}
      role="img"
      aria-label={`${designName(design)} envelope, ${rarity}`}
      className={`h-auto select-none ${className}`}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
