import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useBudgets, useChartOfAccounts, useDeleteBudget, useUpsertBudget } from '../api/queries';
import {
  Alert,
  Amount,
  ConfirmDialog,
  Drawer,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  Panel,
  Pill,
  Progress,
  Spinner,
  Stat,
  type PillTone,
} from '../components/ui';
import { fmtMoney, fmtPct } from '../lib/format';
import type { Budget } from '../types/domain';
import { MonthPicker } from '../components/MonthPicker';

const STATUS: Record<string, { label: string; tone: PillTone }> = {
  HEALTHY: { label: 'Sehat', tone: 'green' },
  NEAR_LIMIT: { label: 'Mendekati batas', tone: 'amber' },
  OVER_BUDGET: { label: 'Melebihi', tone: 'red' },
};

function periodLabel(period: string) {
  const date = new Date(`${period}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

export default function BudgetPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const budgets = useBudgets(period);
  const { data: coa = [] } = useChartOfAccounts();
  const upsert = useUpsertBudget();
  const remove = useDeleteBudget();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [form, setForm] = useState({ categoryId: '', amount: '' });

  const data = budgets.data ?? [];
  const totals = data.reduce(
    (accumulator, item) => ({
      budget: accumulator.budget + Number(item.amount),
      actual: accumulator.actual + Number(item.actual),
    }),
    { budget: 0, actual: 0 },
  );
  const remaining = totals.budget - totals.actual;
  const utilization = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await upsert.mutateAsync({ categoryId: Number(form.categoryId), periodMonth: period, amount: Number(form.amount) });
      setOpen(false);
      setForm({ categoryId: '', amount: '' });
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Perencanaan"
        title="Anggaran"
        subtitle="Realisasi dihitung dari jurnal beban bulan berjalan."
        action={
          <>
            <div>
              
                <MonthPicker
              label="Bulan anggaran"
              value={period}
              onSelect={(newPeriod) => setPeriod(newPeriod)}
            />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Anggaran
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total anggaran" value={fmtMoney(totals.budget)} hint={periodLabel(period)} />
        <Stat label="Realisasi" value={fmtMoney(totals.actual)} hint={`${fmtPct(utilization)} terpakai`} />
        <Stat label="Sisa anggaran" value={fmtMoney(remaining)} tone="auto" trend={remaining} hint="Anggaran − realisasi" />
        <Stat label="Kategori" value={String(data.length)} hint={`${data.filter((item) => item.status === 'OVER_BUDGET').length} melebihi batas`} />
      </div>

      <Panel title={`Anggaran ${periodLabel(period)}`} subtitle="Progres realisasi per kategori beban" flush>
        {budgets.isLoading ? (
          <Loading rows={5} />
        ) : budgets.isError ? (
          <ErrorState title="Anggaran tidak dapat dimuat" onRetry={() => budgets.refetch()} />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <p className="text-sm font-medium text-ink">Belum ada anggaran untuk {periodLabel(period)}</p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Tentukan batas pengeluaran per kategori agar realisasi bulan ini dapat dipantau.
            </p>
            <button type="button" className="btn btn-primary mt-4" onClick={() => setOpen(true)}>
              <Plus size={15} aria-hidden="true" />
              Buat anggaran
            </button>
          </div>
        ) : (
          <>
            <ul>
              {data.map((item) => {
                const ratio = Number(item.amount) > 0 ? (Number(item.actual) / Number(item.amount)) * 100 : 0;
                const status = STATUS[item.status] ?? STATUS.HEALTHY;
                const tone =
                  item.status === 'OVER_BUDGET' ? 'negative' : item.status === 'NEAR_LIMIT' ? 'warning' : 'positive';

                return (
                  <li key={item.id} className="border-b border-line px-5 py-4 last:border-b-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-ink">{item.categoryName}</p>
                          <Pill tone={status.tone} dot>
                            {status.label}
                          </Pill>
                        </div>
                        <p className="num mt-0.5 text-[11px] text-muted">{item.categoryCode}</p>
                      </div>

                      <div className="flex items-start gap-4 sm:gap-7">
                        <div className="text-right">
                          <p className="text-[10px] text-muted">Anggaran</p>
                          <Amount value={item.amount} className="text-xs font-medium" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted">Realisasi</p>
                          <Amount value={item.actual} className="text-xs font-medium" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted">Sisa</p>
                          <Amount value={item.remaining} signed className="text-xs font-medium" />
                        </div>
                        <button
                          type="button"
                          className="icon-btn h-8 w-8 text-faint hover:bg-negative-soft hover:text-negative"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Hapus anggaran ${item.categoryName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={ratio} tone={tone} label={`Realisasi anggaran ${item.categoryName}`} />
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                        <span>{fmtPct(ratio)} terpakai</span>
                        <span>{fmtMoney(item.amount)} batas</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-end gap-6 border-t border-line bg-surface-2 px-5 py-3.5 text-xs">
              <span className="text-muted">
                Anggaran <Amount value={totals.budget} className="ml-1 font-semibold" />
              </span>
              <span className="text-muted">
                Realisasi <Amount value={totals.actual} className="ml-1 font-semibold" />
              </span>
              <span className="text-muted">
                Sisa <Amount value={remaining} signed className="ml-1 font-semibold" />
              </span>
            </div>
          </>
        )}
      </Panel>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Anggaran kategori"
        description={`Berlaku untuk ${periodLabel(period)}. Anggaran yang sudah ada akan diperbarui.`}
      >
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Kategori beban" required>
            <select className="input" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              <option value="">— pilih kategori —</option>
              {coa
                .filter((category) => category.type === 'EXPENSE' && category.parentCode)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.code} · {category.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Jumlah anggaran" required>
            <input
              className="input num"
              type="number"
              inputMode="decimal"
              min="0"
              required
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              placeholder="0"
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={upsert.isPending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={upsert.isPending}>
              {upsert.isPending && <Spinner size={15} />}
              Simpan anggaran
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Hapus anggaran ${deleteTarget.categoryName}?` : 'Hapus anggaran?'}
        description="Anggaran kategori ini akan dihapus dari periode berjalan. Transaksi dan jurnal tidak berubah."
        confirmLabel="Hapus anggaran"
        pending={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
