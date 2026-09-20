import { useState } from 'react';
import { useUpdateSettings } from '../api/queries';
import { Field, PageHeader, Panel } from '../components/ui';
import { useAuth } from '../lib/auth';
import type { CostBasisMethod } from '../types/domain';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const update = useUpdateSettings();
  const [f, setF] = useState({ fullName: user?.fullName ?? '', baseCurrency: user?.baseCurrency ?? 'IDR', costBasisMethod: (user?.costBasisMethod ?? 'FIFO') as CostBasisMethod });
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Mata uang dasar konsolidasi dan metode cost basis untuk penjualan" />
      <Panel title="Profil & akuntansi" className="max-w-lg">
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setUser(await update.mutateAsync(f)); setSaved(true); }}>
          <Field label="Nama lengkap"><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
          <Field label="Mata uang dasar"><select className="input" value={f.baseCurrency} onChange={(e) => setF({ ...f, baseCurrency: e.target.value })}>{['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'HKD', 'MYR'].map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Metode cost basis"><select className="input" value={f.costBasisMethod} onChange={(e) => setF({ ...f, costBasisMethod: e.target.value as CostBasisMethod })}><option value="FIFO">FIFO — lot tertua dahulu</option><option value="AVERAGE">Average cost — rata-rata tertimbang</option><option value="SPECIFIC">Specific identification — pilih lot saat menjual</option></select></Field>
          <p className="text-xs text-slate-500">Email: {user?.email}. Metode cost basis berlaku untuk transaksi penjualan berikutnya; jurnal yang sudah diposting tidak berubah.</p>
          <div className="flex items-center gap-3"><button className="btn-primary" disabled={update.isPending}>Simpan</button>{saved && <span className="text-sm text-accent-green">Tersimpan</span>}</div>
        </form>
      </Panel>
    </>
  );
}
