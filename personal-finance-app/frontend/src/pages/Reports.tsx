import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Download, HardDriveDownload } from 'lucide-react';
import { http } from '../lib/api';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  useBalanceSheet,
  useCashFlow,
  useIncomeExpense,
  useInvestmentIncome,
  useLiabilities,
  useNetWorthHistory,
  usePortfolio,
} from '../api/queries';
import {
  Amount,
  ErrorState,
  Loading,
  PageHeader,
  Panel,
  Pill,
  SegmentedNav,
  Stat,
  Table,
} from '../components/ui';
import { ChartFigure, ChartTooltip, chartAxis, chartColor, chartGrid, moneyTick, useChartMotion } from '../components/charts';
import { CF_LABEL, TX_LABEL, fmtDate, fmtMoney, fmtMonth, fmtPct } from '../lib/format';
import { useAuth } from '../lib/auth';
import { PositionsTable } from './Investments';
import type { LineItem } from '../types/domain';

const year = new Date().getFullYear();

const TABS = [
  { to: '/reports/profit-loss', label: 'Laba rugi' },
  { to: '/reports/cash-flow', label: 'Arus kas' },
  { to: '/reports/balance-sheet', label: 'Neraca' },
  { to: '/reports/net-worth', label: 'Kekayaan bersih' },
  { to: '/reports/portfolio', label: 'Portofolio' },
  { to: '/reports/debt', label: 'Utang' },
];

const TITLES: Record<string, string> = {
  'profit-loss': 'Laba rugi',
  'cash-flow': 'Arus kas',
  'balance-sheet': 'Neraca',
  'net-worth': 'Kekayaan bersih',
  portfolio: 'Kinerja portofolio',
  debt: 'Utang',
};

function Lines({ rows, total, totalLabel }: { rows: LineItem[]; total: string; totalLabel: string }) {
  return (
    <table className="table">
      <caption className="sr-only">{totalLabel}</caption>
      <tbody>
        {rows.map((line) => (
          <tr key={line.code}>
            <td className="num w-16 text-xs text-faint">{line.code}</td>
            <td className="text-sm text-ink">{line.label}</td>
            <td className="text-right">
              <Amount value={line.amount} className="text-sm" />
            </td>
          </tr>
        ))}
        <tr className="bg-surface-2">
          <td />
          <td className="text-sm font-semibold text-ink">{totalLabel}</td>
          <td className="text-right">
            <Amount value={total} className="text-sm font-semibold" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Toolbar({ report, range, children }: { report: string; range: { from: string; to: string }; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => downloadPdf(report, range.from, range.to)}>
          <Download size={14} aria-hidden="true" /> PDF
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => downloadXls(report, range.from, range.to)}>
          <HardDriveDownload size={14} aria-hidden="true" /> XLS
        </button>
      </div>
    </div>
  );
}

