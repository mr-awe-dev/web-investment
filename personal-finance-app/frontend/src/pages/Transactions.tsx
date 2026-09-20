import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Plus } from 'lucide-react';
import { exportTransactionsCsv, useAccounts, useAssets, useChartOfAccounts, useCreateTransaction, useDeleteTransaction, useLiabilities, useLots, useTransaction, useTransactions, useUpdateTransaction, type TxFilter } from '../api/queries';
import { Amount, Drawer, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';
import { CF_LABEL, fmtDate, fmtQty, TX_LABEL } from '../lib/format';
import type { Transaction, TransactionDetail, TransactionInput, TransactionType } from '../types/domain';

const TYPES = Object.keys(TX_LABEL) as TransactionType[];
const QTY_TYPES: TransactionType[] = ['BUY_INVESTMENT', 'SELL_INVESTMENT', 'ASSET_PURCHASE', 'ASSET_SALE'];
const ASSET_TYPES: TransactionType[] = [...QTY_TYPES, 'DIVIDEND', 'COUPON'];
const FEE_TYPES: TransactionType[] = [...QTY_TYPES, 'DIVIDEND', 'COUPON', 'EXPENSE', 'TRANSFER', 'DEBT_PAYMENT'];

/** Dynamic transaction form: fields shown depend on the selected type; all totals are computed by the backend. */
export function TransactionForm({ initial, onDone }: { initial?: Transaction; onDone: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: assets = [] } = useAssets();
  const { data: coa = [] } = useChartOfAccounts();
  const { data: liabilities = [] } = useLiabilities();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch } = useForm<TransactionInput>({
    defaultValues: initial ? { ...initial, quantity: num(initial.quantity), unitPrice: num(initial.unitPrice), grossAmount: num(initial.grossAmount), adminFee: num(initial.adminFee),
      brokerFee: num(initial.brokerFee), levy: num(initial.levy), tax: num(initial.tax), interestAmount: num(initial.interestAmount), exchangeRate: num(initial.exchangeRate) }
      : { type: 'EXPENSE', transactionDate: new Date().toISOString().slice(0, 10), currency: 'IDR', exchangeRate: 1 },
  });
  const type = watch('type');
  const assetId = watch('assetId');
  const { data: lots = [] } = useLots(type === 'SELL_INVESTMENT' || type === 'ASSET_SALE' ? Number(assetId) || undefined : undefined);
  const qty = QTY_TYPES.includes(type);
  const categories = coa.filter((c) => c.parentCode && c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));

  const submit = async (f: TransactionInput) => {
    setError(null);
    const body: TransactionInput = {
      ...f, accountId: Number(f.accountId), destinationAccountId: opt(f.destinationAccountId), categoryId: opt(f.categoryId), assetId: opt(f.assetId), liabilityId: opt(f.liabilityId),
      quantity: opt(f.quantity), unitPrice: opt(f.unitPrice), grossAmount: qty ? undefined : opt(f.grossAmount), adminFee: opt(f.adminFee), brokerFee: opt(f.brokerFee), levy: opt(f.levy),
      tax: opt(f.tax), interestAmount: opt(f.interestAmount), exchangeRate: opt(f.exchangeRate), quantityUnit: qty ? f.quantityUnit : undefined,
      lotIds: (f.lotIds as unknown as string[] | undefined)?.map(Number).filter(Boolean),
    };
    try { initial ? await update.mutateAsync({ ...body, id: initial.id }) : await create.mutateAsync(body); onDone(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-2 gap-4">
      <Field label="Tipe transaksi"><select className="input" {...register('type')}>{TYPES.map((t) => <option key={t} value={t}>{TX_LABEL[t]}</option>)}</select></Field>
      <Field label="Tanggal"><input className="input" type="date" {...register('transactionDate', { required: true })} /></Field>
      <Field label={type === 'TRANSFER' ? 'Akun sumber' : ['SELL_INVESTMENT', 'ASSET_SALE', 'INCOME', 'DIVIDEND', 'COUPON', 'LOAN'].includes(type) ? 'Akun penerima' : 'Akun'}>
        <select className="input" {...register('accountId', { required: true })}><option value="">— pilih —</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      </Field>
      {type === 'TRANSFER' && <Field label="Akun tujuan"><select className="input" {...register('destinationAccountId')}><option value="">— pilih —</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
      {(type === 'INCOME' || type === 'EXPENSE') && <Field label="Kategori"><select className="input" {...register('categoryId')}><option value="">— pilih —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></Field>}
      {ASSET_TYPES.includes(type) && <Field label="Aset"><select className="input" {...register('assetId')}><option value="">— pilih —</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></Field>}
      {(type === 'LOAN' || type === 'DEBT_PAYMENT') && <Field label="Liabilitas"><select className="input" {...register('liabilityId')}><option value="">— pilih —</option>{liabilities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>}
      {qty ? (
        <>
          <Field label="Kuantitas"><input className="input num" type="number" step="any" {...register('quantity')} /></Field>
          <Field label="Unit"><select className="input" {...register('quantityUnit')}>{['SHARE', 'LOT', 'UNIT', 'GRAM', 'SHEET', 'KG', 'LITER', 'METER', 'PIECE', 'OTHER'].map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Harga satuan"><input className="input num" type="number" step="any" {...register('unitPrice')} /></Field>
        </>
      ) : (
        <Field label={type === 'DEBT_PAYMENT' ? 'Pokok' : 'Jumlah bruto'}><input className="input num" type="number" step="any" {...register('grossAmount')} /></Field>
      )}
      {type === 'DEBT_PAYMENT' && <Field label="Bunga"><input className="input num" type="number" step="any" {...register('interestAmount')} /></Field>}
      {FEE_TYPES.includes(type) && (
        <>
          <Field label="Biaya admin"><input className="input num" type="number" step="any" {...register('adminFee')} /></Field>
          {qty && <Field label="Biaya broker"><input className="input num" type="number" step="any" {...register('brokerFee')} /></Field>}
          {qty && <Field label="Levy"><input className="input num" type="number" step="any" {...register('levy')} /></Field>}
        </>
      )}
      {type !== 'TRANSFER' && type !== 'LOAN' && type !== 'OPENING_BALANCE' && type !== 'FEE' && type !== 'TAX' && <Field label="Pajak"><input className="input num" type="number" step="any" {...register('tax')} /></Field>}
      <Field label="Mata uang"><input className="input" maxLength={3} {...register('currency')} /></Field>
      <Field label="Kurs ke mata uang dasar"><input className="input num" type="number" step="any" {...register('exchangeRate')} /></Field>
      {lots.length > 0 && (
        <Field label="Lot spesifik (opsional, untuk metode SPECIFIC)">
          <select className="input h-auto" multiple {...register('lotIds')}>{lots.filter((l) => l.status !== 'CLOSED').map((l) => <option key={l.id} value={l.id}>#{l.id} · {fmtDate(l.purchaseDate)} · sisa {fmtQty(l.remainingQuantity)} @ {l.unitCost}</option>)}</select>
        </Field>
      )}
      <Field label="Referensi"><input className="input" {...register('reference')} /></Field>
      <Field label="Deskripsi"><input className="input" {...register('description')} /></Field>
      {error && <div className="col-span-2 text-sm text-accent-red">{error}</div>}
      <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onDone}>Batal</button><button className="btn-primary" disabled={create.isPending || update.isPending}>Simpan</button></div>
    </form>
  );
}
const num = (v?: string) => (v == null ? undefined : Number(v));
const opt = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

/** Transaction detail: the transparent accounting trail (journal, portfolio, cash flow, P/L, lots). */
export function TransactionDetailView({ detail }: { detail: TransactionDetail }) {
  const t = detail.transaction;
  const rows: [string, string][] = [
    ['Tipe', TX_LABEL[t.type]], ['Tanggal', fmtDate(t.transactionDate)], ['Akun', t.accountName + (t.destinationAccountName ? ` → ${t.destinationAccountName}` : '')],
    ['Kategori / Aset / Liabilitas', t.categoryName ?? t.assetCode ?? t.liabilityName ?? '–'], ['Kuantitas', t.quantity ? fmtQty(t.quantity, t.quantityUnit) : '–'],
    ['Harga satuan', t.unitPrice ? fmtQty(t.unitPrice) : '–'], ['Mata uang / kurs', `${t.currency} @ ${t.exchangeRate}`], ['Referensi', t.reference ?? '–'], ['Deskripsi', t.description ?? '–'], ['Status', t.status],
  ];
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">{rows.map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
      <Panel title="Rincian nilai">
        <table className="w-full text-sm num">
          <tbody>
            <tr><td>Bruto</td><td className="text-right"><Amount value={t.grossAmount} currency={t.currency} /></td></tr>
            <tr><td>Biaya admin / broker / levy</td><td className="text-right"><Amount value={Number(t.adminFee) + Number(t.brokerFee) + Number(t.levy)} currency={t.currency} /></td></tr>
            <tr><td>Pajak</td><td className="text-right"><Amount value={t.tax} currency={t.currency} /></td></tr>
            {Number(t.interestAmount) > 0 && <tr><td>Bunga</td><td className="text-right"><Amount value={t.interestAmount} currency={t.currency} /></td></tr>}
            <tr className="font-semibold border-t border-slate-200"><td>{['SELL_INVESTMENT', 'ASSET_SALE', 'INCOME', 'DIVIDEND', 'COUPON', 'INTEREST'].includes(t.type) ? 'Neto diterima' : 'Total'}</td><td className="text-right"><Amount value={t.netAmount} currency={t.currency} /></td></tr>
            {t.costBasis && <tr><td>Cost basis</td><td className="text-right"><Amount value={t.costBasis} currency={t.currency} /></td></tr>}
            {t.realizedPl && <tr><td>Laba realisasi</td><td className="text-right"><Amount value={t.realizedPl} currency={t.currency} signed /></td></tr>}
          </tbody>
        </table>
      </Panel>
      <Panel title="Dampak akuntansi (jurnal)">
        <Table rows={detail.journalEntries} keyOf={(e) => e.ledgerCode + e.debit + e.credit} empty="Tidak ada jurnal (transaksi dibatalkan)"
          cols={[{ h: 'Akun', cell: (e) => `${e.ledgerCode} · ${e.ledgerName}` }, { h: 'Debit', right: true, cell: (e) => Number(e.debit) ? <Amount value={e.debit} currency={t.baseCurrency} /> : '' }, { h: 'Kredit', right: true, cell: (e) => Number(e.credit) ? <Amount value={e.credit} currency={t.baseCurrency} /> : '' }]} />
      </Panel>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="panel p-3"><div className="text-xs text-slate-500">Portofolio</div><div className="font-medium num">{detail.portfolioQuantityImpact ? `${Number(detail.portfolioQuantityImpact) > 0 ? '+' : ''}${fmtQty(detail.portfolioQuantityImpact, t.quantityUnit)}` : '–'}</div></div>
        <div className="panel p-3"><div className="text-xs text-slate-500">Arus kas · {CF_LABEL[detail.cashFlowCategory]}</div><div className="font-medium"><Amount value={detail.cashFlowImpact} currency={t.baseCurrency} signed /></div></div>
        <div className="panel p-3"><div className="text-xs text-slate-500">P/L realisasi</div><div className="font-medium"><Amount value={detail.realizedPl ?? 0} currency={t.currency} signed /></div></div>
      </div>
      {detail.lotConsumptions.length > 0 && (
        <Panel title="Lot yang terpakai">
          <Table rows={detail.lotConsumptions} keyOf={(c) => c.lotId} cols={[{ h: 'Lot', cell: (c) => `#${c.lotId}` }, { h: 'Tgl beli', cell: (c) => fmtDate(c.lotPurchaseDate) }, { h: 'Kuantitas', right: true, cell: (c) => fmtQty(c.quantity) }, { h: 'Cost basis', right: true, cell: (c) => <Amount value={c.costBasis} currency={t.currency} /> }]} />
        </Panel>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxFilter>({ page: 0, size: 20 });
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'detail'; tx?: Transaction } | null>(null);
  const { data, isLoading } = useTransactions(filter);
  const { data: detail } = useTransaction(drawer?.mode === 'detail' ? drawer.tx?.id : undefined);
  const { data: accounts = [] } = useAccounts();
  const del = useDeleteTransaction();
  const set = (patch: Partial<TxFilter>) => setFilter((f) => ({ ...f, ...patch, page: 0 }));
  const pages = useMemo(() => data?.totalPages ?? 0, [data]);

  const download = async () => {
    const csv = await exportTransactionsCsv(filter);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'transaksi.csv'; a.click();
  };

  return (
    <>
      <PageHeader title="Transaksi" subtitle="Setiap perubahan finansial berawal dari sini"
        action={<div className="flex gap-2"><button className="btn-secondary" onClick={download}><Download size={16} />CSV</button><button className="btn-primary" onClick={() => setDrawer({ mode: 'create' })}><Plus size={16} />Transaksi</button></div>} />
      <div className="panel p-3 mb-4 grid grid-cols-2 md:grid-cols-6 gap-2">
        <input className="input md:col-span-2" placeholder="Cari referensi / deskripsi" onChange={(e) => set({ search: e.target.value })} />
        <select className="input" onChange={(e) => set({ type: e.target.value || undefined })}><option value="">Semua tipe</option>{TYPES.map((t) => <option key={t} value={t}>{TX_LABEL[t]}</option>)}</select>
        <select className="input" onChange={(e) => set({ accountId: Number(e.target.value) || undefined })}><option value="">Semua akun</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <input className="input" type="date" onChange={(e) => set({ from: e.target.value || undefined })} />
        <input className="input" type="date" onChange={(e) => set({ to: e.target.value || undefined })} />
      </div>
      <div className="panel">
        {isLoading || !data ? <Loading /> : (
          <Table rows={data.content} keyOf={(t) => t.id} onRow={(t) => setDrawer({ mode: 'detail', tx: t })} empty="Belum ada transaksi"
            cols={[
              { h: 'Tanggal', cell: (t) => fmtDate(t.transactionDate) },
              { h: 'Tipe', cell: (t) => <Pill tone={t.type === 'TRANSFER' ? 'slate' : ['INCOME', 'SELL_INVESTMENT', 'DIVIDEND', 'COUPON', 'INTEREST', 'LOAN', 'ASSET_SALE', 'OPENING_BALANCE'].includes(t.type) ? 'green' : 'red'}>{TX_LABEL[t.type]}</Pill> },
              { h: 'Akun', cell: (t) => t.accountName + (t.destinationAccountName ? ` → ${t.destinationAccountName}` : '') },
              { h: 'Kategori / Aset', cell: (t) => t.categoryName ?? t.assetCode ?? t.liabilityName ?? '–' },
              { h: 'Kuantitas', right: true, cell: (t) => t.quantity ? fmtQty(t.quantity, t.quantityUnit) : '' },
              { h: 'Neto', right: true, cell: (t) => <Amount value={t.netAmount} currency={t.currency} /> },
              { h: 'Arus kas', cell: (t) => <span className="text-xs text-slate-500">{CF_LABEL[t.cashFlowCategory]}</span> },
              { h: 'Ref', cell: (t) => <span className="text-xs text-slate-500">{t.reference ?? ''}</span> },
              { h: 'Status', cell: (t) => <Pill tone={t.status === 'POSTED' ? 'blue' : 'slate'}>{t.status}</Pill> },
              { h: '', cell: (t) => t.status === 'POSTED' && (
                <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-secondary h-7 px-2 text-xs" onClick={() => setDrawer({ mode: 'edit', tx: t })}>Ubah</button>
                  <button className="btn-danger h-7 px-2 text-xs" onClick={() => confirm('Batalkan transaksi ini? Jurnal dan dampaknya akan dihapus.') && del.mutate(t.id)}>Void</button>
                </span>
              ) },
            ]} />
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 text-sm text-slate-600">
            <span>{data?.totalElements} transaksi</span>
            <span className="flex gap-1">
              <button className="btn-secondary h-7 px-2" disabled={filter.page === 0} onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 0) - 1 }))}>‹</button>
              <span className="px-2 leading-7">{(filter.page ?? 0) + 1} / {pages}</span>
              <button className="btn-secondary h-7 px-2" disabled={(filter.page ?? 0) + 1 >= pages} onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 0) + 1 }))}>›</button>
            </span>
          </div>
        )}
      </div>
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} wide title={drawer?.mode === 'create' ? 'Transaksi baru' : drawer?.mode === 'edit' ? 'Ubah transaksi' : `Detail transaksi #${drawer?.tx?.id}`}>
        {drawer?.mode === 'detail' ? (detail ? <TransactionDetailView detail={detail} /> : <Loading />) : drawer && <TransactionForm initial={drawer.tx} onDone={() => setDrawer(null)} />}
      </Drawer>
    </>
  );
}
