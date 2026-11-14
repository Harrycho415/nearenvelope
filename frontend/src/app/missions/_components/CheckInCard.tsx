"use client";

// 체크인: 쿨다운마다 강화 기회 1회. 반복 미션이라 missions_done에는 남지 않는다.
// 소유자: D

import { useEffect, useState } from "react";

import type { EnvelopeView } from "@/lib/near";

import { BUTTON_PRIMARY } from "../../envelopes/_components/shared";
import { attemptsText, errorText } from "./missions";

function remainingText(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}

export function CheckInCard({
  envelope,
  cooldownMs,
  onCheckIn,
}: {
  envelope: EnvelopeView;
  cooldownMs: number;
  /** 실패하면 throw */
  onCheckIn: () => Promise<void>;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyAt = envelope.last_check_in_ms === 0 ? 0 : envelope.last_check_in_ms + cooldownMs;
  const waiting = readyAt > now;

  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      await onCheckIn();
      setNow(Date.now());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col sheet p-6">
      <h3 className="text-xl font-semibold">Check In</h3>
      <p className="mt-3 text-[15px] text-ink-muted">
        Visit this Envelope regularly. Every {Math.round(cooldownMs / 60_000)} minutes it can earn another attempt.
      </p>
      <div className="label mt-5 text-ink">Reward: +{attemptsText(1)} · Repeatable</div>
      <div className="mt-auto pt-5">
        <button onClick={checkIn} disabled={busy || waiting} className={`${BUTTON_PRIMARY} disabled:opacity-50`}>
          {busy ? "Checking in…" : waiting ? `Next check-in in ${remainingText(readyAt - now)}` : "Check In"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
