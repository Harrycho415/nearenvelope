// History 탭: 생성 + 전달 기록(EnvelopeView.history) 타임라인, 최신순
// 강화 시각은 EnvelopeView에 없어 타임라인에는 넣지 않고 요약 문장에 성공 횟수만 보여 준다.
// 소유자: C

import { displayName, type EnvelopeView } from "@/lib/near";

import { formatDate, plural } from "../../_components/shared";

interface Entry {
  key: string;
  at_ms: number;
  title: string;
  /** 계정 전체 ID (마우스 오버) */
  detail: string;
  label: string;
}

export function HistoryTab({ envelope }: { envelope: EnvelopeView }) {
  const entries: Entry[] = [
    ...envelope.history
      .map((r, i) => ({
        key: `sent-${i}`,
        at_ms: r.at_ms,
        title: `${displayName(r.from)} → ${displayName(r.to)}`,
        detail: `${r.from} → ${r.to}`,
        label: "Envelope sent",
      }))
      .reverse(),
    {
      key: "created",
      at_ms: envelope.created_at_ms,
      title: `Created by ${displayName(envelope.creator_id)}`,
      detail: envelope.creator_id,
      label: "Envelope created",
    },
  ];

  return (
    <section className="mt-8 sheet p-6 sm:p-7">
      <h2 className="text-2xl">Every chapter stays with the envelope.</h2>
      <p className="mt-5 text-[15px] text-ink-muted">
        {plural(envelope.history.length, "gift")} · {plural(envelope.level, "successful enhancement")} · One
        continuing story
      </p>

      <ol className="mt-6 space-y-6">
        {entries.map((entry) => (
          <li key={entry.key} className="grid grid-cols-[24px_1fr] gap-x-4 sm:grid-cols-[24px_160px_1fr] sm:gap-x-6">
            <span aria-hidden className="mt-1.5 size-3 rounded-full bg-stamp" />
            <time dateTime={new Date(entry.at_ms).toISOString()} className="text-[15px] text-ink-muted">
              {formatDate(entry.at_ms)}
            </time>
            <div className="col-start-2 mt-1 min-w-0 sm:col-start-3 sm:mt-0">
              <div className="truncate text-xl font-semibold" title={entry.detail}>
                {entry.title}
              </div>
              <div className="mt-1.5 text-sm text-ink-muted">{entry.label}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
