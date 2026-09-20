import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Money } from '../types/domain';

/** Formats a backend decimal string as currency (default IDR, no decimals for IDR). */
export function fmtMoney(value: Money | number | undefined | null, currency = 'IDR'): string {
  if (value === undefined || value === null || value === '') return '–';
  const n = typeof value === 'number' ? value : Number(value);
  const digits = currency === 'IDR' ? 0 : 2;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

/** Compact form for large headline numbers: Rp 2,50 M / Rp 850 jt. */
export function fmtCompact(value: Money | number, currency = 'IDR'): string {
  const n = typeof value === 'number' ? value : Number(value);
  const abs = Math.abs(n);
  const prefix = currency === 'IDR' ? 'Rp' : currency;
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${prefix} ${(abs / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (abs >= 1e6) return `${sign}${prefix} ${(abs / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return fmtMoney(n, currency);
}

export function fmtQty(value: Money | undefined | null, unit?: string): string {
  if (value === undefined || value === null) return '–';
  return `${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 6 })}${unit ? ` ${unit}` : ''}`;
}

export const fmtPct = (value: Money | number) => `${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
export const fmtDate = (iso: string) => format(parseISO(iso), 'd MMM yyyy', { locale: id });
export const fmtMonth = (iso: string) => format(parseISO(iso), 'MMM yy', { locale: id });
export const signClass = (v: Money | number) => (Number(v) > 0 ? 'text-accent-green' : Number(v) < 0 ? 'text-accent-red' : 'text-slate-700');

export const TX_LABEL: Record<string, string> = {
  INCOME: 'Pemasukan', EXPENSE: 'Pengeluaran', TRANSFER: 'Transfer', BUY_INVESTMENT: 'Beli Investasi', SELL_INVESTMENT: 'Jual Investasi',
  DIVIDEND: 'Dividen', COUPON: 'Kupon', INTEREST: 'Bunga', LOAN: 'Pinjaman', DEBT_PAYMENT: 'Bayar Utang', ASSET_PURCHASE: 'Beli Aset',
  ASSET_SALE: 'Jual Aset', FEE: 'Biaya', TAX: 'Pajak', OPENING_BALANCE: 'Saldo Awal',
};
export const CF_LABEL: Record<string, string> = { OPERATING: 'Operasional', INVESTING: 'Investasi', FINANCING: 'Pendanaan', NONE: 'Transfer' };
export const ACCOUNT_LABEL: Record<string, string> = { BANK: 'Bank', RDN: 'RDN', CASH: 'Kas', EWALLET: 'E-Wallet', DEPOSIT: 'Deposito' };
export const ASSET_LABEL: Record<string, string> = {
  STOCK: 'Saham', BOND: 'Obligasi', MUTUAL_FUND: 'Reksa Dana', ETF: 'ETF', GOLD: 'Emas', DEPOSIT: 'Deposito', PROPERTY: 'Properti', LAND: 'Tanah', VEHICLE: 'Kendaraan', OTHER: 'Lainnya',
};
