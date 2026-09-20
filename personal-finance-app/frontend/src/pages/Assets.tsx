import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAssets, useCreateAsset } from '../api/queries';
import { Drawer, Field, Loading, PageHeader, Panel } from '../components/ui';
import { ASSET_LABEL } from '../lib/format';
import { PositionsTable, PriceDrawer } from './Investments';
import type { Asset } from '../types/domain';

const FINANCIAL = ['STOCK', 'BOND', 'MUTUAL_FUND', 'ETF', 'GOLD', 'DEPOSIT'];

export default function AssetsPage() {
  const { data = [], isLoading } = useAssets();
  const create = useCreateAsset();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ code: '', name: '', assetType: 'STOCK', currency: 'IDR', quantityUnit: 'SHARE', currentPrice: '', sector: '' });
  if (isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Aset" subtitle="Aset finansial dan non-finansial; nilai beli & holding diturunkan dari lot transaksi" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Aset</button>} />
      <Panel title="Aset finansial" className="mb-6"><PositionsTable rows={data.filter((a) => FINANCIAL.includes(a.assetType))} onPrice={setPrice} /></Panel>
      <Panel title="Aset non-finansial"><PositionsTable rows={data.filter((a) => !FINANCIAL.includes(a.assetType))} onPrice={setPrice} /></Panel>
      <PriceDrawer asset={price} onClose={() => setPrice(null)} />
      <Drawer open={open} onClose={() => setOpen(false)} title="Aset baru">
        <form className="grid grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setError(null); try { await create.mutateAsync({ ...f, currentPrice: f.currentPrice || '0' } as never); setOpen(false); } catch (err) { setError((err as Error).message); } }}>
          <Field label="Kode"><input className="input" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Nama"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Jenis"><select className="input" value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value })}>{Object.entries(ASSET_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Unit kuantitas"><select className="input" value={f.quantityUnit} onChange={(e) => setF({ ...f, quantityUnit: e.target.value })}>{['SHARE', 'LOT', 'UNIT', 'GRAM', 'SHEET', 'KG', 'LITER', 'METER', 'PIECE', 'OTHER'].map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Mata uang"><input className="input" maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Harga pasar saat ini"><input className="input num" type="number" step="any" value={f.currentPrice} onChange={(e) => setF({ ...f, currentPrice: e.target.value })} /></Field>
          <Field label="Sektor"><input className="input" value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} /></Field>
          {error && <div className="col-span-2 text-sm text-accent-red">{error}</div>}
          <div className="col-span-2"><button className="btn-primary">Simpan</button></div>
        </form>
      </Drawer>
    </>
  );
}
