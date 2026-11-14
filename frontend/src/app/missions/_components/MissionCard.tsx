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
    <article className="lift flex flex-col sheet p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">{mission.title}</h3>
        {done && (
          <span className="shrink-0 label text-ok">Completed</span>
        )}
      </div>
      <p className="mt-3 text-[15px] text-ink-muted">{mission.description}</p>

      <div className="label mt-5">
        Progress: {progress.current} / {progress.target}
        {progress.unit && ` ${progress.unit}`}
      </div>
      <div
        className="rule-progress mt-3"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.target}
        aria-valuenow={progress.current}
      >
        <div style={{ width: `${(progress.current / progress.target) * 100}%` }} />
      </div>

      <div className="label mt-5 text-ink">Reward: +{attemptsText(mission.reward)}</div>
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
