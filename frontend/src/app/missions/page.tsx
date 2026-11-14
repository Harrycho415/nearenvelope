"use client";

// 미션: 봉투를 골라 그 봉투의 미션 진행·체크인·니어 행사 코드를 보여 준다.
// 미션은 봉투 단위로 판정되고 보상(강화 기회 = enhance_tickets)은 자동으로 그 봉투에 쌓인다. 수령(claim) 단계는 없다.
// `?token=<id>`로 처음 고를 봉투를 지정할 수 있다.
// 소유자: D

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL } from "@/components/envelope/designs";
import { useNear, type EnvelopeView, type NearEventView } from "@/lib/near";

import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ConnectNotice,
  envelopeName,
  Notice,
  RetryButton,
} from "../envelopes/_components/shared";
import { useEnhance } from "../enhance/[tokenId]/_components/enhance";
import { CheckInCard } from "./_components/CheckInCard";
import { EventCard } from "./_components/EventCard";
import { MissionCard } from "./_components/MissionCard";
import { attemptsText, MISSION_GROUPS } from "./_components/missions";

interface Loaded {
  envelopes: EnvelopeView[];
  cooldownMs: number;
  events: (NearEventView & { redeemed: boolean })[];
}

export default function MissionsPage() {
  return (
    <Suspense>
      <Missions />
    </Suspense>
  );
}

