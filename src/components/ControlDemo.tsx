import { cambiarModo, MOMENTO_CLAVE, reiniciar, reloj, useEstado, ahora } from '../store';
import { hhmm } from '../engine/formato';
import { Pausa, Play, Reinicio } from './Iconos';
import { useEffect, useState } from 'react';

const VELOCIDADES = [1, 10, 30, 60];

/** Control flotante del reloj simulado. Aparece en todas las pantallas. */
export function ControlDemo() {
  const e = useEstado();
  const [, set] = useState(0);
  const [abierto, setAbierto] = useState(() => typeof window === 'undefined' || window.innerWidth > 760);
  useEffect(() => {
    if (!e.reloj.corriendo) return;
    const id = window.setInterval(() => set((x) => x + 1), 500);
    return () => window.clearInterval(id);
  }, [e.reloj.corriendo]);
  const t = ahora(e);

  return (
    <div className="demo-dock" role="region" aria-label="Control de la demo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span className="lbl">Hora simulada</span>
        <span className="clock">{hhmm(t)}</span>
      </div>
      {e.reloj.corriendo ? (
        <button onClick={reloj.pausa} aria-label="Pausar"><Pausa /></button>
      ) : (
        <button onClick={reloj.play} aria-label="Reproducir"><Play /></button>
      )}
      {abierto && (
        <>
          <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Velocidad">
            {VELOCIDADES.map((v) => (
              <button key={v} aria-pressed={e.reloj.velocidad === v} onClick={() => reloj.velocidad(v)}>
                ×{v}
              </button>
            ))}
          </div>
          <button onClick={() => reloj.avanzar(5)}>+5 min</button>
          <button onClick={() => reloj.irA(MOMENTO_CLAVE)} title="Ir a las 10:35, el momento del ejemplo">10:35</button>
          <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Modo">
            <button aria-pressed={e.modo === 'guiado'} onClick={() => cambiarModo('guiado')} title="Guion de la presentación">Guiada</button>
            <button aria-pressed={e.modo === 'libre'} onClick={() => cambiarModo('libre')} title="Tú manejas a Camila">Libre</button>
          </div>
          <button onClick={() => reiniciar()} aria-label="Reiniciar jornada"><Reinicio /></button>
        </>
      )}
      <button onClick={() => setAbierto(!abierto)} aria-label={abierto ? 'Contraer controles' : 'Expandir controles'}>
        {abierto ? '–' : '+'}
      </button>
    </div>
  );
}
