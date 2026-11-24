import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PencilLine } from 'lucide-react';
import { useAssets, useDividends, useLots, usePortfolio, useUpdatePrice } from '../api/queries';
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
  TextLink,
} from '../components/ui';
import { fmtDate, fmtMoney, fmtPct, fmtQty, signClass } from '../lib/format';
import { useAuth } from '../lib/auth';
import type { Asset } from '../types/domain';

export function PositionsTable({ rows, onPrice }: { rows: Asset[]; onPrice?: (asset: Asset) => void }) {
  return (
    <Table
      rows={rows}
      keyOf={(asset) => asset.id}
      sortable
      empty="Belum ada posisi"
      emptyHint="Catat pembelian lewat halaman Transaksi dengan tipe Beli Investasi."
      caption="Posisi investasi"
      cols={[
        {
          h: 'Kode',
          cell: (asset) => (
            <div className="min-w-0">
              <p className="font-medium text-ink">{asset.code}</p>
              <p className="truncate text-[11px] text-muted">{asset.name}</p>
            </div>
          ),
          sortValue: (asset) => asset.code,
        },
        {
          h: 'Kuantitas',
          right: true,
          cell: (asset) => fmtQty(asset.quantity, asset.quantityUnit),
          sortValue: (asset) => Number(asset.quantity),
        },
        {
          h: 'Rata-rata',
          right: true,
          mobile: false,
          cell: (asset) => fmtMoney(asset.averageCost, asset.currency),
          sortValue: (asset) => Number(asset.averageCost),
        },
        {
          h: 'Cost basis',
          right: true,
          mobile: false,
          cell: (asset) => <Amount value={asset.totalCost} currency={asset.currency} />,
          sortValue: (asset) => Number(asset.totalCost),
        },
        {
          h: 'Harga',
          right: true,
          mobile: false,
          cell: (asset) => fmtMoney(asset.currentPrice, asset.currency),
          sortValue: (asset) => Number(asset.currentPrice),
        },
        {
          h: 'Nilai pasar',
          right: true,
          cell: (asset) => <Amount value={asset.marketValue} currency={asset.currency} className="font-medium" />,
          sortValue: (asset) => Number(asset.marketValue),
        },
        {
          h: 'Belum realisasi',
          right: true,
          cell: (asset) => (
            <div>
              <span className={`num text-xs font-medium ${signClass(asset.unrealizedPl)}`}>
                {fmtMoney(asset.unrealizedPl, asset.currency)}
              </span>
              <span className="num ml-1 text-[10px] text-muted">({fmtPct(asset.unrealizedPlPercent)})</span>
            </div>
          ),
          sortValue: (asset) => Number(asset.unrealizedPl),
        },
        {
          h: 'Realisasi',
          right: true,
          mobile: false,
          cell: (asset) => <Amount value={asset.realizedPl} currency={asset.currency} signed />,
          sortValue: (asset) => Number(asset.realizedPl),
        },
        {
          h: 'Alokasi',
          right: true,
          mobile: false,
          cell: (asset) => fmtPct(asset.allocationPercent),
          sortValue: (asset) => Number(asset.allocationPercent),
        },
        {
          h: 'Aksi',
          right: true,
          cell: (asset) =>
            onPrice ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onPrice(asset)}
                aria-label={`Perbarui harga ${asset.code}`}
              >
                <PencilLine size={13} aria-hidden="true" />
                Harga
              </button>
            ) : null,
        },
      ]}
    />
  );
}

export function PriceDrawer({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const update = useUpdatePrice();
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!asset) return;
    setError(null);
    try {
      await update.mutateAsync({ id: asset.id, currentPrice: Number(price), valuationDate: date });
      onClose();
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <Drawer
      open={Boolean(asset)}
      onClose={onClose}
      title={`Harga pasar ${asset?.code ?? ''}`}
      description="Perubahan hanya memengaruhi laba belum realisasi."
    >
      <Alert tone="info">
        Tidak ada jurnal, kas, atau arus kas yang berubah. Nilai buku tetap mengikuti cost basis.
      </Alert>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <Field label="Harga per unit" hint="Gunakan harga pasar terakhir yang Anda ketahui.">
          <input
            className="input num"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Tanggal valuasi">
          <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={update.isPending}>
            {update.isPending && <Spinner size={15} />}
            Simpan harga
          </button>
        </div>
      </form>
    </Drawer>
  );
}

