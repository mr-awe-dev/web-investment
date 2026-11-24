import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, Plus } from 'lucide-react';
import { useAccount, useAccounts, useCreateAccount, useReconciliations, useTransactions } from '../api/queries';
import {
  Alert,
  Amount,
  Drawer,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  Panel,
  Pill,
  Spinner,
  Stat,
  Table,
} from '../components/ui';
import { ACCOUNT_LABEL, fmtDate, TX_LABEL } from '../lib/format';
import { useAuth } from '../lib/auth';

function AccountDetail({ id }: { id: number }) {
  const accountQuery = useAccount(id);
  const transactions = useTransactions({ accountId: id, size: 50 });
  const reconciliations = useReconciliations();
  const cur = useAuth().user?.baseCurrency ?? 'IDR';

  if (accountQuery.isLoading) return <Loading rows={5} />;
  if (accountQuery.isError || !accountQuery.data) {
    return <ErrorState title="Akun tidak dapat dimuat" onRetry={() => accountQuery.refetch()} />;
  }

  const account = accountQuery.data;
  const recon = (reconciliations.data ?? []).filter((item) => item.accountId === id);

  return (
    <>
      <Link to="/accounts" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" />
        Semua akun
      </Link>

      <PageHeader
        eyebrow={ACCOUNT_LABEL[account.category]}
        title={account.name}
        subtitle={`${account.institution ?? 'Tanpa institusi'} · Buku besar ${account.ledgerCode} · ${account.currency}`}
        action={
          <Link to="/transactions" className="btn btn-secondary">
            Catat transaksi
          </Link>
        }
      />

      <section className="card mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Saldo buku besar</p>
            <p className="num mt-2 text-[2rem] font-semibold leading-none tracking-tight text-ink sm:text-[2.4rem]">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: account.currency,
                minimumFractionDigits: account.currency === 'IDR' ? 0 : 2,
                maximumFractionDigits: account.currency === 'IDR' ? 0 : 2,
              }).format(Number(account.balance))}
            </p>
            <p className="mt-2 text-xs text-muted">Dihitung dari jumlah debit dikurangi kredit.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={account.active ? 'green' : 'slate'} dot>
              {account.active ? 'Aktif' : 'Nonaktif'}
            </Pill>
            <Pill>{account.category}</Pill>
            <Pill>{account.currency}</Pill>
          </div>
        </div>
        <div className="grid grid-cols-1 divide-y divide-line border-t border-line text-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-muted">Kode buku besar</span>
            <span className="num font-medium text-ink">{account.ledgerCode}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-muted">Institusi</span>
            <span className="font-medium text-ink">{account.institution ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-muted">Rekonsiliasi terakhir</span>
            <span className="font-medium text-ink">
              {recon.length ? fmtDate(recon[0].reconciliationDate) : 'Belum pernah'}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Transaksi & transfer" subtitle="50 transaksi terakhir" className="lg:col-span-2" flush>
          {transactions.isLoading ? (
            <Loading rows={5} />
          ) : transactions.isError ? (
            <ErrorState title="Transaksi akun tidak dapat dimuat" onRetry={() => transactions.refetch()} />
          ) : (
            <Table
              rows={transactions.data?.content ?? []}
              keyOf={(transaction) => transaction.id}
              caption="Transaksi akun"
              empty="Belum ada transaksi"
              emptyHint="Transaksi yang menyentuh akun ini akan muncul di sini."
              sortable
              cols={[
                { h: 'Tanggal', cell: (transaction) => fmtDate(transaction.transactionDate), sortValue: (transaction) => transaction.transactionDate },
                {
                  h: 'Tipe',
                  cell: (transaction) => <Pill tone={transaction.type === 'TRANSFER' ? 'slate' : 'blue'}>{TX_LABEL[transaction.type]}</Pill>,
                  sortValue: (transaction) => transaction.type,
                },
                {
                  h: 'Keterangan',
                  cell: (transaction) => (
                    <span className="text-xs text-muted">{transaction.description ?? transaction.reference ?? '–'}</span>
                  ),
                },
                {
                  h: 'Neto',
                  right: true,
                  cell: (transaction) => <Amount value={transaction.netAmount} currency={transaction.currency} className="font-medium" />,
                  sortValue: (transaction) => Number(transaction.netAmount),
                },
              ]}
            />
          )}
        </Panel>

        <Panel title="Rekonsiliasi" subtitle="Pembanding saldo sistem" flush>
          {reconciliations.isLoading ? (
            <Loading rows={3} />
          ) : (
            <Table
              rows={recon}
              keyOf={(item) => item.id}
              caption="Riwayat rekonsiliasi akun"
              empty="Belum ada rekonsiliasi"
              emptyHint="Bandingkan saldo sistem dengan saldo rekening sebenarnya."
              cols={[
                { h: 'Tanggal', cell: (item) => fmtDate(item.reconciliationDate) },
                {
                  h: 'Selisih',
                  right: true,
                  cell: (item) => <Amount value={item.difference} currency={cur} signed />,
                },
                {
                  h: 'Status',
                  cell: (item) => (
                    <Pill
                      tone={item.status === 'RECONCILED' ? 'green' : item.status === 'DIFFERENCE_FOUND' ? 'red' : 'amber'}
                      dot
                    >
                      {item.status === 'RECONCILED' ? 'Sesuai' : item.status === 'DIFFERENCE_FOUND' ? 'Selisih' : 'Ditinjau'}
                    </Pill>
                  ),
                },
              ]}
            />
          )}
        </Panel>
      </div>
    </>
  );
}

