"use client";

// 보내기 3단계: 수신자 + 메시지
// 소유자: C

import { useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { displayName, isValidAccountId, NETWORK, useNear, type EnvelopeView } from "@/lib/near";

import { envelopeTitle, StepHeader } from "./shared";

type Status = "empty" | "invalid" | "self" | "checking" | "found" | "missing";

export function RecipientStep({
  envelope,
  totalText,
  receiver,
  setReceiver,
  message,
  setMessage,
  maxMessage,
  onBack,
  onContinue,
}: {
  envelope: EnvelopeView;
  totalText: string | null;
  receiver: string;
  setReceiver: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  maxMessage: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { accountId, api } = useNear();
  const id = receiver.trim().toLowerCase();
  const localStatus: Status | null = !id
    ? "empty"
    : id === accountId
      ? "self"
      : !isValidAccountId(id)
        ? "invalid"
        : null;

  // 입력이 멈추면 계정 존재 여부를 확인한다. 결과는 어떤 id에 대한 것인지 함께 저장해 늦게 온 응답을 무시한다.
  const [lookup, setLookup] = useState<{ id: string; exists: boolean } | null>(null);
  useEffect(() => {
    if (localStatus) return;
    const timer = setTimeout(() => {
      api
        .accountExists(id)
        .catch(() => false)
        .then((exists) => setLookup({ id, exists }));
    }, 400);
    return () => clearTimeout(timer);
  }, [id, localStatus, api]);

  const status: Status = localStatus ?? (lookup?.id === id ? (lookup.exists ? "found" : "missing") : "checking");
  const messageLength = [...message].length;
  const canContinue = status === "found" && messageLength <= maxMessage;

  return (
    <>
      <StepHeader title="Who is this for?" subtitle="A few thoughtful words make the gift yours." />

      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[1fr_400px]">
        <div className="sheet p-8">
          <label htmlFor="recipient" className="text-[15px] font-medium">
            Recipient NEAR account / wallet
          </label>
          <input
            id="recipient"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder={NETWORK === "mainnet" ? "alice.near" : "alice.testnet"}
            autoComplete="off"
            spellCheck={false}
            className="mt-4 w-full field px-5 py-4 text-lg"
          />
          <RecipientStatus status={status} id={id} />
          <p className="mt-4 text-sm text-ink-muted">Check the recipient carefully. Sent envelopes cannot be recalled.</p>

          <label htmlFor="message" className="mt-5 block text-[15px] font-medium">
            Personal message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Thanks for everything this year."
            className="mt-4 w-full resize-none field px-5 py-4 text-lg"
          />
          <p className={`mt-4 text-sm ${messageLength > maxMessage ? "text-danger" : "text-ink-muted"}`}>
            {messageLength} / {maxMessage} characters
          </p>

          <div className="mt-4 flex gap-4">
            <button
              onClick={onBack}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="btn btn-primary"
            >
              Preview Envelope
            </button>
          </div>
        </div>

        <div className="sheet bg-paper p-7">
          <Tilt sheen={sheenForLevel(envelope.level)} className="rise">
            <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
          </Tilt>
          <h2 className="mt-6 text-2xl font-semibold">{envelopeTitle(envelope)}</h2>
          <div className={`mt-4 label ${RARITY_TEXT[envelope.rarity]}`}>
            {RARITY_LABEL[envelope.rarity]}
          </div>
          <div className="mt-6 text-xl">Inside: {totalText ?? "Nothing"}</div>
          <p className="mt-5 text-[15px] text-ink-muted">
            {envelope.history.length > 0
              ? "Its existing history travels with your gift."
              : "Its story begins with your gift."}
          </p>
        </div>
      </div>
    </>
  );
}

function RecipientStatus({ status, id }: { status: Status; id: string }) {
  const [text, tone] = {
    empty: [null, ""],
    checking: ["Checking account…", "text-ink-muted"],
    found: [`Account found · ${displayName(id)}`, "text-ok"],
    missing: [`No account named ${id} on ${NETWORK}.`, "text-danger"],
    invalid: ["Enter a valid NEAR account, like alice.testnet.", "text-danger"],
    self: ["You already own this envelope. Choose someone else.", "text-danger"],
  }[status];

  return <p className={`mt-4 min-h-5 text-sm ${tone}`}>{text}</p>;
}
