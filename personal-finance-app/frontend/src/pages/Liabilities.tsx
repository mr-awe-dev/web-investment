import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useCreateLiability, useLiabilities } from '../api/queries';
import {
  Alert,
  Amount,
  Drawer,
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
import { fmtDate, fmtMoney, fmtPct } from '../lib/format';
import { useAuth } from '../lib/auth';

const TYPE_LABEL: Record<string, string> = { LOAN: 'Pinjaman', CREDIT_CARD: 'Kartu kredit', OTHER: 'Utang lain' };

export default function LiabilitiesPage() {
  const liabilities = useLiabilities();
  const create = useCreateLiability();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    creditor: '',
    liabilityType: 'LOAN',
    currency: 'IDR',
    interestRate: '',
    tenorMonths: '',
    installment: '',
    dueDate: '',
  });
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (liabilities.isLoading) return <Loading rows={6} />;
  if (liabilities.isError) return <ErrorState title="Liabilitas tidak dapat dimuat" onRetry={() => liabilities.refetch()} />;

  const data = liabilities.data ?? [];
  const total = data.reduce((sum, item) => sum + Number(item.outstanding), 0);
  const active = data.filter((item) => item.status === 'ACTIVE');
  const installment = active.reduce((sum, item) => sum + Number(item.installment ?? 0), 0);
  const nextDue = active
    .map((item) => item.dueDate)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        ...form,
        interestRate: form.interestRate || '0',
        tenorMonths: form.tenorMonths ? Number(form.tenorMonths) : undefined,
        installment: form.installment || undefined,
        dueDate: form.dueDate || undefined,
      } as never);
      setOpen(false);
      setForm({
        name: '',
        creditor: '',
        liabilityType: 'LOAN',
        currency: 'IDR',
        interestRate: '',
        tenorMonths: '',
        installment: '',
        dueDate: '',
      });
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Portofolio"
        title="Liabilitas"
        subtitle="Sisa pokok diturunkan dari jurnal pinjaman dan pembayaran pokok."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Liabilitas baru
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total sisa pokok" value={fmtMoney(total, cur)} hint={`${data.length} liabilitas`} />
        <Stat label="Liabilitas aktif" value={String(active.length)} hint={`${data.length - active.length} lunas`} />
        <Stat label="Total cicilan" value={fmtMoney(installment, cur)} hint="Per bulan, liabilitas aktif" />
        <Stat label="Jatuh tempo terdekat" value={nextDue ? fmtDate(nextDue) : '–'} hint="Liabilitas aktif" />
      </div>

      <Panel title="Daftar utang" subtitle="Bunga dalam persen per tahun" flush>
        <Table
          rows={data}
          keyOf={(item) => item.id}
          sortable
          caption="Daftar liabilitas"
          empty="Belum ada liabilitas"
          emptyHint="Catat pinjaman atau kartu kredit untuk memantau sisa pokok dan cicilan."
          cols={[
            {
              h: 'Nama',
              cell: (item) => (
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-[11px] text-muted">{item.creditor ?? 'Tanpa kreditur'}</p>
                </div>
              ),
              sortValue: (item) => item.name,
            },
            {
              h: 'Jenis',
              cell: (item) => <Pill>{TYPE_LABEL[item.liabilityType]}</Pill>,
              sortValue: (item) => item.liabilityType,
            },
            { h: 'Bunga', right: true, cell: (item) => fmtPct(item.interestRate), sortValue: (item) => Number(item.interestRate) },
            {
              h: 'Tenor',
              right: true,
              mobile: false,
              cell: (item) => (item.tenorMonths ? `${item.tenorMonths} bln` : '–'),
              sortValue: (item) => item.tenorMonths ?? 0,
            },
            {
              h: 'Cicilan',
              right: true,
              mobile: false,
              cell: (item) => (item.installment ? <Amount value={item.installment} currency={item.currency} /> : '–'),
              sortValue: (item) => Number(item.installment ?? 0),
            },
            {
              h: 'Jatuh tempo',
              mobile: false,
              cell: (item) => (item.dueDate ? fmtDate(item.dueDate) : '–'),
              sortValue: (item) => item.dueDate ?? '',
            },
            {
              h: 'Sisa pokok',
              right: true,
              cell: (item) => <Amount value={item.outstanding} currency={item.currency} className="font-semibold text-negative" />,
              sortValue: (item) => Number(item.outstanding),
            },
            {
              h: 'Status',
              cell: (item) => (
                <Pill tone={item.status === 'ACTIVE' ? 'amber' : 'green'} dot>
                  {item.status === 'ACTIVE' ? 'Aktif' : 'Lunas'}
                </Pill>
              ),
              sortValue: (item) => item.status,
            },
          ]}
        />
        {data.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-xs text-muted">Total liabilitas</span>
            <Amount value={total} currency={cur} className="font-semibold" />
          </div>
        )}
      </Panel>

      <Drawer open={open} onClose={() => setOpen(false)} title="Liabilitas baru" description="Liabilitas baru mendapat kode buku besar otomatis.">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama" required>
              <input className="input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: KPR Rumah" />
            </Field>
            <Field label="Kreditur">
              <input className="input" value={form.creditor} onChange={(event) => setForm({ ...form, creditor: event.target.value })} placeholder="Contoh: Bank Mandiri" />
            </Field>
            <Field label="Jenis" required>
              <select className="input" value={form.liabilityType} onChange={(event) => setForm({ ...form, liabilityType: event.target.value })}>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mata uang" required>
              <input className="input" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
            </Field>
            <Field label="Bunga % per tahun">
              <input
                className="input num"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={form.interestRate}
                onChange={(event) => setForm({ ...form, interestRate: event.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Tenor (bulan)">
              <input className="input num" type="number" inputMode="numeric" min="0" value={form.tenorMonths} onChange={(event) => setForm({ ...form, tenorMonths: event.target.value })} />
            </Field>
            <Field label="Cicilan per bulan">
              <input className="input num" type="number" inputMode="decimal" min="0" value={form.installment} onChange={(event) => setForm({ ...form, installment: event.target.value })} />
            </Field>
            <Field label="Jatuh tempo berikut">
              <input className="input" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </Field>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>
              {create.isPending && <Spinner size={15} />}
              Simpan liabilitas
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
