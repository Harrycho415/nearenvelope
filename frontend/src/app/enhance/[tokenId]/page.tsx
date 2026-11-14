"use client";

// 강화: 결과 쿼리(?result=…)가 있으면 성공/실패 화면, 없으면 강화 버튼이 있는 화면.
// 미션 화면의 Enhance Envelope 버튼은 강화를 실행한 뒤 결과 쿼리와 함께 이 화면으로 온다.
// 소유자: D

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL } from "@/components/envelope/designs";
import { useNear, type EnvelopeView } from "@/lib/near";

import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ConnectNotice,
  envelopeName,
  Notice,
  plural,
  RetryButton,
  type Keyed,
} from "../../envelopes/_components/shared";
import { parseOutcome, useEnhance } from "./_components/enhance";
import { ResultCard } from "./_components/ResultCard";

type Loaded = { envelope: EnvelopeView; table: number[] } | "missing" | "error";

export default function EnhancePage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const searchParams = useSearchParams();
  const outcome = parseOutcome(searchParams);
  const { accountId, ready, api } = useNear();
  const { enhance, busy, error } = useEnhance({ replace: true });

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Keyed<Loaded> | null>(null);

  // 결과가 바뀌면(다시 시도) 남은 기회를 다시 읽는다
  const key = `${accountId}:${tokenId}:${attempt}:${searchParams.toString()}`;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    Promise.all([api.envelopeInfo(tokenId), api.enhanceTable()])
      .then(([envelope, table]): Loaded => (envelope ? { envelope, table } : "missing"))
      .catch((): Loaded => "error")
      .then((value) => !cancelled && setResult({ key, value }));
    return () => {
      cancelled = true;
    };
  }, [key, accountId, tokenId, api]);

  const loaded = result?.key === key ? result.value : null;

  if (!ready || (accountId && loaded === null)) {
    return (
      <Frame>
        <div className="mx-auto h-[640px] max-w-[1020px] animate-pulse rounded-2xl border border-line bg-surface" />
      </Frame>
    );
  }
  if (!accountId) {
    return (
      <Frame>
        <ConnectNotice message="Connect your wallet to enhance this Envelope." />
      </Frame>
    );
  }
  if (loaded === "error" || loaded === null) {
    return (
      <Frame>
        <Notice>
          We couldn&apos;t load this Envelope. <RetryButton onClick={() => setAttempt((n) => n + 1)} />
        </Notice>
      </Frame>
    );
  }
  if (loaded === "missing") {
    return (
      <Frame>
        <Notice>
          Envelope #{tokenId} doesn&apos;t exist.{" "}
          <Link href="/missions" className="font-semibold text-brand hover:underline">
            Back to Missions
          </Link>
        </Notice>
      </Frame>
    );
  }

  const { envelope, table } = loaded;

  if (outcome) {
    return (
      <Frame>
        <ResultCard
          outcome={outcome}
          envelope={envelope}
          onTryAgain={() => enhance(envelope)}
          busy={busy}
          error={error}
        />
      </Frame>
    );
  }

  const isOwner = envelope.owner_id === accountId;
  const maxed = envelope.level >= table.length;
  const chance = maxed ? null : table[envelope.level] / 100;

  return (
    <Frame>
      <section className="mx-auto max-w-[1020px] rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-16">
        <div className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Enhance</div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-[38px]">
          {envelopeName(envelope)} #{envelope.token_id}
        </h1>
        <EnvelopeIllustration className="mx-auto mt-6 w-[260px] sm:w-[340px]" />
        <div className="mt-6 text-5xl font-semibold">+{envelope.level}</div>
        <div className="mt-4 text-xl font-semibold uppercase text-brand">{RARITY_LABEL[envelope.rarity]}</div>

        <div className="mx-auto mt-6 grid max-w-[760px] gap-4 rounded-2xl border border-line bg-seal/40 px-6 py-5 text-left text-[17px] sm:grid-cols-2 sm:gap-10">
          <div>
            <div>Success chance</div>
            <div className="mt-1 font-semibold">
              {chance === null ? "Highest level reached" : `${chance}% · +${envelope.level} → +${envelope.level + 1}`}
            </div>
          </div>
          <div>
            <div>Enhancement Attempts</div>
            <div className="mt-1 font-semibold">{plural(envelope.enhance_tickets, "attempt")} left</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Each try uses one attempt. If it fails, the level, assets and history stay the same.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {isOwner && !maxed && envelope.enhance_tickets > 0 ? (
            <button onClick={() => enhance(envelope)} disabled={busy} className={`${BUTTON_PRIMARY} disabled:opacity-60`}>
              {busy ? "Opening the seal…" : "Enhance Envelope"}
            </button>
          ) : (
            isOwner &&
            !maxed && (
              <Link href={`/missions?token=${envelope.token_id}`} className={BUTTON_PRIMARY}>
                Earn Attempts
              </Link>
            )
          )}
          <Link href={`/envelopes/${envelope.token_id}`} className={BUTTON_SECONDARY}>
            Back to Envelope
          </Link>
        </div>
        {!isOwner && <p className="mt-4 text-sm text-ink-muted">Only the current owner can enhance this Envelope.</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="pt-10 sm:pt-14">{children}</div>;
}
