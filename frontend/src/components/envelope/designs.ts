// 봉투 디자인과 희귀도 표시 정보. design 번호는 컨트랙트 DESIGN_COUNT와 맞춘다.
// 소유자: D

import type { Rarity } from "@/lib/near";

export const DESIGN_NAMES = ["Classic", "Golden", "Midnight"] as const;

export const designName = (design: number) => DESIGN_NAMES[design] ?? "Classic";

/** 화면 표기용. 온체인 값 Basic은 시안대로 Common으로 보여 준다. */
/** 희귀도 글자색 (globals.css --color-common / rare / epic / legendary, 봉투 그림과 같은 색) */
export const RARITY_TEXT: Record<Rarity, string> = {
  Basic: "text-common",
  Rare: "text-rare",
  Epic: "text-epic",
  Legendary: "text-legendary",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  Basic: "Common",
  Rare: "Rare",
  Epic: "Epic",
  Legendary: "Legendary",
};
