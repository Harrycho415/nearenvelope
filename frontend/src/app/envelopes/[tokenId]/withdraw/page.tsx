"use client";

// 봉투 자산 출금: 자산(USDC / NEAR)과 금액을 골라 연결된 지갑(= 현재 소유자)으로 claim_ft / claim_near.
// 완료되면 상세 화면 Assets 탭으로 돌아간다.
// 소유자: C

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useNear, type EnvelopeView, type VaultBalances } from "@/lib/near";

import { ConnectNotice, envelopeName, Notice, RetryButton, type Keyed } from "../../_components/shared";
import { EnvelopeSideCard } from "./_components/EnvelopeSideCard";
import { WithdrawForm, type Token } from "./_components/WithdrawForm";

type Loaded = { envelope: EnvelopeView; balances: VaultBalances } | "missing" | "error";

export default function WithdrawPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const router = useRouter();
  const { accountId, ready, api } = useNear();

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Keyed<Loaded> | null>(null);

  // 계정·토큰·재시도가 바뀌면 키가 바뀌고, 이전 키의 결과는 무시된다 (= 로딩 상태)
  const key = `${accountId}:${tokenId}:${attempt}`;
  const assetsHref = `/envelopes/${tokenId}?tab=assets`;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    (async (): Promise<Loaded> => {
      const envelope = await api.envelopeInfo(tokenId);
      if (!envelope) return "missing";
      return { envelope, balances: await api.vaultBalances(envelope.vault_id) };
    })()
      .catch(
        (e: unknown): Loaded => (String((e as Error)?.message).includes("ERR_TOKEN_NOT_FOUND") ? "missing" : "error"),
      )
      .then((value) => !cancelled && setResult({ key, value }));

    return () => {
      cancelled = true;
    };
  }, [key, accountId, tokenId, api]);

  const loaded = result?.key === key ? result.value : null;

  if (!ready || (accountId && loaded === null)) {
    return (
      <Frame tokenId={tokenId}>
        <div className="h-[520px] animate-pulse rounded-2xl border border-line bg-surface" aria-label="Loading" />
      </Frame>
    );
  }

  if (!accountId) {
    return (
      <Frame tokenId={tokenId}>
        <ConnectNotice message="Connect your wallet to withdraw from this envelope." />
      </Frame>
    );
  }

  if (loaded === "error") {
    return (
      <Frame tokenId={tokenId}>
        <Notice>
          We couldn&apos;t load this envelope. <RetryButton onClick={() => setAttempt((n) => n + 1)} />
        </Notice>
      </Frame>
    );
  }

  if (loaded === "missing" || loaded === null) {
    return (
      <Frame tokenId={tokenId}>
        <Notice>
          Envelope #{tokenId} doesn&apos;t exist.{" "}
          <Link href="/envelopes" className="font-semibold text-brand hover:underline">
            Back to My Envelopes
          </Link>
        </Notice>
      </Frame>
    );
  }

  const { envelope, balances } = loaded;
  const title = `${envelopeName(envelope)} #${envelope.token_id}`;

  if (envelope.owner_id !== accountId) {
    return (
      <Frame tokenId={tokenId} title={title}>
        <Notice>
          Only the current owner can withdraw from this envelope.{" "}
          <Link href={assetsHref} className="font-semibold text-brand hover:underline">
            Back to envelope
          </Link>
        </Notice>
      </Frame>
    );
  }

  async function withdraw(token: Token, units: string) {
    // receiver_id를 생략하면 컨트랙트가 소유자(= 연결된 지갑)에게 보낸다
    if (token === "NEAR") await api.claimNear(tokenId, units);
    else await api.claimFt(tokenId, units);
    router.push(assetsHref);
  }

  return (
    <Frame tokenId={tokenId} title={title}>
      <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">Withdraw assets</h1>
      <p className="mt-5 text-lg text-ink-muted sm:mt-9">Move assets to your wallet. Keep the envelope and its history.</p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_440px] lg:gap-10">
        <WithdrawForm
          balances={balances}
          accountId={accountId}
          cancelHref={assetsHref}
          onConfirm={withdraw}
        />
        <EnvelopeSideCard envelope={envelope} />
      </div>
    </Frame>
  );
}

/** 브레드크럼 (My Envelopes / 봉투 / Assets) + 본문 */
function Frame({ tokenId, title, children }: { tokenId: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="mb-6 truncate text-sm text-ink-muted sm:mb-10">
        <Link href="/envelopes" className="hover:text-ink">
          My Envelopes
        </Link>
        {title && (
          <>
            {" / "}
            <Link href={`/envelopes/${tokenId}`} className="hover:text-ink">
              {title}
            </Link>
            {" / "}
            <Link href={`/envelopes/${tokenId}?tab=assets`} className="hover:text-ink">
              Assets
            </Link>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}
