"use client";

// Wallet: 연결된 계정, 지갑 잔액(NEAR / Mock USDC), 테스트 자금 받기.
// 프로필·알림 설정은 저장할 곳(백엔드·컨트랙트 상태)이 없어 두지 않는다. 연결 해제는 헤더 메뉴와 같은 동작.
// 소유자: C

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  EXPLORER_URL,
  FAUCET_MAX_USDC,
  NEAR_FAUCET_URL,
  NETWORK,
  unitsToUsdc,
  usdcToUnits,
  useNear,
  yoctoToNear,
  type VaultBalances,
} from "@/lib/near";

import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ConnectNotice,
  Notice,
  RetryButton,
  type Keyed,
} from "../envelopes/_components/shared";

const ERROR_TEXT: Record<string, string> = {
  ERR_FAUCET_LIMIT: `You can get up to ${FAUCET_MAX_USDC} test USDC at a time.`,
};

function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

export default function WalletPage() {
  const { accountId, ready, api, signOut } = useNear();

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Keyed<VaultBalances | "error"> | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const key = `${accountId}:${attempt}`;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    api
      .walletBalances(accountId)
      .then(
        (b): VaultBalances | "error" => b,
        (): VaultBalances | "error" => "error",
      )
      .then((value) => !cancelled && setResult({ key, value }));
    return () => {
      cancelled = true;
    };
  }, [key, accountId, api]);

  const balances = result?.key === key ? result.value : null;

  async function getTestUsdc() {
    setClaiming(true);
    setNotice(null);
    try {
      await api.faucet(usdcToUnits(FAUCET_MAX_USDC));
      setNotice({ ok: true, text: `${FAUCET_MAX_USDC} test USDC added to your wallet.` });
      setAttempt((n) => n + 1);
    } catch (e) {
      setNotice({ ok: false, text: errorText(e) });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">Wallet</h1>
      <p className="mt-5 text-lg text-ink-muted">Your connected account and the test funds you need to try NEAR Envelope.</p>

      <div className="mt-9">
        {!ready || (accountId && balances === null) ? (
          <div className="h-[420px] animate-pulse rounded-3xl border border-line bg-surface" aria-label="Loading" />
        ) : !accountId ? (
          <ConnectNotice message="Connect your wallet to see your balances and get test funds." />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
              <h2 className="text-2xl font-semibold">Wallet</h2>
              <div className="mt-5 text-[17px]">
                Connected as{" "}
                <a
                  href={`${EXPLORER_URL}/address/${accountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-medium hover:text-brand"
                >
                  {accountId}
                </a>
              </div>
              <div className="mt-1 text-sm text-ink-muted">NEAR {NETWORK === "mainnet" ? "Mainnet" : "Testnet"}</div>

              <div className="mt-6 text-sm text-ink-muted">Available in your wallet</div>
              {balances === "error" || balances === null ? (
                <div className="mt-3">
                  <Notice>
                    We couldn&apos;t load your balances. <RetryButton onClick={() => setAttempt((n) => n + 1)} />
                  </Notice>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-4 rounded-3xl border border-line bg-seal/40 px-6 py-5">
                  <div>
                    <div className="text-sm text-ink-muted">USDC</div>
                    <div className="mt-3 text-3xl font-semibold">{unitsToUsdc(balances.usdc)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-ink-muted">NEAR</div>
                    <div className="mt-3 text-3xl font-semibold">{yoctoToNear(balances.near, 2)}</div>
                  </div>
                </div>
              )}
              <p className="mt-4 text-[15px] text-ink-muted">
                Assets inside envelopes are separate from this wallet balance. NEAR shown here leaves a small amount
                for network fees.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/send" className={BUTTON_PRIMARY}>
                  Send an Envelope
                </Link>
                <button onClick={() => signOut()} className={BUTTON_SECONDARY}>
                  Disconnect Wallet
                </button>
              </div>
            </section>

            <div className="flex flex-col gap-6">
              {NETWORK === "testnet" && (
                <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
                  <h2 className="text-2xl font-semibold">Test funds</h2>
                  <p className="mt-3 text-[15px] text-ink-muted">
                    NEAR Envelope runs on testnet. These funds have no real value and are only for trying the app.
                  </p>

                  <div className="mt-5 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                      <div>
                        <div className="font-semibold">Test USDC</div>
                        <div className="text-sm text-ink-muted">Up to {FAUCET_MAX_USDC} USDC each time</div>
                      </div>
                      <button
                        onClick={getTestUsdc}
                        disabled={claiming}
                        className={`${BUTTON_PRIMARY} disabled:opacity-60`}
                      >
                        {claiming ? "Getting USDC…" : "Get test USDC"}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                      <div>
                        <div className="font-semibold">Test NEAR</div>
                        <div className="text-sm text-ink-muted">Pays network fees and fills envelopes</div>
                      </div>
                      <a href={NEAR_FAUCET_URL} target="_blank" rel="noreferrer" className={BUTTON_SECONDARY}>
                        Get test NEAR ↗
                      </a>
                    </div>
                  </div>
                  {notice && (
                    <p role="status" className={`mt-4 text-sm ${notice.ok ? "text-brand" : "text-red-400"}`}>
                      {notice.text}
                    </p>
                  )}
                </section>
              )}

              <section className="rounded-3xl border border-line bg-paper p-6 sm:p-7">
                <h2 className="text-[22px] font-semibold">New to NEAR?</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  Your wallet approves every action and keeps you in control. A small NEAR balance pays network fees,
                  and your wallet shows them before you confirm.
                </p>
                <a
                  href="https://docs.near.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-[15px] font-medium text-brand hover:underline"
                >
                  Learn about NEAR ↗
                </a>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
