import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAccount, useAccounts, useCreateAccount, useReconciliations, useTransactions } from '../api/queries';
import { Amount, Drawer, Field, Loading, PageHeader, Panel, Pill, Table } from '../components/ui';
import { ACCOUNT_LABEL, fmtDate, TX_LABEL } from '../lib/format';

function AccountDetail({ id }: { id: number }) {
  const { data: account } = useAccount(id);
  const { data: txs } = useTransactions({ accountId: id, size: 50 });
  const { data: recon = [] } = useReconciliations();
  if (!account) return <Loading />;
  return (
    <>
      <PageHeader title={account.name} subtitle={`${ACCOUNT_LABEL[account.category]} · ${account.institution ?? ''} · Buku besar ${account.ledgerCode}`} />
      <div className="panel p-4 mb-6 flex items-baseline gap-6"><span className="text-xs text-slate-500">Saldo buku besar</span><Amount value={account.balance} currency={account.currency} className="text-2xl font-semibold" /></div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Transaksi & transfer" className="lg:col-span-2">
          <Table rows={txs?.content ?? []} keyOf={(t) => t.id} cols={[{ h: 'Tanggal', cell: (t) => fmtDate(t.transactionDate) }, { h: 'Tipe', cell: (t) => TX_LABEL[t.type] }, { h: 'Keterangan', cell: (t) => t.description ?? t.reference ?? '' }, { h: 'Neto', right: true, cell: (t) => <Amount value={t.netAmount} currency={t.currency} /> }]} />
        </Panel>
        <Panel title="Rekonsiliasi">
          <Table rows={recon.filter((r) => r.accountId === id)} keyOf={(r) => r.id} cols={[{ h: 'Tanggal', cell: (r) => fmtDate(r.reconciliationDate) }, { h: 'Selisih', right: true, cell: (r) => <Amount value={r.difference} signed /> }, { h: 'Status', cell: (r) => <Pill tone={r.status === 'RECONCILED' ? 'green' : 'amber'}>{r.status}</Pill> }]} />
        </Panel>
      </div>
    </>
  );
}

export default function AccountsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data = [], isLoading } = useAccounts();
  const create = useCreateAccount();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'BANK', currency: 'IDR', institution: '' });
  if (id) return <AccountDetail id={Number(id)} />;
  const total = data.reduce((s, a) => s + Number(a.balance), 0);
  return (
    <>
      <PageHeader title="Akun" subtitle="Bank, RDN, kas, e-wallet, deposito — saldo dihitung dari jurnal" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Akun</button>} />
      <div className="panel">
        {isLoading ? <Loading /> : (
          <Table rows={data} keyOf={(a) => a.id} onRow={(a) => navigate(`/accounts/${a.id}`)} cols={[
            { h: 'Nama', cell: (a) => <span className="font-medium">{a.name}</span> }, { h: 'Jenis', cell: (a) => <Pill>{ACCOUNT_LABEL[a.category]}</Pill> },
            { h: 'Institusi', cell: (a) => a.institution ?? '–' }, { h: 'Buku besar', cell: (a) => <span className="num text-slate-500">{a.ledgerCode}</span> },
            { h: 'Mata uang', cell: (a) => a.currency }, { h: 'Saldo', right: true, cell: (a) => <Amount value={a.balance} currency={a.currency} className="font-medium" /> },
          ]} />
        )}
        <div className="flex justify-between px-4 py-3 border-t border-slate-200 text-sm"><span className="text-slate-500">Total kas & bank</span><Amount value={total} className="font-semibold" /></div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Akun baru">
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await create.mutateAsync(form as never); setOpen(false); }}>
          <Field label="Nama"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Jenis"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(ACCOUNT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Mata uang"><input className="input" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Institusi"><input className="input" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></Field>
          <button className="btn-primary">Simpan</button>
        </form>
      </Drawer>
    </>
  );
}
