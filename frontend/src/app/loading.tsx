// 모든 페이지의 Suspense 경계. 동적 라우트([tokenId])의 useParams가 prerender를 막지 않게 한다.
export default function Loading() {
  return <p className="mt-12 text-center opacity-60">Loading…</p>;
}
