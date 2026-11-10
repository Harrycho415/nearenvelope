"use client";

// 지갑 연결 Provider. 앱 전체에서 `useNear()`로 accountId·api를 얻는다.
// 소유자: C

import "@near-wallet-selector/modal-ui/styles.css";

import { setupWalletSelector, type Wallet, type WalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { NETWORK, NFT_CONTRACT_ID, USE_MOCK } from "./config";
import { createContractApi } from "./contract";
import { MOCK_ACCOUNT_ID, mockApi } from "./mock";
import type { EnvelopeApi } from "./types";

interface NearContextValue {
  accountId: string | null;
  api: EnvelopeApi;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const NearContext = createContext<NearContextValue | null>(null);

export function NearProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [accountId, setAccountId] = useState<string | null>(USE_MOCK ? MOCK_ACCOUNT_ID : null);

  useEffect(() => {
    if (USE_MOCK) return;
    let unsubscribe: (() => void) | undefined;

    setupWalletSelector({
      network: NETWORK,
      modules: [setupMeteorWallet(), setupMyNearWallet()],
    }).then((s) => {
      setSelector(s);
      setModal(setupModal(s, { contractId: NFT_CONTRACT_ID }));
      const subscription = s.store.observable.subscribe(async (state) => {
        const active = state.accounts.find((a) => a.active)?.accountId ?? null;
        setAccountId(active);
        setWallet(active ? await s.wallet() : null);
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, []);

  const value = useMemo<NearContextValue>(
    () => ({
      accountId,
      api: USE_MOCK ? mockApi : createContractApi(wallet),
      signIn: () => (USE_MOCK ? setAccountId(MOCK_ACCOUNT_ID) : modal?.show()),
      signOut: async () => {
        if (USE_MOCK) return setAccountId(null);
        if (selector) await (await selector.wallet()).signOut();
      },
    }),
    [accountId, wallet, modal, selector],
  );

  return <NearContext.Provider value={value}>{children}</NearContext.Provider>;
}

export function useNear() {
  const ctx = useContext(NearContext);
  if (!ctx) throw new Error("useNear must be used inside <NearProvider>");
  return ctx;
}
