// 실제 체인 구현. view는 JSON-RPC 직접 호출, change는 Wallet Selector로 서명한다.
// 소유자: C

import type { Wallet } from "@near-wallet-selector/core";
import { actionCreators } from "@near-js/transactions";

import { FT_CONTRACT_ID, GAS_TGAS, NFT_CONTRACT_ID, ONE_YOCTO, RPC_URL } from "./config";
import type { ContractConfig, EnhanceResult, EnvelopeApi, EnvelopeView } from "./types";

const TGAS = BigInt(10 ** 12);

export async function viewCall<T>(contractId: string, method: string, args: object = {}): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "envelope",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: contractId,
        method_name: method,
        args_base64: btoa(JSON.stringify(args)),
      },
    }),
  });
  const json = await res.json();
  if (json.error || json.result?.error) {
    throw new Error(JSON.stringify(json.error ?? json.result.error));
  }
  return JSON.parse(new TextDecoder().decode(new Uint8Array(json.result.result))) as T;
}

type Outcome = Awaited<ReturnType<Wallet["signAndSendTransaction"]>>;

function parseSuccessValue<T>(outcome: Outcome | void): T | null {
  if (!outcome) return null;
  const status = outcome.status as { SuccessValue?: string } | undefined;
  if (!status?.SuccessValue) return null;
  return JSON.parse(atob(status.SuccessValue)) as T;
}

export function createContractApi(wallet: Wallet | null): EnvelopeApi {
  const call = async (
    receiverId: string,
    method: string,
    args: object,
    tgas: number,
    deposit = "0",
  ) => {
    if (!wallet) throw new Error("Wallet not connected");
    return wallet.signAndSendTransaction({
      receiverId,
      actions: [actionCreators.functionCall(method, args, BigInt(tgas) * TGAS, BigInt(deposit))],
    });
  };
  const nft = (method: string, args: object, tgas: number, deposit?: string) =>
    call(NFT_CONTRACT_ID, method, args, tgas, deposit);

  let cachedConfig: ContractConfig | null = null;
  const config = async () => (cachedConfig ??= await viewCall<ContractConfig>(NFT_CONTRACT_ID, "config"));

  return {
    envelopeInfo: (tokenId) => viewCall<EnvelopeView | null>(NFT_CONTRACT_ID, "envelope_info", { token_id: tokenId }),
    envelopesForOwner: (accountId) =>
      viewCall<EnvelopeView[]>(NFT_CONTRACT_ID, "envelopes_for_owner", { account_id: accountId }),
    enhanceTable: () => viewCall<number[]>(NFT_CONTRACT_ID, "enhance_table"),
    config,
    vaultBalances: async (vaultId) => {
      const [near, usdc] = await Promise.all([
        viewCall<string>(vaultId, "withdrawable").catch(() => "0"),
        viewCall<string>(FT_CONTRACT_ID, "ft_balance_of", { account_id: vaultId }).catch(() => "0"),
      ]);
      return { near, usdc };
    },

    mint: async (design) => {
      const { mint_deposit } = await config();
      return parseSuccessValue<string>(await nft("mint", { design }, GAS_TGAS.mint, mint_deposit));
    },
    fill: async (tokenId, yocto) => {
      await nft("fill", { token_id: tokenId }, GAS_TGAS.fill, yocto);
    },
    registerFt: async (tokenId) => {
      const { ft_storage_deposit } = await config();
      await nft(
        "register_ft",
        { token_id: tokenId, ft_contract_id: FT_CONTRACT_ID },
        GAS_TGAS.registerFt,
        ft_storage_deposit,
      );
    },
    fillFt: async (vaultId, amount) => {
      await call(
        FT_CONTRACT_ID,
        "ft_transfer_call",
        { receiver_id: vaultId, amount, msg: "" },
        GAS_TGAS.fillFt,
        ONE_YOCTO,
      );
    },
    claimNear: async (tokenId, yocto, receiverId) => {
      await nft(
        "claim_near",
        { token_id: tokenId, amount: yocto, receiver_id: receiverId },
        GAS_TGAS.claimNear,
        ONE_YOCTO,
      );
    },
    claimFt: async (tokenId, amount, receiverId) => {
      await nft(
        "claim_ft",
        { token_id: tokenId, ft_contract_id: FT_CONTRACT_ID, amount, receiver_id: receiverId },
        GAS_TGAS.claimFt,
        ONE_YOCTO,
      );
    },
    sendEnvelope: async (tokenId, receiverId, message) => {
      await nft(
        "send_envelope",
        { token_id: tokenId, receiver_id: receiverId, message: message || null },
        GAS_TGAS.sendEnvelope,
        ONE_YOCTO,
      );
    },
    enhance: async (tokenId) =>
      parseSuccessValue<EnhanceResult>(await nft("enhance", { token_id: tokenId }, GAS_TGAS.enhance, ONE_YOCTO)),
    checkIn: async (tokenId) => {
      await nft("check_in", { token_id: tokenId }, GAS_TGAS.checkIn);
    },
  };
}
