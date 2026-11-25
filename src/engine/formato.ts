import type { Min } from './types';

/** 630 → "10:30". */
export function hhmm(m: Min): string {
  const total = Math.floor(m + 1e-6);
  const h = Math.floor(total / 60);
  const mm = total % 60;
  return `${h}:${String(mm).padStart(2, '0')}`;
}

/** Minutos (con decimales) → "04:20". */
export function mmss(minutos: number): string {
  const s = Math.max(0, Math.round(minutos * 60));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function hora(h: number, m = 0): Min {
  return h * 60 + m;
}

export function diferencia(min: number): string {
  const r = Math.round(min);
  if (r === 0) return 'a su hora';
  return r > 0 ? `+${r} min` : `${r} min`;
}

export const NOMBRE_CANAL: Record<string, string> = {
  app: 'App',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  ninguno: 'Recepción',
  sistema: 'Sistema',
};
