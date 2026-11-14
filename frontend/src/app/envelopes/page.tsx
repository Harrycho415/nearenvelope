"use client";

// My Envelopes: 내가 소유한 봉투 목록. 새 봉투는 Create Envelope(/envelopes/new)에서 만들고 보내기는 나중에 해도 된다.
// 보유 봉투(Owned)를 받은 것(Received: 전달 기록 있음)과 직접 만든 것(Created: 민트 후 전달된 적 없음)으로 나눈다.
// 둘은 겹치지 않으므로 Owned = Received + Created. 보낸 봉투(Sent)는 조회 API가 없어 표시하지 않는다.
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import { useNear, type EnvelopeView } from "@/lib/near";
import { isOpened, isReceivedBy } from "@/lib/opened";

import { EnvelopeListCard } from "./_components/EnvelopeListCard";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ConnectNotice,
  Notice,
  RetryButton,
  type BalancesResult,
  type Keyed,
} from "./_components/shared";

type Filter = "owned" | "received" | "created";

const FILTERS: { id: Filter; label: string; match: (e: EnvelopeView) => boolean }[] = [
  { id: "owned", label: "Owned", match: () => true },
  { id: "received", label: "Received", match: (e) => e.history.length > 0 },
  { id: "created", label: "Created", match: (e) => e.history.length === 0 },
];

const EMPTY_TEXT: Record<Filter, string> = {
  owned: "You don't have any envelopes yet.",
  received: "No envelopes received yet. When someone sends you one, it will show up here.",
  created: "No envelopes created by you are waiting here.",
};

/** 최근 활동(마지막 전달, 없으면 생성) 순 */
const lastActivity = (e: EnvelopeView) => e.history.at(-1)?.at_ms ?? e.created_at_ms;

export default function MyEnvelopesPage() {
  const { accountId, ready, api } = useNear();

  const [attempt, setAttempt] = useState(0);
  const [listResult, setListResult] = useState<Keyed<EnvelopeView[] | "error"> | null>(null);
  const [balancesResult, setBalancesResult] = useState<Keyed<Record<string, BalancesResult>> | null>(null);
  const [filter, setFilter] = useState<Filter>("owned");

  const key = `${accountId}:${attempt}`;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    api.envelopesForOwner(accountId).then(
      (owned) => {
        if (cancelled) return;
        setListResult({ key, value: [...owned].sort((a, b) => lastActivity(b) - lastActivity(a)) });

        for (const { vault_id } of owned) {
          api
            .vaultBalances(vault_id)
            .then(
              (balances): BalancesResult => balances,
              (): BalancesResult => "error",
            )
            .then((balances) => {
              if (cancelled) return;
              setBalancesResult((prev) => ({
                key,
                value: { ...(prev?.key === key ? prev.value : {}), [vault_id]: balances },
              }));
            });
        }
      },
      () => !cancelled && setListResult({ key, value: "error" }),
    );

    return () => {
      cancelled = true;
    };
  }, [key, accountId, api]);

  const envelopes = listResult?.key === key ? listResult.value : null;
  const balances = balancesResult?.key === key ? balancesResult.value : {};
  const loaded = Array.isArray(envelopes) ? envelopes : [];
  const active = FILTERS.find((f) => f.id === filter)!;
  const visible = loaded.filter(active.match);

  return (
    <div className="pt-10 sm:pt-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">My Envelopes</h1>
          <p className="mt-5 text-lg text-ink-muted">Gifts you own. Stories you are part of.</p>
        </div>
        <div className="flex flex-wrap gap-3 self-start sm:mr-16 sm:mt-4">
          <Link href="/envelopes/new" className={BUTTON_SECONDARY}>
            Create Envelope
          </Link>
          <Link href="/send" className={BUTTON_PRIMARY}>
            Send an Envelope
          </Link>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter envelopes"
        className="mt-9 flex gap-6 overflow-x-auto rounded-3xl border border-line bg-surface px-5 py-5 sm:gap-10"
      >
        {FILTERS.map(({ id, label, match }) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`shrink-0 whitespace-nowrap text-[17px] transition ${
              filter === id ? "font-semibold text-brand" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
            <span className="ml-2">{envelopes === null || envelopes === "error" ? "–" : loaded.filter(match).length}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!ready || (accountId && envelopes === null) ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[496px] animate-pulse rounded-3xl border border-line bg-surface" />
          ))
        ) : !accountId ? (
          <Wide>
            <ConnectNotice message="Connect your wallet to see your envelopes." />
          </Wide>
        ) : envelopes === "error" ? (
          <Wide>
            <Notice>
              We couldn&apos;t load your envelopes. <RetryButton onClick={() => setAttempt((n) => n + 1)} />
            </Notice>
          </Wide>
        ) : visible.length === 0 ? (
          <Wide>
            <Notice>
              {EMPTY_TEXT[filter]}{" "}
              {filter !== "received" && (
                <Link href="/envelopes/new" className="font-semibold text-brand hover:underline">
                  Create an envelope
                </Link>
              )}
            </Notice>
          </Wide>
        ) : (
          visible.map((envelope) => (
            <EnvelopeListCard
              key={envelope.token_id}
              envelope={envelope}
              balances={balances[envelope.vault_id] ?? null}
              unopened={isReceivedBy(envelope, accountId) && !isOpened(envelope, accountId)}
            />
          ))
        )}
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-seal/40 p-6">
        <h2 className="text-[22px] font-semibold">Every envelope is yours to keep or pass on.</h2>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
          Sending an envelope transfers ownership and control of the assets still inside. Received and Created show
          how each envelope you own came to you.
        </p>
      </section>
    </div>
  );
}

function Wide({ children }: { children: React.ReactNode }) {
  return <div className="md:col-span-2 lg:col-span-3">{children}</div>;
}