function RangeFields({ from, to, set }: { from: string; to: string; set: (from: string, to: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <label htmlFor="report-from" className="sr-only">
          Tanggal mulai
        </label>
        <input id="report-from" className="input h-8 w-36 py-1" type="date" value={from} onChange={(event) => set(event.target.value, to)} />
        <span className="text-xs text-faint">–</span>
        <label htmlFor="report-to" className="sr-only">
          Tanggal akhir
        </label>
        <input id="report-to" className="input h-8 w-36 py-1" type="date" value={to} onChange={(event) => set(from, event.target.value)} />
      </div>
    </>
  );
}

function ProfitLoss({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError, refetch } = useIncomeExpense(from, to);
  const inv = useInvestmentIncome(from, to);
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  if (isLoading) return <Loading rows={6} />;
  if (isError || !data) return <ErrorState title="Laba rugi tidak dapat dimuat" onRetry={() => refetch()} />;

  const decomposition = inv.data;
  const rows: { label: string; value: string; signed?: boolean; negative?: boolean }[] = decomposition
    ? [
        { label: 'Laba realisasi', value: decomposition.realizedPl, signed: true },
        { label: 'Laba belum realisasi (posisi saat ini)', value: decomposition.unrealizedPl, signed: true },
        { label: 'Dividen', value: decomposition.dividendIncome },
        { label: 'Kupon', value: decomposition.couponIncome },
        { label: 'Bunga', value: decomposition.interestIncome },
        { label: 'Biaya investasi', value: decomposition.fees, negative: true },
        { label: 'Pajak', value: decomposition.taxes, negative: true },
      ]
    : [];

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Total pendapatan" value={fmtMoney(data.totalIncome, cur)} hint={`${data.income.length} akun`} />
        <Stat label="Total beban" value={fmtMoney(data.totalExpense, cur)} hint={`${data.expenses.length} akun`} />
        <Stat
          label="Hasil bersih"
          value={fmtMoney(data.netResult, cur)}
          tone="auto"
          trend={Number(data.netResult)}
          hint="Pendapatan − beban"
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Pendapatan" flush>
          <Lines rows={data.income} total={data.totalIncome} totalLabel="Total pendapatan" />
        </Panel>
        <Panel title="Beban" flush>
          <Lines rows={data.expenses} total={data.totalExpense} totalLabel="Total beban" />
        </Panel>
      </div>

      <Panel title="Dekomposisi imbal hasil investasi" subtitle="Periode yang sama dengan laporan" flush>
        {!decomposition ? (
          <Loading rows={4} />
        ) : (
          <Table
            rows={rows}
            keyOf={(row) => row.label}
            caption="Dekomposisi imbal hasil investasi"
            cols={[
              { h: 'Komponen', cell: (row) => <span className="text-sm text-ink">{row.label}</span> },
              {
                h: 'Jumlah',
                right: true,
                cell: (row) => (
                  <Amount
                    value={row.negative ? `-${row.value}` : row.value}
                    signed={row.signed}
                    className={`text-sm ${row.negative ? 'text-negative' : ''}`}
                  />
                ),
                sortValue: (row) => Number(row.value),
              },
            ]}
          />
        )}
        {decomposition && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="text-xs text-muted">Total imbal hasil</span>
            <Amount value={decomposition.totalReturn} signed className="font-semibold" />
          </div>
        )}
      </Panel>
    </>
  );
}

function CashFlowReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError, refetch } = useCashFlow(from, to);
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  if (isLoading) return <Loading rows={6} />;
  if (isError || !data) return <ErrorState title="Arus kas tidak dapat dimuat" onRetry={() => refetch()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Operasional" value={fmtMoney(data.operating, cur)} tone="auto" trend={Number(data.operating)} />
        <Stat label="Investasi" value={fmtMoney(data.investing, cur)} tone="auto" trend={Number(data.investing)} />
        <Stat label="Pendanaan" value={fmtMoney(data.financing, cur)} tone="auto" trend={Number(data.financing)} />
        <Stat label="Arus kas neto" value={fmtMoney(data.netCashFlow, cur)} tone="auto" trend={Number(data.netCashFlow)} />
      </div>

      <Panel title="Rincian per tipe transaksi" subtitle="Klasifikasi arus kas mengikuti aturan double-entry" flush>
        <Table
          rows={data.lines}
          keyOf={(line) => `${line.type}-${line.category}`}
          caption="Rincian arus kas"
          empty="Belum ada arus kas pada rentang ini"
          emptyHint="Ubah rentang tanggal atau catat transaksi terlebih dahulu."
          cols={[
            { h: 'Klasifikasi', cell: (line) => <span className="text-sm text-ink">{CF_LABEL[line.category]}</span> },
            { h: 'Tipe', cell: (line) => <Pill>{TX_LABEL[line.type]}</Pill> },
            {
              h: 'Jumlah',
              right: true,
              cell: (line) => <Amount value={line.amount} signed className="text-sm font-medium" />,
              sortValue: (line) => Number(line.amount),
            },
          ]}
        />
      </Panel>
    </>
  );
}

function BalanceSheetReport({ asOf, setAsOf }: { asOf: string; setAsOf: (value: string) => void }) {
  const { data, isLoading, isError, refetch } = useBalanceSheet(asOf);
  if (isLoading) return <Loading rows={6} />;
  if (isError || !data) return <ErrorState title="Neraca tidak dapat dimuat" onRetry={() => refetch()} />;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="as-of" className="text-xs text-muted">
          Per tanggal
        </label>
        <input id="as-of" className="input h-8 w-40 py-1" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
        <Pill tone={data.balanced ? 'green' : 'red'} dot>
          {data.balanced ? 'Aset − liabilitas = ekuitas' : 'Buku besar tidak seimbang'}
        </Pill>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Total aset" value={fmtMoney(data.totalAssets)} hint={`${data.assets.length} akun`} />
        <Stat label="Total liabilitas" value={fmtMoney(data.totalLiabilities)} hint={`${data.liabilities.length} akun`} />
        <Stat label="Ekuitas" value={fmtMoney(data.equity)} hint="Kekayaan bersih" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Aset" flush>
          <Lines rows={data.assets} total={data.totalAssets} totalLabel="Total aset" />
        </Panel>
        <Panel title="Liabilitas" flush>
          <Lines rows={data.liabilities} total={data.totalLiabilities} totalLabel="Total liabilitas" />
        </Panel>
        <Panel title="Ekuitas" flush>
          <Lines rows={data.equityItems} total={data.equity} totalLabel="Total ekuitas" />
        </Panel>
      </div>
    </>
  );
}

