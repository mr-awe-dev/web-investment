import { useState, type FormEvent } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUpdateSettings } from '../api/queries';
import { Alert, Field, PageHeader, Panel, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import type { CostBasisMethod } from '../types/domain';

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'HKD', 'MYR'];

const METHODS: { value: CostBasisMethod; label: string; hint: string }[] = [
  { value: 'FIFO', label: 'FIFO', hint: 'Lot tertua dijual lebih dahulu.' },
  { value: 'AVERAGE', label: 'Average cost', hint: 'Harga perolehan rata-rata tertimbang.' },
  { value: 'SPECIFIC', label: 'Specific identification', hint: 'Pilih lot tertentu saat menjual.' },
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const update = useUpdateSettings();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    baseCurrency: user?.baseCurrency ?? 'IDR',
    costBasisMethod: user?.costBasisMethod ?? ('FIFO' as CostBasisMethod),
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await update.mutateAsync(form);
      setUser(updated);
      setSaved(true);
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Akun"
        title="Pengaturan"
        subtitle="Mata uang dasar konsolidasi, metode cost basis, dan tampilan."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Profil dan akuntansi" subtitle="Berlaku untuk laporan dan transaksi berikutnya">
            <form className="space-y-5" onSubmit={submit}>
              <Field label="Nama lengkap" required>
                <input
                  className="input"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mata uang dasar" hint="Dipakai untuk konsolidasi laporan." required>
                  <select className="input" value={form.baseCurrency} onChange={(event) => setForm({ ...form, baseCurrency: event.target.value })}>
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Email">
                  <input className="input" value={user?.email ?? ''} readOnly disabled />
                </Field>
              </div>

              <fieldset>
                <legend className="mb-2 text-xs font-medium text-ink">Metode cost basis</legend>
                <div className="space-y-2">
                  {METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        form.costBasisMethod === method.value ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cost-basis"
                        value={method.value}
                        checked={form.costBasisMethod === method.value}
                        onChange={() => setForm({ ...form, costBasisMethod: method.value })}
                        className="mt-0.5 accent-[rgb(var(--c-accent))]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">{method.label}</span>
                        <span className="block text-xs text-muted">{method.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <p className="text-xs leading-relaxed text-muted">
                Metode cost basis berlaku untuk transaksi penjualan berikutnya. Jurnal yang sudah diposting tidak berubah.
              </p>

              {error && <Alert tone="error">{error}</Alert>}
              {saved && (
                <Alert tone="success" onDismiss={() => setSaved(false)}>
                  Pengaturan tersimpan.
                </Alert>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button type="submit" className="btn btn-primary" disabled={update.isPending}>
                  {update.isPending && <Spinner size={15} />}
                  Simpan perubahan
                </button>
              </div>
            </form>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Tampilan" subtitle="Preferensi disimpan di perangkat ini">
            <div role="group" aria-label="Tema tampilan" className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                  theme === 'light' ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2'
                }`}
              >
                <Sun size={17} className="text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Terang</span>
                <span className="text-[11px] text-muted">Latar gading</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                  theme === 'dark' ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2'
                }`}
              >
                <Moon size={17} className="text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Gelap</span>
                <span className="text-[11px] text-muted">Latar arang</span>
              </button>
            </div>
          </Panel>

          <Panel title="Tentang data" subtitle="Satu sumber kebenaran">
            <ul className="space-y-3 text-xs leading-relaxed text-muted">
              <li>Setiap transaksi menghasilkan jurnal berpasangan yang seimbang.</li>
              <li>Saldo akun dihitung dari total debit dikurangi kredit, tanpa saldo tersimpan terpisah.</li>
              <li>Semua angka diformat mengikuti mata uang aset; konsolidasi memakai mata uang dasar.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
