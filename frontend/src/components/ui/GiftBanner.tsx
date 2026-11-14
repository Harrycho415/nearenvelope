// "NEW GIFT" 배너. 홈에서는 받기 화면 링크와 함께, 받기 화면에서는 안내로만 쓴다.
// 소유자: C

import Link from "next/link";

import { displayName, timeAgo, type EnvelopeView } from "@/lib/near";

export function GiftBanner({
  envelope,
  now,
  more = 0,
  viewHref,
}: {
  envelope: EnvelopeView;
  /** 상대 시간 기준 (불러온 시각) */
  now: number;
  /** 이 밖에 안 열어 본 선물 수 */
  more?: number;
  viewHref?: string;
}) {
  const last = envelope.history.at(-1);
  if (!last) return null;

  return (
    <div className="note rise flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4">
      <span className="label text-brand">New gift</span>
      <span className="text-lg">{displayName(last.from)} sent you an Envelope.</span>
      <span className="text-[15px] text-ink-muted">
        {timeAgo(last.at_ms, now)}
        {more > 0 && ` · +${more} more`}
        {viewHref && (
          <>
            {" · "}
            <Link href={viewHref} className="link">
              View gift →
            </Link>
          </>
        )}
      </span>
    </div>
  );
}
