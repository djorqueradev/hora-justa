import { useEffect, useState } from 'react';
import { ImagenQR, Marca } from '../components/Comunes';
import { codigoActual, codigoValido, segundosParaCambio } from '../checkin';
import { urlAbsoluta } from '../router';
import { despachar, obtener, useJornada } from '../store';
import { hhmm } from '../engine/formato';

/** Pantalla de la entrada: QR que cambia cada 30 s. */
export function Entrada() {
  const [ahoraReal, setAhoraReal] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAhoraReal(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const codigo = codigoActual(ahoraReal);
  const url = urlAbsoluta(`/checkin?k=${codigo}`);

  return (
    <div className="kiosk">
      <div className="kiosk-card" style={{ maxWidth: 760, alignItems: 'center', textAlign: 'center' }}>
        <Marca />
        <h1 style={{ fontSize: 36, fontWeight: 800 }}>¿Llegaste? Escanea para registrar tu llegada</h1>
        <p className="muted">Abre la cámara de tu teléfono y apunta al código. Si no tienes celular, usa el tótem o acércate a recepción.</p>
        <ImagenQR texto={url} size={300} />
        <div className="col" style={{ alignItems: 'center', gap: 4 }}>
          <span className="small muted">O escribe este código en tu link</span>
          <span className="num" style={{ fontSize: 44, fontWeight: 800, letterSpacing: 8 }}>{codigo}</span>
          <span className="xs muted">Cambia en {segundosParaCambio(ahoraReal)} s, para que la hora de llegada sea real.</span>
        </div>
      </div>
    </div>
  );
}

/** Página que abre el QR. Si este navegador tiene una cita abierta, marca la llegada. */
export function Checkin({ k }: { k: string }) {
  const { snap } = useJornada();
  const [hecho, setHecho] = useState<string | null>(null);
  const valido = codigoValido(k);
  const token = obtener().miCita;
  const p = snap.pacientes.find((x) => x.token === token);

  useEffect(() => {
    if (!valido || !p || hecho) return;
    if (p.estado === 'agendado') despachar({ tipo: 'checkin', pid: p.id, via: 'qr' });
    setHecho(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valido, p?.id]);

  return (
    <div className="kiosk">
      <div className="kiosk-card">
        <Marca />
        {!valido ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Este código ya caducó</h1>
            <p className="muted">Vuelve a escanear el QR de la pantalla de la entrada: cambia cada 30 segundos.</p>
          </>
        ) : !p ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Abre primero el link de tu cita</h1>
            <p className="muted">
              Este teléfono no tiene una cita abierta. Abre el link que te llegó por WhatsApp o SMS, o usa el tótem con
              tu RUT.
            </p>
            <p className="xs muted">
              En este prototipo los datos viven en el navegador: para probar con dos dispositivos, abre todo en el mismo
              navegador o usa el botón “Simular escaneo” del link del paciente.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Listo, {p.nombre.split(' ')[0]}</h1>
            <p style={{ color: 'var(--ink-2)' }}>
              Registramos tu llegada{p.llegada !== undefined ? ` a las ${hhmm(p.llegada)}` : ''}. Te atendemos a las{' '}
              <b>{hhmm(p.estimado ?? p.slot)}</b> en {snap.escenario.box}.
            </p>
            {p.decision && p.decision.texto !== 'Llega a su hora.' && <p className="small" style={{ color: 'var(--warn)' }}>{p.decision.texto}</p>}
            <a className="btn primary" href={`#/c/${p.token}`}>Ver mi hora</a>
          </>
        )}
      </div>
    </div>
  );
}
