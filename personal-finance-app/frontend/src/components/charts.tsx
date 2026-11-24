import type { ReactNode } from 'react';
import type { TooltipProps } from 'recharts';
import { fmtCompact, fmtMoney } from '../lib/format';
import { usePrefersReducedMotion } from '../lib/theme';

export const chartColor = (index: number) => `rgb(var(--c-chart-${index}))`;

export const chartAxis = {
  tick: { fill: 'rgb(var(--c-muted))', fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const chartGrid = 'rgb(var(--c-line))';
export const chartAccent = 'rgb(var(--c-accent))';
export const chartMuted = 'rgb(var(--c-faint))';

export function ChartFigure({
  label,
  summary,
  children,
}: {
  label: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <figure aria-label={label}>
      <figcaption className="sr-only">{summary}</figcaption>
      {children}
    </figure>
  );
}

export function useChartMotion() {
  const reduced = usePrefersReducedMotion();
  return { isAnimationActive: !reduced, animationDuration: 600, animationEasing: 'ease-out' as const };
}

export function moneyTick(currency = 'IDR') {
  return (value: number) => fmtCompact(value, currency);
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency = 'IDR',
}: TooltipProps<number, string> & { currency?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[9rem] rounded-lg border border-line bg-surface px-3 py-2 shadow-pop">
      {label != null && <p className="mb-1 text-[11px] font-medium text-muted">{String(label)}</p>}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? chartColor(index + 1) }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="num font-medium text-ink">{fmtMoney(Number(item.value), currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
