import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateLiability, useLiabilities } from '../api/queries';
import { Amount, Drawer, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';
import { fmtDate, fmtPct } from '../lib/format';

const TYPE_LABEL: Record<string, string> = { LOAN: 'Pinjaman', CREDIT_CARD: 'Kartu Kredit', OTHER: 'Utang Lain' };

export default function LiabilitiesPage() {
  const { data = [], isLoading } = useLiabilities();
  const create = useCreateLiability();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', creditor: '', liabilityType: 'LOAN', currency: 'IDR', interestRate: '', tenorMonths: '', installment: '', dueDate: '' });
  if (isLoading) return <Loading />;
  const total = data.reduce((s, l) => s + Number(l.outstanding), 0);
  return (
    <>
      <PageHeader title="Liabilitas" subtitle="Saldo pokok diturunkan dari jurnal pinjaman & pembayaran pokok" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Liabilitas</button>} />
      <Panel title="Daftar utang">
        <Table rows={data} keyOf={(l) => l.id} cols={[
          { h: 'Nama', cell: (l) => <span className="font-medium">{l.name}</span> }, { h: 'Kreditur', cell: (l) => l.creditor ?? '–' }, { h: 'Jenis', cell: (l) => <Pill>{TYPE_LABEL[l.liabilityType]}</Pill> },
          { h: 'Bunga', right: true, cell: (l) => fmtPct(l.interestRate) }, { h: 'Tenor', right: true, cell: (l) => l.tenorMonths ? `${l.tenorMonths} bln` : '–' },
          { h: 'Cicilan', right: true, cell: (l) => l.installment ? <Amount value={l.installment} currency={l.currency} /> : '–' }, { h: 'Jatuh tempo', cell: (l) => l.dueDate ? fmtDate(l.dueDate) : '–' },
          { h: 'Sisa pokok', right: true, cell: (l) => <Amount value={l.outstanding} currency={l.currency} className="font-medium text-accent-red" /> },
          { h: 'Status', cell: (l) => <Pill tone={l.status === 'ACTIVE' ? 'amber' : 'green'}>{l.status === 'ACTIVE' ? 'Aktif' : 'Lunas'}</Pill> },
        ]} />
        <div className="flex justify-between px-4 py-3 border-t border-slate-200 text-sm"><span className="text-slate-500">Total liabilitas</span><Amount value={total} className="font-semibold" /></div>
      </Panel>
      <Drawer open={open} onClose={() => setOpen(false)} title="Liabilitas baru">
        <form className="grid grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); await create.mutateAsync({ ...f, interestRate: f.interestRate || '0', tenorMonths: f.tenorMonths ? Number(f.tenorMonths) : undefined, installment: f.installment || undefined, dueDate: f.dueDate || undefined } as never); setOpen(false); }}>
          <Field label="Nama"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Kreditur"><input className="input" value={f.creditor} onChange={(e) => setF({ ...f, creditor: e.target.value })} /></Field>
          <Field label="Jenis"><select className="input" value={f.liabilityType} onChange={(e) => setF({ ...f, liabilityType: e.target.value })}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Mata uang"><input className="input" maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Bunga % p.a."><input className="input num" type="number" step="any" value={f.interestRate} onChange={(e) => setF({ ...f, interestRate: e.target.value })} /></Field>
          <Field label="Tenor (bulan)"><input className="input num" type="number" value={f.tenorMonths} onChange={(e) => setF({ ...f, tenorMonths: e.target.value })} /></Field>
          <Field label="Cicilan"><input className="input num" type="number" value={f.installment} onChange={(e) => setF({ ...f, installment: e.target.value })} /></Field>
          <Field label="Jatuh tempo berikut"><input className="input" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          <div className="col-span-2"><button className="btn-primary">Simpan</button></div>
        </form>
      </Drawer>
    </>
  );
}
