import { useEffect, useRef, useState } from 'react';
import { despachar, recordarCita, useJornada } from '../store';
import { hhmm } from '../engine/formato';
import type { Paciente as P, Snapshot } from '../engine/types';
import { Marca, Modal } from '../components/Comunes';
import { Check, Qr, Reloj } from '../components/Iconos';
import { codigoActual, codigoValido } from '../checkin';
import { PACIENTE_DEMO } from '../engine/escenario';

export function Paciente({ token }: { token?: string }) {
  const { snap, t } = useJornada();
  const esc = snap.escenario;
  const tok = token ?? esc.pacientes.find((p) => p.id === PACIENTE_DEMO)!.token;
  useEffect(() => recordarCita(tok), [tok]);

  const p = snap.pacientes.find((x) => x.token === tok);
  const enEspera = snap.listaEspera.find((w) => w.token === tok);

  return (
    <div className="phone-stage">
      <div className="phone">
        <div className="row between">
          <Marca />
          <span className="small muted" style={{ fontWeight: 500 }}>{esc.clinica}</span>
        </div>
        {p ? <Cita p={p} snap={snap} t={t} /> : enEspera ? <ListaEspera nombre={enEspera.nombre} /> : <NoEncontrada />}
        <p className="xs muted" style={{ marginTop: 'auto', textAlign: 'center' }}>
          ¿Sin celular? Confirma por WhatsApp, SMS, en el tótem o en recepción.
        </p>
      </div>
      <aside className="phone-note">
        <span className="badge b-demo" style={{ alignSelf: 'flex-start' }}>Vista del paciente</span>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>El link único de cada cita</h2>
        <p className="small" style={{ color: 'var(--ink-2)' }}>
          Al confirmar la hora, el paciente recibe por WhatsApp o SMS un link propio. Se abre en el navegador, sin
          descargar nada ni crear cuenta. Muestra solo hora, especialidad, médico y box: ningún dato clínico.
        </p>
        <p className="small" style={{ color: 'var(--ink-2)' }}>
          Para registrar la llegada, el paciente escanea el QR de la pantalla de la entrada. Ese código cambia cada
          30 segundos, así la hora de llegada es real.
        </p>
        <div className="card" style={{ padding: 16, gap: 8 }}>
          <span className="small bold">Abrir la cita de otro paciente</span>
          {esc.pacientes.map((x) => (
            <a key={x.token} href={`#/c/${x.token}`} className="small" aria-current={x.token === tok ? 'page' : undefined}>
              {hhmm(x.slot)} · {x.nombre} <span className="muted">({x.token})</span>
            </a>
          ))}
          {esc.listaEspera.map((x) => (
            <a key={x.token} href={`#/c/${x.token}`} className="small">
              Lista de espera · {x.nombre} <span className="muted">({x.token})</span>
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Cita({ p, snap, t }: { p: P; snap: Snapshot; t: number }) {
  const esc = snap.escenario;
  const [checkin, setCheckin] = useState(false);
  const nombre = p.nombre.split(' ')[0];
  const estimado = p.estimado ?? p.slot;
  const desfase = Math.round(estimado - p.slot);
  const antes = snap.pacientes.filter(
    (o) => o.id !== p.id && (o.estado === 'en_consulta' || ((o.estado === 'en_sala' || o.estado === 'agendado') && (o.estimado ?? o.slot) < estimado - 0.01)),
  ).length;
  const titulo: Record<string, string> = {
    agendado: p.confirmado ? 'Tu hora de hoy está confirmada.' : 'Confirma tu hora de hoy.',
    en_sala: 'Ya registramos tu llegada.',
    en_consulta: 'Es tu turno.',
    atendido: 'Tu consulta terminó.',
    reagendado: 'Te reagendamos con prioridad.',
    cancelado: 'Cancelaste tu hora.',
  };

  return (
    <>
      <div className="col" style={{ gap: 2, paddingTop: 4 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Hola, {nombre}</h1>
        <p className="small muted">{titulo[p.estado]}</p>
      </div>

      <div className="card shadow" style={{ gap: 14, padding: 18 }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tu hora</span>
            <span className="num" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>{hhmm(p.slot)}</span>
          </div>
          {p.confirmado ? (
            <span className="badge b-accent"><Check size={13} />Confirmada</span>
          ) : (
            <span className="badge b-warn-2">Sin confirmar</span>
          )}
        </div>
        <span className="small" style={{ color: 'var(--ink-2)' }}>{esc.especialidad} · {esc.medico} · {esc.box}</span>

        {(p.estado === 'agendado' || p.estado === 'en_sala') && (
          <>
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div className="row between">
              <div className="col" style={{ gap: 3 }}>
                <span className="xs muted" style={{ fontWeight: 600 }}>Hora estimada de atención</span>
                <span className="num" style={{ fontSize: 22, fontWeight: 800 }}>{hhmm(estimado)}</span>
              </div>
              <span className={`badge ${desfase <= 2 ? 'b-ok' : 'b-warn-2'}`} style={{ fontSize: 13, padding: '8px 12px', borderRadius: 12 }}>
                {desfase <= 2 ? 'A tu hora' : `+${desfase} min`}
              </span>
            </div>
            <div className="col" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 4 }}>
                {Array.from({ length: Math.min(antes, 4) + 1 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < Math.min(antes, 4) ? 'var(--accent-soft-2)' : 'var(--accent)' }} />
                ))}
              </div>
              <span className="xs muted">
                {antes === 0 ? 'Eres el siguiente' : `${antes} paciente${antes > 1 ? 's' : ''} antes que tú`} · se actualiza solo
              </span>
            </div>
          </>
        )}
        {p.estado === 'en_consulta' && (
          <span className="badge b-ok" style={{ alignSelf: 'flex-start', fontSize: 14, padding: '10px 14px' }}>Pasa a {esc.box}</span>
        )}
        {p.estado === 'reagendado' && (
          <div className="col" style={{ gap: 6 }}>
            <span className="small bold">Nueva hora: {p.reagendadoA}</span>
            <span className="xs muted">{p.decision?.texto}</span>
          </div>
        )}
      </div>

      {p.decision && p.estado !== 'reagendado' && p.decision.texto !== 'Llega a su hora.' && (
        <div className="card" style={{ padding: 14, gap: 4, background: 'var(--warn-soft)' }}>
          <span className="small bold" style={{ color: 'var(--warn)' }}>Regla de tolerancia</span>
          <span className="small" style={{ color: 'var(--ink-2)' }}>{p.decision.texto}</span>
        </div>
      )}

      {p.estado === 'en_sala' && p.llegada !== undefined && (
        <div className="card" style={{ padding: 16, gap: 4, background: 'var(--accent-soft)' }}>
          <span className="small bold" style={{ color: 'var(--accent-ink)' }}>
            Llegaste a las {hhmm(p.llegada)}{p.llegadaVia === 'qr' ? ' con QR' : p.llegadaVia === 'totem' ? ' por el tótem' : ' en recepción'}
          </span>
          <span className="small" style={{ color: 'var(--ink-2)' }}>
            Espera en la sala: esta pantalla se actualiza sola y te avisamos cuando sea tu turno.
          </span>
        </div>
      )}

      <Recorrido p={p} t={t} />

      {p.estado === 'agendado' && !p.confirmado && (
        <div className="row">
          <button className="btn primary lg" style={{ flex: 1 }} onClick={() => despachar({ tipo: 'confirmar', pid: p.id })}>Confirmar</button>
          <button className="btn lg" onClick={() => despachar({ tipo: 'cancelar', pid: p.id })}>No podré ir</button>
        </div>
      )}

      {p.estado === 'agendado' && (
        <button className="btn primary lg block" onClick={() => setCheckin(true)}>
          <Qr />Hacer check-in con QR
        </button>
      )}

      {p.estado === 'agendado' && p.avisoAtraso === undefined && <VoyAtrasado p={p} />}

      {p.estado === 'agendado' && p.confirmado && (
        <button className="btn sm" style={{ alignSelf: 'center', border: 'none', background: 'transparent', color: 'var(--muted)' }} onClick={() => despachar({ tipo: 'cancelar', pid: p.id })}>
          No podré ir: liberar mi hora
        </button>
      )}

      {checkin && <ModalCheckin p={p} cerrar={() => setCheckin(false)} />}
    </>
  );
}

function Recorrido({ p, t }: { p: P; t: number }) {
  const pasos = [
    { label: 'Confirmada', sub: '24 h antes', hecho: p.confirmado },
    { label: 'Recordatorio', sub: '2 h antes', hecho: t >= p.slotOriginal - 120 },
    { label: 'Check-in', sub: 'al llegar', hecho: p.llegada !== undefined },
    { label: 'Consulta', sub: p.estado === 'en_consulta' ? 'ahora' : p.inicio ? hhmm(p.inicio) : 'Box 4', hecho: p.estado === 'atendido' },
  ];
  const actual = pasos.findIndex((s) => !s.hecho);
  return (
    <div className="steps">
      {pasos.map((s, i) => (
        <div key={s.label} className="step">
          <span
            className="step-dot"
            style={
              s.hecho
                ? { background: 'var(--accent)', color: '#fff' }
                : i === actual
                  ? { border: '2px solid var(--accent)', color: 'var(--accent)' }
                  : { background: 'var(--line)', color: 'var(--muted)' }
            }
          >
            {s.hecho ? <Check size={14} /> : i + 1}
          </span>
          <span className="step-label" style={{ color: i === actual ? 'var(--accent)' : s.hecho ? 'var(--ink)' : 'var(--muted)', fontWeight: i === actual ? 700 : 600 }}>
            {s.label}<br />{s.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

function VoyAtrasado({ p }: { p: P }) {
  const opciones: [string, number][] = [['5 min', 5], ['10 min', 10], ['15+ min', 20]];
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ gap: 8 }}>
        <Reloj color="var(--warn-strong)" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>¿Vas atrasado? Avísanos</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {opciones.map(([label, min]) => (
          <button key={label} className="chip" onClick={() => despachar({ tipo: 'aviso_atraso', pid: p.id, minutos: min })}>{label}</button>
        ))}
      </div>
      <p className="xs muted" style={{ lineHeight: 1.5 }}>
        Hasta 5 min pasas igual. De 6 a 15 min, según la holgura del médico; si no hay, te damos otra hora hoy. Más de
        15 min: reagendamos con prioridad.
      </p>
    </div>
  );
}

function extraerCodigo(texto: string): string | null {
  const m = texto.match(/[?&]k=([A-Za-z0-9]+)/);
  return m ? m[1] : /^[A-Za-z0-9]{6}$/.test(texto.trim()) ? texto.trim() : null;
}

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

function ModalCheckin({ p, cerrar }: { p: P; cerrar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [camara, setCamara] = useState<'off' | 'on' | 'no'>('off');
  const video = useRef<HTMLVideoElement>(null);

  const confirmar = (c: string) => {
    if (!codigoValido(c)) {
      setError('Ese código ya no es válido. Mira la pantalla de la entrada e inténtalo de nuevo.');
      return;
    }
    despachar({ tipo: 'checkin', pid: p.id, via: 'qr' });
    cerrar();
  };

  useEffect(() => {
    if (camara !== 'on') return;
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) {
      setCamara('no');
      return;
    }
    let vivo = true;
    let stream: MediaStream | undefined;
    let id: number | undefined;
    const det = new BD({ formats: ['qr_code'] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        void video.current.play();
        const leer = async () => {
          if (!vivo || !video.current) return;
          try {
            const r = await det.detect(video.current);
            const c = r[0] ? extraerCodigo(r[0].rawValue) : null;
            if (c) return confirmar(c);
          } catch {
            /* sigue intentando */
          }
          id = window.setTimeout(leer, 300);
        };
        void leer();
      })
      .catch(() => setCamara('no'));
    return () => {
      vivo = false;
      if (id) window.clearTimeout(id);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camara]);

  return (
    <Modal titulo="Check-in al llegar" cerrar={cerrar}>
      <p className="small" style={{ color: 'var(--ink-2)' }}>
        Escanea el QR de la pantalla de la entrada o escribe el código de 6 letras que aparece bajo él.
      </p>
      {camara === 'on' && <video ref={video} muted playsInline style={{ width: '100%', borderRadius: 16, background: '#0F2A33', aspectRatio: '1' }} />}
      {camara === 'off' && <button className="btn primary" onClick={() => setCamara('on')}><Qr />Abrir cámara</button>}
      {camara === 'no' && <span className="xs muted">Este navegador no permite escanear aquí. Usa la cámara del teléfono o escribe el código.</span>}
      <form className="col" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); confirmar(codigo); }}>
        <label htmlFor="codigo">Código de la pantalla</label>
        <input id="codigo" className="input" maxLength={6} value={codigo} autoComplete="off" onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(''); }} placeholder="Ej: K7M2QX" />
        {error && <span className="xs" style={{ color: 'var(--bad)' }}>{error}</span>}
        <button className="btn" type="submit" disabled={codigo.length < 6}>Registrar llegada</button>
      </form>
      <button className="btn sm" style={{ border: 'none', background: 'var(--surface-2)' }} onClick={() => confirmar(codigoActual())}>
        Simular escaneo (demo)
      </button>
    </Modal>
  );
}

function ListaEspera({ nombre }: { nombre: string }) {
  return (
    <div className="card shadow">
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Hola, {nombre.split(' ')[0]}</h1>
      <p className="small" style={{ color: 'var(--ink-2)' }}>
        Estás en la lista de espera. Si se libera una hora hoy, te avisamos por aquí y por tu canal preferido. El primero
        que acepta la toma.
      </p>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="card shadow">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>No encontramos esta cita</h1>
      <p className="small muted">El link puede haber caducado. Los links únicos dejan de funcionar cuando termina la cita.</p>
      <a className="btn" href="#/">Volver al inicio</a>
    </div>
  );
}