function NetWorthReport() {
  const { data, isLoading, isError, refetch } = useNetWorthHistory();
  const motion = useChartMotion();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  if (isLoading) return <Loading rows={6} />;
  if (isError || !data) return <ErrorState title="Riwayat kekayaan bersih tidak dapat dimuat" onRetry={() => refetch()} />;

  const rows = data.map((point) => ({ ...point, label: fmtMonth(point.date) }));
  const first = rows[0];
  const last = rows[rows.length - 1];
  const change = first && last ? Number(last.netWorth) - Number(first.netWorth) : 0;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Kekayaan bersih" value={last ? fmtMoney(last.netWorth, cur) : '–'} hint={last ? fmtDate(last.date) : undefined} />
        <Stat label="Aset" value={last ? fmtMoney(last.totalAssets, cur) : '–'} />
        <Stat label="Liabilitas" value={last ? fmtMoney(last.totalLiabilities, cur) : '–'} />
        <Stat label="Perubahan" value={fmtMoney(change, cur)} tone="auto" trend={change} hint="Sejak titik pertama" />
      </div>

      <Panel title="Perkembangan kekayaan bersih" subtitle="Akhir bulan, diturunkan dari jurnal" className="mb-4" flush>
        <div className="p-4 pt-5">
          <ChartFigure label="Grafik kekayaan bersih" summary={`Kekayaan bersih dari ${first ? fmtDate(first.date) : 'awal'} sampai ${last ? fmtDate(last.date) : 'akhir'}, perubahan ${fmtMoney(change, cur)}.`}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="label" {...chartAxis} minTickGap={24} />
                <YAxis {...chartAxis} tickFormatter={moneyTick(cur)} width={78} />
                <Tooltip content={<ChartTooltip currency={cur} />} cursor={{ stroke: chartGrid }} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Kekayaan bersih"
                  stroke={chartColor(1)}
                  fill={chartColor(1)}
                  fillOpacity={0.12}
                  strokeWidth={2}
                  {...motion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFigure>
        </div>
      </Panel>

      <Panel title="Rincian per bulan" subtitle="Perubahan dijelaskan oleh aset dan liabilitas" flush>
        <Table
          rows={data}
          keyOf={(point) => point.date}
          sortable
          caption="Kekayaan bersih per bulan"
          empty="Belum ada data bulanan"
          cols={[
            { h: 'Akhir bulan', cell: (point) => fmtDate(point.date), sortValue: (point) => point.date },
            { h: 'Aset', right: true, cell: (point) => <Amount value={point.totalAssets} />, sortValue: (point) => Number(point.totalAssets) },
            { h: 'Liabilitas', right: true, cell: (point) => <Amount value={point.totalLiabilities} />, sortValue: (point) => Number(point.totalLiabilities) },
            {
              h: 'Kekayaan bersih',
              right: true,
              cell: (point) => <Amount value={point.netWorth} className="font-medium" />,
              sortValue: (point) => Number(point.netWorth),
            },
          ]}
        />
      </Panel>
    </>
  );
}

function PortfolioReport() {
  const { data, isLoading, isError, refetch } = usePortfolio();
  if (isLoading) return <Loading rows={6} />;
  if (isError || !data) return <ErrorState title="Portofolio tidak dapat dimuat" onRetry={() => refetch()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Cost basis" value={fmtMoney(data.totalCost)} hint="Nilai perolehan" />
        <Stat label="Nilai pasar" value={fmtMoney(data.marketValue)} hint="Harga terakhir" />
        <Stat
          label="Belum realisasi"
          value={fmtMoney(data.unrealizedPl)}
          tone="auto"
          trend={Number(data.unrealizedPl)}
          hint={fmtPct(data.unrealizedPlPercent)}
        />
        <Stat label="Realisasi" value={fmtMoney(data.realizedPl)} tone="auto" trend={Number(data.realizedPl)} hint="Laba/rugi terealisasi" />
      </div>

      <Panel title="Kinerja dan alokasi per aset" subtitle="Selisih pasar terhadap cost basis" flush>
        <PositionsTable rows={data.positions} />
      </Panel>
    </>
  );
}

