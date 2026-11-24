import { Link } from 'react-router-dom';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useDashboard } from '../api/queries';
import {
  Amount,
  ErrorState,
  Loading,
  PageHeader,
  Panel,
  Pill,
  Stat,
  TextLink,
} from '../components/ui';
import { ChartFigure, ChartTooltip, chartAxis, chartColor, chartGrid, moneyTick, useChartMotion } from '../components/charts';
import { fmtCompact, fmtDate, fmtMoney, fmtMonth, fmtPct, TX_LABEL } from '../lib/format';
import { useAuth } from '../lib/auth';

export default function DashboardPage() {
  const query = useDashboard();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  const motion = useChartMotion();

  if (query.isLoading) return <DashboardSkeleton />;
  if (query.isError || !query.data) {
    return <ErrorState title="Dashboard tidak dapat dimuat" onRetry={() => query.refetch()} />;
  }

  const data = query.data;
  const inv = data.investment;

  const history = data.netWorthHistory.map((point) => ({
    ...point,
    netWorth: Number(point.netWorth),
    totalAssets: Number(point.totalAssets),
    totalLiabilities: Number(point.totalLiabilities),
    label: fmtMonth(point.date),
  }));

  const last = history[history.length - 1];
  const previous = history[history.length - 2];
  const delta = last && previous ? last.netWorth - previous.netWorth : 0;
  const deltaPct = previous && previous.netWorth !== 0 ? (delta / Math.abs(previous.netWorth)) * 100 : null;
  const trend = delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down';

  const allocationTotal = data.allocation.reduce((sum, item) => sum + Number(item.amount), 0);
  const allocation = data.allocation.map((item) => ({
    ...item,
    amount: Number(item.amount),
    share: allocationTotal > 0 ? (Number(item.amount) / allocationTotal) * 100 : 0,
  }));

  const cashFlow = [
    { name: 'Operasional', value: Number(data.cashFlow.operating) },
    { name: 'Investasi', value: Number(data.cashFlow.investing) },
    { name: 'Pendanaan', value: Number(data.cashFlow.financing) },
    { name: 'Neto', value: Number(data.cashFlow.netCashFlow) },
  ];

  const netWorthSummary = history
    .slice(-12)
    .map((point) => `${point.label}: ${fmtMoney(point.netWorth, cur)}`)
    .join('; ');

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Ikhtisar keuangan"
        title="Dashboard"
        subtitle="Posisi keuangan disusun langsung dari buku besar double-entry."
        action={
          <>
            <Link to="/reports/net-worth" className="btn btn-secondary">
              Lihat laporan
            </Link>
            <Link to="/transactions" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              Transaksi
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="card p-5 sm:p-6 xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Kekayaan bersih</p>
                {last && previous && (
                  <Pill tone={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'slate'} dot>
                    {trend === 'up' ? 'Naik' : trend === 'down' ? 'Turun' : 'Stabil'}
                    {deltaPct != null ? ` ${fmtPct(Math.abs(deltaPct))}` : ''}
                  </Pill>
                )}
              </div>
              <p className="num mt-2 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.6rem]">
                {fmtMoney(data.netWorth, cur)}
              </p>
              <p className="mt-2 text-xs text-muted">
                {last && previous ? (
                  <>
                    <span className={delta >= 0 ? 'text-positive' : 'text-negative'}>
                      {delta >= 0 ? '+' : ''}
                      {fmtMoney(delta, cur)}
                    </span>{' '}
                    sejak bulan sebelumnya
                  </>
                ) : (
                  'Belum ada riwayat bulan sebelumnya'
                )}
              </p>
            </div>
            <Link to="/reports/balance-sheet" className="btn btn-secondary btn-sm">
              Neraca
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 h-[116px]">
            {history.length > 1 ? (
              <ChartFigure label="Tren kekayaan bersih" summary={`Kekayaan bersih terakhir ${fmtMoney(last?.netWorth ?? 0, cur)}. ${netWorthSummary}.`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <Tooltip content={<ChartTooltip currency={cur} />} cursor={{ stroke: chartGrid }} />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      name="Kekayaan bersih"
                      stroke={chartColor(1)}
                      strokeWidth={2}
                      fill={chartColor(1)}
                      fillOpacity={0.1}
                      {...motion}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAssets"
                      name="Total aset"
                      stroke={chartColor(5)}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      {...motion}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartFigure>
            ) : (
              <div className="grid h-full place-items-center rounded-lg bg-surface-2 text-xs text-muted">
                Riwayat kekayaan bersih muncul setelah ada transaksi.
              </div>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 sm:grid-cols-4">
            {[
              { label: 'Total aset', value: fmtCompact(data.totalAssets, cur) },
              { label: 'Kas & bank', value: fmtCompact(data.cashAndBank, cur) },
              { label: 'Total investasi', value: fmtCompact(data.totalInvestments, cur) },
              { label: 'Liabilitas', value: fmtCompact(data.totalLiabilities, cur) },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-[11px] text-muted">{item.label}</dt>
                <dd className="num mt-0.5 truncate text-sm font-semibold text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card flex flex-col p-5 xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="panel-title">Kinerja investasi</h2>
              <p className="mt-0.5 text-xs text-muted">Setelah biaya &amp; pajak</p>
            </div>
            <Pill tone={Number(inv.totalReturn) >= 0 ? 'green' : 'red'}>
              {Number(inv.totalReturn) >= 0 ? 'Positif' : 'Negatif'}
            </Pill>
          </div>

          <p className={`num mt-4 text-2xl font-semibold tracking-tight ${Number(inv.totalReturn) >= 0 ? 'text-positive' : 'text-negative'}`}>
            {fmtMoney(inv.totalReturn, cur)}
          </p>

          <dl className="mt-4 flex-1 divide-y divide-line">
            {[
              { label: 'Laba realisasi', value: inv.realizedPl },
              { label: 'Belum realisasi', value: inv.unrealizedPl },
              { label: 'Pendapatan investasi', value: Number(inv.dividendIncome) + Number(inv.couponIncome) + Number(inv.interestIncome) },
              { label: 'Biaya & pajak', value: -(Number(inv.fees) + Number(inv.taxes)) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd>
                  <Amount value={row.value} currency={cur} signed className="text-xs font-medium" />
                </dd>
              </div>
            ))}
          </dl>

          <Link
            to="/investments/portfolio"
            className="mt-4 flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-3"
          >
            Buka portofolio
            <ArrowUpRight size={14} className="text-muted" aria-hidden="true" />
          </Link>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Pendapatan dividen"
          value={fmtMoney(inv.dividendIncome, cur)}
          hint="Arus kas masuk dari saham"
        />
        <Stat
          label="Pendapatan kupon"
          value={fmtMoney(inv.couponIncome, cur)}
          hint="Obligasi & surat utang"
        />
        <Stat
          label="Bunga"
          value={fmtMoney(inv.interestIncome, cur)}
          hint="Deposito & instrumen berbunga"
        />
        <Stat
          label="Laba belum realisasi"
          value={fmtMoney(inv.unrealizedPl, cur)}
          tone="auto"
          trend={Number(inv.unrealizedPl)}
          hint="Harga pasar − cost basis"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel title="Riwayat kekayaan bersih" subtitle="Nilai bersih bulanan dibanding total aset" className="xl:col-span-8">
          <div className="h-[248px]">
            {history.length ? (
              <ChartFigure label="Grafik riwayat kekayaan bersih" summary={netWorthSummary}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="label" {...chartAxis} />
                    <YAxis width={72} tickFormatter={moneyTick(cur)} {...chartAxis} />
                    <Tooltip content={<ChartTooltip currency={cur} />} cursor={{ stroke: chartGrid }} />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      name="Kekayaan bersih"
                      stroke={chartColor(1)}
                      strokeWidth={2}
                      fill={chartColor(1)}
                      fillOpacity={0.1}
                      {...motion}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAssets"
                      name="Total aset"
                      stroke={chartColor(5)}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      {...motion}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartFigure>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">Belum ada riwayat.</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(1) }} aria-hidden="true" />
              Kekayaan bersih
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(5) }} aria-hidden="true" />
              Total aset
            </span>
          </div>
        </Panel>

        <Panel title="Alokasi portofolio" subtitle="Berdasarkan nilai pasar" className="xl:col-span-4">
          {allocation.length ? (
            <>
              <div className="relative h-[196px]">
                <ChartFigure
                  label="Alokasi portofolio"
                  summary={allocation.map((item) => `${item.label || item.code} ${fmtPct(item.share)} senilai ${fmtMoney(item.amount, cur)}`).join('; ')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        dataKey="amount"
                        nameKey="label"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={1.5}
                        stroke="none"
                        {...motion}
                      >
                        {allocation.map((item, index) => (
                          <Cell key={item.code} fill={chartColor(index + 1)} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip currency={cur} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartFigure>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-faint">Nilai pasar</p>
                    <p className="num text-sm font-semibold text-ink">{fmtCompact(allocationTotal, cur)}</p>
                  </div>
                </div>
              </div>
              <ul className="mt-1 space-y-2">
                {allocation.map((item, index) => (
                  <li key={item.code} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColor(index + 1) }} aria-hidden="true" />
                      <span className="truncate text-ink">{item.label || item.code}</span>
                    </span>
                    <span className="shrink-0 text-muted">
                      <span className="num font-medium text-ink">{fmtPct(item.share)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="grid h-[240px] place-items-center text-sm text-muted">Belum ada posisi investasi.</div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Arus kas tahun berjalan" subtitle="Klasifikasi operasional, investasi, pendanaan">
          <div className="h-[188px]">
            <ChartFigure
              label="Arus kas tahun berjalan"
              summary={cashFlow.map((item) => `${item.name} ${fmtMoney(item.value, cur)}`).join('; ')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="name" {...chartAxis} tick={{ ...chartAxis.tick, fontSize: 10 }} />
                  <YAxis width={64} tickFormatter={moneyTick(cur)} {...chartAxis} />
                  <Tooltip content={<ChartTooltip currency={cur} />} cursor={{ fill: 'rgb(var(--c-surface-2))' }} />
                  <Bar dataKey="value" name="Arus kas" radius={[4, 4, 0, 0]} maxBarSize={40} {...motion}>
                    {cashFlow.map((item) => (
                      <Cell key={item.name} fill={item.value < 0 ? 'rgb(var(--c-negative))' : 'rgb(var(--c-accent))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
            <span className="text-muted">Arus kas neto</span>
            <Amount value={data.cashFlow.netCashFlow} currency={cur} signed className="font-semibold" />
          </div>
        </Panel>

        <Panel title="Akan datang" subtitle="Kupon dan cicilan terdekat" action={<TextLink to="/investments/coupons">Kupon</TextLink>}>
          {data.upcoming.length ? (
            <ul className="divide-y divide-line">
              {data.upcoming.slice(0, 5).map((item) => (
                <li key={`${item.kind}-${item.label}-${item.date}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-center">
                      <span className="num text-[11px] font-semibold leading-none text-ink">{item.date.slice(8, 10)}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink">{item.label}</p>
                      <p className="text-[11px] text-muted">
                        {fmtDate(item.date)} · {item.kind === 'COUPON' ? 'Kupon' : 'Cicilan'}
                      </p>
                    </div>
                  </div>
                  <Amount value={item.amount} currency={cur} className="shrink-0 text-xs font-medium" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid h-[220px] place-items-center text-sm text-muted">Tidak ada jadwal mendatang.</div>
          )}
        </Panel>

        <Panel title="Transaksi terbaru" subtitle="Aktivitas terakhir di buku besar" action={<TextLink to="/transactions">Semua</TextLink>}>
          {data.recentTransactions.length ? (
            <ul className="divide-y divide-line">
              {data.recentTransactions.slice(0, 5).map((transaction) => (
                <li key={transaction.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink">{TX_LABEL[transaction.type]}</p>
                    <p className="truncate text-[11px] text-muted">
                      {fmtDate(transaction.transactionDate)} · {transaction.accountName}
                    </p>
                  </div>
                  <Amount value={transaction.netAmount} currency={transaction.currency} className="shrink-0 text-xs font-medium" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid h-[220px] place-items-center text-sm text-muted">Belum ada transaksi.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 sm:space-y-5">
      <span className="sr-only">Memuat dashboard…</span>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-3 w-64" />
        </div>
        <div className="skeleton h-10 w-32" />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="card h-[320px] p-6 xl:col-span-8">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton mt-3 h-10 w-56" />
          <div className="skeleton mt-6 h-[116px] w-full" />
        </div>
        <div className="card h-[320px] p-5 xl:col-span-4">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mt-4 h-8 w-40" />
          <div className="mt-5 space-y-3">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="card p-5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-3 h-6 w-32" />
          </div>
        ))}
      </div>
      <Loading rows={4} />
    </div>
  );
}
