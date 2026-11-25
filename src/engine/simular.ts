import type {
  Accion,
  Aviso,
  Config,
  Decision,
  Escenario,
  Hueco,
  Metricas,
  Min,
  Paciente,
  PersonaEspera,
  Snapshot,
} from './types';
import { aplicarRegla } from './regla';
import { hhmm } from './formato';

/** Paso de la simulación: 10 segundos. */
const PASO = 1 / 6;
const EPS = 1e-6;
/** Anticipación mínima para ofrecer un cupo liberado a la lista de espera. */
const ANTICIPACION_OFERTA = 15;
const DURACION_URGENCIA = 15;
const REAGENDA_TEXTO = 'jueves 1 de octubre, 9:20 (con prioridad)';

type EstadoEspera = PersonaEspera & { estado: 'en_espera' | 'ofrecido' | 'asignado'; slot?: Min };

/**
 * Simula la jornada desde el inicio hasta `ahora` aplicando las acciones en orden.
 * Es una función pura: mismas entradas, mismo resultado (así todas las pestañas
 * abiertas muestran exactamente lo mismo).
 */
export function simular(esc: Escenario, cfg: Config, acciones: Accion[], ahora: Min): Snapshot {
  const pacientes: Paciente[] = esc.pacientes.map((p) => ({
    ...p,
    origen: 'agenda',
    slotOriginal: p.slot,
    estado: 'agendado',
    ultimoEstimadoAvisado: p.slot,
  }));
  const huecos: Hueco[] = [];
  const avisos: Aviso[] = [];
  const espera: EstadoEspera[] = esc.listaEspera.map((w) => ({ ...w, estado: 'en_espera' }));
  const aceptaciones: { wid: string; t: Min; slot: Min }[] = [];
  const medico = { libreDesde: esc.inicioDia, atrasoAvisado: 0 };
  let urgencias = 0;

  const ultimoSlot = esc.slots[esc.slots.length - 1];
  const finAgenda = ultimoSlot + cfg.slotMin;

  // Avisos previos a la jornada: confirmación 24 h antes y recordatorio 2 h antes.
  for (const p of esc.pacientes) {
    avisos.push({
      t: p.slot - 24 * 60,
      canal: p.canal,
      para: p.nombre,
      texto: p.confirmado
        ? `Confirmó su hora de las ${hhmm(p.slot)}.`
        : `Se pidió confirmar la hora de las ${hhmm(p.slot)}. Sin respuesta.`,
      tipo: 'confirmacion',
    });
    avisos.push({
      t: p.slot - 120,
      canal: p.canal,
      para: p.nombre,
      texto: `Recordatorio: hoy ${hhmm(p.slot)}, ${esc.especialidad}, ${esc.box}.`,
      tipo: 'recordatorio',
    });
  }

  const avisar = (t: Min, p: { canal: Paciente['canal']; nombre: string }, texto: string, tipo: Aviso['tipo']) => {
    if (p.canal === 'ninguno') return;
    avisos.push({ t, canal: p.canal, para: p.nombre, texto, tipo });
  };

  const activo = (p: Paciente) =>
    p.origen !== 'urgencia' && (p.estado === 'agendado' || p.estado === 'en_sala' || p.estado === 'en_consulta' || p.estado === 'atendido');

  const slotOcupado = (s: Min) => pacientes.some((p) => activo(p) && Math.abs(p.slot - s) < EPS);
  const slotOfrecido = (s: Min) => huecos.some((h) => h.estado === 'ofrecido' && Math.abs(h.slot - s) < EPS);

  /** Minutos libres en la agenda justo después de la cita de `p`. */
  const holguraDespues = (p: Paciente): number => {
    const finSlot = p.slot + cfg.slotMin;
    const siguiente = esc.slots
      .filter((s) => s >= finSlot - EPS && slotOcupado(s))
      .sort((a, b) => a - b)[0];
    return Math.max(0, (siguiente ?? finAgenda) - finSlot);
  };

  const huecoLibre = (desde: Min, p: Paciente): Min | null => {
    const s = esc.slots.find((s) => s > p.slot + EPS && s >= desde - EPS && !slotOcupado(s) && !slotOfrecido(s));
    return s ?? null;
  };

  const evaluar = (p: Paciente, atraso: number, conAviso: boolean, t: Min): Decision =>
    aplicarRegla({
      atraso,
      inicioSlot: p.slot,
      holguraDespues: holguraDespues(p),
      huecoLibre: huecoLibre(Math.max(t, p.slot + atraso), p),
      conAviso,
      config: cfg,
    });

  /** Libera la hora de `p` y, si hay tiempo, la ofrece a la lista de espera. */
  const liberar = (slot: Min, quien: string, t: Min) => {
    if (!cfg.reglaActiva) return;
    const hueco: Hueco = { slot, liberadoEn: t, liberadoPor: quien, estado: 'sin_cubrir' };
    huecos.push(hueco);
    if (slot - t < ANTICIPACION_OFERTA) return;
    const candidatos = espera.filter((w) => w.estado === 'en_espera');
    if (candidatos.length === 0) return;
    hueco.estado = 'ofrecido';
    for (const w of candidatos) w.estado = 'ofrecido';
    avisos.push({
      t,
      canal: 'sistema',
      para: `Lista de espera (${candidatos.length})`,
      texto: `Se liberó hoy ${hhmm(slot)} con ${esc.medico}. El primero que acepte la toma.`,
      tipo: 'lista_espera',
    });
    const primero = candidatos
      .filter((w) => w.aceptaEn !== null)
      .sort((a, b) => (a.aceptaEn ?? 0) - (b.aceptaEn ?? 0))[0];
    if (primero) aceptaciones.push({ wid: primero.id, t: t + (primero.aceptaEn ?? 0), slot });
  };

  const reagendar = (p: Paciente, d: Decision, t: Min) => {
    const slotLiberado = p.slot;
    p.estado = 'reagendado';
    p.decision = d;
    p.decisionEn = t;
    p.reagendadoA = REAGENDA_TEXTO;
    avisar(t, p, `Te reagendamos con prioridad: ${REAGENDA_TEXTO}. También puedes pedir teleconsulta.`, 'regla');
    liberar(slotLiberado, p.nombre, t);
  };

  const reubicar = (p: Paciente, d: Extract<Decision, { tipo: 'reubicar' }>, t: Min) => {
    const anterior = p.slot;
    p.slot = d.nuevoSlot;
    p.decision = d;
    p.decisionEn = t;
    p.avisoAtraso = undefined;
    p.ultimoEstimadoAvisado = d.nuevoSlot;
    avisar(t, p, `No alcanzamos a atenderte en tu bloque. Te reubicamos hoy a las ${hhmm(d.nuevoSlot)}.`, 'regla');
    liberar(anterior, p.nombre, t);
  };

  const aplicar = (a: Accion) => {
    const t = a.t;
    switch (a.tipo) {
      case 'aviso_atraso': {
        const p = pacientes.find((x) => x.id === a.pid);
        if (!p || p.estado !== 'agendado' || p.llegada !== undefined) return;
        p.avisoAtraso = a.minutos;
        p.avisoEn = t;
        if (!cfg.reglaActiva) {
          avisar(t, p, `Recibimos tu aviso de ${a.minutos} min de atraso.`, 'regla');
          return;
        }
        const d = evaluar(p, a.minutos, true, t);
        if (d.tipo === 'reagendar') return reagendar(p, d, t);
        if (d.tipo === 'reubicar') return reubicar(p, d, t);
        p.decision = d;
        p.decisionEn = t;
        p.ultimoEstimadoAvisado = p.slot + a.minutos;
        avisar(t, p, `Recibimos tu aviso. Si llegas a las ${hhmm(p.slot + a.minutos)}, te atendemos hasta las ${hhmm(d.finPermitido)}.`, 'regla');
        return;
      }
      case 'checkin': {
        const p = pacientes.find((x) => x.id === a.pid);
        if (!p || p.llegada !== undefined || p.estado !== 'agendado') return;
        p.llegada = t;
        p.llegadaVia = a.via;
        const atraso = t - p.slot;
        if (cfg.reglaActiva) {
          const d = evaluar(p, atraso, p.avisoAtraso !== undefined, t);
          if (d.tipo === 'reagendar') {
            p.estado = 'reagendado';
            return reagendar(p, d, t);
          }
          if (d.tipo === 'reubicar') reubicar(p, d, t);
          else {
            p.decision = d;
            p.decisionEn = t;
          }
        }
        p.estado = 'en_sala';
        proyectar(t, false);
        avisar(t, p, `Llegaste a las ${hhmm(t)}. Te atendemos a las ${hhmm(p.estimado ?? p.slot)} en ${esc.box}.`, 'llegada');
        p.ultimoEstimadoAvisado = p.estimado;
        return;
      }
      case 'confirmar': {
        const p = pacientes.find((x) => x.id === a.pid);
        if (!p || p.confirmado) return;
        p.confirmado = true;
        avisar(t, p, `Confirmaste tu hora de las ${hhmm(p.slot)}.`, 'confirmacion');
        return;
      }
      case 'cancelar': {
        const p = pacientes.find((x) => x.id === a.pid);
        if (!p || (p.estado !== 'agendado' && p.estado !== 'en_sala')) return;
        p.estado = 'cancelado';
        avisar(t, p, `Cancelaste tu hora de las ${hhmm(p.slot)}. Gracias por avisar: se ofrece a otro paciente.`, 'cancelacion');
        liberar(p.slot, p.nombre, t);
        return;
      }
      case 'urgencia': {
        urgencias += 1;
        pacientes.push({
          id: `urgencia-${urgencias}`,
          nombre: a.nombre,
          rut4: '',
          canal: 'ninguno',
          token: '',
          slot: t,
          slotOriginal: t,
          duracion: DURACION_URGENCIA,
          confirmado: true,
          origen: 'urgencia',
          estado: 'en_sala',
          llegada: t,
          llegadaVia: 'recepcion',
          decision: { tipo: 'pasa', finPermitido: t + DURACION_URGENCIA, texto: 'Urgencia clínica: pasa siempre y decide el médico.' },
          decisionEn: t,
        });
        avisos.push({ t, canal: 'sistema', para: 'Recepción', texto: `Urgencia clínica registrada (${a.nombre}). Pasa a continuación.`, tipo: 'urgencia' });
        return;
      }
      case 'medico_atraso': {
        const actual = pacientes.find((x) => x.estado === 'en_consulta');
        if (actual && actual.fin !== undefined && actual.finObjetivo !== undefined) {
          actual.fin += a.minutos;
          actual.finObjetivo += a.minutos;
        } else {
          medico.libreDesde = Math.max(medico.libreDesde, t) + a.minutos;
        }
        medico.atrasoAvisado += a.minutos;
        avisos.push({
          t,
          canal: 'sistema',
          para: 'Pacientes que siguen',
          texto: `${esc.medico} avisa ${a.minutos} min de atraso. Se informa la nueva hora y se ofrece reagendar.`,
          tipo: 'medico',
        });
        return;
      }
      case 'terminar': {
        const actual = pacientes.find((x) => x.estado === 'en_consulta');
        if (actual) actual.fin = t;
        return;
      }
    }
  };

  const tarde = (p: Paciente) => p.llegada !== undefined && p.llegada > p.slot + 0.5;

  const finObjetivoPara = (p: Paciente, inicio: Min): Min => {
    if (p.origen === 'urgencia') return inicio + DURACION_URGENCIA;
    if (cfg.reglaActiva && p.decision && p.decision.tipo !== 'reubicar' && p.decision.tipo !== 'reagendar' && tarde(p)) {
      return Math.max(p.decision.finPermitido, inicio + cfg.consultaMinima);
    }
    return inicio <= p.slot + 0.5 ? p.slot + cfg.slotMin : inicio + cfg.slotMin;
  };

  function avanzarMedico(t: Min) {
    let actual = pacientes.find((x) => x.estado === 'en_consulta');
    if (actual && actual.fin !== undefined && t >= actual.fin - EPS) {
      actual.estado = 'atendido';
      actual = undefined;
    }
    if (actual || t < medico.libreDesde - EPS) return;
    const listos = pacientes
      .filter((p) => p.estado === 'en_sala' && (p.origen === 'urgencia' || p.slot <= t + EPS))
      .sort((a, b) => {
        if (a.origen === 'urgencia' && b.origen !== 'urgencia') return -1;
        if (b.origen === 'urgencia' && a.origen !== 'urgencia') return 1;
        return a.slot - b.slot;
      });
    const p = listos[0];
    if (!p) return;
    p.estado = 'en_consulta';
    p.inicio = t;
    p.finObjetivo = finObjetivoPara(p, t);
    const conRegla = cfg.reglaActiva && tarde(p) && p.origen !== 'urgencia';
    p.fin = conRegla ? Math.min(p.finObjetivo, t + p.duracion) : t + p.duracion;
  }

  function proyectar(t: Min, notificar: boolean) {
    const actual = pacientes.find((x) => x.estado === 'en_consulta');
    let libre = actual?.finObjetivo !== undefined ? Math.max(t, actual.finObjetivo) : Math.max(t, medico.libreDesde);
    const cola = pacientes
      .filter((p) => p.estado === 'agendado' || p.estado === 'en_sala')
      .sort((a, b) => {
        const ua = a.origen === 'urgencia' ? 0 : 1;
        const ub = b.origen === 'urgencia' ? 0 : 1;
        return ua - ub || a.slot - b.slot;
      });
    for (const p of cola) {
      const llegadaEsperada = p.llegada ?? p.slot + (p.avisoAtraso ?? 0);
      const ausente = p.llegada === undefined && t > llegadaEsperada + EPS;
      let inicio: Min;
      if (p.origen === 'urgencia') inicio = libre;
      else if (p.llegada !== undefined) inicio = Math.max(libre, p.slot);
      else inicio = Math.max(libre, p.slot, llegadaEsperada);
      p.estimado = ausente ? Math.max(libre, t) : inicio;
      if (!ausente) {
        const tardeEsperado = llegadaEsperada > p.slot + 0.5;
        let fin: Min;
        if (p.origen === 'urgencia') fin = inicio + DURACION_URGENCIA;
        else if (cfg.reglaActiva && tardeEsperado && p.decision && (p.decision.tipo === 'pasa' || p.decision.tipo === 'pasa_holgura')) {
          fin = Math.max(p.decision.finPermitido, inicio + cfg.consultaMinima);
        } else fin = inicio + cfg.slotMin;
        libre = fin;
      }
      if (
        notificar &&
        p.ultimoEstimadoAvisado !== undefined &&
        p.estimado > t &&
        Math.abs(p.estimado - p.ultimoEstimadoAvisado) >= 3
      ) {
        avisar(t, p, `Tu hora estimada cambió: te atendemos a las ${hhmm(p.estimado)}.`, 'estimado');
        p.ultimoEstimadoAvisado = p.estimado;
      }
    }
  }

  function revisarAusentes(t: Min) {
    for (const p of pacientes) {
      if (p.estado !== 'agendado' || p.llegada !== undefined || p.origen === 'urgencia') continue;
      const limite = p.slot + (p.avisoAtraso !== undefined ? p.avisoAtraso + 5 : cfg.toleranciaMax);
      if (t <= limite + EPS) continue;
      const d: Decision = {
        tipo: 'reagendar',
        texto: p.avisoAtraso !== undefined
          ? 'Avisó atraso pero no llegó: se reagenda con prioridad.'
          : 'No llegó ni avisó: se reagenda con prioridad.',
      };
      if (cfg.reglaActiva) reagendar(p, d, t);
      else {
        p.estado = 'reagendado';
        p.decision = { tipo: 'reagendar', texto: 'No se presentó.' };
      }
    }
  }

  function procesarListaEspera(t: Min) {
    for (const a of aceptaciones) {
      if (a.t > t + EPS || a.wid === '') continue;
      const w = espera.find((x) => x.id === a.wid);
      const hueco = huecos.find((h) => h.estado === 'ofrecido' && Math.abs(h.slot - a.slot) < EPS);
      a.wid = '';
      if (!w || !hueco || slotOcupado(a.slot)) continue;
      w.estado = 'asignado';
      w.slot = a.slot;
      for (const otro of espera) if (otro.estado === 'ofrecido') otro.estado = 'en_espera';
      hueco.estado = 'reocupado';
      hueco.tomadoPor = w.nombre;
      hueco.aceptadoEn = t;
      pacientes.push({
        id: w.id,
        nombre: w.nombre,
        rut4: w.rut4,
        canal: w.canal,
        token: w.token,
        slot: a.slot,
        slotOriginal: a.slot,
        duracion: 18,
        confirmado: true,
        origen: 'lista_espera',
        estado: 'agendado',
        ultimoEstimadoAvisado: a.slot,
      });
      avisar(t, w, `Listo, la hora es tuya: hoy ${hhmm(a.slot)} con ${esc.medico}, ${esc.box}.`, 'lista_espera');
    }
    // Quien tomó un cupo de la lista de espera llega 4 min antes.
    for (const p of pacientes) {
      if (p.origen === 'lista_espera' && p.estado === 'agendado' && p.llegada === undefined && t >= p.slot - 4 - EPS) {
        aplicar({ tipo: 'checkin', t, pid: p.id, via: 'qr' });
      }
    }
    for (const h of huecos) if (h.estado === 'ofrecido' && t >= h.slot - EPS) h.estado = 'sin_cubrir';
  }

  // ---- Bucle principal ----
  const orden = [...acciones].sort((a, b) => a.t - b.t);
  let i = 0;
  const fin = Math.max(ahora, esc.inicioDia);
  const paso = (t: Min, notificar: boolean) => {
    while (i < orden.length && orden[i].t <= t + EPS) aplicar(orden[i++]);
    procesarListaEspera(t);
    revisarAusentes(t);
    avanzarMedico(t);
    proyectar(t, notificar);
  };
  let t = esc.inicioDia;
  while (t < fin - EPS) {
    paso(t, true);
    t += PASO;
  }
  paso(fin, true);

  return {
    t: fin,
    escenario: esc,
    config: cfg,
    pacientes,
    huecos,
    avisos: avisos.filter((a) => a.t <= fin + EPS).sort((a, b) => b.t - a.t),
    listaEspera: espera,
    medico: { actual: pacientes.find((p) => p.estado === 'en_consulta'), libreDesde: medico.libreDesde, atrasoAvisado: medico.atrasoAvisado },
    metricas: calcularMetricas(pacientes, huecos, cfg, fin),
  };
}

function calcularMetricas(pacientes: Paciente[], huecos: Hueco[], cfg: Config, t: Min): Metricas {
  const puntuales = pacientes.filter(
    (p) => p.origen !== 'urgencia' && p.llegada !== undefined && p.llegada <= p.slotOriginal + cfg.toleranciaPasa + EPS,
  );
  const espera = (p: Paciente) => {
    if (p.inicio !== undefined) return Math.max(0, p.inicio - p.slot);
    if (p.estado === 'en_sala') return Math.max(0, t - p.slot);
    return 0;
  };
  const atendidos = puntuales.filter((p) => p.inicio !== undefined);
  return {
    aTiempo: atendidos.filter((p) => espera(p) <= 10 + EPS).length,
    puntualesAtendidos: atendidos.length,
    atrasoAcumulado: Math.round(puntuales.reduce((s, p) => s + espera(p), 0)),
    huecosReocupados: huecos.filter((h) => h.estado === 'reocupado').length,
    huecosTotales: huecos.length,
    riesgoReclamo: puntuales.filter((p) => espera(p) > 15 + EPS).length,
  };
}
