// 실제 체인 구현. view는 JSON-RPC 직접 호출, change는 Wallet Selector로 서명한다.
// 소유자: C

import type { Wallet } from "@near-wallet-selector/core";
import { actionCreators } from "@near-js/transactions";

import { FT_CONTRACT_ID, GAS_TGAS, NFT_CONTRACT_ID, ONE_YOCTO, RPC_URL } from "./config";
import { nearToYocto } from "./format";
import type {
  AddAssetsParams,
  ContractConfig,
  EnhanceResult,
  EnvelopeApi,
  EnvelopeView,
  NearEventView,
} from "./types";

const TGAS = BigInt(10 ** 12);
const STORAGE_PRICE_PER_BYTE = BigInt(10 ** 19);
/** 지갑 잔액에서 가스용으로 남겨 두는 NEAR */
const GAS_RESERVE = BigInt(nearToYocto("0.05"));

const functionCall = (method: string, args: object, tgas: number, deposit = "0") =>
  actionCreators.functionCall(method, args, BigInt(tgas) * TGAS, BigInt(deposit));

async function query<T>(params: object): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "envelope", method: "query", params: { finality: "optimistic", ...params } }),
  });
  const json = await res.json();
  if (json.error || json.result?.error) {
    throw new Error(JSON.stringify(json.error ?? json.result.error));
  }
  return json.result as T;
}

export async function viewCall<T>(contractId: string, method: string, args: object = {}): Promise<T> {
  const result = await query<{ result: number[] }>({
    request_type: "call_function",
    account_id: contractId,
    method_name: method,
    args_base64: btoa(JSON.stringify(args)),
  });
  return JSON.parse(new TextDecoder().decode(new Uint8Array(result.result))) as T;
}

const viewAccount = (accountId: string) =>
  query<{ amount: string; storage_usage: number }>({ request_type: "view_account", account_id: accountId });

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
    return wallet.signAndSendTransaction({ receiverId, actions: [functionCall(method, args, tgas, deposit)] });
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
    // v0.2 미배포 컨트랙트에서는 메서드가 없으므로 빈 값으로 둔다
    nearEvents: () => viewCall<NearEventView[]>(NFT_CONTRACT_ID, "near_events").catch(() => []),
    nearEventRedeemed: (eventId, accountId) =>
      viewCall<boolean>(NFT_CONTRACT_ID, "near_event_redeemed", { event_id: eventId, account_id: accountId }).catch(
        () => false,
      ),
    vaultBalances: async (vaultId) => {
      const [near, usdc] = await Promise.all([
        viewCall<string>(vaultId, "withdrawable").catch(() => "0"),
        viewCall<string>(FT_CONTRACT_ID, "ft_balance_of", { account_id: vaultId }).catch(() => "0"),
      ]);
      return { near, usdc };
    },
    walletBalances: async (accountId) => {
      const [account, usdc] = await Promise.all([
        viewAccount(accountId),
        viewCall<string>(FT_CONTRACT_ID, "ft_balance_of", { account_id: accountId }).catch(() => "0"),
      ]);
      const free = BigInt(account.amount) - BigInt(account.storage_usage) * STORAGE_PRICE_PER_BYTE - GAS_RESERVE;
      return { near: (free > BigInt(0) ? free : BigInt(0)).toString(), usdc };
    },
    faucet: async (amount) => {
      await call(FT_CONTRACT_ID, "faucet", { amount }, GAS_TGAS.faucet);
    },
    accountExists: (accountId) =>
      viewAccount(accountId).then(
        () => true,
        () => false,
      ),

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
      if (!wallet) throw new Error("Wallet not connected");
      // 수령자가 FT에 storage 등록이 안 되어 있으면 ft_transfer가 실패하므로 같은 서명에서 먼저 등록한다
      const receiver = receiverId ?? (await wallet.getAccounts())[0]?.accountId;
      const registered = receiver
        ? await viewCall<unknown>(FT_CONTRACT_ID, "storage_balance_of", { account_id: receiver }).catch(() => null)
        : true;
      const claim = {
        receiverId: NFT_CONTRACT_ID,
        actions: [
          functionCall(
            "claim_ft",
            { token_id: tokenId, ft_contract_id: FT_CONTRACT_ID, amount, receiver_id: receiverId },
            GAS_TGAS.claimFt,
            ONE_YOCTO,
          ),
        ],
      };
      if (registered) {
        await wallet.signAndSendTransaction(claim);
        return;
      }
      const { ft_storage_deposit } = await config();
      await wallet.signAndSendTransactions({
        transactions: [
          {
            receiverId: FT_CONTRACT_ID,
            actions: [
              functionCall(
                "storage_deposit",
                { account_id: receiver, registration_only: true },
                GAS_TGAS.registerFt,
                ft_storage_deposit,
              ),
            ],
          },
          claim,
        ],
      });
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
    redeemNearEvent: async (tokenId, eventId, code) => {
      await nft(
        "redeem_near_event",
        { token_id: tokenId, event_id: eventId, code },
        GAS_TGAS.redeemNearEvent,
      );
    },
    addAssets: async (params) => {
      if (!wallet) throw new Error("Wallet not connected");
      const transactions = await fillTransactions(params);
      if (transactions.length) await wallet.signAndSendTransactions({ transactions });
    },
    sealAndSend: async ({ tokenId, vaultId, near, usdc, receiverId, message }) => {
      if (!wallet) throw new Error("Wallet not connected");
      const transactions = await fillTransactions({ tokenId, vaultId, near, usdc });
      // 3) 전송
      transactions.push({
        receiverId: NFT_CONTRACT_ID,
        actions: [
          functionCall(
            "send_envelope",
            { token_id: tokenId, receiver_id: receiverId, message: message || null },
            GAS_TGAS.sendEnvelope,
            ONE_YOCTO,
          ),
        ],
      });

      const outcomes = await wallet.signAndSendTransactions({ transactions });
      return outcomes?.at(-1)?.transaction_outcome.id ?? null;
    },
  };

  /** 채우기 트랜잭션: NFT 컨트랙트 fill·register_ft → FT 컨트랙트 ft_transfer_call. 넣을 것이 없으면 빈 배열 */
  async function fillTransactions({ tokenId, vaultId, near, usdc }: AddAssetsParams) {
    const addNear = BigInt(near) > BigInt(0);
    const addUsdc = BigInt(usdc) > BigInt(0);

    // 1) NFT 컨트랙트: fill, (필요하면) register_ft
    const prepare = [];
    if (addNear) prepare.push(functionCall("fill", { token_id: tokenId }, GAS_TGAS.fill, near));
    if (addUsdc) {
      const registered = await viewCall<unknown>(FT_CONTRACT_ID, "storage_balance_of", {
        account_id: vaultId,
      }).catch(() => null);
      if (!registered) {
        const { ft_storage_deposit } = await config();
        prepare.push(
          functionCall(
            "register_ft",
            { token_id: tokenId, ft_contract_id: FT_CONTRACT_ID },
            GAS_TGAS.registerFt,
            ft_storage_deposit,
          ),
        );
      }
    }

    const transactions = [];
    if (prepare.length) transactions.push({ receiverId: NFT_CONTRACT_ID, actions: prepare });
    // 2) FT 컨트랙트: Vault로 ft_transfer_call
    if (addUsdc) {
      transactions.push({
        receiverId: FT_CONTRACT_ID,
        actions: [
          functionCall("ft_transfer_call", { receiver_id: vaultId, amount: usdc, msg: "" }, GAS_TGAS.fillFt, ONE_YOCTO),
        ],
      });
    }
    return transactions;
  }
}