function DebtReport() {
  const { data = [], isLoading, isError, refetch } = useLiabilities();
  if (isLoading) return <Loading rows={5} />;
  if (isError) return <ErrorState title="Liabilitas tidak dapat dimuat" onRetry={() => refetch()} />;

  const total = data.reduce((sum, item) => sum + Number(item.outstanding), 0);
  const installment = data.reduce((sum, item) => sum + Number(item.installment ?? 0), 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Total sisa pokok" value={fmtMoney(total)} hint={`${data.length} liabilitas`} />
        <Stat label="Cicilan per bulan" value={fmtMoney(installment)} hint="Seluruh liabilitas aktif" />
        <Stat label="Rata-rata bunga" value={data.length ? fmtPct(data.reduce((sum, item) => sum + Number(item.interestRate), 0) / data.length) : '–'} hint="Tertimbang sederhana" />
      </div>

      <Panel title="Ringkasan utang" subtitle="Sisa pokok dari jurnal liabilitas" flush>
        <Table
          rows={data}
          keyOf={(item) => item.id}
          sortable
          caption="Ringkasan utang"
          empty="Belum ada utang"
          cols={[
            { h: 'Nama', cell: (item) => <span className="text-sm font-medium text-ink">{item.name}</span>, sortValue: (item) => item.name },
            { h: 'Kreditur', mobile: false, cell: (item) => <span className="text-xs text-muted">{item.creditor ?? '–'}</span>, sortValue: (item) => item.creditor ?? '' },
            { h: 'Bunga', right: true, cell: (item) => fmtPct(item.interestRate), sortValue: (item) => Number(item.interestRate) },
            { h: 'Cicilan', right: true, mobile: false, cell: (item) => (item.installment ? <Amount value={item.installment} /> : '–'), sortValue: (item) => Number(item.installment ?? 0) },
            { h: 'Jatuh tempo', mobile: false, cell: (item) => (item.dueDate ? fmtDate(item.dueDate) : '–'), sortValue: (item) => item.dueDate ?? '' },
            { h: 'Sisa pokok', right: true, cell: (item) => <Amount value={item.outstanding} className="font-medium" />, sortValue: (item) => Number(item.outstanding) },
          ]}
        />
        {data.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="text-xs text-muted">Total sisa pokok</span>
            <Amount value={total} className="font-semibold" />
          </div>
        )}
      </Panel>
    </>
  );
}

export default function ReportsPage() {
  const { report = 'profit-loss' } = useParams();
  const [range, setRange] = useState({ from: `${year}-01-01`, to: new Date().toISOString().slice(0, 10) });
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const ranged = report === 'profit-loss' || report === 'cash-flow';
  const title = TITLES[report] ?? report;

  return (
    <>
      <PageHeader
        eyebrow="Laporan"
        title={title}
        subtitle="Semua angka diturunkan dari jurnal double-entry; tidak ada saldo yang didenormalisasi."
        action={
          ranged ? (
            <Toolbar report={report} range={range}>
              <RangeFields from={range.from} to={range.to} set={(from, to) => setRange({ from, to })} />
            </Toolbar>
          ) : report === 'balance-sheet' ? (
            <Toolbar report={report} range={range} />
          ) : undefined
        }
      />

      <div className="mb-4">
        <SegmentedNav items={TABS} ariaLabel="Jenis laporan" />
      </div>

      {report === 'profit-loss' && <ProfitLoss {...range} />}
      {report === 'cash-flow' && <CashFlowReport {...range} />}
      {report === 'balance-sheet' && <BalanceSheetReport asOf={asOf} setAsOf={setAsOf} />}
      {report === 'net-worth' && <NetWorthReport />}
      {report === 'portfolio' && <PortfolioReport />}
      {report === 'debt' && <DebtReport />}

      {!TITLES[report] && (
        <Panel title="Laporan tidak ditemukan">
          <p className="text-sm text-muted">Pilih salah satu jenis laporan di atas.</p>
        </Panel>
      )}

      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-faint">
        <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
        Angka mengikuti mata uang dasar akun.
      </p>
    </>
  );
}

function downloadPdf(report: string, from: string, to: string) {
  http.get<Blob>('/api/reports/export/pdf', { params: { report, from, to }, responseType: 'blob' }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${report}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function downloadXls(report: string, from: string, to: string) {
  http.get<Blob>('/api/reports/export/xls', { params: { report, from, to }, responseType: 'blob' }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${report}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
