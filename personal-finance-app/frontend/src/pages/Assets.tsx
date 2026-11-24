import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAssets, useCreateAsset } from '../api/queries';
import { Alert, Drawer, ErrorState, Field, Loading, PageHeader, Panel, Spinner, Stat } from '../components/ui';
import { ASSET_LABEL, fmtMoney } from '../lib/format';
import { useAuth } from '../lib/auth';
import { PositionsTable, PriceDrawer } from './Investments';
import type { Asset } from '../types/domain';

const FINANCIAL = ['STOCK', 'BOND', 'MUTUAL_FUND', 'ETF', 'GOLD', 'DEPOSIT'];

export default function AssetsPage() {
  const assets = useAssets();
  const create = useCreateAsset();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    assetType: 'STOCK',
    currency: 'IDR',
    quantityUnit: 'SHARE',
    currentPrice: '',
    sector: '',
  });
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (assets.isLoading) return <Loading rows={6} />;
  if (assets.isError) return <ErrorState title="Aset tidak dapat dimuat" onRetry={() => assets.refetch()} />;

  const data = assets.data ?? [];
  const financial = data.filter((asset) => FINANCIAL.includes(asset.assetType));
  const nonFinancial = data.filter((asset) => !FINANCIAL.includes(asset.assetType));
  const marketValue = data.reduce((sum, asset) => sum + Number(asset.marketValue), 0);
  const cost = data.reduce((sum, asset) => sum + Number(asset.totalCost), 0);
  const unrealized = data.reduce((sum, asset) => sum + Number(asset.unrealizedPl), 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ ...form, currentPrice: form.currentPrice || '0' } as never);
      setOpen(false);
      setForm({ code: '', name: '', assetType: 'STOCK', currency: 'IDR', quantityUnit: 'SHARE', currentPrice: '', sector: '' });
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Portofolio"
        title="Aset"
        subtitle="Aset finansial dan non-finansial; nilai beli dan holding diturunkan dari lot transaksi."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Aset baru
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Nilai pasar" value={fmtMoney(marketValue, cur)} hint={`${data.length} aset tercatat`} />
        <Stat label="Cost basis" value={fmtMoney(cost, cur)} hint="Nilai perolehan" />
        <Stat label="Belum realisasi" value={fmtMoney(unrealized, cur)} tone="auto" trend={unrealized} hint="Pasar − cost basis" />
        <Stat
          label="Aset finansial"
          value={`${financial.length} dari ${data.length}`}
          hint={`${nonFinancial.length} aset non-finansial`}
        />
      </div>

      <Panel title="Aset finansial" subtitle="Saham, obligasi, reksa dana, ETF, emas, dan deposito" className="mb-4" flush>
        <PositionsTable rows={financial} onPrice={setPrice} />
      </Panel>

      <Panel title="Aset non-finansial" subtitle="Properti, tanah, kendaraan, dan aset lain" flush>
        <PositionsTable rows={nonFinancial} onPrice={setPrice} />
      </Panel>

      <PriceDrawer asset={price} onClose={() => setPrice(null)} />

      <Drawer open={open} onClose={() => setOpen(false)} title="Aset baru" description="Posisi dan nilai berjalan muncul setelah lot tercatat.">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kode" required>
              <input
                className="input"
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                placeholder="Contoh: BBCA"
              />
            </Field>
            <Field label="Nama" required>
              <input
                className="input"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Contoh: Bank Central Asia"
              />
            </Field>
            <Field label="Jenis aset" required>
              <select className="input" value={form.assetType} onChange={(event) => setForm({ ...form, assetType: event.target.value })}>
                {Object.entries(ASSET_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit kuantitas">
              <select className="input" value={form.quantityUnit} onChange={(event) => setForm({ ...form, quantityUnit: event.target.value })}>
                {['SHARE', 'LOT', 'UNIT', 'GRAM', 'SHEET', 'KG', 'LITER', 'METER', 'PIECE', 'OTHER'].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </Field>
            <Field label="Mata uang" required>
              <input
                className="input"
                maxLength={3}
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Harga pasar saat ini">
              <input
                className="input num"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={form.currentPrice}
                onChange={(event) => setForm({ ...form, currentPrice: event.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Sektor">
              <input
                className="input"
                value={form.sector}
                onChange={(event) => setForm({ ...form, sector: event.target.value })}
                placeholder="Contoh: Perbankan"
              />
            </Field>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>
              {create.isPending && <Spinner size={15} />}
              Simpan aset
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
