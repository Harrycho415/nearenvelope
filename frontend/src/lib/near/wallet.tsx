"use client";

// 지갑 연결 Provider. 앱 전체에서 `useNear()`로 accountId·api를 얻는다.
// 지갑은 Meteor만 지원한다. NEXT_PUBLIC_USE_MOCK은 데이터(api)만 목업으로 바꾸고 지갑 연결은 항상 실제로 한다.
// 예외: 목업 모드에서 NEXT_PUBLIC_MOCK_ACCOUNT를 주면 Meteor 없이 그 계정으로 연결한다 (드라이런, 로컬 개발 전용).
// 소유자: C

import {
  setupWalletSelector,
  type InjectedWallet,
  type Wallet,
  type WalletSelector,
} from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { MOCK_ACCOUNT, NETWORK, NFT_CONTRACT_ID, USE_MOCK } from "./config";
import { createContractApi } from "./contract";
import { mockApi, setMockAccount } from "./mock";
import type { EnvelopeApi } from "./types";

const METEOR_WALLET_ID = "meteor-wallet";
/** 드라이런 연결 상태를 새로고침 뒤에도 유지 */
const DRY_RUN_KEY = "near-envelope:dry-run-connected";

interface NearContextValue {
  accountId: string | null;
  /** 지갑 초기화가 끝났는지. false인 동안 연결 버튼을 비활성화한다. */
  ready: boolean;
  api: EnvelopeApi;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const NearContext = createContext<NearContextValue | null>(null);

export function NearProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dryRunReady, setDryRunReady] = useState(false);

  useEffect(() => {
    if (MOCK_ACCOUNT) {
      // 드라이런: Meteor를 띄우지 않는다. 한 번도 연결을 끊지 않았다면 연결된 상태로 시작
      queueMicrotask(() => {
        if (localStorage.getItem(DRY_RUN_KEY) !== "false") setAccountId(MOCK_ACCOUNT);
        setDryRunReady(true);
      });
      return;
    }

    let unsubscribe: (() => void) | undefined;

    setupWalletSelector({ network: NETWORK, modules: [setupMeteorWallet()] }).then((s) => {
      setSelector(s);
      const subscription = s.store.observable.subscribe(async (state) => {
        const active = state.accounts.find((a) => a.active)?.accountId ?? null;
        setAccountId(active);
        setWallet(active ? await s.wallet() : null);
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (USE_MOCK && accountId) setMockAccount(accountId);
  }, [accountId]);

  const value = useMemo<NearContextValue>(
    () => ({
      accountId,
      ready: MOCK_ACCOUNT ? dryRunReady : selector !== null,
      api: USE_MOCK ? mockApi : createContractApi(wallet),
      signIn: async () => {
        if (MOCK_ACCOUNT) {
          localStorage.setItem(DRY_RUN_KEY, "true");
          setAccountId(MOCK_ACCOUNT);
          return;
        }
        if (!selector) return;
        const meteor = await selector.wallet<InjectedWallet>(METEOR_WALLET_ID);
        await meteor.signIn({ contractId: NFT_CONTRACT_ID });
      },
      signOut: async () => {
        if (MOCK_ACCOUNT) {
          localStorage.setItem(DRY_RUN_KEY, "false");
          setAccountId(null);
          return;
        }
        if (selector) await (await selector.wallet()).signOut();
      },
    }),
    [accountId, wallet, selector, dryRunReady],
  );

  return <NearContext.Provider value={value}>{children}</NearContext.Provider>;
}

export function useNear() {
  const ctx = useContext(NearContext);
  if (!ctx) throw new Error("useNear must be used inside <NearProvider>");
  return ctx;
}
