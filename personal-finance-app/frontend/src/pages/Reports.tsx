import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBalanceSheet, useCashFlow, useIncomeExpense, useInvestmentIncome, useLiabilities, useNetWorthHistory, usePortfolio } from '../api/queries';
import { Amount, Loading, Metric, PageHeader, Panel, Table } from '../components/ui';
import { CF_LABEL, fmtCompact, fmtDate, fmtMoney, fmtMonth, fmtPct, TX_LABEL } from '../lib/format';
import { PositionsTable } from './Investments';
import type { LineItem } from '../types/domain';

const year = new Date().getFullYear();
const Lines = ({ rows, total, totalLabel }: { rows: LineItem[]; total: string; totalLabel: string }) => (
  <table className="table">
    <tbody>
      {rows.map((l) => <tr key={l.code}><td className="text-slate-500 w-20 num">{l.code}</td><td>{l.label}</td><td className="text-right"><Amount value={l.amount} /></td></tr>)}
      <tr className="font-semibold"><td /><td>{totalLabel}</td><td className="text-right"><Amount value={total} /></td></tr>
    </tbody>
  </table>
);

function Range({ from, to, set }: { from: string; to: string; set: (f: string, t: string) => void }) {
  return <div className="flex gap-2"><input className="input w-40" type="date" value={from} onChange={(e) => set(e.target.value, to)} /><input className="input w-40" type="date" value={to} onChange={(e) => set(from, e.target.value)} /><button className="btn-secondary" onClick={() => window.print()}>Cetak</button></div>;
}

function ProfitLoss({ from, to }: { from: string; to: string }) {
  const { data } = useIncomeExpense(from, to);
  const { data: inv } = useInvestmentIncome(from, to);
  if (!data || !inv) return <Loading />;
  return (
    <>
      <div className="panel grid grid-cols-3 mb-6"><Metric label="Total pendapatan" value={fmtMoney(data.totalIncome)} /><Metric label="Total beban" value={fmtMoney(data.totalExpense)} /><Metric label="Hasil bersih" value={fmtMoney(data.netResult)} tone="signed" /></div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6"><Panel title="Pendapatan"><Lines rows={data.income} total={data.totalIncome} totalLabel="Total pendapatan" /></Panel><Panel title="Beban"><Lines rows={data.expenses} total={data.totalExpense} totalLabel="Total beban" /></Panel></div>
      <Panel title="Dekomposisi imbal hasil investasi">
        <table className="table"><tbody>
          {[['Laba realisasi', inv.realizedPl], ['Laba belum realisasi (posisi saat ini)', inv.unrealizedPl], ['Dividen', inv.dividendIncome], ['Kupon', inv.couponIncome], ['Bunga', inv.interestIncome], ['(−) Biaya investasi', inv.fees], ['(−) Pajak', inv.taxes]].map(([k, v]) => <tr key={k as string}><td>{k as string}</td><td className="text-right"><Amount value={v} signed={!String(k).startsWith('(')} /></td></tr>)}
          <tr className="font-semibold"><td>Total imbal hasil</td><td className="text-right"><Amount value={inv.totalReturn} signed /></td></tr>
        </tbody></table>
      </Panel>
    </>
  );
}

function CashFlowReport({ from, to }: { from: string; to: string }) {
  const { data } = useCashFlow(from, to);
  if (!data) return <Loading />;
  return (
    <>
      <div className="panel grid grid-cols-4 mb-6"><Metric label="Operasional" value={fmtMoney(data.operating)} tone="signed" /><Metric label="Investasi" value={fmtMoney(data.investing)} tone="signed" /><Metric label="Pendanaan" value={fmtMoney(data.financing)} tone="signed" /><Metric label="Arus kas neto" value={fmtMoney(data.netCashFlow)} tone="signed" /></div>
      <Panel title="Rincian per tipe transaksi"><Table rows={data.lines} keyOf={(l) => l.type} cols={[{ h: 'Klasifikasi', cell: (l) => CF_LABEL[l.category] }, { h: 'Tipe', cell: (l) => TX_LABEL[l.type] }, { h: 'Jumlah', right: true, cell: (l) => <Amount value={l.amount} signed /> }]} /></Panel>
    </>
  );
}

function BalanceSheetReport({ asOf, setAsOf }: { asOf: string; setAsOf: (v: string) => void }) {
  const { data } = useBalanceSheet(asOf);
  if (!data) return <Loading />;
  return (
    <>
      <div className="flex items-center gap-3 mb-4"><span className="text-sm text-slate-500">Per tanggal</span><input className="input w-40" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} /><span className={`text-xs ${data.balanced ? 'text-accent-green' : 'text-accent-red'}`}>{data.balanced ? 'Aset − Liabilitas = Ekuitas ✓' : 'Buku besar tidak seimbang!'}</span></div>
      <div className="panel grid grid-cols-3 mb-6"><Metric label="Total aset" value={fmtMoney(data.totalAssets)} /><Metric label="Total liabilitas" value={fmtMoney(data.totalLiabilities)} /><Metric label="Ekuitas / kekayaan bersih" value={fmtMoney(data.equity)} /></div>
      <div className="grid lg:grid-cols-3 gap-6"><Panel title="Aset"><Lines rows={data.assets} total={data.totalAssets} totalLabel="Total aset" /></Panel><Panel title="Liabilitas"><Lines rows={data.liabilities} total={data.totalLiabilities} totalLabel="Total liabilitas" /></Panel><Panel title="Ekuitas"><Lines rows={data.equityItems} total={data.equity} totalLabel="Total ekuitas" /></Panel></div>
    </>
  );
}

