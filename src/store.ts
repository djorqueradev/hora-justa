import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Accion, Config, Snapshot } from './engine/types';
import { CONFIG_INICIAL } from './engine/types';
import { ESCENARIO_DEMO, GUION_GUIADO, GUION_LIBRE } from './engine/escenario';
import { simular } from './engine/simular';
import { hora } from './engine/formato';

/**
 * Estado compartido del prototipo. Vive en localStorage, así que todas las
 * pestañas abiertas en este navegador (paciente, recepción, médico, tótem)
 * ven la misma jornada y se sincronizan solas.
 */
export interface Reloj {
  /** Minuto simulado en el instante `realEn`. */
  simEn: number;
  realEn: number;
  /** Minutos simulados por minuto real. */
  velocidad: number;
  corriendo: boolean;
}

export type Modo = 'guiado' | 'libre';

export interface EstadoApp {
  modo: Modo;
  config: Config;
  reloj: Reloj;
  acciones: Accion[];
  /** Cita abierta desde el link único en este navegador. */
  miCita?: string;
}

const CLAVE = 'hora-justa:v1';
export const INICIO_DEMO = hora(9, 55);
export const MOMENTO_CLAVE = hora(10, 35);

const inicial = (): EstadoApp => ({
  modo: 'guiado',
  config: CONFIG_INICIAL,
  reloj: { simEn: INICIO_DEMO, realEn: Date.now(), velocidad: 10, corriendo: false },
  acciones: [],
});

function leer(): EstadoApp {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return { ...inicial(), ...JSON.parse(raw) };
  } catch {
    /* sin almacenamiento: se usa el estado inicial */
  }
  return inicial();
}

let estado: EstadoApp = leer();
const oyentes = new Set<() => void>();

function emitir() {
  for (const o of oyentes) o();
}

function guardar(nuevo: EstadoApp) {
  estado = nuevo;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    /* ignorar */
  }
  emitir();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) {
      estado = leer();
      emitir();
    }
  });
}

export function obtener(): EstadoApp {
  return estado;
}

export function suscribir(fn: () => void) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function ahora(e: EstadoApp = estado, real = Date.now()): number {
  const r = e.reloj;
  if (!r.corriendo) return r.simEn;
  return r.simEn + ((real - r.realEn) / 60000) * r.velocidad;
}

function conReloj(parcial: Partial<Reloj>) {
  const t = ahora();
  guardar({ ...estado, reloj: { ...estado.reloj, simEn: t, realEn: Date.now(), ...parcial } });
}

export const reloj = {
  play: () => conReloj({ corriendo: true }),
  pausa: () => conReloj({ corriendo: false }),
  velocidad: (v: number) => conReloj({ velocidad: v }),
  irA: (t: number) => guardar({ ...estado, reloj: { ...estado.reloj, simEn: t, realEn: Date.now() } }),
  avanzar: (min: number) => {
    const t = ahora();
    guardar({ ...estado, reloj: { ...estado.reloj, simEn: t + min, realEn: Date.now() } });
  },
};

export function reiniciar(modo: Modo = estado.modo) {
  guardar({ ...inicial(), modo, config: estado.config, miCita: estado.miCita });
}

export function cambiarModo(modo: Modo) {
  guardar({ ...inicial(), modo, config: estado.config, miCita: estado.miCita });
}

export function cambiarConfig(config: Partial<Config>) {
  guardar({ ...estado, config: { ...estado.config, ...config } });
}

export function recordarCita(token: string) {
  if (estado.miCita !== token) guardar({ ...estado, miCita: token });
}

type SinTiempo<T> = T extends Accion ? Omit<T, 't'> : never;

/** Registra una acción en el minuto simulado actual. */
export function despachar(a: SinTiempo<Accion>) {
  const t = ahora();
  guardar({ ...estado, acciones: [...estado.acciones, { ...a, t } as Accion] });
}

/** Guion del modo + acciones de quien hace la demo (que mandan sobre el guion). */
export function accionesEfectivas(e: EstadoApp): Accion[] {
  const guion = e.modo === 'guiado' ? GUION_GUIADO : GUION_LIBRE;
  const tocados = new Set(e.acciones.map((a) => ('pid' in a ? a.pid : '')));
  return [...guion.filter((a) => !('pid' in a) || !tocados.has(a.pid)), ...e.acciones];
}

export function useEstado(): EstadoApp {
  return useSyncExternalStore(suscribir, obtener, obtener);
}

/** Vuelve a dibujar cada `ms` mientras el reloj corre. */
function useTic(corriendo: boolean, ms = 250) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!corriendo) return;
    const id = window.setInterval(() => set((x) => x + 1), ms);
    return () => window.clearInterval(id);
  }, [corriendo, ms]);
}

export function useJornada(): { estado: EstadoApp; snap: Snapshot; t: number } {
  const e = useEstado();
  useTic(e.reloj.corriendo);
  const t = ahora(e);
  // Simula con resolución de 10 s; el cronómetro usa `t` para los segundos.
  const tPaso = Math.floor(t * 6) / 6;
  const snap = useMemo(
    () => simular(ESCENARIO_DEMO, e.config, accionesEfectivas(e), tPaso),
    [e, tPaso],
  );
  return { estado: e, snap, t };
}
