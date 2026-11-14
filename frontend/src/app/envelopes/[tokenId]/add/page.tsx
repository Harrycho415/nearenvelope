"use client";

// 봉투 채우기: 자산(USDC / NEAR)과 금액을 골라 연결된 지갑에서 봉투(Vault)로 넣는다 (fill / ft_transfer_call).
// 화면에서는 현재 소유자만 채울 수 있다 (컨트랙트상으로는 누구나 가능). 완료되면 Assets 탭으로 돌아간다.
// 소유자: C

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useNear, type EnvelopeView, type VaultBalances } from "@/lib/near";

import { ConnectNotice, envelopeName, Notice, RetryButton, type Keyed } from "../../_components/shared";
import { EnvelopeSideCard } from "../withdraw/_components/EnvelopeSideCard";
import { AddForm, type Token } from "./_components/AddForm";

type Loaded = { envelope: EnvelopeView; inside: VaultBalances; wallet: VaultBalances } | "missing" | "error";

export default function AddAssetsPage() {
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
      const [inside, wallet] = await Promise.all([api.vaultBalances(envelope.vault_id), api.walletBalances(accountId)]);
      return { envelope, inside, wallet };
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
        <div className="h-[520px] animate-pulse rounded-3xl border border-line bg-surface" aria-label="Loading" />
      </Frame>
    );
  }

  if (!accountId) {
    return (
      <Frame tokenId={tokenId}>
        <ConnectNotice message="Connect your wallet to add assets to this envelope." />
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

  const { envelope, inside, wallet } = loaded;

  // 현재 소유자만 채울 수 있다. 보낸 사람이 전송 후 다시 자산을 넣는 일을 막는다 (컨트랙트 fill은 여전히 누구나 가능).
  if (envelope.owner_id !== accountId) {
    return (
      <Frame tokenId={tokenId}>
        <Notice>
          Only the current owner can add assets to this envelope.{" "}
          <Link href="/envelopes" className="font-semibold text-brand hover:underline">
            Back to My Envelopes
          </Link>
        </Notice>
      </Frame>
    );
  }

  const title = `${envelopeName(envelope)} #${envelope.token_id}`;

  async function add(token: Token, units: string) {
    await api.addAssets({
      tokenId,
      vaultId: envelope.vault_id,
      near: token === "NEAR" ? units : "0",
      usdc: token === "USDC" ? units : "0",
    });
    router.push(assetsHref);
  }

  return (
    <Frame tokenId={tokenId} title={title}>
      <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">Add assets</h1>
      <p className="mt-5 text-lg text-ink-muted sm:mt-9">
        Put NEAR or USDC inside. It stays with the envelope until its owner withdraws it.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_440px] lg:gap-10">
        <AddForm inside={inside} wallet={wallet} accountId={accountId} cancelHref={assetsHref} onConfirm={add} />
        <EnvelopeSideCard
          envelope={envelope}
          note="Assets you add move with the envelope. Whoever owns it can withdraw them."
        />
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
