import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  CircleAlert,
  Inbox,
  Loader2,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { fmtMoney, signClass } from '../lib/format';
import { useTheme } from '../lib/theme';
import type { Money as MoneyT } from '../types/domain';

/* ------------------------------------------------------------------ */
/* Money + status                                                      */
/* ------------------------------------------------------------------ */

export const Amount = ({
  value,
  currency,
  signed = false,
  className = '',
}: {
  value: MoneyT | number | undefined | null;
  currency?: string;
  signed?: boolean;
  className?: string;
}) => (
  <span className={`num ${signed && value != null && Number(value) !== 0 ? signClass(Number(value)) : ''} ${className}`}>
    {fmtMoney(value, currency)}
  </span>
);

const PILL: Record<string, string> = {
  green: 'pill-green',
  red: 'pill-red',
  amber: 'pill-amber',
  blue: 'pill-blue',
  slate: 'pill-slate',
};

export type PillTone = keyof typeof PILL;

export const Pill = ({
  tone = 'slate',
  children,
  dot = false,
}: {
  tone?: PillTone;
  children: ReactNode;
  dot?: boolean;
}) => (
  <span className={`pill ${PILL[tone]}`}>
    {dot && <span className="status-dot bg-current" aria-hidden="true" />}
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
  flush = false,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={flush ? '' : bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  trend,
  icon,
  className = '',
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'auto';
  trend?: number;
  icon?: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : tone === 'auto' && trend != null
          ? signClass(trend)
          : 'text-ink';

  return (
    <div className={`card p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="stat-label">{label}</p>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className={`num mt-1.5 text-[1.35rem] font-semibold leading-tight tracking-tight sm:text-2xl ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Progress({
  value,
  tone = 'accent',
  label,
  className = '',
}: {
  value: number;
  tone?: 'accent' | 'positive' | 'warning' | 'negative';
  label: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const toneClass = {
    accent: 'bg-accent',
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
  }[tone];

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
    >
      <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function Empty({
  text,
  title,
  hint,
  action,
  icon,
}: {
  text?: string;
  title?: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-faint" aria-hidden="true">
        {icon ?? <Inbox size={20} strokeWidth={1.75} />}
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title ?? text ?? 'Belum ada data'}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Spinner = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />
);

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-5" role="status" aria-busy="true">
      <span className="sr-only">Memuat data…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-4" style={{ width: `${92 - index * 12}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({
  title = 'Data gagal dimuat',
  hint = 'Periksa koneksi lalu coba lagi.',
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-negative-soft text-negative" aria-hidden="true">
        <CircleAlert size={20} strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function Alert({
  tone = 'error',
  children,
  onDismiss,
}: {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const toneClass = {
    error: 'border-negative/25 bg-negative-soft text-negative',
    success: 'border-positive/25 bg-positive-soft text-positive',
    info: 'border-line bg-surface-2 text-muted',
  }[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${toneClass}`}
    >
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Tutup pesan">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const errorId = useId();
  const hintId = useId();

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <label className="block">
      <span className="label">
        {label}
        {required && (
          <span className="ml-0.5 text-negative" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {control}
      {hint && !error && (
        <span id={hintId} className="hint mt-1 block">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  h: string;
  cell: (row: T) => ReactNode;
  right?: boolean;
  w?: string;
  /** Set false to hide this column in the stacked mobile layout. */
  mobile?: boolean;
  sortValue?: (row: T) => string | number;
}

export function Table<T>({
  rows,
  cols,
  keyOf,
  empty,
  emptyHint,
  caption,
  sortable = false,
  className = '',
}: {
  rows: T[];
  cols: Column<T>[];
  keyOf: (row: T) => string | number;
  empty?: string;
  emptyHint?: string;
  caption?: string;
  sortable?: boolean;
  className?: string;
}) {
  const [sort, setSort] = useState<{ index: number; dir: 1 | -1 } | null>(null);

  const ordered = useMemo(() => {
    if (!sort || !sortable) return rows;
    const column = cols[sort.index];
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * sort.dir;
      return String(left).localeCompare(String(right)) * sort.dir;
    });
  }, [rows, sort, sortable, cols]);

  if (!rows.length) return <Empty title={empty} hint={emptyHint} />;

  const toggle = (index: number) => {
    if (!sortable || !cols[index].sortValue) return;
    setSort((current) =>
      current?.index === index ? { index, dir: current.dir === 1 ? -1 : 1 } : { index, dir: 1 },
    );
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table table-stack">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {cols.map((column, index) => {
              const sorted = sort?.index === index ? sort.dir : null;
              return (
                <th
                  key={column.h}
                  scope="col"
                  aria-sort={sorted === 1 ? 'ascending' : sorted === -1 ? 'descending' : sortable && column.sortValue ? 'none' : undefined}
                  className={`${column.right ? 'text-right' : ''} ${column.w ?? ''}`}
                >
                  {sortable && column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(index)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${column.right ? 'flex-row-reverse' : ''}`}
                    >
                      {column.h}
                      {sorted === 1 ? (
                        <ArrowUp size={12} aria-hidden="true" />
                      ) : sorted === -1 ? (
                        <ArrowDown size={12} aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.h
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={keyOf(row)}>
              {cols.map((column) => (
                <td
                  key={column.h}
                  data-label={column.h || undefined}
                  data-mobile={column.mobile === false ? 'false' : undefined}
                  className={column.right ? 'text-right num' : ''}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog behaviour                                                    */
/* ------------------------------------------------------------------ */

function useDialogBehaviour(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null || element === node);

    const [first] = focusables();
    (first ?? node)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const firstElement = list[0];
      const lastElement = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [active, onClose]);

  return ref;
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useDialogBehaviour(open, onClose);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!rendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-line bg-surface shadow-pop outline-none transition-transform duration-300 ease-out ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        } ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-xs text-muted">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="icon-btn -mr-1.5 h-9 w-9" aria-label="Tutup panel">
            <X size={18} />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useDialogBehaviour(open, onCancel);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/45" onClick={onCancel} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md animate-scale-in rounded-xl border border-line bg-surface p-5 shadow-pop outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <div id={descriptionId} className="mt-2 text-sm text-muted">
            {description}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={onConfirm} disabled={pending}>
            {pending && <Spinner size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Navigation helpers                                                  */
/* ------------------------------------------------------------------ */

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`icon-btn border border-line ${className}`}
      aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-pressed={dark}
      title={dark ? 'Mode terang' : 'Mode gelap'}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function SegmentedNav({
  items,
  ariaLabel,
}: {
  items: { to: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="scroll-thin flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface-2 p-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              isActive ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-xs font-medium text-accent-text underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
