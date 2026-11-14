// 봉투 그림: public/designs/{design}/{rarity}.svg (NFT 메타데이터 media와 같은 파일, scripts/generate-envelope-art.mjs로 생성)
// 크기는 부모 너비를 따른다 (비율 34:23, 희귀도 빛 번짐 여백 포함).
// 소유자: D

import Image from "next/image";

import type { Rarity } from "@/lib/near";

import { designName } from "./designs";

export function EnvelopeIllustration({
  design = 0,
  rarity = "Basic",
  className = "",
}: {
  design?: number;
  rarity?: Rarity;
  className?: string;
}) {
  return (
    <Image
      src={`/designs/${design}/${rarity.toLowerCase()}.svg`}
      alt={`${designName(design)} envelope, ${rarity}`}
      width={340}
      height={230}
      unoptimized
      draggable={false}
      className={`h-auto select-none ${className}`}
    />
  );
}
