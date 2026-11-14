"use client";

// 받기 화면: 봉인된 봉투 → Open Envelope → 여는 중(잠깐) → 금액·메시지 공개.
// "열어 봄"은 이 브라우저에만 기록한다 (lib/opened.ts). 출금은 상세 화면에서 한다.
// 소유자: C

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { GiftBanner } from "@/components/ui/GiftBanner";
import { displayName, useNear, type EnvelopeView, type VaultBalances } from "@/lib/near";
import { isOpened, isReceivedBy, markOpened } from "@/lib/opened";

import {
  assetsText,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ConnectNotice,
  envelopeName,
  Notice,
} from "../../_components/shared";

/** 여는 중 연출 시간 */
const OPENING_MS = 2200;

type Phase = "sealed" | "opening" | "revealed";

interface Loaded {
  accountId: string;
  envelope: EnvelopeView | null;
  balances: VaultBalances | null;
  opened: boolean;
  loadedAt: number;
}

export default function OpenEnvelopePage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { accountId, ready, api } = useNear();
  const [data, setData] = useState<Loaded | null>(null);
  /** null이면 불러온 상태(이미 열어 봤는지)를 따른다 */
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    (async () => {
      const envelope = await api.envelopeInfo(tokenId).catch(() => null);
      const balances = envelope ? await api.vaultBalances(envelope.vault_id).catch(() => null) : null;
      if (cancelled) return;
      setData({
        accountId,
        envelope,
        balances,
        opened: envelope ? isOpened(envelope, accountId) : false,
        loadedAt: Date.now(),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenId, accountId, api]);

  if (!ready || (accountId && data?.accountId !== accountId)) {
    return <div className="mx-auto mt-14 h-[640px] max-w-[580px] animate-pulse rounded-3xl border border-line bg-surface" />;
  }

  if (!accountId) {
    return (
      <div className="pt-14">
        <ConnectNotice message="Connect your wallet to open your envelope." />
      </div>
    );
  }

  const { envelope, balances, opened, loadedAt } = data!;

  if (!envelope || !isReceivedBy(envelope, accountId)) {
    return (
      <div className="pt-14">
        <Notice>
          This envelope isn&apos;t waiting for you.{" "}
          <Link href={envelope ? `/envelopes/${tokenId}` : "/envelopes"} className="font-semibold text-brand hover:underline">
            {envelope ? "View envelope" : "Back to My Envelopes"}
          </Link>
        </Notice>
      </div>
    );
  }

  const last = envelope.history.at(-1)!;
  const travelled = envelope.history.length;
  const current = phase ?? (opened ? "revealed" : "sealed");

  if (current === "opening") return <Opening envelope={envelope} from={last.from} />;
  if (current === "revealed") {
    return (
      <Revealed
        envelope={envelope}
        from={last.from}
        message={last.message}
        contents={balances ? assetsText(balances) : null}
      />
    );
  }

  return (
    <div className="pt-14">
      <GiftBanner envelope={envelope} now={loadedAt} />

      <section className="mt-10 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-[42px]">You received an Envelope.</h1>
        <p className="mt-6 text-xl text-ink-muted">From: {last.from}</p>

        <div className="mx-auto mt-6 max-w-[580px] rounded-3xl border border-line bg-paper px-12 pb-12 pt-12">
          <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
          <h2 className="mt-6 text-3xl font-semibold">
            {envelopeName(envelope)} +{envelope.level}
          </h2>
          <div className={`mt-5 text-sm font-semibold uppercase tracking-wide ${RARITY_TEXT[envelope.rarity]}`}>
            {RARITY_LABEL[envelope.rarity]}
          </div>
        </div>

        <p className="mt-6 text-lg text-ink-muted">
          {travelled > 1
            ? `This envelope has already traveled through ${travelled} people.`
            : "This envelope begins its journey with you."}
        </p>
        <button
          onClick={() => {
            setPhase("opening");
            setTimeout(() => {
              markOpened(envelope, accountId);
              setPhase("revealed");
            }, OPENING_MS);
          }}
          className={`${BUTTON_PRIMARY} mt-5`}
        >
          Open Envelope
        </button>
        <p className="mt-6 text-[15px] text-ink-muted">
          {last.message ? "A message and a surprise are waiting inside." : "A surprise is waiting inside."}
        </p>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-14">
      <section className="mx-auto max-w-[1040px] rounded-3xl border border-line bg-surface px-6 py-14 text-center">
        {children}
      </section>
    </div>
  );
}

function Opening({ envelope, from }: { envelope: EnvelopeView; from: string }) {
  return (
    <Card>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">A moment just for you</p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-[42px]">Opening your Envelope…</h1>
      <p className="mt-6 text-lg text-ink-muted">From {from}</p>

      <div className="mx-auto mt-5 max-w-[360px] rounded-3xl border border-line bg-seal/40 px-6 py-7">
        <div className="text-[22px] font-medium">A note for you</div>
        <p className="mt-4 text-[15px] text-ink-muted">Your gift is about to be revealed.</p>
      </div>

      <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="mx-auto mt-4 w-full max-w-[440px] animate-pulse" />
      <div className="mt-6 text-xl font-medium">
        {envelopeName(envelope)} +{envelope.level} ·{" "}
        <span className={RARITY_TEXT[envelope.rarity]}>{RARITY_LABEL[envelope.rarity]}</span>
      </div>
      <div className="mt-5 flex items-center justify-center gap-3 text-[17px] text-ink-muted" role="status">
        Opening
        <span className="flex gap-1.5" aria-hidden>
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1.5 animate-bounce rounded-full bg-ink-muted"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
      <p className="mt-6 text-sm text-ink-muted">The amount and message stay hidden until the reveal.</p>
    </Card>
  );
}

function Revealed({
  envelope,
  from,
  message,
  contents,
}: {
  envelope: EnvelopeView;
  from: string;
  message: string | null;
  contents: string | null;
}) {
  return (
    <Card>
      <div className="transition duration-700 starting:translate-y-3 starting:opacity-0">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">
          From {displayName(from)}, with thanks
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-[40px]">A little something for you.</h1>
        {contents && <div className="mt-8 text-5xl font-bold tracking-tight sm:text-[64px]">{contents}</div>}

        <div className="mx-auto mt-8 max-w-[760px] space-y-4">
          {message && (
            <div className="rounded-3xl border border-line bg-paper px-6 py-9">
              <p className="whitespace-pre-wrap break-words text-[28px]">&ldquo;{message}&rdquo;</p>
              <p className="mt-5 text-[17px] text-ink-muted">— {from}</p>
            </div>
          )}

          <div className="flex items-center gap-7 rounded-3xl border border-line bg-seal/40 p-6 text-left">
            <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-32 shrink-0 sm:w-44" />
            <div className="min-w-0">
              <div className="text-[15px] text-ink-muted">You now own</div>
              <div className="mt-4 text-2xl font-semibold sm:text-[28px]">
                {envelopeName(envelope)} +{envelope.level}
              </div>
              <div className="mt-4 text-[17px] text-ink-muted">
                <span className={RARITY_TEXT[envelope.rarity]}>{RARITY_LABEL[envelope.rarity]}</span> · Its story continues with you.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link href={`/envelopes/${envelope.token_id}`} className={BUTTON_PRIMARY}>
            View Envelope
          </Link>
          <Link href="/" className={BUTTON_SECONDARY}>
            Keep It
          </Link>
        </div>
        <p className="mt-6 text-[15px] text-ink-muted">Keep it, enhance it, or pass it on when the moment feels right.</p>
      </div>
    </Card>
  );
}
