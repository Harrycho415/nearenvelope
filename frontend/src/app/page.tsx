"use client";

// Home: 히어로, 최근 받은 봉투, 4단계 안내.
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { ReceivedEnvelopeCard } from "@/components/envelope/ReceivedEnvelopeCard";
import { useNear, type EnvelopeView } from "@/lib/near";

const STEPS = ["Choose Envelope", "Put Something Inside", "Write a Message", "Seal & Send"];
const RECENT_LIMIT = 3;

interface ReceivedItem {
  envelope: EnvelopeView;
  opened: boolean;
}

export default function Home() {
  return (
    <div className="pt-14">
      <Hero />
      <RecentlyReceived />
      <Steps />
    </div>
  );
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

function RecentlyReceived() {
  const { accountId, api } = useNear();
  const [items, setItems] = useState<ReceivedItem[] | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    (async () => {
      const owned = await api.envelopesForOwner(accountId);
      const received = owned
        .filter((e) => e.history.at(-1)?.to === accountId)
        .sort((a, b) => b.history.at(-1)!.at_ms - a.history.at(-1)!.at_ms)
        .slice(0, RECENT_LIMIT);
      // "Opened" = Vault가 비어 있음 (받은 사람이 자산을 꺼냄). 온체인 opened 플래그는 아직 없다.
      const withState = await Promise.all(
        received.map(async (envelope) => {
          const { near, usdc } = await api.vaultBalances(envelope.vault_id);
          return { envelope, opened: BigInt(near) === BigInt(0) && BigInt(usdc) === BigInt(0) };
        }),
      );
      if (!cancelled) setItems(withState);
    })().catch(() => !cancelled && setItems([]));

    return () => {
      cancelled = true;
    };
  }, [accountId, api]);

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
