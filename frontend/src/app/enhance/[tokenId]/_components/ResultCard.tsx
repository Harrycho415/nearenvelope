"use client";

// 강화 결과 카드: 성공 / 실패 (시안 기준)
// 소유자: D

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { designName, RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import type { EnvelopeView } from "@/lib/near";

import { BUTTON_PRIMARY, BUTTON_SECONDARY, envelopeName } from "../../../envelopes/_components/shared";
import { rarityOf, type EnhanceOutcome } from "./enhance";

const attemptsText = (n: number) => `${n} → ${Math.max(n - 1, 0)} remaining`;

export function ResultCard({
  outcome,
  envelope,
  onTryAgain,
  busy,
  error,
}: {
  outcome: EnhanceOutcome;
  envelope: EnvelopeView;
  onTryAgain: () => void;
  busy: boolean;
  error: string | null;
}) {
  const name = `${envelopeName(envelope)} #${envelope.token_id}`;
  const left = Math.max(outcome.attempts - 1, 0);

  return (
    <section className="mx-auto max-w-[1020px] sheet px-6 py-12 text-center sm:px-16 sm:py-14">
      {outcome.success ? (
        <Success outcome={outcome} name={name} design={envelope.design} />
      ) : (
        <Failure outcome={outcome} name={name} design={envelope.design} />
      )}

      {outcome.success ? (
        <>
          <div className="mx-auto mt-6 grid max-w-[760px] gap-4 note px-6 py-5 text-left text-[17px] sm:grid-cols-2 sm:gap-10">
            <div>
              <div>Assets unchanged</div>
              <div className="mt-1">All assets remain inside.</div>
            </div>
            <div>
              <div>Enhancement Attempts</div>
              <div className="mt-1">{attemptsText(outcome.attempts)}</div>
            </div>
          </div>
          <Link href={`/envelopes/${envelope.token_id}`} className={`${BUTTON_PRIMARY} mt-4 inline-block`}>
            View Upgraded Envelope
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto mt-5 max-w-[760px] note px-6 py-7">
            <div className="text-[22px] font-semibold">Your envelope and its assets are safe.</div>
            <p className="mt-4 text-[15px] text-ink-muted">
              All assets remain inside. Your envelope&apos;s history is preserved.
            </p>
          </div>
          <div className="mt-8 text-[22px] font-semibold">Enhancement Attempts: {attemptsText(outcome.attempts)}</div>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {left > 0 && envelope.level < 10 ? (
              <button onClick={onTryAgain} disabled={busy} className={`${BUTTON_PRIMARY} disabled:opacity-60`}>
                {busy ? "Opening the seal…" : "Try Again"}
              </button>
            ) : (
              <Link href={`/missions?token=${envelope.token_id}`} className={BUTTON_PRIMARY}>
                Earn Attempts
              </Link>
            )}
            <Link href={`/envelopes/${envelope.token_id}`} className={BUTTON_SECONDARY}>
              Back to Envelope
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            {left > 0
              ? `One attempt was used. Try Again uses 1 of your ${left} remaining attempt${left === 1 ? "" : "s"}.`
              : "One attempt was used. Complete missions to earn more attempts."}
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

function Success({ outcome, name, design }: { outcome: EnhanceOutcome; name: string; design: number }) {
  const before = rarityOf(outcome.from);
  const after = rarityOf(outcome.to);
  const rarityUp = before !== after;

  return (
    <>
      <div className="postmark thunk">Level up</div>
      <h1 className="mt-6 text-3xl tracking-tight sm:text-[38px]">Your Envelope just got stronger.</h1>
      <Tilt sheen={sheenForLevel(outcome.to)} className="settle mx-auto mt-8 w-[260px] sm:w-[360px]">
        <EnvelopeIllustration design={design} rarity={after} className="w-full" />
      </Tilt>
      <div className="mt-6 text-5xl tabular-nums sm:text-[64px]">
        +{outcome.from} → +{outcome.to}
      </div>
      <div className="label mt-6 text-ink">
        {rarityUp && (
          <>
            <span className={RARITY_TEXT[before]}>{RARITY_LABEL[before].toUpperCase()}</span>
            <span className="text-ink-muted"> → </span>
          </>
        )}
        <span className={RARITY_TEXT[after]}>{RARITY_LABEL[after].toUpperCase()}</span>
        {rarityUp ? " · Rarity upgraded" : " · Level upgraded"}
      </div>
      <div className="mt-5 text-xl">{name}</div>
      <p className="mt-5 text-[17px] text-ink-muted">One attempt used. A new chapter for your {designName(design)} Envelope.</p>
    </>
  );
}

function Failure({ outcome, name, design }: { outcome: EnhanceOutcome; name: string; design: number }) {
  return (
    <>
      <h1 className="text-3xl sm:text-[44px]">Enhancement Failed</h1>
      <EnvelopeIllustration design={design} rarity={rarityOf(outcome.from)} className="shake mx-auto mt-6 w-[260px] sm:w-[340px]" />
      <div className="mt-6 text-2xl sm:text-[28px]">
        {name} remains at +{outcome.from}.
      </div>
      <p className="mt-4 text-lg text-ink-muted">
        <span className={RARITY_TEXT[rarityOf(outcome.from)]}>{RARITY_LABEL[rarityOf(outcome.from)].toUpperCase()}</span> ·
        Your level and rarity are unchanged.
      </p>
    </>
  );
}
