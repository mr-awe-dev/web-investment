import type { ReactNode } from 'react';
import { fmtMoney, signClass } from '../lib/format';
import type { Money as MoneyT } from '../types/domain';

export const Panel = ({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`panel ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="panel-title">{title}</h2>
        {action}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Metric = ({ label, value, sub, tone }: { label: string; value: string; sub?: ReactNode; tone?: 'neutral' | 'signed'; }) => (
  <div className="px-4 py-3 border-r border-slate-200 last:border-r-0">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`num text-xl font-semibold mt-1 ${tone === 'signed' ? signClass(value.startsWith('-') ? -1 : 1) : 'text-slate-900'}`}>{value}</div>
    {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

export const Amount = ({ value, currency, signed = false, className = '' }: { value: MoneyT | number | undefined | null; currency?: string; signed?: boolean; className?: string }) => (
  <span className={`num ${signed && value != null ? signClass(value) : ''} ${className}`}>{fmtMoney(value, currency)}</span>
);

const PILL: Record<string, string> = {
  green: 'bg-green-50 text-accent-green border-green-200', red: 'bg-red-50 text-accent-red border-red-200',
  amber: 'bg-amber-50 text-accent-amber border-amber-200', blue: 'bg-blue-50 text-accent-blue border-blue-200', slate: 'bg-slate-100 text-slate-600 border-slate-200',
};
export const Pill = ({ tone = 'slate', children }: { tone?: keyof typeof PILL; children: ReactNode }) => <span className={`pill ${PILL[tone]}`}>{children}</span>;

export const Empty = ({ text = 'Belum ada data' }: { text?: string }) => <div className="text-center text-slate-400 py-10 text-sm">{text}</div>;
export const Loading = () => <div className="animate-pulse space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-4 bg-slate-100 rounded" />)}</div>;

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export function Table<T>({ rows, cols, keyOf, onRow, empty }: { rows: T[]; cols: { h: string; cell: (r: T) => ReactNode; right?: boolean; w?: string }[]; keyOf: (r: T) => string | number; onRow?: (r: T) => void; empty?: string }) {
  if (!rows.length) return <Empty text={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead><tr>{cols.map((c) => <th key={c.h} className={`${c.right ? 'text-right' : ''} ${c.w ?? ''}`}>{c.h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={keyOf(r)} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'cursor-pointer' : ''}>
              {cols.map((c) => <td key={c.h} className={c.right ? 'text-right num' : ''}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Drawer = ({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside className={`absolute right-0 top-0 h-full bg-white shadow-lg border-l border-slate-200 flex flex-col ${wide ? 'w-full max-w-3xl' : 'w-full max-w-xl'}`}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-secondary h-8 px-2" aria-label="Tutup">✕</button>
        </header>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </aside>
    </div>
  );
};

export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {error && <span className="text-xs text-accent-red mt-1 block">{error}</span>}
  </label>
);
