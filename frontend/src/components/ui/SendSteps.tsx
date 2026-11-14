// 보내기 흐름 상단의 4단계 표시. current는 1부터.
// 소유자: C

export const SEND_STEPS = ["Choose Envelope", "Add Assets", "Recipient & Message", "Preview & Send"];

export function SendSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-8 gap-y-1 border-b border-dashed border-sketch">
      {SEND_STEPS.map((label, i) => {
        const active = i + 1 === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 font-mono text-xs uppercase tracking-[0.1em] ${
              active ? "border-brand text-ink" : "border-transparent text-ink-faint"
            }`}
          >
            <span className={active ? "text-brand" : undefined}>{String(i + 1).padStart(2, "0")}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
