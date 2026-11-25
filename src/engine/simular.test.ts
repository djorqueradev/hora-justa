import { describe, expect, it } from 'vitest';
import { aplicarRegla } from './regla';
import { simular } from './simular';
import { ESCENARIO_DEMO, ESCENARIO_EJEMPLO, GUION_GUIADO, guionEjemplo } from './escenario';
import { CONFIG_INICIAL } from './types';
import { hora, hhmm } from './formato';

const cfg = CONFIG_INICIAL;
const base = { inicioSlot: hora(10), holguraDespues: 0, huecoLibre: null, conAviso: true, config: cfg };

describe('regla de tolerancia', () => {
  it('hasta 5 min: pasa y termina a la hora planificada', () => {
    const d = aplicarRegla({ ...base, atraso: 5 });
    expect(d.tipo).toBe('pasa');
    if (d.tipo === 'pasa') expect(d.finPermitido).toBe(hora(10, 20));
  });
  it('8 min tarde en cita de 20: pasa con el tiempo restante', () => {
    const d = aplicarRegla({ ...base, atraso: 8 });
    expect(d.tipo).toBe('pasa');
  });
  it('12 min tarde sin holgura ni huecos: se reagenda', () => {
    expect(aplicarRegla({ ...base, atraso: 12 }).tipo).toBe('reagendar');
  });
  it('12 min tarde con holgura después: pasa usando holgura', () => {
    const d = aplicarRegla({ ...base, atraso: 12, holguraDespues: 5 });
    expect(d.tipo).toBe('pasa_holgura');
  });
  it('12 min tarde con un hueco libre: se reubica', () => {
    const d = aplicarRegla({ ...base, atraso: 12, huecoLibre: hora(11, 20) });
    expect(d.tipo).toBe('reubicar');
  });
  it('más de 15 min: reagenda con prioridad', () => {
    expect(aplicarRegla({ ...base, atraso: 20 }).tipo).toBe('reagendar');
  });
});

describe('ejemplo de la presentación 2', () => {
  it('sin Hora Justa el atraso de A se contagia a B, C y D', () => {
    const s = simular(ESCENARIO_EJEMPLO, { ...cfg, reglaActiva: false }, guionEjemplo(12), hora(12));
    const inicio = (id: string) => hhmm(s.pacientes.find((p) => p.id === id)!.inicio!);
    expect([inicio('a'), inicio('b'), inicio('c'), inicio('d')]).toEqual(['10:12', '10:32', '10:52', '11:12']);
  });
  it('con Hora Justa B, C y D entran a su hora', () => {
    const s = simular(ESCENARIO_EJEMPLO, cfg, guionEjemplo(12), hora(12));
    const inicio = (id: string) => hhmm(s.pacientes.find((p) => p.id === id)!.inicio!);
    expect([inicio('b'), inicio('c'), inicio('d')]).toEqual(['10:20', '10:40', '11:00']);
    expect(s.pacientes.find((p) => p.id === 'a')!.slot).toBe(hora(11, 20));
  });
});

describe('jornada guiada', () => {
  const a1035 = simular(ESCENARIO_DEMO, cfg, GUION_GUIADO, hora(10, 35));
  const p = (id: string) => a1035.pacientes.find((x) => x.id === id)!;

  it('Sofía está en consulta hasta las 10:40', () => {
    expect(p('sofia').estado).toBe('en_consulta');
    expect(hhmm(p('sofia').finObjetivo!)).toBe('10:40');
  });
  it('Camila espera en sala y entra a su hora', () => {
    expect(p('camila').estado).toBe('en_sala');
    expect(hhmm(p('camila').estimado!)).toBe('10:40');
  });
  it('Jorge se reagenda y Marta toma su hora desde la lista de espera', () => {
    expect(p('jorge').estado).toBe('reagendado');
    expect(p('marta').slot).toBe(hora(11));
    expect(a1035.huecos[0].estado).toBe('reocupado');
  });
  it('al final del día Pedro no llegó y los puntuales entraron a su hora', () => {
    const s = simular(ESCENARIO_DEMO, cfg, GUION_GUIADO, hora(12, 20));
    expect(s.pacientes.find((x) => x.id === 'pedro')!.estado).toBe('reagendado');
    expect(s.metricas.aTiempo).toBe(s.metricas.puntualesAtendidos);
    expect(s.metricas.riesgoReclamo).toBe(0);
  });
});
