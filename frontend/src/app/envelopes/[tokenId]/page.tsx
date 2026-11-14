"use client";

// 봉투 상세: 개요, 자산(Vault 잔액), 전달 기록 타임라인. 강화는 /enhance/[tokenId], 보내기는 /send/[tokenId],
// 출금은 /envelopes/[tokenId]/withdraw. `?tab=assets|history`로 처음 열 탭을 고를 수 있다.
// 채우기(fill)는 아직 연결하지 않았다.
// 소유자: C

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useNear, type EnvelopeView } from "@/lib/near";

import {
  ConnectNotice,
  envelopeName,
  Notice,
  RetryButton,
  type BalancesResult,
  type Keyed,
} from "../_components/shared";
import { AssetsTab } from "./_components/AssetsTab";
import { DetailTabs, parseTab, tabPanelId, type Tab } from "./_components/DetailTabs";
import { EnvelopeHero } from "./_components/EnvelopeHero";
import { HistoryTab } from "./_components/HistoryTab";
import { OverviewTab } from "./_components/OverviewTab";

type EnvelopeResult = EnvelopeView | "missing" | "error";

export default function EnvelopeDetailPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const searchParams = useSearchParams();
  const { accountId, ready, api } = useNear();

  const [attempt, setAttempt] = useState(0);
  const [envelopeResult, setEnvelopeResult] = useState<Keyed<EnvelopeResult> | null>(null);
  const [balancesResult, setBalancesResult] = useState<Keyed<BalancesResult> | null>(null);
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get("tab")));

  // 계정·토큰·재시도가 바뀌면 키가 바뀌고, 이전 키의 결과는 무시된다 (= 로딩 상태)
  const key = `${accountId}:${tokenId}:${attempt}`;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    api
      .envelopeInfo(tokenId)
      .then(
        (envelope): EnvelopeResult => envelope ?? "missing",
        (e: unknown): EnvelopeResult =>
          String((e as Error)?.message).includes("ERR_TOKEN_NOT_FOUND") ? "missing" : "error",
      )
      .then((result) => {
        if (cancelled) return;
        setEnvelopeResult({ key, value: result });
        if (typeof result === "string") return;

        api
          .vaultBalances(result.vault_id)
          .then(
            (balances): BalancesResult => balances,
            (): BalancesResult => "error",
          )
          .then((balances) => !cancelled && setBalancesResult({ key, value: balances }));
      });

    return () => {
      cancelled = true;
    };
  }, [key, accountId, tokenId, api]);

  const retry = () => setAttempt((n) => n + 1);
  const envelope = envelopeResult?.key === key ? envelopeResult.value : null;
  const balances = balancesResult?.key === key ? balancesResult.value : null;

  if (!ready || (accountId && envelope === null)) {
    return (
      <Frame>
        <div className="h-[236px] animate-pulse rounded-3xl border border-line bg-surface" aria-label="Loading" />
        <div className="mt-8 h-[420px] animate-pulse rounded-3xl border border-line bg-surface" />
      </Frame>
    );
  }

  if (!accountId) {
    return (
      <Frame>
        <ConnectNotice message="Connect your wallet to view this envelope." />
      </Frame>
    );
  }

  if (envelope === "error") {
    return (
      <Frame>
        <Notice>
          We couldn&apos;t load this envelope. <RetryButton onClick={retry} />
        </Notice>
      </Frame>
    );
  }

  if (envelope === "missing" || envelope === null) {
    return (
      <Frame>
        <Notice>
          Envelope #{tokenId} doesn&apos;t exist.{" "}
          <Link href="/envelopes" className="font-semibold text-brand hover:underline">
            Back to My Envelopes
          </Link>
        </Notice>
      </Frame>
    );
  }

  const isOwner = envelope.owner_id === accountId;

  return (
    <Frame title={`${envelopeName(envelope)} #${envelope.token_id}`}>
      <EnvelopeHero envelope={envelope} isOwner={isOwner} />
      <DetailTabs tokenId={envelope.token_id} current={tab} onChange={setTab} />

      <div role="tabpanel" id={tabPanelId(tab)}>
        {tab === "overview" && (
          <OverviewTab envelope={envelope} isOwner={isOwner} onViewAssets={() => setTab("assets")} />
        )}
        {tab === "assets" && (
          <AssetsTab tokenId={envelope.token_id} balances={balances} isOwner={isOwner} onRetry={retry} />
        )}
        {tab === "history" && <HistoryTab envelope={envelope} />}
      </div>
    </Frame>
  );
}

/** 브레드크럼 + 본문 */
function Frame({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="mb-5 truncate text-sm text-ink-muted sm:mb-7">
        <Link href="/envelopes" className="hover:text-ink">
          My Envelopes
        </Link>
        {title && <span aria-current="page"> / {title}</span>}
      </nav>
      {children}
    </div>
  );
}
