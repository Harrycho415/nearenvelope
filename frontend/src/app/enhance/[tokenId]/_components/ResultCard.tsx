"use client";

// 강화 결과 카드: 성공 / 실패 (시안 기준)
// 소유자: D

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { designName, RARITY_LABEL } from "@/components/envelope/designs";
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
    <section className="mx-auto max-w-[1020px] rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-16 sm:py-14">
      {outcome.success ? (
        <Success outcome={outcome} name={name} design={designName(envelope.design)} />
      ) : (
        <Failure outcome={outcome} name={name} />
      )}

      {outcome.success ? (
        <>
          <div className="mx-auto mt-6 grid max-w-[760px] gap-4 rounded-2xl border border-line bg-seal/40 px-6 py-5 text-left text-[17px] sm:grid-cols-2 sm:gap-10">
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
          <div className="mx-auto mt-5 max-w-[760px] rounded-2xl border border-line bg-seal/40 px-6 py-7">
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
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

function Success({ outcome, name, design }: { outcome: EnhanceOutcome; name: string; design: string }) {
  const before = rarityOf(outcome.from);
  const after = rarityOf(outcome.to);
  const rarityUp = before !== after;

  return (
    <>
      <div className="text-sm font-semibold uppercase tracking-wide text-brand">Enhancement successful</div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-[38px]">Your Envelope just got stronger.</h1>
      <EnvelopeIllustration className="mx-auto mt-6 w-[260px] sm:w-[360px]" />
      <div className="mt-6 text-5xl font-semibold sm:text-[56px]">
        +{outcome.from} → +{outcome.to}
      </div>
      <div className="mt-6 text-2xl font-semibold text-brand">
        {rarityUp
          ? `${RARITY_LABEL[before].toUpperCase()} → ${RARITY_LABEL[after].toUpperCase()} · Rarity upgraded`
          : `${RARITY_LABEL[after].toUpperCase()} · Level upgraded`}
      </div>
      <div className="mt-5 text-xl">{name}</div>
      <p className="mt-5 text-[17px] text-ink-muted">One attempt used. A new chapter for your {design} Envelope.</p>
    </>
  );
}

function Failure({ outcome, name }: { outcome: EnhanceOutcome; name: string }) {
  return (
    <>
      <div className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Enhancement unsuccessful</div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-[42px]">Enhancement Failed</h1>
      <EnvelopeIllustration className="mx-auto mt-6 w-[260px] sm:w-[340px]" />
      <div className="mt-6 text-2xl sm:text-[28px]">
        {name} remains at +{outcome.from}.
      </div>
      <p className="mt-4 text-lg text-ink-muted">
        {RARITY_LABEL[rarityOf(outcome.from)].toUpperCase()} · Your level and rarity are unchanged.
      </p>
    </>
  );
}
