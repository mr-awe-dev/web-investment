import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBudgets, useChartOfAccounts, useDeleteBudget, useUpsertBudget } from '../api/queries';
import { Amount, Drawer, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';

const STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = { HEALTHY: { label: 'Sehat', tone: 'green' }, NEAR_LIMIT: { label: 'Mendekati batas', tone: 'amber' }, OVER_BUDGET: { label: 'Melebihi', tone: 'red' } };

export default function BudgetPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const { data = [], isLoading } = useBudgets(period);
  const { data: coa = [] } = useChartOfAccounts();
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ categoryId: '', amount: '' });
  const totals = data.reduce((s, b) => ({ budget: s.budget + Number(b.amount), actual: s.actual + Number(b.actual) }), { budget: 0, actual: 0 });
  return (
    <>
      <PageHeader title="Anggaran" subtitle="Realisasi dihitung dari jurnal beban bulan berjalan" action={<div className="flex gap-2"><input className="input w-40" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /><button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Anggaran</button></div>} />
      <Panel title={`Anggaran ${period}`}>
        {isLoading ? <Loading /> : (
          <Table rows={data} keyOf={(b) => b.id} empty="Belum ada anggaran untuk bulan ini" cols={[
            { h: 'Kategori', cell: (b) => <span className="font-medium">{b.categoryCode} · {b.categoryName}</span> }, { h: 'Anggaran', right: true, cell: (b) => <Amount value={b.amount} /> },
            { h: 'Realisasi', right: true, cell: (b) => <Amount value={b.actual} /> }, { h: 'Sisa', right: true, cell: (b) => <Amount value={b.remaining} signed /> },
            { h: 'Progres', cell: (b) => <div className="w-32 h-1.5 bg-slate-100 rounded"><div className={`h-1.5 rounded ${b.status === 'OVER_BUDGET' ? 'bg-accent-red' : b.status === 'NEAR_LIMIT' ? 'bg-accent-amber' : 'bg-navy-light'}`} style={{ width: `${Math.min(100, (Number(b.actual) / Number(b.amount)) * 100)}%` }} /></div> },
            { h: 'Status', cell: (b) => <Pill tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Pill> },
            { h: '', cell: (b) => <button className="btn-danger h-7 px-2 text-xs" onClick={() => del.mutate(b.id)}>Hapus</button> },
          ]} />
        )}
        <div className="flex justify-end gap-8 px-4 py-3 border-t border-slate-200 text-sm"><span>Anggaran <Amount value={totals.budget} className="font-semibold" /></span><span>Realisasi <Amount value={totals.actual} className="font-semibold" /></span></div>
      </Panel>
      <Drawer open={open} onClose={() => setOpen(false)} title="Anggaran kategori">
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await upsert.mutateAsync({ categoryId: Number(f.categoryId), periodMonth: period, amount: Number(f.amount) }); setOpen(false); }}>
          <Field label="Kategori beban"><select className="input" required value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}><option value="">— pilih —</option>{coa.filter((c) => c.type === 'EXPENSE' && c.parentCode).map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></Field>
          <Field label="Jumlah anggaran"><input className="input num" type="number" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <button className="btn-primary">Simpan</button>
        </form>
      </Drawer>
    </>
  );
}
