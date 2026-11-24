import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAssets, useBonds, useCouponHistory, useCoupons, useCreateBond } from '../api/queries';
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

const FREQUENCY_LABEL: Record<string, string> = {
  MONTHLY: 'Bulanan',
  QUARTERLY: 'Triwulan',
  SEMI_ANNUAL: 'Semesteran',
  ANNUAL: 'Tahunan',
};

export function BondsPage() {
  const bonds = useBonds();
  const assets = useAssets();
  const create = useCreateBond();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: '',
    issuer: '',
    bondType: 'ORI',
    nominalValue: '',
    couponRate: '',
    taxRate: '10',
    frequency: 'MONTHLY',
    settlementDate: '',
    maturityDate: '',
  });
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (bonds.isLoading) return <Loading rows={6} />;
  if (bonds.isError) return <ErrorState title="Obligasi tidak dapat dimuat" onRetry={() => bonds.refetch()} />;

  const data = bonds.data ?? [];
  const nominal = data.reduce((sum, bond) => sum + Number(bond.nominalValue), 0);
  const nextCoupon = data
    .flatMap((bond) => bond.schedule.filter((coupon) => coupon.status === 'UPCOMING').map((coupon) => ({ ...coupon, code: bond.assetCode })))
    .sort((left, right) => left.paymentDate.localeCompare(right.paymentDate))[0];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        ...form,
        assetId: Number(form.assetId),
        nominalValue: Number(form.nominalValue),
        couponRate: Number(form.couponRate),
        taxRate: Number(form.taxRate),
      });
      setOpen(false);
      setForm({
        assetId: '',
        issuer: '',
        bondType: 'ORI',
        nominalValue: '',
        couponRate: '',
        taxRate: '10',
        frequency: 'MONTHLY',
        settlementDate: '',
        maturityDate: '',
      });
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Investasi"
        title="Obligasi"
        subtitle="Jadwal kupon dihitung dari nominal, kupon, frekuensi, settlement, dan jatuh tempo."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Obligasi baru
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Jumlah obligasi" value={String(data.length)} hint="Seri tercatat" />
        <Stat label="Total nominal" value={fmtMoney(nominal, cur)} hint="Nilai pokok" />
        <Stat label="Kupon berikutnya" value={nextCoupon ? fmtDate(nextCoupon.paymentDate) : '–'} hint={nextCoupon?.code ?? 'Belum ada jadwal'} />
        <Stat label="Kupon berikut (neto)" value={nextCoupon ? fmtMoney(nextCoupon.net, cur) : '–'} hint="Setelah pajak" />
      </div>

      <Panel title="Daftar obligasi" subtitle="Kupon berikut diambil dari jadwal terdekat" flush>
        <Table
          rows={data}
          keyOf={(bond) => bond.id}
          sortable
          caption="Daftar obligasi"
          empty="Belum ada obligasi"
          emptyHint="Daftarkan aset bertipe obligasi lalu tambahkan seri obligasinya di sini."
          cols={[
            {
              h: 'Kode',
              cell: (bond) => (
                <div className="min-w-0">
                  <p className="font-medium text-ink">{bond.assetCode}</p>
                  <p className="truncate text-[11px] text-muted">{bond.assetName}</p>
                </div>
              ),
              sortValue: (bond) => bond.assetCode,
            },
            {
              h: 'Penerbit',
              mobile: false,
              cell: (bond) => <span className="text-xs text-muted">{bond.issuer ?? '–'}</span>,
              sortValue: (bond) => bond.issuer ?? '',
            },
            {
              h: 'Nominal',
              right: true,
              cell: (bond) => <Amount value={bond.nominalValue} currency="IDR" />,
              sortValue: (bond) => Number(bond.nominalValue),
            },
            { h: 'Kupon', right: true, cell: (bond) => fmtPct(bond.couponRate), sortValue: (bond) => Number(bond.couponRate) },
            {
              h: 'Frekuensi',
              mobile: false,
              cell: (bond) => <Pill>{FREQUENCY_LABEL[bond.frequency]}</Pill>,
              sortValue: (bond) => bond.frequency,
            },
            {
              h: 'Settlement',
              mobile: false,
              cell: (bond) => fmtDate(bond.settlementDate),
              sortValue: (bond) => bond.settlementDate,
            },
            {
              h: 'Jatuh tempo',
              cell: (bond) => fmtDate(bond.maturityDate),
              sortValue: (bond) => bond.maturityDate,
            },
            {
              h: 'Kupon berikut',
              right: true,
              cell: (bond) => {
                const next = bond.schedule.find((coupon) => coupon.status === 'UPCOMING');
                return next ? (
                  <div>
                    <p className="text-xs text-ink">{fmtDate(next.paymentDate)}</p>
                    <p className="num text-[11px] text-muted">{fmtMoney(next.net, 'IDR')}</p>
                  </div>
                ) : (
                  '–'
                );
              },
              sortValue: (bond) => bond.schedule.find((coupon) => coupon.status === 'UPCOMING')?.paymentDate ?? '',
            },
          ]}
        />
      </Panel>

      <Drawer open={open} onClose={() => setOpen(false)} title="Obligasi baru" description="Pilih aset bertipe obligasi yang sudah terdaftar.">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Aset obligasi" required>
              <select className="input" required value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })}>
                <option value="">— pilih aset —</option>
                {(assets.data ?? [])
                  .filter((asset) => asset.assetType === 'BOND')
                  .map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.code} · {asset.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Penerbit">
              <input className="input" value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} placeholder="Contoh: Pemerintah RI" />
            </Field>
            <Field label="Nominal" required>
              <input className="input num" type="number" inputMode="decimal" min="0" required value={form.nominalValue} onChange={(event) => setForm({ ...form, nominalValue: event.target.value })} />
            </Field>
            <Field label="Kupon % per tahun" required>
              <input className="input num" type="number" inputMode="decimal" step="any" min="0" required value={form.couponRate} onChange={(event) => setForm({ ...form, couponRate: event.target.value })} />
            </Field>
            <Field label="Pajak kupon %">
              <input className="input num" type="number" inputMode="decimal" step="any" min="0" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} />
            </Field>
            <Field label="Frekuensi" required>
              <select className="input" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
                {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Settlement" required>
              <input className="input" type="date" required value={form.settlementDate} onChange={(event) => setForm({ ...form, settlementDate: event.target.value })} />
            </Field>
            <Field label="Jatuh tempo" required>
              <input className="input" type="date" required value={form.maturityDate} onChange={(event) => setForm({ ...form, maturityDate: event.target.value })} />
            </Field>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>
              {create.isPending && <Spinner size={15} />}
              Simpan obligasi
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
}

