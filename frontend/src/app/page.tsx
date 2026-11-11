"use client";

// Home: 새 선물 배너, 히어로, 최근 받은 봉투, 4단계 안내.
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { ReceivedEnvelopeCard } from "@/components/envelope/ReceivedEnvelopeCard";
import { GiftBanner } from "@/components/ui/GiftBanner";
import { useNear, type EnvelopeView } from "@/lib/near";
import { isOpened, isReceivedBy } from "@/lib/opened";

const STEPS = ["Choose Envelope", "Put Something Inside", "Write a Message", "Seal & Send"];
const RECENT_LIMIT = 3;

interface ReceivedItem {
  envelope: EnvelopeView;
  opened: boolean;
}

interface Received {
  /** 최근 받은 순 */
  items: ReceivedItem[];
  /** 불러온 시각 (상대 시간 기준) */
  loadedAt: number;
}

export default function Home() {
  const received = useReceived();
  const unopened = received?.items.filter((i) => !i.opened) ?? [];

  return (
    <div className="pt-14">
      {unopened.length > 0 && (
        <div className="mb-10">
          <GiftBanner
            envelope={unopened[0].envelope}
            now={received!.loadedAt}
            more={unopened.length - 1}
            viewHref={`/envelopes/${unopened[0].envelope.token_id}/open`}
          />
        </div>
      )}
      <Hero />
      <RecentlyReceived items={received?.items.slice(0, RECENT_LIMIT) ?? null} />
      <Steps />
    </div>
  );
}

/** 지금 내가 가진 봉투 중 나에게 전달된 것. 지갑 미연결이면 null */
function useReceived() {
  const { accountId, api } = useNear();
  const [received, setReceived] = useState<(Received & { accountId: string }) | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    api
      .envelopesForOwner(accountId)
      .catch(() => [])
      .then((owned) => {
        if (cancelled) return;
        // "Opened" = 이 브라우저에서 받기 화면을 열어 봄 (lib/opened.ts). 온체인 opened 플래그는 없다.
        const items = owned
          .filter((e) => isReceivedBy(e, accountId))
          .sort((a, b) => b.history.at(-1)!.at_ms - a.history.at(-1)!.at_ms)
          .map((envelope) => ({ envelope, opened: isOpened(envelope, accountId) }));
        setReceived({ accountId, items, loadedAt: Date.now() });
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, api]);

  return received && received.accountId === accountId ? received : null;
}

function Hero() {
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1fr_500px]">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">A little more personal</p>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-[56px] sm:leading-[1.1]">
          Send more than money.
        </h1>
        <p className="mt-8 max-w-xl text-xl leading-relaxed text-ink-muted">
          Send crypto inside a digital envelope that carries history, rarity, and meaning.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <Link
            href="/send"
            className="rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-hover"
          >
            Send an Envelope
          </Link>
          <Link
            href="/envelopes"
            className="rounded-lg border border-line bg-surface px-6 py-3.5 font-semibold text-ink transition hover:border-sketch"
          >
            View My Envelopes
          </Link>
        </div>
        <p className="mt-6 text-[15px] text-ink-muted">The money stays the same. The meaning travels with it.</p>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-10">
        <EnvelopeIllustration className="w-full" />
        <p className="mt-8 text-xl">A gift with a story to tell.</p>
      </div>
    </section>
  );
}

function RecentlyReceived({ items }: { items: ReceivedItem[] | null }) {
  const { accountId } = useNear();

  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-4">
        <h2 className="text-2xl font-semibold">Recently received envelopes</h2>
        <Link href="/envelopes" className="text-[15px] font-medium text-brand hover:underline">
          View all →
        </Link>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!accountId ? (
          <EmptyCard>Connect your wallet to see envelopes sent to you.</EmptyCard>
        ) : items === null ? (
          Array.from({ length: RECENT_LIMIT }, (_, i) => (
            <div key={i} className="h-[138px] animate-pulse rounded-2xl border border-line bg-surface" />
          ))
        ) : items.length === 0 ? (
          <EmptyCard>No envelopes yet. When someone sends you one, it will show up here.</EmptyCard>
        ) : (
          items.map(({ envelope, opened }) => (
            <ReceivedEnvelopeCard key={envelope.token_id} envelope={envelope} opened={opened} />
          ))
        )}
      </div>
    </section>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted md:col-span-2 lg:col-span-3">
      {children}
    </div>
  );
}

function Steps() {
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface px-7 py-7">
      <h2 className="text-2xl font-semibold">A thoughtful gift in four steps</h2>
      <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step}>
            <div className="text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")}</div>
            <div className="mt-5 text-lg">{step}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
