/** Minutos desde la medianoche del día simulado (admite decimales). */
export type Min = number;

export type Canal = 'app' | 'whatsapp' | 'sms' | 'ninguno';
export type ViaLlegada = 'qr' | 'totem' | 'recepcion';

export interface Config {
  /** Duración de cada cita en minutos. */
  slotMin: number;
  /** Hasta este atraso el paciente pasa y la consulta termina a su hora. */
  toleranciaPasa: number;
  /** Sobre este atraso (o sin aviso) se reagenda con prioridad. */
  toleranciaMax: number;
  /** Tiempo mínimo útil de una consulta. */
  consultaMinima: number;
  /** false = cómo funciona hoy, sin Hora Justa: el atrasado pasa con su tiempo completo. */
  reglaActiva: boolean;
}

export const CONFIG_INICIAL: Config = {
  slotMin: 20,
  toleranciaPasa: 5,
  toleranciaMax: 15,
  consultaMinima: 10,
  reglaActiva: true,
};

export interface PacienteBase {
  id: string;
  nombre: string;
  /** Últimos 4 dígitos del RUT, para el tótem y la recepción. */
  rut4: string;
  canal: Canal;
  token: string;
  slot: Min;
  /** Cuánto dura realmente su consulta si llega a la hora. */
  duracion: number;
  confirmado: boolean;
}

export interface PersonaEspera {
  id: string;
  nombre: string;
  rut4: string;
  canal: Canal;
  token: string;
  /** Minutos que tarda en aceptar un cupo ofrecido; null = no responde. */
  aceptaEn: number | null;
}

export interface Escenario {
  id: string;
  clinica: string;
  especialidad: string;
  medico: string;
  box: string;
  fecha: string;
  /** Desde cuándo corre la simulación. */
  inicioDia: Min;
  /** Horarios de la agenda (los que no tienen paciente son holgura). */
  slots: Min[];
  pacientes: PacienteBase[];
  listaEspera: PersonaEspera[];
}

export type Accion =
  | { tipo: 'aviso_atraso'; t: Min; pid: string; minutos: number }
  | { tipo: 'checkin'; t: Min; pid: string; via: ViaLlegada }
  | { tipo: 'confirmar'; t: Min; pid: string }
  | { tipo: 'cancelar'; t: Min; pid: string }
  | { tipo: 'urgencia'; t: Min; nombre: string }
  | { tipo: 'medico_atraso'; t: Min; minutos: number }
  | { tipo: 'terminar'; t: Min };

export type Decision =
  | { tipo: 'pasa'; finPermitido: Min; texto: string }
  | { tipo: 'pasa_holgura'; finPermitido: Min; holguraUsada: number; texto: string }
  | { tipo: 'reubicar'; nuevoSlot: Min; texto: string }
  | { tipo: 'reagendar'; texto: string };

export type Estado =
  | 'agendado'
  | 'en_sala'
  | 'en_consulta'
  | 'atendido'
  | 'reagendado'
  | 'cancelado';

export interface Paciente extends PacienteBase {
  origen: 'agenda' | 'lista_espera' | 'urgencia';
  slotOriginal: Min;
  estado: Estado;
  avisoAtraso?: number;
  avisoEn?: Min;
  llegada?: Min;
  llegadaVia?: ViaLlegada;
  decision?: Decision;
  decisionEn?: Min;
  inicio?: Min;
  fin?: Min;
  /** Hora a la que debe terminar la consulta (lo que muestra el cronómetro). */
  finObjetivo?: Min;
  /** Hora estimada de atención para quien todavía no entra. */
  estimado?: Min;
  ultimoEstimadoAvisado?: Min;
  /** Nueva fecha cuando se reagenda. */
  reagendadoA?: string;
}

export interface Hueco {
  slot: Min;
  liberadoEn: Min;
  liberadoPor: string;
  estado: 'ofrecido' | 'reocupado' | 'sin_cubrir';
  tomadoPor?: string;
  aceptadoEn?: Min;
}

export type CanalAviso = Canal | 'sistema';

export interface Aviso {
  t: Min;
  canal: CanalAviso;
  para: string;
  texto: string;
  tipo: 'confirmacion' | 'recordatorio' | 'regla' | 'estimado' | 'lista_espera' | 'llegada' | 'medico' | 'urgencia' | 'cancelacion';
}

export interface Metricas {
  /** Pacientes que llegaron a tiempo y entraron ±10 min de su hora. */
  aTiempo: number;
  puntualesAtendidos: number;
  /** Suma de minutos que esperaron, sobre su hora, los que llegaron a tiempo. */
  atrasoAcumulado: number;
  huecosReocupados: number;
  huecosTotales: number;
  /** Puntuales que esperaron más de 15 min sobre su hora (riesgo de reclamo). */
  riesgoReclamo: number;
}

export interface Snapshot {
  t: Min;
  escenario: Escenario;
  config: Config;
  pacientes: Paciente[];
  huecos: Hueco[];
  avisos: Aviso[];
  listaEspera: (PersonaEspera & { estado: 'en_espera' | 'ofrecido' | 'asignado'; slot?: Min })[];
  medico: { actual?: Paciente; libreDesde: Min; atrasoAvisado: number };
  metricas: Metricas;
}
