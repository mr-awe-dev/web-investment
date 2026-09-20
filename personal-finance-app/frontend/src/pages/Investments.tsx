import { useState } from 'react';
import { useAssets, useDividends, useLots, usePortfolio, useUpdatePrice } from '../api/queries';
import { Amount, Drawer, Field, Loading, Metric, PageHeader, Panel, Pill, Table } from '../components/ui';
import { fmtDate, fmtMoney, fmtPct, fmtQty, signClass } from '../lib/format';
import type { Asset } from '../types/domain';

export function PositionsTable({ rows, onPrice }: { rows: Asset[]; onPrice?: (a: Asset) => void }) {
  return (
    <Table rows={rows} keyOf={(a) => a.id} empty="Belum ada posisi" cols={[
      { h: 'Kode', cell: (a) => <span className="font-medium">{a.code}</span> }, { h: 'Nama', cell: (a) => <span className="text-slate-600">{a.name}</span> },
      { h: 'Kuantitas', right: true, cell: (a) => fmtQty(a.quantity, a.quantityUnit) }, { h: 'Rata-rata', right: true, cell: (a) => fmtMoney(a.averageCost, a.currency) },
      { h: 'Total cost', right: true, cell: (a) => <Amount value={a.totalCost} currency={a.currency} /> }, { h: 'Harga', right: true, cell: (a) => fmtMoney(a.currentPrice, a.currency) },
      { h: 'Nilai pasar', right: true, cell: (a) => <Amount value={a.marketValue} currency={a.currency} className="font-medium" /> },
      { h: 'Unrealized', right: true, cell: (a) => <span className={signClass(a.unrealizedPl)}>{fmtMoney(a.unrealizedPl, a.currency)} <span className="text-xs">({fmtPct(a.unrealizedPlPercent)})</span></span> },
      { h: 'Realized', right: true, cell: (a) => <Amount value={a.realizedPl} currency={a.currency} signed /> }, { h: 'Alokasi', right: true, cell: (a) => fmtPct(a.allocationPercent) },
      { h: '', cell: (a) => onPrice && <button className="btn-secondary h-7 px-2 text-xs" onClick={() => onPrice(a)}>Harga</button> },
    ]} />
  );
}

export function PriceDrawer({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const update = useUpdatePrice();
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <Drawer open={!!asset} onClose={onClose} title={`Harga pasar ${asset?.code ?? ''}`}>
      <p className="text-sm text-slate-500 mb-4">Perubahan harga hanya mempengaruhi laba belum realisasi. Tidak ada jurnal, kas, atau arus kas yang berubah.</p>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (asset) { await update.mutateAsync({ id: asset.id, currentPrice: Number(price), valuationDate: date }); onClose(); } }}>
        <Field label="Harga per unit"><input className="input num" type="number" step="any" required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Tanggal valuasi"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <button className="btn-primary">Simpan</button>
      </form>
    </Drawer>
  );
}

export function PortfolioPage() {
  const { data, isLoading } = usePortfolio();
  const { data: lots = [] } = useLots();
  const [price, setPrice] = useState<Asset | null>(null);
  if (isLoading || !data) return <Loading />;
  return (
    <>
      <PageHeader title="Portofolio" subtitle="Posisi diturunkan dari lot pembelian; nilai pasar dari harga terakhir" />
      <div className="panel grid grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric label="Total cost basis" value={fmtMoney(data.totalCost)} /><Metric label="Nilai pasar" value={fmtMoney(data.marketValue)} />
        <Metric label="Unrealized P/L" value={fmtMoney(data.unrealizedPl)} tone="signed" sub={fmtPct(data.unrealizedPlPercent)} /><Metric label="Realized P/L" value={fmtMoney(data.realizedPl)} tone="signed" />
      </div>
      <Panel title="Posisi" className="mb-6"><PositionsTable rows={data.positions} onPrice={setPrice} /></Panel>
      <Panel title="Lot">
        <Table rows={lots} keyOf={(l) => l.id} cols={[
          { h: 'Lot', cell: (l) => `#${l.id}` }, { h: 'Aset', cell: (l) => l.assetCode }, { h: 'Tgl beli', cell: (l) => fmtDate(l.purchaseDate) },
          { h: 'Kuantitas', right: true, cell: (l) => fmtQty(l.quantity) }, { h: 'Sisa', right: true, cell: (l) => fmtQty(l.remainingQuantity) },
          { h: 'Harga beli', right: true, cell: (l) => fmtMoney(l.unitCost) }, { h: 'Cost basis sisa', right: true, cell: (l) => <Amount value={l.remainingCost} /> },
          { h: 'Status', cell: (l) => <Pill tone={l.status === 'CLOSED' ? 'slate' : l.status === 'PARTIAL' ? 'amber' : 'green'}>{l.status}</Pill> },
        ]} />
      </Panel>
      <PriceDrawer asset={price} onClose={() => setPrice(null)} />
    </>
  );
}

export function StocksPage() {
  const { data = [], isLoading } = useAssets();
  const [price, setPrice] = useState<Asset | null>(null);
  if (isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Saham" subtitle="Beli/jual saham dicatat melalui halaman Transaksi (tipe Beli/Jual Investasi)" />
      <Panel title="Saham"><PositionsTable rows={data.filter((a) => a.assetType === 'STOCK')} onPrice={setPrice} /></Panel>
      <PriceDrawer asset={price} onClose={() => setPrice(null)} />
    </>
  );
}

export function DividendsPage() {
  const { data = [], isLoading } = useDividends();
  if (isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Dividen" subtitle="Pendapatan investasi — terpisah dari laba realisasi" />
      <Panel title="Riwayat dividen">
        <Table rows={data} keyOf={(t) => t.id} cols={[
          { h: 'Tanggal bayar', cell: (t) => fmtDate(t.transactionDate) }, { h: 'Saham', cell: (t) => t.assetCode }, { h: 'Lembar', right: true, cell: (t) => fmtQty(t.quantity) },
          { h: 'Per lembar', right: true, cell: (t) => t.unitPrice ? fmtMoney(t.unitPrice, t.currency) : '–' }, { h: 'Bruto', right: true, cell: (t) => <Amount value={t.grossAmount} currency={t.currency} /> },
          { h: 'Pajak', right: true, cell: (t) => <Amount value={t.tax} currency={t.currency} /> }, { h: 'Neto', right: true, cell: (t) => <Amount value={t.netAmount} currency={t.currency} className="font-medium" /> },
          { h: 'Akun penerima', cell: (t) => t.accountName },
        ]} />
      </Panel>
    </>
  );
}
