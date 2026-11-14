"use client";

// 포인터를 따라 기울고 광택이 도는 틀. 봉투 상세·강화·보내기 화면의 우표에 쓴다.
// sheen(0~1)은 광택 세기: 레벨·희귀도가 높을수록 크게 준다. 움직임 줄이기 설정이면 아무것도 하지 않는다.
// 소유자: D

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

const MAX_DEG = 8;

export function Tilt({
  children,
  sheen = 0.5,
  className = "",
}: {
  children: ReactNode;
  sheen?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    el.dataset.active = "";
    el.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_DEG).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_DEG).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.active;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`tilt ${className}`}
      style={{ "--sheen": sheen } as CSSProperties}
    >
      <div className="tilt-body">
        {children}
        <span aria-hidden className="tilt-sheen" />
      </div>
    </div>
  );
}

/** 레벨(0~)에 따른 광택 세기 */
export const sheenForLevel = (level: number) => Math.min(0.25 + level * 0.09, 0.95);
