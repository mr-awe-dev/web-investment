import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../api/queries';
import { Amount, Loading, Metric, PageHeader, Panel, Pill, Table } from '../components/ui';
import { fmtCompact, fmtDate, fmtMoney, fmtMonth, TX_LABEL } from '../lib/format';
import { useAuth } from '../lib/auth';

const ALLOC_COLORS = ['#0F172A', '#1E3A5F', '#2563EB', '#334155', '#64748B', '#94A3B8', '#CBD5E1'];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  if (isLoading || !data) return <Loading />;
  const inv = data.investment;
  const cf = [
    { name: 'Operasional', value: Number(data.cashFlow.operating) }, { name: 'Investasi', value: Number(data.cashFlow.investing) },
    { name: 'Pendanaan', value: Number(data.cashFlow.financing) }, { name: 'Neto', value: Number(data.cashFlow.netCashFlow) },
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Posisi keuangan diturunkan langsung dari buku besar" />
      <div className="panel grid grid-cols-2 lg:grid-cols-5 mb-6">
        <Metric label="Kekayaan Bersih" value={fmtCompact(data.netWorth, cur)} sub="Aset − Liabilitas" />
        <Metric label="Total Aset" value={fmtCompact(data.totalAssets, cur)} />
        <Metric label="Total Investasi" value={fmtCompact(data.totalInvestments, cur)} sub="nilai buku" />
        <Metric label="Kas & Bank" value={fmtCompact(data.cashAndBank, cur)} />
        <Metric label="Total Liabilitas" value={fmtCompact(data.totalLiabilities, cur)} />
      </div>
      <div className="panel grid grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric label="Laba Realisasi" value={fmtMoney(inv.realizedPl, cur)} tone="signed" />
        <Metric label="Laba Belum Realisasi" value={fmtMoney(inv.unrealizedPl, cur)} tone="signed" sub="harga pasar − cost basis" />
        <Metric label="Pendapatan Investasi" value={fmtMoney(Number(inv.dividendIncome) + Number(inv.couponIncome) + Number(inv.interestIncome), cur)} sub="dividen + kupon + bunga" />
        <Metric label="Total Imbal Hasil" value={fmtMoney(inv.totalReturn, cur)} tone="signed" sub="setelah biaya & pajak" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="Riwayat Kekayaan Bersih" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.netWorthHistory.map((p) => ({ ...p, netWorth: Number(p.netWorth), label: fmtMonth(p.date) }))}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmtCompact(v, cur)} tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => fmtMoney(Number(v), cur)} />
              <Area type="monotone" dataKey="netWorth" stroke="#1E3A5F" fill="#E2E8F0" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Alokasi Portofolio">
          {data.allocation.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.allocation.map((a) => ({ name: a.code, value: Number(a.amount) }))} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={1}>
                  {data.allocation.map((_, i) => <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMoney(Number(v), cur)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-slate-400 text-sm py-10 text-center">Belum ada posisi</div>}
        </Panel>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="Arus Kas Tahun Berjalan">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cf}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmtCompact(v, cur)} tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => fmtMoney(Number(v), cur)} />
              <Bar dataKey="value">{cf.map((c, i) => <Cell key={i} fill={c.value < 0 ? '#DC2626' : '#16A34A'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Akan Datang">
          <Table rows={data.upcoming} keyOf={(u) => `${u.kind}-${u.label}-${u.date}`} empty="Tidak ada jadwal"
            cols={[
              { h: 'Jenis', cell: (u) => <Pill tone="amber">{u.kind === 'COUPON' ? 'Kupon' : 'Cicilan'}</Pill> },
              { h: 'Item', cell: (u) => u.label }, { h: 'Tanggal', cell: (u) => fmtDate(u.date) },
              { h: 'Jumlah', right: true, cell: (u) => <Amount value={u.amount} currency={cur} /> },
            ]} />
        </Panel>
        <Panel title="Transaksi Terbaru" action={<Link to="/transactions" className="text-xs text-accent-blue">Semua</Link>}>
          <Table rows={data.recentTransactions} keyOf={(t) => t.id}
            cols={[
              { h: 'Tanggal', cell: (t) => fmtDate(t.transactionDate) }, { h: 'Tipe', cell: (t) => TX_LABEL[t.type] },
              { h: 'Jumlah', right: true, cell: (t) => <Amount value={t.netAmount} currency={t.currency} /> },
            ]} />
        </Panel>
      </div>
    </>
  );
}
