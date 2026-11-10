// 보내기 흐름 상단의 4단계 표시. current는 1부터.
// 소유자: C

export const SEND_STEPS = ["Choose Envelope", "Add Assets", "Recipient & Message", "Preview & Send"];

export function SendSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[15px]">
      {SEND_STEPS.map((label, i) => {
        const active = i + 1 === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-2 ${active ? "font-semibold text-brand" : "text-ink-muted"}`}
          >
            <span>{i + 1}</span>
            <span>{label}</span>
            {i < SEND_STEPS.length - 1 && <span className="ml-2">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
