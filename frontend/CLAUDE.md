# frontend/ 지침

@AGENTS.md

루트 `CLAUDE.md`와 `docs/INTERFACE.md`를 먼저 읽는다. 여기는 프런트 영역에만 해당하는 규칙이다.

## 스택

Next.js 16 (App Router, Cache Components 활성화), React 19, Tailwind CSS 4, TypeScript, pnpm.
NEAR: `@near-wallet-selector/core` + `meteor-wallet` 10.x (**Meteor 지갑만 지원**), `@near-js/transactions` 2.x.
`near-api-js`는 Meteor SDK의 peer 의존성 때문에 **6.x로 고정**한다. 7.x로 올리면 빌드가 깨진다. 직접 import하지 않는다.

## 구조와 소유

| 경로 | 내용 | 소유 |
|---|---|---|
| `src/lib/near/` | 체인 접근 계층 (config, types, contract, mock, wallet, format) | C |
| `src/app/page.tsx` | Home (히어로, 최근 받은 봉투, 4단계 안내) | C |
| `src/app/envelopes/` | My Envelopes 목록 (+ 민트) | C |
| `src/app/send/` | 보낼 봉투 선택 → `/send/[tokenId]` | C |
| `src/app/missions/` | 미션 목록·진행 상황 | D |
| `src/app/wallet/` | 계정·잔액·Mock USDC faucet | C |
| `src/app/envelopes/[tokenId]/` | 상세: 잔액·채우기·열기(claim)·전달 기록 | C |
| `src/app/send/[tokenId]/` | 보내기 (수신자 + 메시지) | C |
| `src/app/enhance/[tokenId]/` | 미션·check-in·강화 연출 | D |
| `src/components/ui/` | 공용 UI (SiteHeader, ConnectButton, 버튼, 토스트) | C |
| `src/components/envelope/` | EnvelopeCard 등 봉투 비주얼 | D |
| `public/designs/{design}/{rarity}.svg` | 봉투 이미지 (컨트랙트 메타데이터 media 경로와 동일) | D |
| `src/app/layout.tsx`, `globals.css`, `loading.tsx` | 공유. 변경 시 C·D 합의 | 공유 |

## 규칙

- 페이지·컴포넌트는 체인 관련 코드를 **`@/lib/near`에서만** import 한다. `@near-wallet-selector/*`, `@near-js/*`를 직접 쓰지 않는다.
- 체인 호출은 `const { accountId, api } = useNear()`의 `api`(`EnvelopeApi`)로만 한다. 새 호출이 필요하면 C에게 `EnvelopeApi`에 메서드 추가를 요청한다 (컨트랙트 변경이면 §5 절차).
- 금액은 항상 최소 단위 **문자열**로 다루고 `format.ts`의 `nearToYocto`/`yoctoToNear`/`usdcToUnits`/`unitsToUsdc`로 변환한다. `Number`로 계산하지 않는다.
- 에러 메시지는 `ERR_XXX` 접두어로 분기해 사용자 문구로 바꾼다.
- 지갑·브라우저 API를 쓰는 컴포넌트는 `"use client"`. 동적 라우트의 `useParams`는 루트 `loading.tsx`의 Suspense 경계 덕분에 동작한다. 새 최상위 레이아웃을 만들면 Suspense 경계를 유지한다.
- 스타일은 Tailwind 유틸리티. 색은 `globals.css`의 `@theme` 토큰(`bg-canvas`, `bg-surface`, `bg-paper`, `border-line`, `text-ink`, `text-ink-muted`, `bg-brand` …)만 쓰고 hex를 직접 쓰지 않는다. 토큰 추가는 D.
- `usePathname`/`useSearchParams`를 레이아웃 공용 컴포넌트에서 쓰면 `<Suspense>`로 감싼다 (`SiteHeader` 참고). 안 그러면 동적 라우트 빌드가 실패한다.
- 패키지 추가는 C만 머지한다 (`pnpm-lock.yaml` 충돌 방지). 다른 사람은 PR에 필요한 패키지를 적어 요청한다.

## 개발

```bash
cp .env.example .env.local   # 기본값 NEXT_PUBLIC_USE_MOCK=false → 테스트넷 컨트랙트 사용 (true면 목업)
pnpm dev
pnpm lint && pnpm build      # PR 전 필수
```

`NEXT_PUBLIC_USE_MOCK`은 **데이터(api)만** 목업으로 바꾼다. 지갑 연결은 항상 실제 Meteor 지갑으로 한다.
목업(`src/lib/near/mock.ts`)에는 봉투 4개(받은 봉투 3개 포함)가 있고, Meteor로 연결한 계정이 그 소유자가 된다. 확률표·미션·에러 코드는 INTERFACE.md를 따른다.
컨트랙트가 스테이징에 배포되면 `.env.local`에서 `NEXT_PUBLIC_USE_MOCK=false`로 바꿔 실제 체인과 연결한다.
