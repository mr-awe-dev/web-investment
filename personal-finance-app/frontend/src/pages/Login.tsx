import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Alert, Field, Spinner, ThemeToggle } from '../components/ui';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Gunakan minimal 8 karakter'),
  fullName: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const BENEFITS = [
  { icon: Wallet, text: 'Saldo akun, aset, dan liabilitas dalam satu buku besar.' },
  { icon: TrendingUp, text: 'Kinerja portofolio, lot, dividen, dan kupon yang dapat ditelusuri.' },
  { icon: ShieldCheck, text: 'Setiap transaksi menghasilkan jurnal berimbang — debit sama dengan kredit.' },
];

function PasswordField({
  label,
  error,
  autoComplete,
  registration,
}: {
  label: string;
  error?: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="input pr-11"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-ink"
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}

export default function LoginPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const { login, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'demo@finance.id', password: 'Demo1234!' },
  });

  const title = mode === 'register' ? 'Buat akun' : mode === 'forgot' ? 'Lupa kata sandi' : 'Masuk ke akun';
  const subtitle =
    mode === 'register'
      ? 'Mulai catat keuangan dan investasi Anda dalam satu buku besar.'
      : mode === 'forgot'
        ? 'Pemulihan kata sandi belum tersedia pada versi ini.'
        : 'Lanjutkan pemantauan keuangan dan portofolio Anda.';

  const submit = async (form: Form) => {
    setError(null);
    try {
      if (mode === 'register') await signUp(form.email, form.password, form.fullName || form.email);
      else await login(form.email, form.password);
      navigate('/dashboard');
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <aside className="on-dark relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-ink lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full border border-sidebar-line"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-36 h-[22rem] w-[22rem] rounded-full border border-sidebar-line"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-20 h-[18rem] w-[18rem] rounded-full border border-sidebar-line"
          aria-hidden="true"
        />

        <Link to="/login" className="relative flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-lg bg-accent text-base font-semibold text-accent-ink">
            F
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-sidebar bg-gold" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold leading-tight">Finansia</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-sidebar-muted">Wealth desk</span>
          </span>
        </Link>

        <div className="relative max-w-lg py-10">
          <p className="eyebrow text-gold">Akuntansi pribadi &amp; investasi</p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-sidebar-ink xl:text-[2.5rem]">
            Satu sumber kebenaran untuk seluruh kekayaan Anda.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-muted">
            Portofolio, arus kas, laba rugi, neraca, dan kekayaan bersih diturunkan dari jurnal double-entry yang sama.
          </p>

          <ul className="mt-8 space-y-3.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sidebar-line bg-sidebar-hover text-gold">
                  <benefit.icon size={16} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-sm text-sidebar-muted">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-sidebar-line pt-5 text-[11px] text-sidebar-muted">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-positive" aria-hidden="true" />
            Total debit = total kredit
          </span>
          <span>© {new Date().getFullYear()} Finansia</span>
        </div>
      </aside>

      <main className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-ink">F</span>
            <span className="text-sm font-semibold text-ink">Finansia</span>
          </Link>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-6">
            <p className="eyebrow mb-2">{mode === 'register' ? 'Akun baru' : mode === 'forgot' ? 'Bantuan akses' : 'Selamat datang kembali'}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          </div>

          {mode === 'forgot' ? (
            <div className="space-y-4">
              <Alert tone="info">
                Gunakan akun demo <span className="font-medium text-ink">demo@finance.id</span> dengan kata sandi{' '}
                <span className="font-medium text-ink">Demo1234!</span>, atau daftar akun baru.
              </Alert>
              <Link to="/login" className="btn btn-primary w-full">
                Kembali ke halaman masuk
              </Link>
              <Link to="/register" className="btn btn-secondary w-full">
                Daftar akun baru
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
              {mode === 'register' && (
                <Field label="Nama lengkap" error={errors.fullName?.message}>
                  <input className="input" autoComplete="name" placeholder="Nama sesuai identitas" {...register('fullName')} />
                </Field>
              )}

              <Field label="Email" error={errors.email?.message}>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="nama@contoh.com"
                  {...register('email')}
                />
              </Field>

              <PasswordField
                label="Kata sandi"
                error={errors.password?.message}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                registration={register('password')}
              />

              {error && <Alert tone="error">{error}</Alert>}

              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting && <Spinner size={15} />}
                {mode === 'register' ? 'Daftar' : 'Masuk'}
              </button>

              <div className="flex items-center justify-between text-xs text-muted">
                {mode === 'login' ? (
                  <Link className="font-medium text-accent-text hover:underline" to="/register">
                    Daftar akun
                  </Link>
                ) : (
                  <Link className="font-medium text-accent-text hover:underline" to="/login">
                    Sudah punya akun
                  </Link>
                )}
                <Link className="hover:text-ink" to="/forgot-password">
                  Lupa kata sandi?
                </Link>
              </div>

              {mode === 'login' && (
                <div className="rounded-lg border border-line bg-surface-2 p-3.5 text-xs text-muted">
                  <p className="font-medium text-ink">Akun demo</p>
                  <p className="mt-1">
                    Email <span className="num text-ink">demo@finance.id</span> · Kata sandi{' '}
                    <span className="num text-ink">Demo1234!</span>
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        <p className="mx-auto w-full max-w-sm text-center text-[11px] text-faint">
          Data keuangan Anda terisolasi per pengguna dan diturunkan dari jurnal yang tidak diubah.
        </p>
      </main>
    </div>
  );
}
