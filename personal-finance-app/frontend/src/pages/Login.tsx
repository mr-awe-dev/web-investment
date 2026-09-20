import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../lib/auth';
import { Field } from '../components/ui';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Minimal 8 karakter'),
  fullName: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function LoginPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const { login, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: 'demo@finance.id', password: 'Demo1234!' } });

  const submit = async (f: Form) => {
    setError(null);
    try {
      if (mode === 'register') await signUp(f.email, f.password, f.fullName || f.email);
      else await login(f.email, f.password);
      navigate('/dashboard');
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex bg-navy text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-md bg-accent-blue grid place-items-center font-bold">F</span><span className="text-lg font-semibold">Finansia</span></div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">Akuntansi keuangan pribadi &amp; investasi berbasis double-entry.</h1>
          <p className="mt-4 text-slate-300 max-w-md">Setiap transaksi menjadi jurnal berimbang. Portofolio, arus kas, laba rugi, neraca dan kekayaan bersih semuanya diturunkan dari satu sumber kebenaran.</p>
        </div>
        <p className="text-xs text-slate-400">Total Debit = Total Kredit · Aset − Liabilitas = Ekuitas</p>
      </aside>
      <main className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit(submit)} className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-semibold">{mode === 'register' ? 'Buat akun' : mode === 'forgot' ? 'Lupa kata sandi' : 'Masuk'}</h2>
          {mode === 'forgot' ? (
            <p className="text-sm text-slate-600">Reset kata sandi belum tersedia di versi ini. Gunakan akun demo <code>demo@finance.id / Demo1234!</code> atau <Link className="text-accent-blue" to="/register">daftar akun baru</Link>.</p>
          ) : (
            <>
              {mode === 'register' && <Field label="Nama lengkap" error={errors.fullName?.message}><input className="input" {...register('fullName')} /></Field>}
              <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
              <Field label="Kata sandi" error={errors.password?.message}><input className="input" type="password" autoComplete="current-password" {...register('password')} /></Field>
              {error && <div className="text-sm text-accent-red">{error}</div>}
              <button className="btn-primary w-full justify-center" disabled={isSubmitting}>{mode === 'register' ? 'Daftar' : 'Masuk'}</button>
              <div className="flex justify-between text-sm text-slate-500">
                {mode === 'login' ? <Link className="hover:text-accent-blue" to="/register">Daftar</Link> : <Link className="hover:text-accent-blue" to="/login">Sudah punya akun</Link>}
                <Link className="hover:text-accent-blue" to="/forgot-password">Lupa kata sandi?</Link>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
