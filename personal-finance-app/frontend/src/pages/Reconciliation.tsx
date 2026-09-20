import { useState } from 'react';
import { useAccounts, useCreateReconciliation, useReconciliations } from '../api/queries';
import { Amount, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';
import { fmtDate } from '../lib/format';

const STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = { RECONCILED: { label: 'Sesuai', tone: 'green' }, DIFFERENCE_FOUND: { label: 'Ada selisih', tone: 'red' }, PENDING_REVIEW: { label: 'Perlu ditinjau', tone: 'amber' } };

export default function ReconciliationPage() {
  const { data = [], isLoading } = useReconciliations();
  const { data: accounts = [] } = useAccounts();
  const create = useCreateReconciliation();
  const [f, setF] = useState({ accountId: '', reconciliationDate: new Date().toISOString().slice(0, 10), actualBalance: '', notes: '' });
  const selected = accounts.find((a) => a.id === Number(f.accountId));
  return (
    <>
      <PageHeader title="Rekonsiliasi" subtitle="Bandingkan saldo buku besar dengan saldo rekening sebenarnya" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Rekonsiliasi baru">
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await create.mutateAsync({ ...f, accountId: Number(f.accountId), actualBalance: Number(f.actualBalance), notes: f.notes || undefined }); setF({ ...f, actualBalance: '', notes: '' }); }}>
            <Field label="Akun"><select className="input" required value={f.accountId} onChange={(e) => setF({ ...f, accountId: e.target.value })}><option value="">— pilih —</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            {selected && <div className="text-sm text-slate-600">Saldo sistem saat ini: <Amount value={selected.balance} currency={selected.currency} className="font-medium" /></div>}
            <Field label="Tanggal"><input className="input" type="date" value={f.reconciliationDate} onChange={(e) => setF({ ...f, reconciliationDate: e.target.value })} /></Field>
            <Field label="Saldo aktual (rekening)"><input className="input num" type="number" step="any" required value={f.actualBalance} onChange={(e) => setF({ ...f, actualBalance: e.target.value })} /></Field>
            <Field label="Catatan (mis. biaya/dividen belum tercatat)"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <button className="btn-primary">Bandingkan</button>
          </form>
        </Panel>
        <Panel title="Riwayat" className="lg:col-span-2">
          {isLoading ? <Loading /> : (
            <Table rows={data} keyOf={(r) => r.id} cols={[
              { h: 'Tanggal', cell: (r) => fmtDate(r.reconciliationDate) }, { h: 'Akun', cell: (r) => r.accountName },
              { h: 'Saldo sistem', right: true, cell: (r) => <Amount value={r.systemBalance} /> }, { h: 'Saldo aktual', right: true, cell: (r) => <Amount value={r.actualBalance} /> },
              { h: 'Selisih', right: true, cell: (r) => <Amount value={r.difference} signed className="font-medium" /> },
              { h: 'Status', cell: (r) => <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill> }, { h: 'Catatan', cell: (r) => <span className="text-slate-500">{r.notes ?? ''}</span> },
            ]} />
          )}
        </Panel>
      </div>
    </>
  );
}
