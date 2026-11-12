// 출금 화면 오른쪽: 어떤 봉투에서 꺼내는지 보여 주는 카드
// 소유자: C

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL } from "@/components/envelope/designs";
import type { EnvelopeView } from "@/lib/near";

import { envelopeName } from "../../../_components/shared";

export function EnvelopeSideCard({ envelope }: { envelope: EnvelopeView }) {
  return (
    <aside className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
      <EnvelopeIllustration className="w-full" />
      <h2 className="mt-6 text-2xl font-semibold">
        {envelopeName(envelope)} #{envelope.token_id}
      </h2>
      <div className="mt-4 text-[17px] text-brand">
        +{envelope.level} · {RARITY_LABEL[envelope.rarity]}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        Only the assets you select move out. Ownership, level, and history stay the same.
      </p>
    </aside>
  );
}
