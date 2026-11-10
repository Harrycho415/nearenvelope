// 선으로 그린 봉투. 크기는 부모 너비를 따른다 (비율 29:18).
// 소유자: D

export function EnvelopeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 290 180" className={className} role="img" aria-label="Envelope">
      <g fill="none" stroke="var(--color-sketch)" strokeWidth="2.5" strokeLinecap="round">
        <rect x="2" y="2" width="286" height="176" rx="14" className="fill-paper" />
        <path d="M2 8 L127 98 M288 8 L163 98" />
        <path d="M2 176 L100 92 M288 176 L190 92" />
      </g>
      <circle cx="145" cy="101" r="17" fill="var(--color-seal)" stroke="var(--color-sketch)" strokeWidth="1.5" />
    </svg>
  );
}
