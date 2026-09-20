import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAssets, useBonds, useCouponHistory, useCoupons, useCreateBond } from '../api/queries';
import { Amount, Drawer, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';
import { fmtDate, fmtPct } from '../lib/format';

export function BondsPage() {
  const { data = [], isLoading } = useBonds();
  const { data: assets = [] } = useAssets();
  const create = useCreateBond();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ assetId: '', issuer: '', bondType: 'ORI', nominalValue: '', couponRate: '', taxRate: '10', frequency: 'MONTHLY', settlementDate: '', maturityDate: '' });
  if (isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Obligasi" subtitle="Jadwal kupon dihitung dari kupon, nominal, frekuensi, settlement dan jatuh tempo" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Obligasi</button>} />
      <Panel title="Daftar obligasi">
        <Table rows={data} keyOf={(b) => b.id} cols={[
          { h: 'Kode', cell: (b) => <span className="font-medium">{b.assetCode}</span> }, { h: 'Nama', cell: (b) => b.assetName }, { h: 'Penerbit', cell: (b) => b.issuer ?? '–' },
          { h: 'Nominal', right: true, cell: (b) => <Amount value={b.nominalValue} /> }, { h: 'Kupon', right: true, cell: (b) => fmtPct(b.couponRate) }, { h: 'Frekuensi', cell: (b) => b.frequency },
          { h: 'Settlement', cell: (b) => fmtDate(b.settlementDate) }, { h: 'Jatuh tempo', cell: (b) => fmtDate(b.maturityDate) },
          { h: 'Kupon berikut', right: true, cell: (b) => { const n = b.schedule.find((c) => c.status === 'UPCOMING'); return n ? <span>{fmtDate(n.paymentDate)} · <Amount value={n.net} /></span> : '–'; } },
        ]} />
      </Panel>
      <Drawer open={open} onClose={() => setOpen(false)} title="Obligasi baru">
        <form className="grid grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setError(null); try { await create.mutateAsync({ ...f, assetId: Number(f.assetId), nominalValue: Number(f.nominalValue), couponRate: Number(f.couponRate), taxRate: Number(f.taxRate) }); setOpen(false); } catch (err) { setError((err as Error).message); } }}>
          <Field label="Aset (tipe obligasi)"><select className="input" required value={f.assetId} onChange={(e) => setF({ ...f, assetId: e.target.value })}><option value="">— pilih —</option>{assets.filter((a) => a.assetType === 'BOND').map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}</select></Field>
          <Field label="Penerbit"><input className="input" value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} /></Field>
          <Field label="Nominal"><input className="input num" type="number" required value={f.nominalValue} onChange={(e) => setF({ ...f, nominalValue: e.target.value })} /></Field>
          <Field label="Kupon % p.a."><input className="input num" type="number" step="any" required value={f.couponRate} onChange={(e) => setF({ ...f, couponRate: e.target.value })} /></Field>
          <Field label="Pajak kupon %"><input className="input num" type="number" step="any" value={f.taxRate} onChange={(e) => setF({ ...f, taxRate: e.target.value })} /></Field>
          <Field label="Frekuensi"><select className="input" value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>{['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Settlement"><input className="input" type="date" required value={f.settlementDate} onChange={(e) => setF({ ...f, settlementDate: e.target.value })} /></Field>
          <Field label="Jatuh tempo"><input className="input" type="date" required value={f.maturityDate} onChange={(e) => setF({ ...f, maturityDate: e.target.value })} /></Field>
          {error && <div className="col-span-2 text-sm text-accent-red">{error}</div>}
          <div className="col-span-2"><button className="btn-primary">Simpan</button></div>
        </form>
      </Drawer>
    </>
  );
}

export function CouponsPage() {
  const { data = [], isLoading } = useCoupons();
  const { data: history = [] } = useCouponHistory();
  if (isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Kupon" subtitle="Jadwal kupon (derivasi) dan kupon yang sudah diterima (transaksi)" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Jadwal kupon">
          <Table rows={data} keyOf={(c) => `${c.bondId}-${c.paymentDate}`} cols={[
            { h: 'Tanggal', cell: (c) => fmtDate(c.paymentDate) }, { h: 'Obligasi', cell: (c) => c.assetCode }, { h: 'Bruto', right: true, cell: (c) => <Amount value={c.gross} /> },
            { h: 'Pajak', right: true, cell: (c) => <Amount value={c.tax} /> }, { h: 'Neto', right: true, cell: (c) => <Amount value={c.net} className="font-medium" /> },
            { h: 'Status', cell: (c) => <Pill tone={c.status === 'UPCOMING' ? 'amber' : 'green'}>{c.status === 'UPCOMING' ? 'Akan datang' : 'Terbayar'}</Pill> },
          ]} />
        </Panel>
        <Panel title="Kupon diterima">
          <Table rows={history} keyOf={(t) => t.id} cols={[
            { h: 'Tanggal', cell: (t) => fmtDate(t.transactionDate) }, { h: 'Obligasi', cell: (t) => t.assetCode }, { h: 'Bruto', right: true, cell: (t) => <Amount value={t.grossAmount} /> },
            { h: 'Pajak', right: true, cell: (t) => <Amount value={t.tax} /> }, { h: 'Neto', right: true, cell: (t) => <Amount value={t.netAmount} className="font-medium" /> }, { h: 'Akun', cell: (t) => t.accountName },
          ]} />
        </Panel>
      </div>
    </>
  );
}
