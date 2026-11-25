import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type { Aviso, Paciente } from '../engine/types';
import { hhmm, mmss, NOMBRE_CANAL } from '../engine/formato';
import { Reloj as IcoReloj } from './Iconos';

export function Marca({ texto = true }: { texto?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark"><IcoReloj size={18} color="#fff" /></span>
      {texto && <span className="brand-name">Hora Justa</span>}
    </span>
  );
}

/** Estado de un paciente en la agenda: etiqueta y color. */
export function estadoPaciente(p: Paciente, t: number): { texto: string; clase: string; tinte?: string } {
  switch (p.estado) {
    case 'atendido':
      return { texto: 'Atendido', clase: 'b-neutral' };
    case 'en_consulta':
      return p.origen === 'urgencia'
        ? { texto: 'Urgencia en consulta', clase: 'b-bad', tinte: 'tint-bad' }
        : { texto: 'En consulta', clase: 'b-warn', tinte: 'tint-warn' };
    case 'en_sala': {
      if (p.origen === 'urgencia') return { texto: 'Urgencia', clase: 'b-bad', tinte: 'tint-bad' };
      const atraso = (p.estimado ?? p.slot) - p.slot;
      if (p.decision?.tipo === 'reubicar') return { texto: 'Reubicado hoy', clase: 'b-accent' };
      return atraso <= 2
        ? { texto: 'En sala · a su hora', clase: 'b-ok' }
        : { texto: `En sala · +${Math.round(atraso)} min`, clase: 'b-warn-2' };
    }
    case 'reagendado':
      return { texto: 'Reagendado', clase: 'b-neutral' };
    case 'cancelado':
      return { texto: 'Canceló', clase: 'b-neutral' };
    case 'agendado':
      if (p.origen === 'lista_espera') return { texto: 'Hueco reocupado', clase: 'b-accent-2', tinte: 'tint-accent' };
      if (p.avisoAtraso !== undefined) return { texto: `Avisó +${p.avisoAtraso} min`, clase: 'b-warn-2' };
      if (!p.confirmado) return { texto: 'Sin confirmar', clase: 'b-warn-2' };
      if (t > p.slot) return { texto: 'No ha llegado', clase: 'b-bad' };
      return { texto: 'Confirmada', clase: 'b-accent' };
  }
}

/** Lo que pasó con un paciente, en una línea. */
export function detallePaciente(p: Paciente): string {
  const partes: string[] = [];
  if (p.origen === 'urgencia') return `Llegó ${hhmm(p.llegada!)} · ${p.decision?.texto ?? ''}`;
  if (p.origen === 'lista_espera') partes.push('Tomó el cupo desde la lista de espera');
  if (p.avisoAtraso !== undefined && p.avisoEn !== undefined) partes.push(`Avisó +${p.avisoAtraso} min a las ${hhmm(p.avisoEn)}`);
  if (p.llegada !== undefined) {
    const via = p.llegadaVia === 'qr' ? 'check-in con QR' : p.llegadaVia === 'totem' ? 'check-in en tótem' : 'llegada en recepción';
    const atraso = Math.round(p.llegada - p.slotOriginal);
    partes.push(`${via} ${hhmm(p.llegada)}${atraso > 0 ? ` (+${atraso} min)` : ''}`);
  }
  if (p.decision && !(p.decision.tipo === 'pasa' && p.decision.texto === 'Llega a su hora.')) {
    if (p.llegada === undefined || (p.llegada - p.slotOriginal > 0.5) || p.decision.tipo !== 'pasa') partes.push(`Regla: ${p.decision.texto.replace(/\.$/, '')}`);
  }
  if (p.estado === 'atendido' && p.inicio !== undefined && p.fin !== undefined) partes.push(`Atendido de ${hhmm(p.inicio)} a ${hhmm(p.fin)}`);
  if (p.estado === 'en_consulta' && p.inicio !== undefined) partes.push(`En consulta desde ${hhmm(p.inicio)}`);
  if (p.estado === 'agendado' && p.llegada === undefined && p.avisoAtraso === undefined) {
    partes.push(p.confirmado ? `Confirmada por ${NOMBRE_CANAL[p.canal]}` : 'Sin confirmar · recordatorio de 2 h enviado');
  }
  if (p.estado === 'cancelado') partes.push('Canceló con anticipación: su hora se ofreció a la lista de espera');
  return partes.join(' · ');
}

export function horaAviso(a: Aviso): string {
  return a.t < 0 ? `ayer ${hhmm(a.t + 24 * 60)}` : hhmm(a.t);
}

/** Cronómetro-semáforo: verde con más de la mitad del tiempo, ámbar con menos, rojo excedido. */
export function semaforo(p: Paciente, t: number) {
  const inicio = p.inicio ?? t;
  const objetivo = p.finObjetivo ?? t;
  const total = Math.max(1, objetivo - inicio);
  const restante = objetivo - t;
  const usado = Math.min(1, Math.max(0, (t - inicio) / total));
  const color = restante < 0 ? '#FF7A6B' : restante < total / 2 ? '#FFC46B' : '#5FD39A';
  const nombre = restante < 0 ? 'Excedido' : restante < total / 2 ? 'Ámbar' : 'Verde';
  return { restante, usado, color, nombre, texto: restante < 0 ? `+${mmss(-restante)}` : mmss(restante) };
}

export function ImagenQR({ texto, size = 260, oscuro = '#0F2A33' }: { texto: string; size?: number; oscuro?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(texto, { margin: 1, width: size * 2, color: { dark: oscuro, light: '#FFFFFF' } })
      .then(setSrc)
      .catch(() => setSrc(''));
  }, [texto, size, oscuro]);
  return src ? (
    <img src={src} width={size} height={size} alt="Código QR de check-in" style={{ borderRadius: 16, display: 'block' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 16, background: '#E4ECEE' }} />
  );
}

export function Modal({ titulo, children, cerrar }: { titulo: string; children: ReactNode; cerrar: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [cerrar]);
  return (
    <div className="overlay" onClick={cerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{titulo}</h2>
          <button className="btn sm" onClick={cerrar} aria-label="Cerrar">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
