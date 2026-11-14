"use client";

// 니어 행사 코드: 행사 현장에서 받은 코드를 입력하면 선택한 봉투에 강화 기회가 쌓인다. 행사마다 계정당 1회.
// 소유자: D

import { useState } from "react";

import type { NearEventView } from "@/lib/near";

import { BUTTON_PRIMARY, formatDate } from "../../envelopes/_components/shared";
import { attemptsText, errorText } from "./missions";

const FIELD =
  "block w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand disabled:opacity-60";

export function EventCard({
  event,
  redeemed,
  envelopeLabel,
  onRedeem,
}: {
  event: NearEventView;
  redeemed: boolean;
  /** "Golden Envelope #182" */
  envelopeLabel: string;
  /** 실패하면 throw */
  onRedeem: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 화면을 연 시점 기준. 끝난 뒤 제출하면 컨트랙트가 ERR_EVENT_ENDED로 막는다
  const [ended] = useState(() => Date.now() >= event.ends_at_ms);

  async function redeem() {
    setBusy(true);
    setError(null);
    try {
      await onRedeem(code);
      setCode("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">{event.name}</h3>
        {redeemed && (
          <span className="shrink-0 rounded-full bg-seal px-3 py-1 text-xs font-semibold text-brand">Completed</span>
        )}
      </div>
      <p className="mt-3 text-[15px] text-ink-muted">
        Attending? Enter the code shown at the event. {ended ? "Ended" : "Open until"} {formatDate(event.ends_at_ms)}.
      </p>
      <div className="mt-5 text-sm font-semibold text-brand">Reward: +{attemptsText(event.tickets)}</div>
      <p className="mt-2 text-xs text-ink-muted">
        {redeemed
          ? "You've used this event's code. Each account can use it once."
          : `Once per account. The reward goes to ${envelopeLabel}.`}
      </p>

      {!redeemed && !ended && (
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) redeem();
          }}
        >
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="Event code"
            aria-label={`${event.name} code`}
            autoComplete="off"
            disabled={busy}
            className={FIELD}
          />
          <button type="submit" disabled={busy || !code.trim()} className={`${BUTTON_PRIMARY} shrink-0 disabled:opacity-50`}>
            {busy ? "Checking…" : "Redeem"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </article>
  );
}
