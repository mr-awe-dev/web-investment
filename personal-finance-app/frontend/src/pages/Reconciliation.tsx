import { useState, type FormEvent } from 'react';
import { Scale } from 'lucide-react';
import { useAccounts, useCreateReconciliation, useReconciliations } from '../api/queries';
import {
  Alert,
  Amount,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  Panel,
  Pill,
  Spinner,
  Stat,
  Table,
} from '../components/ui';
import { fmtDate } from '../lib/format';
import { useAuth } from '../lib/auth';
import type { Reconciliation } from '../types/domain';

const STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  RECONCILED: { label: 'Cocok', tone: 'green' },
  PENDING_REVIEW: { label: 'Menunggu tinjauan', tone: 'amber' },
  DIFFERENCE_FOUND: { label: 'Selisih', tone: 'red' },
};

export default function ReconciliationPage() {
  const reconciliations = useReconciliations();
  const accounts = useAccounts();
  const reconcile = useCreateReconciliation();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  const [form, setForm] = useState({ accountId: '', actualBalance: '', notes: '' });
  const [outcome, setOutcome] = useState<Reconciliation | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (reconciliations.isLoading) return <Loading rows={6} />;
  if (reconciliations.isError) return <ErrorState title="Rekonsiliasi tidak dapat dimuat" onRetry={() => reconciliations.refetch()} />;

  const data = reconciliations.data ?? [];
  const matched = data.filter((item) => item.status === 'RECONCILED').length;
  const difference = data.filter((item) => item.status === 'DIFFERENCE_FOUND').length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setOutcome(null);
    try {
      const created = await reconcile.mutateAsync({
        accountId: Number(form.accountId),
        actualBalance: Number(form.actualBalance),
        notes: form.notes || undefined,
      });
      setOutcome(created);
      setForm({ accountId: '', actualBalance: '', notes: '' });
      await reconciliations.refetch();
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Kontrol"
        title="Rekonsiliasi"
        subtitle="Saldo buku dibandingkan dengan saldo aktual akun, lalu selisih dicatat ke jurnal penyesuaian."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total rekonsiliasi" value={String(data.length)} hint="Seluruh riwayat" />
        <Stat label="Cocok" value={String(matched)} hint={`${data.length - matched} perlu perhatian`} />
        <Stat label="Selisih ditemukan" value={String(difference)} hint="Sudah disesuaikan" />
        <Stat
          label="Terakhir"
          value={data[0] ? fmtDate(data[0].reconciliationDate) : '–'}
          hint={data[0]?.accountName ?? 'Belum pernah'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Panel title="Rekonsiliasi baru" subtitle="Catat saldo aktual akun">
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Akun" required>
                <select
                  className="input"
                  required
                  value={form.accountId}
                  onChange={(event) => setForm({ ...form, accountId: event.target.value })}
                  disabled={accounts.isLoading}
                >
                  <option value="">— pilih akun —</option>
                  {(accounts.data ?? [])
                    .filter((account) => account.active)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Saldo aktual" required>
                <input
                  className="input num"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  required
                  value={form.actualBalance}
                  onChange={(event) => setForm({ ...form, actualBalance: event.target.value })}
                  placeholder="0"
                />
              </Field>
              <Field label="Catatan">
                <textarea
                  className="input min-h-20 resize-y"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Contoh: saldo rekening koran per akhir bulan"
                />
              </Field>

              {error && <Alert tone="error">{error}</Alert>}
              {outcome && (
                <Alert tone={outcome.status === 'RECONCILED' ? 'success' : 'info'}>
                  <strong className="font-medium">{STATUS[outcome.status]?.label ?? outcome.status}.</strong> Saldo buku{' '}
                  <Amount value={outcome.systemBalance} currency={cur} className="mx-0.5" />, selisih{' '}
                  <Amount value={outcome.difference} signed currency={cur} className="mx-0.5" />.
                </Alert>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={reconcile.isPending}>
                {reconcile.isPending ? <Spinner size={15} /> : <Scale size={16} aria-hidden="true" />}
                Jalankan rekonsiliasi
              </button>
              <p className="text-[11px] leading-relaxed text-muted">
                Selisih di luar nol diposting ke akun penyesuaian agar buku tetap seimbang.
              </p>
            </form>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Riwayat rekonsiliasi" subtitle="Urut dari yang terbaru" flush>
            <Table
              rows={data}
              keyOf={(item) => item.id}
              sortable
              caption="Riwayat rekonsiliasi"
              empty="Belum ada rekonsiliasi"
              emptyHint="Mulai dengan mencocokkan saldo satu akun di formulir samping."
              cols={[
                {
                  h: 'Tanggal',
                  cell: (item) => fmtDate(item.reconciliationDate),
                  sortValue: (item) => item.reconciliationDate,
                },
                { h: 'Akun', cell: (item) => <span className="font-medium text-ink">{item.accountName}</span>, sortValue: (item) => item.accountName },
                { h: 'Saldo buku', right: true, mobile: false, cell: (item) => <Amount value={item.systemBalance} />, sortValue: (item) => Number(item.systemBalance) },
                { h: 'Saldo aktual', right: true, cell: (item) => <Amount value={item.actualBalance} />, sortValue: (item) => Number(item.actualBalance) },
                {
                  h: 'Selisih',
                  right: true,
                  cell: (item) => <Amount value={item.difference} signed className="font-medium" />,
                  sortValue: (item) => Number(item.difference),
                },
                {
                  h: 'Status',
                  cell: (item) => {
                    const status = STATUS[item.status] ?? STATUS.PENDING_REVIEW;
                    return (
                      <Pill tone={status.tone} dot>
                        {status.label}
                      </Pill>
                    );
                  },
                  sortValue: (item) => item.status,
                },
              ]}
            />
            {data.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                <span className="text-xs text-muted">Total selisih tercatat</span>
                <Amount
                  value={data.reduce((sum, item) => sum + Number(item.difference), 0)}
                  signed
                  className="font-semibold"
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
