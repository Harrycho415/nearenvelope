"use client";

// 보내기 2~4단계 + 완료. 단계는 이 페이지 안의 상태로 넘기고, 마지막에 api.sealAndSend 한 번으로 채우기와 전송을 끝낸다.
// 소유자: C

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SendSteps } from "@/components/ui/SendSteps";
import { useNear, type EnvelopeView, type VaultBalances } from "@/lib/near";

import { AssetsStep } from "./AssetsStep";
import { PreviewStep } from "./PreviewStep";
import { RecipientStep } from "./RecipientStep";
import { SentView } from "./SentView";
import { errorText, formatAssets, parseAmount, type AssetRow } from "./shared";

interface Loaded {
  envelope: EnvelopeView;
  /** Vault에 이미 들어 있는 자산 */
  inside: VaultBalances;
  wallet: VaultBalances;
  maxMessage: number;
}

interface Sent {
  envelope: EnvelopeView;
  from: string;
  to: string;
  totalText: string | null;
  txHash: string | null;
}

export default function SendFlowPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const router = useRouter();
  const { accountId, api, signIn, ready } = useNear();

  const [data, setData] = useState<Loaded | "missing" | null>(null);
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [rows, setRows] = useState<AssetRow[]>([{ key: 0, token: "USDC", amount: "" }]);
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    (async () => {
      const envelope = await api.envelopeInfo(tokenId);
      if (!envelope) return "missing" as const;
      const [inside, wallet, config] = await Promise.all([
        api.vaultBalances(envelope.vault_id),
        api.walletBalances(accountId),
        api.config(),
      ]);
      return { envelope, inside, wallet, maxMessage: config.message_max_len };
    })()
      .catch(() => "missing" as const)
      .then((loaded) => !cancelled && setData(loaded));

    return () => {
      cancelled = true;
    };
  }, [tokenId, accountId, api]);

  if (sent) {
    return (
      <div className="pt-14">
        <SentView {...sent} />
      </div>
    );
  }

  if (!accountId || data === null || data === "missing" || data.envelope.owner_id !== accountId) {
    return (
      <div className="pt-14">
        <SendSteps current={2} />
        <div className="mt-10 rounded-3xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted">
          {!accountId ? (
            <>
              Connect your wallet to continue.{" "}
              <button onClick={() => signIn()} disabled={!ready} className="font-semibold text-brand hover:underline">
                Connect Wallet
              </button>
            </>
          ) : data === null ? (
            "Loading envelope…"
          ) : data === "missing" ? (
            "We couldn't find this envelope."
          ) : (
            "You don't own this envelope, so you can't send it."
          )}
        </div>
      </div>
    );
  }

  const { envelope, inside, wallet, maxMessage } = data;

  const added = { near: BigInt(0), usdc: BigInt(0) };
  for (const row of rows) {
    const units = parseAmount(row) ?? BigInt(0);
    if (row.token === "NEAR") added.near += units;
    else added.usdc += units;
  }
  const total: VaultBalances = {
    near: (BigInt(inside.near) + added.near).toString(),
    usdc: (BigInt(inside.usdc) + added.usdc).toString(),
  };
  const totalText = formatAssets(total);
  const receiverId = receiver.trim().toLowerCase();

  const goTo = (next: 2 | 3 | 4) => {
    setError(null);
    setStep(next);
    window.scrollTo(0, 0);
  };

  async function sealAndSend() {
    setSending(true);
    setError(null);
    try {
      const txHash = await api.sealAndSend({
        tokenId,
        vaultId: envelope.vault_id,
        near: added.near.toString(),
        usdc: added.usdc.toString(),
        receiverId,
        message: message.trim() || undefined,
      });
      setSent({ envelope, from: accountId!, to: receiverId, totalText, txHash });
      window.scrollTo(0, 0);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-14">
      <SendSteps current={step} />

      {step === 2 && (
        <AssetsStep
          envelope={envelope}
          inside={inside}
          wallet={wallet}
          rows={rows}
          setRows={setRows}
          total={total}
          onBack={() => router.push("/send")}
          onContinue={() => goTo(3)}
        />
      )}
      {step === 3 && (
        <RecipientStep
          envelope={envelope}
          totalText={totalText}
          receiver={receiver}
          setReceiver={setReceiver}
          message={message}
          setMessage={setMessage}
          maxMessage={maxMessage}
          onBack={() => goTo(2)}
          onContinue={() => goTo(4)}
        />
      )}
      {step === 4 && (
        <PreviewStep
          envelope={envelope}
          receiverId={receiverId}
          message={message.trim()}
          totalText={totalText}
          sending={sending}
          error={error}
          onBack={() => goTo(3)}
          onSend={sealAndSend}
        />
      )}
    </div>
  );
}
