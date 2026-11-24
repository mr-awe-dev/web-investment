import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Plus, Search } from 'lucide-react';
import {
  exportTransactionsCsv,
  useAccounts,
  useAssets,
  useChartOfAccounts,
  useCreateTransaction,
  useDeleteTransaction,
  useLiabilities,
  useLots,
  useTransaction,
  useTransactions,
  useUpdateTransaction,
  type TxFilter,
} from '../api/queries';
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
  Spinner,
  Table,
  type PillTone,
} from '../components/ui';
import { CF_LABEL, fmtDate, fmtQty, TX_LABEL } from '../lib/format';
import type { Transaction, TransactionDetail, TransactionInput, TransactionType } from '../types/domain';

const TYPES = Object.keys(TX_LABEL) as TransactionType[];
const QTY_TYPES: TransactionType[] = ['BUY_INVESTMENT', 'SELL_INVESTMENT', 'ASSET_PURCHASE', 'ASSET_SALE'];
const ASSET_TYPES: TransactionType[] = [...QTY_TYPES, 'DIVIDEND', 'COUPON'];
const FEE_TYPES: TransactionType[] = [...QTY_TYPES, 'DIVIDEND', 'COUPON', 'EXPENSE', 'TRANSFER', 'DEBT_PAYMENT'];

const INFLOW_TYPES: TransactionType[] = [
  'INCOME',
  'SELL_INVESTMENT',
  'DIVIDEND',
  'COUPON',
  'INTEREST',
  'LOAN',
  'ASSET_SALE',
  'OPENING_BALANCE',
];