function Missions() {
  const { accountId, ready, api } = useNear();
  const initialToken = useSearchParams().get("token");

  const [data, setData] = useState<{ account: string; value: Loaded | "error" } | null>(null);
  const [picked, setPicked] = useState<string | null>(initialToken);

  const load = useCallback(
    async (account: string) => {
      try {
        const [envelopes, config, events] = await Promise.all([
          api.envelopesForOwner(account),
          api.config(),
          api.nearEvents(),
        ]);
        const redeemed = await Promise.all(events.map((e) => api.nearEventRedeemed(e.event_id, account)));
        return {
          envelopes: [...envelopes].sort((a, b) => Number(b.token_id) - Number(a.token_id)),
          cooldownMs: config.check_in_cooldown_ms,
          events: events.map((e, i) => ({ ...e, redeemed: redeemed[i] })),
        };
      } catch {
        return "error" as const;
      }
    },
    [api],
  );

  const refresh = useCallback(() => {
    if (!accountId) return;
    load(accountId).then((value) => setData({ account: accountId, value }));
  }, [accountId, load]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    load(accountId).then((value) => !cancelled && setData({ account: accountId, value }));
    return () => {
      cancelled = true;
    };
  }, [accountId, load]);

  const loaded = data?.account === accountId ? data.value : null;

  return (
    <div className="pt-10 sm:pt-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">Missions</h1>
          <p className="mt-5 text-lg text-ink-muted">Complete missions to help your Envelopes grow.</p>
        </div>
        <Link href="/send" className={`${BUTTON_PRIMARY} self-start sm:mt-4`}>
          Send an Envelope
        </Link>
      </div>

      <div className="mt-10">
        {!ready || (accountId && loaded === null) ? (
          <div className="h-[420px] animate-pulse rounded-2xl border border-line bg-surface" aria-label="Loading" />
        ) : !accountId ? (
          <ConnectNotice message="Connect your wallet to see your Envelopes' missions." />
        ) : loaded === "error" || loaded === null ? (
          <Notice>
            We couldn&apos;t load your missions. <RetryButton onClick={refresh} />
          </Notice>
        ) : loaded.envelopes.length === 0 ? (
          <Notice>
            You don&apos;t have any Envelopes yet. Missions start the moment you create one.{" "}
            <Link href="/envelopes" className="font-semibold text-brand hover:underline">
              Go to My Envelopes
            </Link>
          </Notice>
        ) : (
          <MissionBoard
            data={loaded}
            selectedId={
              loaded.envelopes.some((e) => e.token_id === picked) ? picked! : loaded.envelopes[0].token_id
            }
            onSelect={setPicked}
            onCheckIn={async (tokenId) => {
              await api.checkIn(tokenId);
              refresh();
            }}
            onRedeem={async (tokenId, eventId, code) => {
              await api.redeemNearEvent(tokenId, eventId, code);
              refresh();
            }}
          />
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-line bg-seal/40 p-6">
        <h2 className="text-lg font-semibold sm:text-xl">
          Action → Envelope Experience → Enhancement Attempt → Stronger Envelope
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          The Envelope grows through its own experiences. Its Enhancement Attempts travel with it and can only be used
          to enhance that Envelope.
        </p>
      </section>
    </div>
  );
}

function MissionBoard({
  data,
  selectedId,
  onSelect,
  onCheckIn,
  onRedeem,
}: {
  data: Loaded;
  selectedId: string;
  onSelect: (tokenId: string) => void;
  onCheckIn: (tokenId: string) => Promise<void>;
  onRedeem: (tokenId: string, eventId: string, code: string) => Promise<void>;
}) {
  const selected = data.envelopes.find((e) => e.token_id === selectedId)!;
  const label = `${envelopeName(selected)} #${selected.token_id}`;
  // 강화를 실행하고 결과 화면(/enhance/[tokenId]?result=…)으로 이동
  const { enhance, busy, error } = useEnhance();

  return (
    <>
      <section>
        <h2 className="text-[22px] font-semibold">Your Envelopes</h2>
        <p className="mt-2 text-[15px] text-ink-muted">
          Each Envelope earns its own Enhancement Attempts. Pick one to see its missions.
        </p>
        <div role="radiogroup" aria-label="Envelope" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.envelopes.map((e) => {
            const active = e.token_id === selectedId;
            return (
              <button
                key={e.token_id}
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(e.token_id)}
                className={`flex items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition ${
                  active ? "border-brand ring-1 ring-brand" : "border-line hover:border-sketch"
                }`}
              >
                <EnvelopeIllustration className="w-20 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {envelopeName(e)} +{e.level}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {RARITY_LABEL[e.rarity]} · #{e.token_id}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-brand">
                    {attemptsText(e.enhance_tickets)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <EnvelopeIllustration className="w-28 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold">
            {label} +{selected.level}
          </h2>
          <div className="mt-1 text-ink-muted">{RARITY_LABEL[selected.rarity]}</div>
          <div className="mt-2 font-semibold text-brand">{attemptsText(selected.enhance_tickets)} ready</div>
        </div>
        {selected.enhance_tickets > 0 && selected.level < 10 ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              onClick={() => enhance(selected)}
              disabled={busy}
              className={`${BUTTON_PRIMARY} disabled:opacity-60`}
            >
              {busy ? "Opening the seal…" : "Enhance Envelope"}
            </button>
            {error && (
              <p role="alert" className="max-w-xs text-sm text-red-600 sm:text-right">
                {error}
              </p>
            )}
          </div>
        ) : (
          <Link href={`/envelopes/${selected.token_id}`} className={`${BUTTON_SECONDARY} self-start sm:self-center`}>
            View Envelope
          </Link>
        )}
      </section>
      <p className="mt-3 text-sm text-ink-muted">
        Showing {label}&apos;s missions. Rewards are added to this Envelope automatically and stay with it when it is
        sent.
      </p>

      <MissionSection title="Every Day" description="Repeatable ways to keep this Envelope growing.">
        <CheckInCard
          key={selected.token_id}
          envelope={selected}
          cooldownMs={data.cooldownMs}
          onCheckIn={() => onCheckIn(selected.token_id)}
        />
      </MissionSection>

      {MISSION_GROUPS.map((group) => (
        <MissionSection key={group.title} title={group.title} description={group.description}>
          {group.missions.map((m) => (
            <MissionCard key={m.id} mission={m} envelope={selected} />
          ))}
        </MissionSection>
      ))}

      <MissionSection
        title="NEAR Events"
        description="Join NEAR community events and bring your Envelope along."
      >
        {data.events.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <Notice>No events are open right now. Check back when the next NEAR event starts.</Notice>
          </div>
        ) : (
          data.events.map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              redeemed={event.redeemed}
              envelopeLabel={label}
              onRedeem={(code) => onRedeem(selected.token_id, event.event_id, code)}
            />
          ))
        )}
      </MissionSection>
    </>
  );
}

function MissionSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-[22px] font-semibold">{title}</h2>
      <p className="mt-2 text-[15px] text-ink-muted">{description}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
