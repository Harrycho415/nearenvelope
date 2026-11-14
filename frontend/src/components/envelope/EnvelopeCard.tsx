// 봉투 카드 (임시 디자인). 희귀도별 비주얼은 public/designs/{design}/{rarity}.svg 로 교체 예정.
// 소유자: D

import type { EnvelopeView, Rarity } from "@/lib/near";

const RARITY_STYLE: Record<Rarity, string> = {
  Basic: "border-common bg-common-tint",
  Rare: "border-rare bg-rare-tint",
  Epic: "border-epic bg-epic-tint",
  Legendary: "border-legendary bg-legendary-tint",
};

export function EnvelopeCard({ envelope }: { envelope: EnvelopeView }) {
  return (
    <div className={`rounded-[3px] border p-5 ${RARITY_STYLE[envelope.rarity]}`}>
      <div className="label">#{envelope.token_id}</div>
      <div className="mt-2 text-lg font-semibold">
        {envelope.rarity} Envelope +{envelope.level}
      </div>
      <div className="mt-1 text-sm opacity-70">
        티켓 {envelope.enhance_tickets} · 전달 {envelope.history.length}회
      </div>
    </div>
  );
}
