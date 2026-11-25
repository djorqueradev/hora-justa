import type { Accion, Escenario } from './types';
import { hora } from './formato';

/**
 * Jornada de demostración: Traumatología, citas de 20 min, 10:00 a 12:00.
 * El bloque de las 12:00 queda libre: es la holgura del día.
 * Todos los nombres son ficticios.
 */
export const ESCENARIO_DEMO: Escenario = {
  id: 'demo',
  clinica: 'Clínica Demo',
  especialidad: 'Traumatología',
  medico: 'Dra. Paula Rivas',
  box: 'Box 4',
  fecha: 'Miércoles 30 de septiembre',
  inicioDia: hora(9, 50),
  slots: [hora(10), hora(10, 20), hora(10, 40), hora(11), hora(11, 20), hora(11, 40), hora(12)],
  pacientes: [
    { id: 'andres', nombre: 'Andrés Muñoz', rut4: '4821', canal: 'app', token: 'A1F3-K8', slot: hora(10), duracion: 19, confirmado: true },
    { id: 'sofia', nombre: 'Sofía Pérez', rut4: '7390', canal: 'whatsapp', token: 'S7PZ-2M', slot: hora(10, 20), duracion: 18, confirmado: true },
    { id: 'camila', nombre: 'Camila Torres', rut4: '1156', canal: 'app', token: '7KQ2-M9', slot: hora(10, 40), duracion: 18, confirmado: true },
    { id: 'jorge', nombre: 'Jorge Silva', rut4: '6604', canal: 'whatsapp', token: 'J4RT-6Q', slot: hora(11), duracion: 19, confirmado: true },
    { id: 'elena', nombre: 'Elena Rojas', rut4: '2287', canal: 'sms', token: 'E9LX-3V', slot: hora(11, 20), duracion: 17, confirmado: true },
    { id: 'pedro', nombre: 'Pedro Díaz', rut4: '9015', canal: 'sms', token: 'P2DN-8W', slot: hora(11, 40), duracion: 18, confirmado: false },
  ],
  listaEspera: [
    { id: 'marta', nombre: 'Marta Lagos', rut4: '3342', canal: 'whatsapp', token: 'M5GB-4H', aceptaEn: 4 },
    { id: 'luis', nombre: 'Luis Fuentes', rut4: '5170', canal: 'sms', token: 'L8QW-1C', aceptaEn: null },
    { id: 'carmen', nombre: 'Carmen Vidal', rut4: '8863', canal: 'app', token: 'C3VN-7T', aceptaEn: 9 },
  ],
};

/** Paciente que maneja quien hace la demo desde su celular. */
export const PACIENTE_DEMO = 'camila';

/**
 * Guion de la demo guiada (el mismo caso de las presentaciones):
 * Sofía avisa y llega 8 min tarde, Jorge avisa 20 min y libera su hora,
 * Marta la toma desde la lista de espera, Elena llega sin celular y Pedro no llega.
 */
export const GUION_GUIADO: Accion[] = [
  { tipo: 'checkin', t: hora(9, 57), pid: 'andres', via: 'qr' },
  { tipo: 'aviso_atraso', t: hora(10, 12), pid: 'sofia', minutos: 8 },
  { tipo: 'aviso_atraso', t: hora(10, 26), pid: 'jorge', minutos: 20 },
  { tipo: 'checkin', t: hora(10, 28), pid: 'sofia', via: 'qr' },
  { tipo: 'checkin', t: hora(10, 31), pid: 'camila', via: 'qr' },
  { tipo: 'checkin', t: hora(11, 14), pid: 'elena', via: 'recepcion' },
];

/** Modo libre: todos llegan a la hora, salvo Camila, que la maneja quien hace la demo. */
export const GUION_LIBRE: Accion[] = ESCENARIO_DEMO.pacientes
  .filter((p) => p.id !== PACIENTE_DEMO)
  .map((p) => ({ tipo: 'checkin' as const, t: p.slot - 3, pid: p.id, via: p.canal === 'sms' ? ('recepcion' as const) : ('qr' as const) }));

/**
 * Caso de la presentación 2: citas cada 20 min, el paciente A llega a las 10:12.
 * Sirve para comparar la agenda con y sin Hora Justa.
 */
export const ESCENARIO_EJEMPLO: Escenario = {
  id: 'ejemplo',
  clinica: 'Clínica Demo',
  especialidad: 'Ejemplo de la presentación 2',
  medico: 'Médico',
  box: 'Box 1',
  fecha: 'Ejemplo ilustrativo',
  inicioDia: hora(9, 55),
  slots: [hora(10), hora(10, 20), hora(10, 40), hora(11), hora(11, 20)],
  pacientes: [
    { id: 'a', nombre: 'Paciente A', rut4: '0001', canal: 'app', token: 'EJ-A', slot: hora(10), duracion: 20, confirmado: true },
    { id: 'b', nombre: 'Paciente B', rut4: '0002', canal: 'app', token: 'EJ-B', slot: hora(10, 20), duracion: 20, confirmado: true },
    { id: 'c', nombre: 'Paciente C', rut4: '0003', canal: 'app', token: 'EJ-C', slot: hora(10, 40), duracion: 20, confirmado: true },
    { id: 'd', nombre: 'Paciente D', rut4: '0004', canal: 'app', token: 'EJ-D', slot: hora(11), duracion: 20, confirmado: true },
  ],
  listaEspera: [],
};

export function guionEjemplo(atrasoA: number): Accion[] {
  return [
    { tipo: 'checkin', t: hora(10) + atrasoA, pid: 'a', via: 'qr' },
    { tipo: 'checkin', t: hora(10, 17), pid: 'b', via: 'qr' },
    { tipo: 'checkin', t: hora(10, 37), pid: 'c', via: 'qr' },
    { tipo: 'checkin', t: hora(10, 57), pid: 'd', via: 'qr' },
  ];
}