export default function AccountsPage() {
  const { id } = useParams();
  const accounts = useAccounts();
  const create = useCreateAccount();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'BANK', currency: 'IDR', institution: '' });
  const cur = useAuth().user?.baseCurrency ?? 'IDR';
  const list = accounts.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (account) =>
        account.name.toLowerCase().includes(term) ||
        (account.institution ?? '').toLowerCase().includes(term) ||
        ACCOUNT_LABEL[account.category].toLowerCase().includes(term),
    );
  }, [list, search]);

  const total = list.reduce((sum, account) => sum + Number(account.balance), 0);
  const active = list.filter((account) => account.active).length;

  if (id) return <AccountDetail id={Number(id)} />;
  if (accounts.isLoading) return <Loading rows={6} />;
  if (accounts.isError) return <ErrorState title="Akun tidak dapat dimuat" onRetry={() => accounts.refetch()} />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync(form as never);
      setOpen(false);
      setForm({ name: '', category: 'BANK', currency: 'IDR', institution: '' });
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Portofolio"
        title="Akun"
        subtitle="Bank, RDN, kas, e-wallet, dan deposito — saldo dihitung dari jurnal."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Akun baru
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total saldo" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(total)} hint="Seluruh akun" icon={<Landmark size={16} />} />
        <Stat label="Jumlah akun" value={String(list.length)} hint="Bank, kas, dan e-wallet" />
        <Stat label="Akun aktif" value={String(active)} hint={`${list.length - active} nonaktif`} />
        <Stat label="Rata-rata saldo" value={list.length ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(total / list.length) : '–'} hint="Per akun" />
      </div>

      <Panel
        title="Daftar akun"
        subtitle="Klik buka untuk melihat buku besar akun"
        action={
          <div className="relative">
            <label htmlFor="account-search" className="sr-only">
              Cari akun
            </label>
            <input
              id="account-search"
              className="input h-9 w-44 sm:w-56"
              placeholder="Cari akun"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        }
        flush
      >
        <Table
          rows={filtered}
          keyOf={(account) => account.id}
          sortable
          caption="Daftar akun"
          empty={search ? 'Akun tidak ditemukan' : 'Belum ada akun'}
          emptyHint={search ? 'Ubah kata kunci pencarian.' : 'Tambahkan rekening bank, kas, atau e-wallet pertama Anda.'}
          cols={[
            {
              h: 'Nama',
              cell: (account) => (
                <div className="min-w-0">
                  <p className="font-medium text-ink">{account.name}</p>
                  <p className="text-[11px] text-muted">{account.institution ?? 'Tanpa institusi'}</p>
                </div>
              ),
              sortValue: (account) => account.name,
            },
            {
              h: 'Jenis',
              cell: (account) => <Pill>{ACCOUNT_LABEL[account.category]}</Pill>,
              sortValue: (account) => account.category,
            },
            {
              h: 'Buku besar',
              mobile: false,
              cell: (account) => <span className="num text-xs text-muted">{account.ledgerCode}</span>,
              sortValue: (account) => account.ledgerCode,
            },
            {
              h: 'Mata uang',
              mobile: false,
              cell: (account) => <span className="text-xs text-muted">{account.currency}</span>,
              sortValue: (account) => account.currency,
            },
            {
              h: 'Status',
              cell: (account) => (
                <Pill tone={account.active ? 'green' : 'slate'} dot>
                  {account.active ? 'Aktif' : 'Nonaktif'}
                </Pill>
              ),
              sortValue: (account) => (account.active ? 1 : 0),
            },
            {
              h: 'Saldo',
              right: true,
              cell: (account) => <Amount value={account.balance} currency={account.currency} className="font-medium" />,
              sortValue: (account) => Number(account.balance),
            },
            {
              h: 'Aksi',
              right: true,
              cell: (account) => (
                <Link to={`/accounts/${account.id}`} className="btn btn-secondary btn-sm" aria-label={`Buka akun ${account.name}`}>
                  Buka
                </Link>
              ),
            },
          ]}
        />
        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
            <span className="text-xs text-muted">Total saldo akun</span>
            <Amount value={total} currency={cur} className="font-semibold" />
          </div>
        )}
      </Panel>

      <Drawer open={open} onClose={() => setOpen(false)} title="Akun baru" description="Akun baru otomatis mendapat kode buku besar.">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Nama akun" required>
            <input
              className="input"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Contoh: BCA Tahapan"
            />
          </Field>
          <Field label="Jenis akun" required>
            <select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {Object.entries(ACCOUNT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mata uang" required>
            <input
              className="input"
              maxLength={3}
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Institusi">
            <input
              className="input"
              value={form.institution}
              onChange={(event) => setForm({ ...form, institution: event.target.value })}
              placeholder="Contoh: Bank Central Asia"
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>
              {create.isPending && <Spinner size={15} />}
              Simpan akun
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
