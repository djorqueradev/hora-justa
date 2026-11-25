import type { Config, Decision, Min } from './types';
import { hhmm } from './formato';

export interface EntradaRegla {
  /** Minutos de atraso respecto de su hora (≤ 0 = llegó a tiempo). */
  atraso: number;
  inicioSlot: Min;
  /** Minutos libres en la agenda justo después de su cita. */
  holguraDespues: number;
  /** Próximo hueco libre del día, si existe. */
  huecoLibre: Min | null;
  conAviso: boolean;
  config: Config;
}

/**
 * Regla de tolerancia dinámica de Hora Justa.
 *  - Hasta `toleranciaPasa` min tarde: pasa y la consulta termina a la hora planificada.
 *  - Hasta `toleranciaMax`: pasa con el tiempo restante si alcanza la consulta mínima
 *    (usando la holgura que haya después); si no, se reubica en el próximo hueco del día.
 *  - Sobre `toleranciaMax`, o si no llegó ni avisó: se reagenda con prioridad o teleconsulta.
 */
export function aplicarRegla(e: EntradaRegla): Decision {
  const { atraso, inicioSlot, holguraDespues, huecoLibre, conAviso, config: c } = e;
  const finSlot = inicioSlot + c.slotMin;
  const llegada = inicioSlot + Math.max(0, atraso);
  const tarde = Math.round(Math.max(0, atraso));

  if (atraso <= c.toleranciaPasa) {
    return {
      tipo: 'pasa',
      finPermitido: finSlot,
      texto:
        tarde === 0
          ? 'Llega a su hora.'
          : `Llega ${tarde} min tarde: pasa y la consulta termina a las ${hhmm(finSlot)}.`,
    };
  }

  if (atraso <= c.toleranciaMax) {
    const restante = finSlot - llegada;
    if (restante >= c.consultaMinima) {
      return {
        tipo: 'pasa',
        finPermitido: finSlot,
        texto: `Llega ${tarde} min tarde: pasa con el tiempo restante (${Math.floor(restante)} min), hasta las ${hhmm(finSlot)}.`,
      };
    }
    const falta = c.consultaMinima - restante;
    if (holguraDespues >= falta) {
      return {
        tipo: 'pasa_holgura',
        finPermitido: llegada + c.consultaMinima,
        holguraUsada: Math.ceil(falta),
        texto: `Llega ${tarde} min tarde: pasa usando ${Math.ceil(falta)} min de holgura, sin atrasar al siguiente.`,
      };
    }
    if (huecoLibre !== null) {
      return {
        tipo: 'reubicar',
        nuevoSlot: huecoLibre,
        texto: `Llega ${tarde} min tarde y no hay holgura: se reubica hoy a las ${hhmm(huecoLibre)}.`,
      };
    }
    return {
      tipo: 'reagendar',
      texto: `Llega ${tarde} min tarde, sin holgura ni huecos hoy: se reagenda con prioridad.`,
    };
  }

  return {
    tipo: 'reagendar',
    texto: conAviso
      ? `Avisó ${tarde} min de atraso: se reagenda con prioridad o pasa a teleconsulta.`
      : 'No llegó ni avisó: se reagenda con prioridad y su hora se ofrece a la lista de espera.',
  };
}
