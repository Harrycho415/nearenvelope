"use client";

// 홈 히어로의 우표 판: 모눈종이 위에 흩어진 봉투 우표를 마우스로 끌어 옮길 수 있다.
// 끌기 없이도 같은 결과를 얻도록 Organize / Shuffle 버튼을 둔다 (WCAG 2.5.7). 터치에서는 스크롤을 막지 않으려고 끌기를 끈다.
// 위치 단위는 판 크기 대비 % (cqw / cqh).
// 소유자: D

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

import type { Rarity } from "@/lib/near";

import { EnvelopeIllustration } from "./EnvelopeIllustration";

interface Placed {
  x: number;
  y: number;
  r: number;
  z: number;
}

const STAMPS: { design: number; rarity: Rarity }[] = [
  { design: 0, rarity: "Basic" },
  { design: 2, rarity: "Rare" },
  { design: 1, rarity: "Legendary" },
  { design: 0, rarity: "Epic" },
  { design: 2, rarity: "Legendary" },
  { design: 1, rarity: "Rare" },
  { design: 0, rarity: "Legendary" },
];

// 우표 너비 36cqw. 왼쪽 9%는 바인더 구멍 자리
const MIN_X = 9;
const MAX_X = 61;
const MIN_Y = 2;
const MAX_Y = 77;

const SCATTERED: Placed[] = [
  [10, 4, -6],
  [51, 8, 5],
  [26, 25, -3],
  [57, 37, 8],
  [10, 49, 4],
  [39, 61, -7],
  [12, 76, 3],
].map(([x, y, r], z) => ({ x, y, r, z }));

const ORGANIZED: Placed[] = STAMPS.map((_, i) => ({ x: i % 2 ? 55 : 13, y: 3 + Math.floor(i / 2) * 24, r: 0, z: i }));

const between = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function StampBoard() {
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; px: number; py: number; x: number; y: number } | null>(null);
  const top = useRef(STAMPS.length);
  const [placed, setPlaced] = useState(SCATTERED);
  const [dragging, setDragging] = useState<number | null>(null);

  const down = (i: number, e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { i, px: e.clientX, py: e.clientY, x: placed[i].x, y: placed[i].y };
    const z = top.current++;
    setDragging(i);
    setPlaced((all) => all.map((p, j) => (j === i ? { ...p, z } : p)));
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const box = board.current?.getBoundingClientRect();
    if (!d || !box) return;
    const x = clamp(d.x + ((e.clientX - d.px) / box.width) * 100, MIN_X - 6, MAX_X + 4);
    const y = clamp(d.y + ((e.clientY - d.py) / box.height) * 100, MIN_Y - 2, MAX_Y + 2);
    setPlaced((all) => all.map((p, j) => (j === d.i ? { ...p, x, y } : p)));
  };

  const up = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(null);
    setPlaced((all) => all.map((p, j) => (j === d.i ? { ...p, r: between(-7, 7) } : p)));
  };

  return (
    <div>
      <div
        ref={board}
        className="sheet sheet-grid punched relative aspect-[5/6] overflow-hidden [container-type:size]"
        aria-hidden
      >
        {STAMPS.map((s, i) => {
          const p = placed[i];
          const held = dragging === i;
          return (
            <div
              key={i}
              onPointerDown={(e) => down(i, e)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className={`lift absolute left-0 top-0 w-[36cqw] cursor-grab active:cursor-grabbing ${
                held ? "" : "transition-[translate,scale] duration-[900ms] ease-spring"
              }`}
              style={
                {
                  translate: `${p.x}cqw ${p.y}cqh`,
                  scale: held ? 1.06 : 1,
                  zIndex: p.z,
                  "--r": `${held ? 0 : p.r}deg`,
                } as CSSProperties
              }
            >
              <div className="rise" style={{ "--i": 4 + i * 2 } as CSSProperties}>
                <EnvelopeIllustration design={s.design} rarity={s.rarity} className="w-full" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Fig. 1 — Drag a stamp, or</p>
        <div className="flex gap-2">
          <button onClick={() => setPlaced(ORGANIZED)} className="btn btn-secondary">
            Organize
          </button>
          <button
            onClick={() =>
              setPlaced((all) =>
                all.map((p) => ({ ...p, x: between(MIN_X, MAX_X), y: between(MIN_Y, MAX_Y), r: between(-9, 9) })),
              )
            }
            className="btn btn-secondary"
          >
            Shuffle
          </button>
        </div>
      </div>
    </div>
  );
}