/** Dynamic transaction form: fields shown depend on the selected type; all totals are computed by the backend. */
export function TransactionForm({ initial, onDone }: { initial?: Transaction; onDone: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: assets = [] } = useAssets();
  const { data: coa = [] } = useChartOfAccounts();
  const { data: liabilities = [] } = useLiabilities();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
  } = useForm<TransactionInput>({
    defaultValues: initial
      ? {
          ...initial,
          quantity: num(initial.quantity),
          unitPrice: num(initial.unitPrice),
          grossAmount: num(initial.grossAmount),
          adminFee: num(initial.adminFee),
          brokerFee: num(initial.brokerFee),
          levy: num(initial.levy),
          tax: num(initial.tax),
          interestAmount: num(initial.interestAmount),
          exchangeRate: num(initial.exchangeRate),
        }
      : { type: 'EXPENSE', transactionDate: new Date().toISOString().slice(0, 10), currency: 'IDR', exchangeRate: 1 },
  });
  const type = watch('type');
  const assetId = watch('assetId');
  const { data: lots = [] } = useLots(
    type === 'SELL_INVESTMENT' || type === 'ASSET_SALE' ? Number(assetId) || undefined : undefined,
  );
  const qty = QTY_TYPES.includes(type);
  const categories = coa.filter((category) => category.parentCode && category.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));
  const pending = create.isPending || update.isPending;

  const submit = async (form: TransactionInput) => {
    setError(null);
    const body: TransactionInput = {
      ...form,
      accountId: Number(form.accountId),
      destinationAccountId: opt(form.destinationAccountId),
      categoryId: opt(form.categoryId),
      assetId: opt(form.assetId),
      liabilityId: opt(form.liabilityId),
      quantity: opt(form.quantity),
      unitPrice: opt(form.unitPrice),
      grossAmount: qty ? undefined : opt(form.grossAmount),
      adminFee: opt(form.adminFee),
      brokerFee: opt(form.brokerFee),
      levy: opt(form.levy),
      tax: opt(form.tax),
      interestAmount: opt(form.interestAmount),
      exchangeRate: opt(form.exchangeRate),
      quantityUnit: qty ? form.quantityUnit : undefined,
      lotIds: (form.lotIds as unknown as string[] | undefined)?.map(Number).filter(Boolean),
    };
    try {
      if (initial) await update.mutateAsync({ ...body, id: initial.id });
      else await create.mutateAsync(body);
      onDone();
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipe transaksi" required>
          <select className="input" {...register('type')}>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {TX_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal" required>
          <input className="input" type="date" required {...register('transactionDate')} />
        </Field>
        <Field
          label={
            type === 'TRANSFER'
              ? 'Akun sumber'
              : INFLOW_TYPES.includes(type)
                ? 'Akun penerima'
                : 'Akun'
          }
          required
        >
          <select className="input" required {...register('accountId')}>
            <option value="">— pilih akun —</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        {type === 'TRANSFER' && (
          <Field label="Akun tujuan" required>
            <select className="input" required {...register('destinationAccountId')}>
              <option value="">— pilih akun —</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {(type === 'INCOME' || type === 'EXPENSE') && (
          <Field label="Kategori" required>
            <select className="input" required {...register('categoryId')}>
              <option value="">— pilih kategori —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.code} · {category.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {ASSET_TYPES.includes(type) && (
          <Field label="Aset" required>
            <select className="input" required {...register('assetId')}>
              <option value="">— pilih aset —</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.code} · {asset.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {(type === 'LOAN' || type === 'DEBT_PAYMENT') && (
          <Field label="Liabilitas" required>
            <select className="input" required {...register('liabilityId')}>
              <option value="">— pilih liabilitas —</option>
              {liabilities.map((liability) => (
                <option key={liability.id} value={liability.id}>
                  {liability.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="panel-title mb-3">Nilai transaksi</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {qty ? (
            <>
              <Field label="Kuantitas" required>
                <input className="input num" type="number" inputMode="decimal" step="any" min="0" required {...register('quantity')} />
              </Field>
              <Field label="Unit kuantitas">
                <select className="input" {...register('quantityUnit')}>
                  {['SHARE', 'LOT', 'UNIT', 'GRAM', 'SHEET', 'KG', 'LITER', 'METER', 'PIECE', 'OTHER'].map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </Field>
              <Field label="Harga satuan" required>
                <input className="input num" type="number" inputMode="decimal" step="any" min="0" required {...register('unitPrice')} />
              </Field>
            </>
          ) : (
            <Field label={type === 'DEBT_PAYMENT' ? 'Pokok' : 'Jumlah bruto'} required>
              <input className="input num" type="number" inputMode="decimal" step="any" min="0" required {...register('grossAmount')} />
            </Field>
          )}
          {type === 'DEBT_PAYMENT' && (
            <Field label="Bunga">
              <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('interestAmount')} />
            </Field>
          )}
          {FEE_TYPES.includes(type) && (
            <>
              <Field label="Biaya admin">
                <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('adminFee')} />
              </Field>
              {qty && (
                <Field label="Biaya broker">
                  <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('brokerFee')} />
                </Field>
              )}
              {qty && (
                <Field label="Levy">
                  <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('levy')} />
                </Field>
              )}
            </>
          )}
          {!['TRANSFER', 'LOAN', 'OPENING_BALANCE', 'FEE', 'TAX'].includes(type) && (
            <Field label="Pajak">
              <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('tax')} />
            </Field>
          )}
          <Field label="Mata uang">
            <input className="input" maxLength={3} {...register('currency')} />
          </Field>
          <Field label="Kurs ke mata uang dasar">
            <input className="input num" type="number" inputMode="decimal" step="any" min="0" {...register('exchangeRate')} />
          </Field>
          {lots.length > 0 && (
            <div className="sm:col-span-2">
              <Field label="Lot spesifik" hint="Opsional, hanya untuk metode cost basis SPECIFIC.">
                <select className="input h-auto py-2" multiple size={4} {...register('lotIds')}>
                  {lots
                    .filter((lot) => lot.status !== 'CLOSED')
                    .map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        #{lot.id} · {fmtDate(lot.purchaseDate)} · sisa {fmtQty(lot.remainingQuantity)} @ {lot.unitCost}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="panel-title mb-3">Catatan</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Referensi">
            <input className="input" placeholder="Contoh: INV-2026-014" {...register('reference')} />
          </Field>
          <Field label="Deskripsi">
            <input className="input" placeholder="Keterangan singkat transaksi" {...register('description')} />
          </Field>
        </div>
      </section>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn btn-secondary" onClick={onDone} disabled={pending}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Spinner size={15} />}
          {initial ? 'Simpan perubahan' : 'Simpan transaksi'}
        </button>
      </div>
    </form>
  );
}

const num = (value?: string) => (value == null ? undefined : Number(value));
const opt = (value: unknown) => (value === '' || value == null || Number.isNaN(Number(value)) ? undefined : Number(value));

/** Transaction detail: the transparent accounting trail (journal, portfolio, cash flow, P/L, lots). */
export function TransactionDetailView({ detail }: { detail: TransactionDetail }) {
  const transaction = detail.transaction;
  const meta: [string, string][] = [
    ['Tipe', TX_LABEL[transaction.type]],
    ['Tanggal', fmtDate(transaction.transactionDate)],
    ['Akun', transaction.accountName + (transaction.destinationAccountName ? ` → ${transaction.destinationAccountName}` : '')],
    ['Kategori / aset / liabilitas', transaction.categoryName ?? transaction.assetCode ?? transaction.liabilityName ?? '–'],
    ['Kuantitas', transaction.quantity ? fmtQty(transaction.quantity, transaction.quantityUnit) : '–'],
    ['Harga satuan', transaction.unitPrice ? fmtQty(transaction.unitPrice) : '–'],
    ['Mata uang / kurs', `${transaction.currency} @ ${transaction.exchangeRate}`],
    ['Referensi', transaction.reference ?? '–'],
    ['Deskripsi', transaction.description ?? '–'],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Status transaksi</p>
        <Pill tone={transaction.status === 'POSTED' ? 'green' : 'slate'} dot>
          {transaction.status === 'POSTED' ? 'Terposting' : 'Dibatalkan'}
        </Pill>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {meta.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="mt-0.5 truncate text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <Panel title="Rincian nilai" flush>
        <table className="w-full text-sm">
          <caption className="sr-only">Rincian nilai transaksi</caption>
          <tbody>
            <tr className="border-b border-line">
              <td className="px-5 py-2.5 text-muted">Bruto</td>
              <td className="px-5 py-2.5 text-right">
                <Amount value={transaction.grossAmount} currency={transaction.currency} />
              </td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-5 py-2.5 text-muted">Biaya admin / broker / levy</td>
              <td className="px-5 py-2.5 text-right">
                <Amount
                  value={Number(transaction.adminFee) + Number(transaction.brokerFee) + Number(transaction.levy)}
                  currency={transaction.currency}
                />
              </td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-5 py-2.5 text-muted">Pajak</td>
              <td className="px-5 py-2.5 text-right">
                <Amount value={transaction.tax} currency={transaction.currency} />
              </td>
            </tr>
            {Number(transaction.interestAmount) > 0 && (
              <tr className="border-b border-line">
                <td className="px-5 py-2.5 text-muted">Bunga</td>
                <td className="px-5 py-2.5 text-right">
                  <Amount value={transaction.interestAmount} currency={transaction.currency} />
                </td>
              </tr>
            )}
            <tr className="bg-surface-2">
              <td className="px-5 py-3 font-medium text-ink">
                {INFLOW_TYPES.includes(transaction.type) ? 'Neto diterima' : 'Total'}
              </td>
              <td className="px-5 py-3 text-right">
                <Amount value={transaction.netAmount} currency={transaction.currency} className="font-semibold" />
              </td>
            </tr>
            {transaction.costBasis && (
              <tr className="border-t border-line">
                <td className="px-5 py-2.5 text-muted">Cost basis</td>
                <td className="px-5 py-2.5 text-right">
                  <Amount value={transaction.costBasis} currency={transaction.currency} />
                </td>
              </tr>
            )}
            {transaction.realizedPl && (
              <tr className="border-t border-line">
                <td className="px-5 py-2.5 text-muted">Laba realisasi</td>
                <td className="px-5 py-2.5 text-right">
                  <Amount value={transaction.realizedPl} currency={transaction.currency} signed />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Dampak akuntansi" subtitle="Jurnal double-entry" flush>
        <Table
          rows={detail.journalEntries}
          keyOf={(entry) => entry.ledgerCode + entry.debit + entry.credit}
          caption="Jurnal transaksi"
          empty="Tidak ada jurnal (transaksi dibatalkan)"
          cols={[
            { h: 'Akun', cell: (entry) => `${entry.ledgerCode} · ${entry.ledgerName}` },
            {
              h: 'Debit',
              right: true,
              cell: (entry) => (Number(entry.debit) ? <Amount value={entry.debit} currency={transaction.baseCurrency} /> : ''),
            },
            {
              h: 'Kredit',
              right: true,
              cell: (entry) => (Number(entry.credit) ? <Amount value={entry.credit} currency={transaction.baseCurrency} /> : ''),
            },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-2 p-3.5">
          <p className="text-[11px] text-muted">Portofolio</p>
          <p className="num mt-1 text-sm font-medium text-ink">
            {detail.portfolioQuantityImpact
              ? `${Number(detail.portfolioQuantityImpact) > 0 ? '+' : ''}${fmtQty(detail.portfolioQuantityImpact, transaction.quantityUnit)}`
              : '–'}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-3.5">
          <p className="text-[11px] text-muted">Arus kas · {CF_LABEL[detail.cashFlowCategory]}</p>
          <p className="mt-1">
            <Amount value={detail.cashFlowImpact} currency={transaction.baseCurrency} signed className="text-sm font-medium" />
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-3.5">
          <p className="text-[11px] text-muted">Laba realisasi</p>
          <p className="mt-1">
            <Amount value={detail.realizedPl ?? 0} currency={transaction.currency} signed className="text-sm font-medium" />
          </p>
        </div>
      </div>

      {detail.lotConsumptions.length > 0 && (
        <Panel title="Lot yang terpakai" flush>
          <Table
            rows={detail.lotConsumptions}
            keyOf={(consumption) => consumption.lotId}
            caption="Lot yang terpakai"
            cols={[
              { h: 'Lot', cell: (consumption) => `#${consumption.lotId}` },
              { h: 'Tanggal beli', cell: (consumption) => fmtDate(consumption.lotPurchaseDate) },
              { h: 'Kuantitas', right: true, cell: (consumption) => fmtQty(consumption.quantity) },
              {
                h: 'Cost basis',
                right: true,
                cell: (consumption) => <Amount value={consumption.costBasis} currency={transaction.currency} />,
              },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}

const TYPE_TONE = (transaction: Transaction): PillTone =>
  transaction.type === 'TRANSFER' ? 'slate' : INFLOW_TYPES.includes(transaction.type) ? 'green' : 'red';

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxFilter>({ page: 0, size: 20 });
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'detail'; transaction?: Transaction } | null>(null);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const query = useTransactions(filter);
  const detail = useTransaction(drawer?.mode === 'detail' ? drawer.transaction?.id : undefined);
  const { data: accounts = [] } = useAccounts();
  const remove = useDeleteTransaction();
  const pages = useMemo(() => query.data?.totalPages ?? 0, [query.data]);
  const hasFilters = Boolean(filter.search || filter.type || filter.accountId || filter.from || filter.to);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilter((current) => (current.search === (search || undefined) ? current : { ...current, search: search || undefined, page: 0 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const patch = (change: Partial<TxFilter>) => setFilter((current) => ({ ...current, ...change, page: 0 }));

  const reset = () => {
    setSearch('');
    setFilter({ page: 0, size: 20 });
  };

  const download = async () => {
    const csv = await exportTransactionsCsv(filter);
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    anchor.download = 'transaksi.csv';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    await remove.mutateAsync(voidTarget.id);
    setVoidTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Buku besar"
        title="Transaksi"
        subtitle="Setiap perubahan finansial berawal dari sini dan menghasilkan jurnal berimbang."
        action={
          <>
            <button type="button" className="btn btn-secondary" onClick={download}>
              <Download size={15} aria-hidden="true" />
              Ekspor CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setDrawer({ mode: 'create' })}>
              <Plus size={16} aria-hidden="true" />
              Transaksi
            </button>
          </>
        }
      />

      <section className="card mb-4 p-3 sm:p-4" aria-label="Filter transaksi">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative xl:col-span-4">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <label htmlFor="tx-search" className="sr-only">
              Cari transaksi
            </label>
            <input
              id="tx-search"
              className="input pl-9"
              placeholder="Cari referensi atau deskripsi"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="tx-type" className="sr-only">
              Tipe transaksi
            </label>
            <select
              id="tx-type"
              className="input"
              value={filter.type ?? ''}
              onChange={(event) => patch({ type: event.target.value || undefined })}
            >
              <option value="">Semua tipe</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {TX_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="tx-account" className="sr-only">
              Akun
            </label>
            <select
              id="tx-account"
              className="input"
              value={filter.accountId ?? ''}
              onChange={(event) => patch({ accountId: Number(event.target.value) || undefined })}
            >
              <option value="">Semua akun</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="tx-from" className="sr-only">
              Dari tanggal
            </label>
            <input
              id="tx-from"
              className="input"
              type="date"
              value={filter.from ?? ''}
              onChange={(event) => patch({ from: event.target.value || undefined })}
              aria-label="Dari tanggal"
            />
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="tx-to" className="sr-only">
              Sampai tanggal
            </label>
            <input
              id="tx-to"
              className="input"
              type="date"
              value={filter.to ?? ''}
              onChange={(event) => patch({ to: event.target.value || undefined })}
              aria-label="Sampai tanggal"
            />
          </div>
        </div>
      </section>

      <section className="card" aria-label="Daftar transaksi">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="panel-title">Daftar transaksi</h2>
            <p className="mt-0.5 text-xs text-muted">
              {query.data ? `${query.data.totalElements.toLocaleString('id-ID')} transaksi` : 'Memuat…'}
              {hasFilters ? ' · filter aktif' : ''}
            </p>
          </div>
          {hasFilters && (
            <button type="button" className="text-xs font-medium text-accent-text hover:underline" onClick={reset}>
              Bersihkan filter
            </button>
          )}
        </header>

        {query.isLoading || !query.data ? (
          <Loading rows={6} />
        ) : query.isError ? (
          <ErrorState title="Transaksi tidak dapat dimuat" onRetry={() => query.refetch()} />
        ) : (
          <>
            <Table
              rows={query.data.content}
              keyOf={(transaction) => transaction.id}
              caption="Daftar transaksi"
              sortable={false}
              empty={hasFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
              emptyHint={hasFilters ? 'Ubah kata kunci atau rentang tanggal, lalu coba lagi.' : 'Mulai dengan mencatat pemasukan, pengeluaran, atau pembelian investasi.'}
              cols={[
                { h: 'Tanggal', cell: (transaction) => fmtDate(transaction.transactionDate), w: 'whitespace-nowrap' },
                {
                  h: 'Tipe',
                  cell: (transaction) => (
                    <Pill tone={TYPE_TONE(transaction)} dot>
                      {TX_LABEL[transaction.type]}
                    </Pill>
                  ),
                },
                {
                  h: 'Akun',
                  cell: (transaction) => (
                    <span className="text-xs text-ink">
                      {transaction.accountName}
                      {transaction.destinationAccountName ? ` → ${transaction.destinationAccountName}` : ''}
                    </span>
                  ),
                },
                {
                  h: 'Kategori / aset',
                  mobile: false,
                  cell: (transaction) => (
                    <span className="text-xs text-muted">
                      {transaction.categoryName ?? transaction.assetCode ?? transaction.liabilityName ?? '–'}
                    </span>
                  ),
                },
                {
                  h: 'Kuantitas',
                  right: true,
                  mobile: false,
                  cell: (transaction) => (transaction.quantity ? fmtQty(transaction.quantity, transaction.quantityUnit) : ''),
                },
                {
                  h: 'Neto',
                  right: true,
                  cell: (transaction) => <Amount value={transaction.netAmount} currency={transaction.currency} className="font-medium" />,
                },
                {
                  h: 'Arus kas',
                  mobile: false,
                  cell: (transaction) => <span className="text-[11px] text-muted">{CF_LABEL[transaction.cashFlowCategory]}</span>,
                },
                {
                  h: 'Status',
                  cell: (transaction) => (
                    <Pill tone={transaction.status === 'POSTED' ? 'blue' : 'slate'}>
                      {transaction.status === 'POSTED' ? 'Terposting' : 'Dibatalkan'}
                    </Pill>
                  ),
                },
                {
                  h: 'Aksi',
                  right: true,
                  cell: (transaction) => (
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDrawer({ mode: 'detail', transaction })}
                        aria-label={`Lihat detail transaksi ${transaction.id}`}
                      >
                        Detail
                      </button>
                      {transaction.status === 'POSTED' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDrawer({ mode: 'edit', transaction })}
                            aria-label={`Ubah transaksi ${transaction.id}`}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setVoidTarget(transaction)}
                            aria-label={`Batalkan transaksi ${transaction.id}`}
                          >
                            Void
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {pages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
                <span>
                  Halaman {(filter.page ?? 0) + 1} dari {pages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={(filter.page ?? 0) === 0}
                    onClick={() => setFilter((current) => ({ ...current, page: Math.max(0, (current.page ?? 0) - 1) }))}
                    aria-label="Halaman sebelumnya"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={(filter.page ?? 0) + 1 >= pages}
                    onClick={() => setFilter((current) => ({ ...current, page: (current.page ?? 0) + 1 }))}
                    aria-label="Halaman berikutnya"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Drawer
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        wide
        title={
          drawer?.mode === 'create'
            ? 'Transaksi baru'
            : drawer?.mode === 'edit'
              ? `Ubah transaksi #${drawer.transaction?.id}`
              : `Detail transaksi #${drawer?.transaction?.id}`
        }
        description={drawer?.mode === 'detail' ? 'Jejak akuntansi lengkap untuk transaksi ini.' : 'Semua total dihitung oleh backend.'}
      >
        {drawer?.mode === 'detail' ? (
          detail.isLoading ? (
            <Loading rows={5} />
          ) : detail.isError || !detail.data ? (
            <ErrorState title="Detail tidak dapat dimuat" onRetry={() => detail.refetch()} />
          ) : (
            <TransactionDetailView detail={detail.data} />
          )
        ) : drawer ? (
          <TransactionForm initial={drawer.transaction} onDone={() => setDrawer(null)} />
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(voidTarget)}
        title={voidTarget ? `Batalkan transaksi #${voidTarget.id}?` : 'Batalkan transaksi?'}
        description="Jurnal dan seluruh dampaknya akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Batalkan transaksi"
        cancelLabel="Kembali"
        pending={remove.isPending}
        onConfirm={confirmVoid}
        onCancel={() => setVoidTarget(null)}
      />
    </>
  );
}