export function PortfolioPage() {
  const portfolio = usePortfolio();
  const lots = useLots();
  const [price, setPrice] = useState<Asset | null>(null);
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (portfolio.isLoading) return <Loading />;
  if (portfolio.isError || !portfolio.data) {
    return <ErrorState title="Portofolio tidak dapat dimuat" onRetry={() => portfolio.refetch()} />;
  }

  const data = portfolio.data;

  return (
    <>
      <PageHeader
        eyebrow="Portofolio"
        title="Posisi & kinerja"
        subtitle="Posisi diturunkan dari lot pembelian; nilai pasar memakai harga terakhir."
        action={
          <Link to="/investments/stocks" className="btn btn-secondary">
            Lihat saham
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total cost basis" value={fmtMoney(data.totalCost, cur)} hint="Nilai perolehan" />
        <Stat label="Nilai pasar" value={fmtMoney(data.marketValue, cur)} hint="Harga terakhir" />
        <Stat
          label="Belum realisasi"
          value={fmtMoney(data.unrealizedPl, cur)}
          tone="auto"
          trend={Number(data.unrealizedPl)}
          hint={fmtPct(data.unrealizedPlPercent)}
        />
        <Stat
          label="Realisasi"
          value={fmtMoney(data.realizedPl, cur)}
          tone="auto"
          trend={Number(data.realizedPl)}
          hint="Laba dari penjualan"
        />
      </div>

      <Panel title="Posisi" subtitle="Urutkan dengan menekan judul kolom" className="mb-4" flush>
        <PositionsTable rows={data.positions} onPrice={setPrice} />
      </Panel>

      <Panel
        title="Lot pembelian"
        subtitle="Sisa lot menentukan cost basis penjualan berikutnya"
        action={<TextLink to="/settings">Metode cost basis</TextLink>}
        flush
      >
        {lots.isLoading ? (
          <Loading />
        ) : lots.isError ? (
          <ErrorState title="Lot tidak dapat dimuat" onRetry={() => lots.refetch()} />
        ) : (
          <Table
            rows={lots.data ?? []}
            keyOf={(lot) => lot.id}
            sortable
            empty="Belum ada lot"
            emptyHint="Lot terbentuk otomatis saat transaksi pembelian investasi dicatat."
            caption="Lot pembelian"
            cols={[
              { h: 'Lot', cell: (lot) => <span className="num text-muted">#{lot.id}</span>, sortValue: (lot) => lot.id },
              { h: 'Aset', cell: (lot) => <span className="font-medium text-ink">{lot.assetCode}</span>, sortValue: (lot) => lot.assetCode },
              { h: 'Tanggal beli', cell: (lot) => fmtDate(lot.purchaseDate), sortValue: (lot) => lot.purchaseDate },
              { h: 'Kuantitas', right: true, cell: (lot) => fmtQty(lot.quantity), sortValue: (lot) => Number(lot.quantity) },
              { h: 'Sisa', right: true, cell: (lot) => fmtQty(lot.remainingQuantity), sortValue: (lot) => Number(lot.remainingQuantity) },
              { h: 'Harga beli', right: true, mobile: false, cell: (lot) => fmtMoney(lot.unitCost), sortValue: (lot) => Number(lot.unitCost) },
              {
                h: 'Cost basis sisa',
                right: true,
                cell: (lot) => <Amount value={lot.remainingCost} />,
                sortValue: (lot) => Number(lot.remainingCost),
              },
              {
                h: 'Status',
                cell: (lot) => (
                  <Pill tone={lot.status === 'CLOSED' ? 'slate' : lot.status === 'PARTIAL' ? 'amber' : 'green'} dot>
                    {lot.status === 'CLOSED' ? 'Tertutup' : lot.status === 'PARTIAL' ? 'Sebagian' : 'Terbuka'}
                  </Pill>
                ),
                sortValue: (lot) => lot.status,
              },
            ]}
          />
        )}
      </Panel>

      <PriceDrawer asset={price} onClose={() => setPrice(null)} />
    </>
  );
}

export function StocksPage() {
  const assets = useAssets();
  const [price, setPrice] = useState<Asset | null>(null);
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (assets.isLoading) return <Loading />;
  if (assets.isError) return <ErrorState title="Saham tidak dapat dimuat" onRetry={() => assets.refetch()} />;

  const stocks = (assets.data ?? []).filter((asset) => asset.assetType === 'STOCK');
  const marketValue = stocks.reduce((sum, asset) => sum + Number(asset.marketValue), 0);
  const cost = stocks.reduce((sum, asset) => sum + Number(asset.totalCost), 0);
  const unrealized = stocks.reduce((sum, asset) => sum + Number(asset.unrealizedPl), 0);

  return (
    <>
      <PageHeader
        eyebrow="Investasi"
        title="Saham"
        subtitle="Pembelian dan penjualan dicatat melalui halaman Transaksi dengan tipe Beli/Jual Investasi."
        action={
          <Link to="/transactions" className="btn btn-primary">
            Catat transaksi
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Jumlah emiten" value={String(stocks.length)} hint="Posisi aktif" />
        <Stat label="Cost basis" value={fmtMoney(cost, cur)} hint="Total nilai perolehan" />
        <Stat label="Nilai pasar" value={fmtMoney(marketValue, cur)} hint="Harga terakhir" />
        <Stat label="Belum realisasi" value={fmtMoney(unrealized, cur)} tone="auto" trend={unrealized} hint="Selisih pasar − cost" />
      </div>

      <Panel title="Posisi saham" subtitle="Klik harga untuk memperbarui valuasi" flush>
        <PositionsTable rows={stocks} onPrice={setPrice} />
      </Panel>

      <PriceDrawer asset={price} onClose={() => setPrice(null)} />
    </>
  );
}

export function DividendsPage() {
  const dividends = useDividends();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  const navigate = useNavigate();

  if (dividends.isLoading) return <Loading />;
  if (dividends.isError) return <ErrorState title="Dividen tidak dapat dimuat" onRetry={() => dividends.refetch()} />;

  const rows = dividends.data ?? [];
  const net = rows.reduce((sum, item) => sum + Number(item.netAmount), 0);
  const gross = rows.reduce((sum, item) => sum + Number(item.grossAmount), 0);
  const tax = rows.reduce((sum, item) => sum + Number(item.tax), 0);

  return (
    <>
      <PageHeader
        eyebrow="Investasi"
        title="Dividen"
        subtitle="Pendapatan investasi yang terpisah dari laba realisasi."
        action={
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>
            Riwayat transaksi
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Dividen neto" value={fmtMoney(net, cur)} hint={`${rows.length} pembayaran`} />
        <Stat label="Bruto" value={fmtMoney(gross, cur)} hint="Sebelum pajak" />
        <Stat label="Pajak" value={fmtMoney(tax, cur)} hint="Potongan pajak dividen" />
        <Stat label="Rata-rata per bayar" value={rows.length ? fmtMoney(net / rows.length, cur) : fmtMoney(0, cur)} hint="Neto" />
      </div>

      <Panel title="Riwayat dividen" subtitle="Sumber dana masuk ke akun penerima" flush>
        <Table
          rows={rows}
          keyOf={(item) => item.id}
          sortable
          caption="Riwayat dividen"
          empty="Belum ada dividen"
          emptyHint="Catat penerimaan dividen lewat Transaksi dengan tipe Dividen."
          cols={[
            { h: 'Tanggal bayar', cell: (item) => fmtDate(item.transactionDate), sortValue: (item) => item.transactionDate },
            { h: 'Saham', cell: (item) => <span className="font-medium text-ink">{item.assetCode ?? '–'}</span>, sortValue: (item) => item.assetCode ?? '' },
            { h: 'Lembar', right: true, mobile: false, cell: (item) => fmtQty(item.quantity), sortValue: (item) => Number(item.quantity ?? 0) },
            {
              h: 'Per lembar',
              right: true,
              mobile: false,
              cell: (item) => (item.unitPrice ? fmtMoney(item.unitPrice, item.currency) : '–'),
              sortValue: (item) => Number(item.unitPrice ?? 0),
            },
            { h: 'Bruto', right: true, mobile: false, cell: (item) => <Amount value={item.grossAmount} currency={item.currency} />, sortValue: (item) => Number(item.grossAmount) },
            { h: 'Pajak', right: true, mobile: false, cell: (item) => <Amount value={item.tax} currency={item.currency} />, sortValue: (item) => Number(item.tax) },
            {
              h: 'Neto',
              right: true,
              cell: (item) => <Amount value={item.netAmount} currency={item.currency} className="font-medium" />,
              sortValue: (item) => Number(item.netAmount),
            },
            { h: 'Akun', cell: (item) => <span className="text-xs text-muted">{item.accountName}</span>, sortValue: (item) => item.accountName },
          ]}
        />
      </Panel>
    </>
  );
}
