import { useMemo, useState } from 'react';
import { simular } from '../engine/simular';
import { ESCENARIO_EJEMPLO, guionEjemplo } from '../engine/escenario';
import { CONFIG_INICIAL, type Config, type Snapshot } from '../engine/types';
import { hhmm, hora } from '../engine/formato';

const DESDE = hora(10);
const HASTA = hora(11, 45);
const pct = (m: number) => `${((m - DESDE) / (HASTA - DESDE)) * 100}%`;

/** El ejemplo de la presentación 2, lado a lado: sin y con Hora Justa. */
export function Simulacion() {
  const [atraso, setAtraso] = useState(12);
  const [cfg, setCfg] = useState<Config>(CONFIG_INICIAL);
  const sin = useMemo(() => simular(ESCENARIO_EJEMPLO, { ...cfg, reglaActiva: false }, guionEjemplo(atraso), hora(12)), [atraso, cfg]);
  const con = useMemo(() => simular(ESCENARIO_EJEMPLO, { ...cfg, reglaActiva: true }, guionEjemplo(atraso), hora(12)), [atraso, cfg]);
  const esperaPuntuales = (s: Snapshot) =>
    s.pacientes.filter((p) => p.id !== 'a').reduce((acc, p) => acc + Math.max(0, (p.inicio ?? p.slot) - p.slotOriginal), 0);

  return (
    <div className="page">
      <header className="col" style={{ gap: 6 }}>
        <span className="badge b-accent" style={{ alignSelf: 'flex-start' }}>Ejemplo de la presentación 2</span>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>Un atraso que se contagia… o no</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Citas de 20 minutos. El paciente A llega tarde. Mueve el atraso y los parámetros de la regla, y compara la misma
          mañana sin Hora Justa y con Hora Justa. Las barras punteadas son la hora agendada; las de color, la atención real.
        </p>
      </header>

      <section className="card" aria-label="Parámetros">
        <div className="grid-auto">
          <Deslizador label="Atraso del paciente A" valor={atraso} min={0} max={25} sufijo="min" onChange={setAtraso} />
          <Deslizador label="Pasa sin más hasta" valor={cfg.toleranciaPasa} min={0} max={10} sufijo="min" onChange={(v) => setCfg({ ...cfg, toleranciaPasa: v, toleranciaMax: Math.max(v + 1, cfg.toleranciaMax) })} />
          <Deslizador label="Reagenda sobre" valor={cfg.toleranciaMax} min={cfg.toleranciaPasa + 1} max={25} sufijo="min" onChange={(v) => setCfg({ ...cfg, toleranciaMax: v })} />
          <Deslizador label="Consulta mínima" valor={cfg.consultaMinima} min={5} max={20} sufijo="min" onChange={(v) => setCfg({ ...cfg, consultaMinima: v })} />
        </div>
      </section>

      <div className="split">
        <section className="card main" aria-label="Sin Hora Justa" style={{ flex: '1 1 520px' }}>
          <div className="card-head">
            <h2>Sin Hora Justa</h2>
            <span className="badge b-bad">Puntuales esperan {Math.round(esperaPuntuales(sin))} min en total</span>
          </div>
          <p className="small muted">A pasa con su tiempo completo y el atraso se traspasa en cadena.</p>
          <Gantt s={sin} />
        </section>
        <section className="card main" aria-label="Con Hora Justa" style={{ flex: '1 1 520px' }}>
          <div className="card-head">
            <h2>Con Hora Justa</h2>
            <span className={`badge ${esperaPuntuales(con) === 0 ? 'b-ok' : 'b-warn-2'}`}>Puntuales esperan {Math.round(esperaPuntuales(con))} min en total</span>
          </div>
          <p className="small muted">{con.pacientes.find((p) => p.id === 'a')?.decision?.texto}</p>
          <Gantt s={con} />
        </section>
      </div>
    </div>
  );
}

function Gantt({ s }: { s: Snapshot }) {
  const marcas = [hora(10), hora(10, 20), hora(10, 40), hora(11), hora(11, 20), hora(11, 40)];
  return (
    <div className="gantt">
      {s.pacientes.map((p) => {
        const espera = Math.round((p.inicio ?? p.slot) - p.slotOriginal);
        const reubicado = p.slot !== p.slotOriginal;
        const color = p.id === 'a' ? (reubicado ? '#0B6E6E' : '#B25E00') : espera > 2 ? '#B42318' : '#17663D';
        return (
          <div key={p.id} className="gantt-row">
            <div className="col" style={{ gap: 0 }}>
              <span className="small bold">{p.nombre}</span>
              <span className="xs muted">Hora {hhmm(p.slotOriginal)}</span>
            </div>
            <div className="gantt-track">
              <div className="gantt-plan" style={{ left: pct(p.slotOriginal), width: `calc(${pct(p.slotOriginal + 20)} - ${pct(p.slotOriginal)})` }} />
              {p.inicio !== undefined && p.fin !== undefined && (
                <div className="gantt-bar" style={{ left: pct(p.inicio), width: `calc(${pct(p.fin)} - ${pct(p.inicio)})`, background: color }}>
                  {hhmm(p.inicio)}{p.id !== 'a' && espera > 0 ? ` · +${espera}` : ''}
                  {reubicado ? ' · reubicado' : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="gantt-axis">
        <div />
        <div>
          {marcas.map((m) => (
            <span key={m} style={{ left: pct(m) }}>{hhmm(m)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Deslizador({ label, valor, min, max, sufijo, onChange }: { label: string; valor: number; min: number; max: number; sufijo: string; onChange: (v: number) => void }) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row between">
        <label htmlFor={id}>{label}</label>
        <span className="num bold">{valor} {sufijo}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={valor} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
