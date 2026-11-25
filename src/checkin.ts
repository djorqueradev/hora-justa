/**
 * Código de la pantalla de la entrada. Cambia cada 30 segundos, así una foto
 * del QR no sirve para marcar llegada desde la casa. Se aceptan el código
 * actual y los dos anteriores para dar margen al escaneo.
 */
const VENTANA_MS = 30_000;
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function codigo(n: number): string {
  let h = 2166136261 ^ n;
  let out = '';
  for (let i = 0; i < 6; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ (i * 374761393);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    out += ALFABETO[Math.abs(h ^ (h >>> 16)) % ALFABETO.length];
  }
  return out;
}

export function codigoActual(real = Date.now()): string {
  return codigo(Math.floor(real / VENTANA_MS));
}

export function segundosParaCambio(real = Date.now()): number {
  return Math.ceil((VENTANA_MS - (real % VENTANA_MS)) / 1000);
}

export function codigoValido(c: string, real = Date.now()): boolean {
  const n = Math.floor(real / VENTANA_MS);
  const limpio = c.trim().toUpperCase();
  return [n, n - 1, n - 2].some((k) => codigo(k) === limpio);
}
