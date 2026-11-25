import { useState } from 'react';
import { despachar, useJornada } from '../store';
import { hhmm } from '../engine/formato';
import { Marca } from '../components/Comunes';

/** Tótem de la entrada: check-in con los últimos 4 dígitos del RUT, para quien no usa celular. */
export function Totem() {
  const { snap, t } = useJornada();
  const [rut, setRut] = useState('');
  const [resultado, setResultado] = useState<{ ok: boolean; titulo: string; texto: string } | null>(null);

  const tecla = (k: string) => {
    setResultado(null);
    if (k === '←') return setRut((r) => r.slice(0, -1));
    if (rut.length >= 4) return;
    const nuevo = rut + k;
    setRut(nuevo);
    if (nuevo.length === 4) buscar(nuevo);
  };

  const buscar = (r: string) => {
    const p = snap.pacientes.find((x) => x.rut4 === r && x.origen !== 'urgencia');
    if (!p) {
      setResultado({ ok: false, titulo: 'No encontramos una hora hoy con ese RUT', texto: 'Acércate a recepción y te ayudamos.' });
    } else if (p.estado !== 'agendado') {
      const msg: Record<string, string> = {
        en_sala: 'Ya registraste tu llegada. Te avisamos en pantalla cuando sea tu turno.',
        en_consulta: `Es tu turno: pasa a ${snap.escenario.box}.`,
        atendido: 'Tu consulta de hoy ya terminó.',
        reagendado: `Tu hora fue reagendada: ${p.reagendadoA}. Recepción puede ayudarte.`,
        cancelado: 'Esta hora fue cancelada.',
      };
      setResultado({ ok: p.estado === 'en_sala' || p.estado === 'en_consulta', titulo: `Hola, ${p.nombre.split(' ')[0]}`, texto: msg[p.estado] });
    } else {
      despachar({ tipo: 'checkin', pid: p.id, via: 'totem' });
      setResultado({
        ok: true,
        titulo: `Listo, ${p.nombre.split(' ')[0]}. Registramos tu llegada a las ${hhmm(t)}.`,
        texto: `Tu hora es a las ${hhmm(p.slot)} en ${snap.escenario.box}. Si llegaste tarde, la regla de tolerancia ya decidió qué sigue y te lo mostramos en la pantalla de la sala.`,
      });
    }
    window.setTimeout(() => setRut(''), 400);
  };

  return (
    <div className="kiosk">
      <div className="kiosk-card">
        <div className="row between">
          <Marca />
          <span className="num bold" style={{ fontSize: 22 }}>{hhmm(t)}</span>
        </div>
        <div className="col" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Registra tu llegada</h1>
          <p className="muted">Ingresa los últimos 4 dígitos de tu RUT, sin dígito verificador.</p>
        </div>
        <div className="pin" aria-live="polite" aria-label={`Dígitos ingresados: ${rut.length} de 4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < rut.length ? 'on' : ''}>{rut[i] ? '•' : ''}</span>
          ))}
        </div>
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((k, i) =>
            k ? (
              <button key={i} onClick={() => tecla(k)} aria-label={k === '←' ? 'Borrar' : k}>{k}</button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        {resultado && (
          <div className="card" role="status" style={{ background: resultado.ok ? 'var(--ok-soft)' : 'var(--warn-soft)', padding: 18 }}>
            <span className="bold" style={{ color: resultado.ok ? 'var(--ok)' : 'var(--warn)' }}>{resultado.titulo}</span>
            <span className="small" style={{ color: 'var(--ink-2)' }}>{resultado.texto}</span>
          </div>
        )}
        <details className="small muted">
          <summary style={{ cursor: 'pointer' }}>RUT de prueba</summary>
          <div className="col" style={{ gap: 4, marginTop: 8 }}>
            {snap.pacientes.filter((p) => p.origen !== 'urgencia').map((p) => (
              <span key={p.id}>{p.rut4} · {p.nombre} ({hhmm(p.slot)})</span>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
