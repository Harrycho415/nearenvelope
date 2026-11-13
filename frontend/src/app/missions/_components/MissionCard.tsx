// 미션 카드: 진행도, 보상, 완료 여부 또는 행동 버튼
// 소유자: D

import Link from "next/link";

import type { EnvelopeView } from "@/lib/near";

import { BUTTON_SECONDARY } from "../../envelopes/_components/shared";
import { attemptsText, type MissionDef } from "./missions";

export function MissionCard({ mission, envelope }: { mission: MissionDef; envelope: EnvelopeView }) {
  const done = envelope.missions_done.includes(mission.id);
  const raw = mission.progress?.(envelope) ?? { current: 0, target: 1 };
  const progress = done ? { ...raw, current: raw.target } : { ...raw, current: Math.min(raw.current, raw.target) };
  const action = done ? undefined : mission.action?.(envelope);

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">{mission.title}</h3>
        {done && (
          <span className="shrink-0 rounded-full bg-seal px-3 py-1 text-xs font-semibold text-brand">Completed</span>
        )}
      </div>
      <p className="mt-3 text-[15px] text-ink-muted">{mission.description}</p>

      <div className="mt-5 text-sm">
        Progress: {progress.current} / {progress.target}
        {progress.unit && ` ${progress.unit}`}
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.target}
        aria-valuenow={progress.current}
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${(progress.current / progress.target) * 100}%` }} />
      </div>

      <div className="mt-5 text-sm font-semibold text-brand">Reward: +{attemptsText(mission.reward)}</div>
      <p className="mt-2 text-xs text-ink-muted">
        {done ? "Added to this Envelope automatically." : "Added to this Envelope automatically when completed."}
      </p>

      {action && (
        <Link href={action.href} className={`${BUTTON_SECONDARY} mt-5 self-start text-sm`}>
          {action.label}
        </Link>
      )}
    </article>
  );
}