function NetWorthReport() {
  const { data } = useNetWorthHistory();
  if (!data) return <Loading />;
  const rows = data.map((p) => ({ ...p, nw: Number(p.netWorth), label: fmtMonth(p.date) }));
  return (
    <>
      <Panel title="Perkembangan kekayaan bersih" className="mb-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={rows}><CartesianGrid stroke="#E2E8F0" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fontSize: 11 }} width={80} /><Tooltip formatter={(v) => fmtMoney(Number(v))} /><Area type="monotone" dataKey="nw" stroke="#1E3A5F" fill="#E2E8F0" strokeWidth={2} /></AreaChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Per bulan (perubahan dijelaskan oleh aset dan liabilitas)">
        <Table rows={data} keyOf={(p) => p.date} cols={[{ h: 'Akhir bulan', cell: (p) => fmtDate(p.date) }, { h: 'Aset', right: true, cell: (p) => <Amount value={p.totalAssets} /> }, { h: 'Liabilitas', right: true, cell: (p) => <Amount value={p.totalLiabilities} /> }, { h: 'Kekayaan bersih', right: true, cell: (p) => <Amount value={p.netWorth} className="font-medium" /> }]} />
      </Panel>
    </>
  );
}

function PortfolioReport() {
  const { data } = usePortfolio();
  if (!data) return <Loading />;
  return (
    <>
      <div className="panel grid grid-cols-4 mb-6"><Metric label="Cost basis" value={fmtMoney(data.totalCost)} /><Metric label="Nilai pasar" value={fmtMoney(data.marketValue)} /><Metric label="Unrealized" value={fmtMoney(data.unrealizedPl)} tone="signed" sub={fmtPct(data.unrealizedPlPercent)} /><Metric label="Realized" value={fmtMoney(data.realizedPl)} tone="signed" /></div>
      <Panel title="Kinerja & alokasi per aset"><PositionsTable rows={data.positions} /></Panel>
    </>
  );
}

function DebtReport() {
  const { data = [] } = useLiabilities();
  const total = data.reduce((s, l) => s + Number(l.outstanding), 0);
  return (
    <Panel title="Ringkasan utang">
      <Table rows={data} keyOf={(l) => l.id} cols={[{ h: 'Nama', cell: (l) => l.name }, { h: 'Kreditur', cell: (l) => l.creditor ?? '–' }, { h: 'Bunga', right: true, cell: (l) => fmtPct(l.interestRate) }, { h: 'Cicilan', right: true, cell: (l) => l.installment ? <Amount value={l.installment} /> : '–' }, { h: 'Jatuh tempo', cell: (l) => l.dueDate ? fmtDate(l.dueDate) : '–' }, { h: 'Sisa pokok', right: true, cell: (l) => <Amount value={l.outstanding} className="font-medium" /> }]} />
      <div className="flex justify-between px-4 py-3 border-t border-slate-200 text-sm"><span className="text-slate-500">Total sisa pokok</span><Amount value={total} className="font-semibold" /></div>
    </Panel>
  );
}

const TITLES: Record<string, string> = { 'profit-loss': 'Laba Rugi', 'cash-flow': 'Arus Kas', 'balance-sheet': 'Neraca', 'net-worth': 'Kekayaan Bersih', portfolio: 'Kinerja Portofolio', debt: 'Utang' };

export default function ReportsPage() {
  const { report = 'profit-loss' } = useParams();
  const [range, setRange] = useState({ from: `${year}-01-01`, to: new Date().toISOString().slice(0, 10) });
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const ranged = report === 'profit-loss' || report === 'cash-flow';
  return (
    <>
      <PageHeader title={`Laporan · ${TITLES[report] ?? report}`} subtitle="Semua angka diturunkan dari jurnal double-entry" action={ranged ? <Range from={range.from} to={range.to} set={(from, to) => setRange({ from, to })} /> : undefined} />
      {report === 'profit-loss' && <ProfitLoss {...range} />}
      {report === 'cash-flow' && <CashFlowReport {...range} />}
      {report === 'balance-sheet' && <BalanceSheetReport asOf={asOf} setAsOf={setAsOf} />}
      {report === 'net-worth' && <NetWorthReport />}
      {report === 'portfolio' && <PortfolioReport />}
      {report === 'debt' && <DebtReport />}
    </>
  );
}
