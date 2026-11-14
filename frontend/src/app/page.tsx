"use client";

// Home: 새 선물 배너, 히어로(편지글 + 우표 판), 최근 받은 봉투, 4단계 안내, 기능 소개.
// 소유자: C

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { ReceivedEnvelopeCard } from "@/components/envelope/ReceivedEnvelopeCard";
import { StampBoard } from "@/components/envelope/StampBoard";
import { GiftBanner } from "@/components/ui/GiftBanner";
import { InkTitle } from "@/components/ui/InkTitle";
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
    <div className="pt-8 sm:pt-10">
      {unopened.length > 0 && (
        <div className="mb-8">
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

/** 히어로 왼쪽 아래의 사실 표. 값은 타자기처럼 찍힌다 */
const FACTS = [
  ["Standard", "NEP-171 NFT"],
  ["Vault", "One sub-account per envelope"],
  ["Access keys", "None"],
  ["Holds", "NEAR and USDC"],
];

function Hero() {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-0">
      <div className="lg:border-r lg:border-line lg:py-6 lg:pr-14">
        <InkTitle
          text="Send more than money — send the envelope."
          className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem]"
        />
        <div className="stagger mt-8 max-w-[34rem]">
          <p className="text-lg text-ink-muted sm:text-xl">
            Every envelope is an NFT with its own NEAR account inside. Whoever holds the envelope controls
            what&apos;s in it — pass it on, and the money goes with it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/send" className="btn btn-primary">
              Send an Envelope ↗
            </Link>
            <Link href="/envelopes" className="btn btn-secondary">
              View My Envelopes
            </Link>
          </div>
          <dl className="ledger mt-12">
            {FACTS.map(([term, value], i) => (
              <div key={term} className="flex items-baseline justify-between gap-6">
                <dt className="label">{term}</dt>
                <dd className="typed text-right" style={{ "--n": value.length, "--i": i + 4 } as CSSProperties}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 italic text-ink-muted">The money stays the same. The meaning travels with it.</p>
        </div>
      </div>

      <div className="lg:py-6 lg:pl-14">
        <StampBoard />
      </div>
    </section>
  );
}

function RecentlyReceived({ items }: { items: ReceivedItem[] | null }) {
  const { accountId } = useNear();

  return (
    <section className="mt-24 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl">Recently received envelopes</h2>
        <Link href="/envelopes" className="link text-[15px]">
          View all →
        </Link>
      </div>

      <div className="pull mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!accountId ? (
          <EmptyCard>Connect your wallet to see envelopes sent to you.</EmptyCard>
        ) : items === null ? (
          Array.from({ length: RECENT_LIMIT }, (_, i) => (
            <div key={i} className="h-[138px] animate-pulse rounded-[3px] bg-seal" />
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

function EmptyCard({ children }: { children: ReactNode }) {
  return <div className="note p-6 text-[15px] text-ink-muted md:col-span-2 lg:col-span-3">{children}</div>;
}

const STEP_TEXT: Record<(typeof STEPS)[number], string> = {
  "Choose Envelope": "Pick one you own or create a new one. Each comes with its own vault account.",
  "Put Something Inside": "Fill it with NEAR or USDC. The assets live inside the envelope, not your wallet.",
  "Write a Message": "Add a note up to 280 characters. It stays in the envelope's history forever.",
  "Seal & Send": "Send it like any NFT. Control of everything inside moves with it.",
};

function Steps() {
  return (
    <section className="mt-28 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-0">
      <div className="lg:pr-14">
        <h2 className="text-4xl sm:text-5xl">A thoughtful gift in four steps</h2>
      </div>
      <ol className="ledger lg:pl-14">
        {STEPS.map((step, i) => (
          <li key={step} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-6!">
            <span className="pt-1.5 font-mono text-xs tracking-[0.1em] text-brand">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="text-2xl">{step}</h3>
              <p className="mt-2 max-w-[32rem] text-ink-muted">{STEP_TEXT[step]}</p>
            </div>
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
    tab: "",
  },
  {
    title: "Grows as it travels",
    text: "Missions reward the envelope itself — new owners, first-time NEAR users, NEAR events.",
    tab: "tab-rare",
  },
  {
    title: "Enhance to +10",
    text: "Spend attempts to level up. Rarity rises from Common to Legendary, and the art changes with it.",
    tab: "tab-epic",
  },
  {
    title: "A history that stays",
    text: "Every hand-off and message is recorded on-chain, so the envelope carries its whole story to the next owner.",
    tab: "tab-legendary",
  },
];

function Features() {
  return (
    <section className="mt-28">
      <h2 className="max-w-[20ch] text-4xl sm:text-5xl">Ownership with behavior, not just a picture</h2>

      <div className="mt-12 grid gap-x-14 gap-y-10 border-t border-line pt-10 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <article key={f.title} className={i % 2 ? "md:mt-16" : ""}>
            <span className={`tab pointer-events-none rounded-[3px] border-b ${f.tab}`}>
              No. {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-[28px]">{f.title}</h3>
            <p className="mt-3 max-w-[30rem] text-ink-muted">{f.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap gap-3 border-t border-dashed border-sketch pt-8">
        <Link href="/envelopes/new" className="btn btn-primary">
          Create an Envelope ↗
        </Link>
        <Link href="/missions" className="btn btn-secondary">
          See Missions
        </Link>
      </div>
    </section>
  );
}
