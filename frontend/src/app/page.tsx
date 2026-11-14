"use client";

// Home: 새 선물 배너, 히어로(희귀도별 봉투), 최근 받은 봉투, 4단계 안내, 기능 소개.
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
      <Features />
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

/** 작은 라벨: "• Built on NEAR" */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-seal px-3.5 py-1.5 text-sm text-brand">
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      {children}
    </span>
  );
}

/** 희귀도별 봉투 부채꼴: 왼쪽 Rare, 가운데 Legendary, 오른쪽 Epic */
const FAN: { design: number; rarity: "Rare" | "Epic" | "Legendary"; className: string }[] = [
  { design: 2, rarity: "Rare", className: "-rotate-12 translate-y-6 sm:translate-x-10" },
  { design: 1, rarity: "Legendary", className: "z-10 scale-110" },
  { design: 0, rarity: "Epic", className: "rotate-12 translate-y-6 sm:-translate-x-10" },
];

function Hero() {
  return (
    <section className="relative overflow-x-clip pt-8 text-center sm:pt-14">
      <div
        className="pointer-events-none absolute left-1/2 top-[420px] -z-10 h-[360px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
        aria-hidden
      />
      <Eyebrow>NFTs that hold money · Built on NEAR</Eyebrow>
      <h1 className="mx-auto mt-7 max-w-[880px] text-5xl font-semibold leading-[1.05] sm:text-[72px]">
        Send more than money — send the envelope.
      </h1>
      <p className="mx-auto mt-7 max-w-[620px] text-lg leading-relaxed text-ink-muted sm:text-xl">
        Every envelope is an NFT with its own NEAR account inside. Whoever holds the envelope controls what&apos;s in
        it — pass it on, and the money goes with it.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/send"
          className="rounded-full bg-brand shadow-[0_0_32px_-8px_var(--color-brand)] px-6 py-3.5 font-semibold text-on-brand transition hover:bg-brand-hover"
        >
          Send an Envelope ↗
        </Link>
        <Link
          href="/envelopes"
          className="rounded-full border border-line bg-surface px-6 py-3.5 font-semibold text-ink transition hover:border-sketch"
        >
          View My Envelopes
        </Link>
      </div>

      <div className="mx-auto mt-14 flex max-w-[960px] items-center justify-center gap-2 sm:mt-16 sm:gap-0">
        {FAN.map(({ design, rarity, className }) => (
          <div key={rarity} className={`w-1/3 max-w-[320px] transition ${className}`}>
            <EnvelopeIllustration design={design} rarity={rarity} className="w-full" />
          </div>
        ))}
      </div>
      <p className="mt-10 text-[15px] text-ink-muted">The money stays the same. The meaning travels with it.</p>
    </section>
  );
}

function RecentlyReceived({ items }: { items: ReceivedItem[] | null }) {
  const { accountId } = useNear();

  return (
    <section className="mt-20">
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
            <div key={i} className="h-[138px] animate-pulse rounded-3xl border border-line bg-surface" />
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
    <div className="rounded-3xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted md:col-span-2 lg:col-span-3">
      {children}
    </div>
  );
}

const STEP_TEXT: Record<(typeof STEPS)[number], string> = {
  "Choose Envelope": "Pick one you own or create a new one. Each comes with its own vault account.",
  "Put Something Inside": "Fill it with NEAR or USDC. The assets live inside the envelope, not your wallet.",
  "Write a Message": "Add a note up to 280 characters. It stays in the envelope's history forever.",
  "Seal & Send": "Send it like any NFT. Control of everything inside moves with it.",
};

function Steps() {
  return (
    <section className="mt-24 text-center">
      <Eyebrow>How it works</Eyebrow>
      <h2 className="mt-6 text-4xl font-semibold sm:text-5xl">A thoughtful gift in four steps</h2>
      <ol className="mt-10 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step} className="rounded-3xl border border-line bg-surface p-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-seal px-3 py-1 text-sm text-brand">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              Step {i + 1}
            </span>
            <div className="mt-6 text-xl font-semibold">{step}</div>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{STEP_TEXT[step]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FEATURES = [
  {
    title: "An account inside every NFT",
    text: "Each envelope gets its own NEAR sub-account with no access keys. Only the envelope contract can move its funds, and only for the current owner.",
    wide: true,
  },
  {
    title: "Grows as it travels",
    text: "Missions reward the envelope itself — new owners, first-time NEAR users, NEAR events.",
    wide: false,
  },
  {
    title: "Enhance to +10",
    text: "Spend attempts to level up. Rarity rises from Common to Legendary, and the art changes with it.",
    wide: false,
  },
  {
    title: "A history that stays",
    text: "Every hand-off and message is recorded on-chain, so the envelope carries its whole story to the next owner.",
    wide: true,
  },
];

function Features() {
  return (
    <section className="mt-24 text-center">
      <Eyebrow>Why NEAR Envelope</Eyebrow>
      <h2 className="mx-auto mt-6 max-w-[760px] text-4xl font-semibold sm:text-5xl">
        Ownership with behavior, not just a picture
      </h2>
      <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`rounded-3xl border border-line bg-surface p-7 ${f.wide ? "md:col-span-2" : ""}`}
          >
            <div className="text-2xl font-semibold">{f.title}</div>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-ink-muted">{f.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/envelopes/new"
          className="rounded-full bg-brand shadow-[0_0_32px_-8px_var(--color-brand)] px-6 py-3.5 font-semibold text-on-brand transition hover:bg-brand-hover"
        >
          Create an Envelope ↗
        </Link>
        <Link
          href="/missions"
          className="rounded-full border border-line bg-surface px-6 py-3.5 font-semibold text-ink transition hover:border-sketch"
        >
          See Missions
        </Link>
      </div>
    </section>
  );
}