export function CouponsPage() {
  const coupons = useCoupons();
  const history = useCouponHistory();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (coupons.isLoading) return <Loading rows={6} />;
  if (coupons.isError) return <ErrorState title="Kupon tidak dapat dimuat" onRetry={() => coupons.refetch()} />;

  const rows = coupons.data ?? [];
  const paid = rows.filter((coupon) => coupon.status === 'PAID');
  const upcoming = rows.filter((coupon) => coupon.status === 'UPCOMING');
  const upcomingNet = upcoming.reduce((sum, coupon) => sum + Number(coupon.net), 0);
  const paidNet = paid.reduce((sum, coupon) => sum + Number(coupon.net), 0);
  const tax = rows.reduce((sum, coupon) => sum + Number(coupon.tax), 0);

  return (
    <>
      <PageHeader
        eyebrow="Investasi"
        title="Kupon"
        subtitle="Jadwal kupon merupakan derivasi; kupon yang sudah diterima berasal dari transaksi."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Kupon akan datang" value={String(upcoming.length)} hint={fmtMoney(upcomingNet, cur)} />
        <Stat label="Kupon terbayar" value={String(paid.length)} hint={fmtMoney(paidNet, cur)} />
        <Stat label="Total pajak kupon" value={fmtMoney(tax, cur)} hint="Seluruh jadwal" />
        <Stat label="Total neto" value={fmtMoney(upcomingNet + paidNet, cur)} hint="Setelah pajak" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Jadwal kupon" subtitle="Perkiraan pembayaran berikutnya" flush>
          <Table
            rows={upcoming}
            keyOf={(coupon) => `${coupon.bondId}-${coupon.paymentDate}`}
            sortable
            caption="Jadwal kupon"
            empty="Tidak ada kupon mendatang"
            emptyHint="Tambahkan obligasi untuk membentuk jadwal kupon."
            cols={[
              { h: 'Tanggal', cell: (coupon) => fmtDate(coupon.paymentDate), sortValue: (coupon) => coupon.paymentDate },
              { h: 'Obligasi', cell: (coupon) => <span className="font-medium text-ink">{coupon.assetCode}</span>, sortValue: (coupon) => coupon.assetCode },
              { h: 'Bruto', right: true, mobile: false, cell: (coupon) => <Amount value={coupon.gross} />, sortValue: (coupon) => Number(coupon.gross) },
              { h: 'Pajak', right: true, mobile: false, cell: (coupon) => <Amount value={coupon.tax} />, sortValue: (coupon) => Number(coupon.tax) },
              { h: 'Neto', right: true, cell: (coupon) => <Amount value={coupon.net} className="font-medium" />, sortValue: (coupon) => Number(coupon.net) },
              { h: 'Status', cell: () => <Pill tone="amber" dot>Akan datang</Pill> },
            ]}
          />
        </Panel>

        <Panel title="Kupon diterima" subtitle="Transaksi yang sudah diposting" flush>
          {history.isLoading ? (
            <Loading rows={4} />
          ) : history.isError ? (
            <ErrorState title="Riwayat kupon tidak dapat dimuat" onRetry={() => history.refetch()} />
          ) : (
            <Table
              rows={history.data ?? []}
              keyOf={(transaction) => transaction.id}
              sortable
              caption="Kupon diterima"
              empty="Belum ada kupon diterima"
              emptyHint="Catat penerimaan kupon lewat halaman Transaksi."
              cols={[
                { h: 'Tanggal', cell: (transaction) => fmtDate(transaction.transactionDate), sortValue: (transaction) => transaction.transactionDate },
                { h: 'Obligasi', cell: (transaction) => <span className="font-medium text-ink">{transaction.assetCode ?? '–'}</span>, sortValue: (transaction) => transaction.assetCode ?? '' },
                { h: 'Bruto', right: true, mobile: false, cell: (transaction) => <Amount value={transaction.grossAmount} />, sortValue: (transaction) => Number(transaction.grossAmount) },
                { h: 'Pajak', right: true, mobile: false, cell: (transaction) => <Amount value={transaction.tax} />, sortValue: (transaction) => Number(transaction.tax) },
                { h: 'Neto', right: true, cell: (transaction) => <Amount value={transaction.netAmount} className="font-medium" />, sortValue: (transaction) => Number(transaction.netAmount) },
                { h: 'Akun', mobile: false, cell: (transaction) => <span className="text-xs text-muted">{transaction.accountName}</span> },
              ]}
            />
          )}
        </Panel>
      </div>
    </>
  );
}
