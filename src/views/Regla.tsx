import { useState } from 'react';
import { cambiarConfig, useEstado } from '../store';
import { aplicarRegla } from '../engine/regla';
import { hora } from '../engine/formato';

export function Regla() {
  const { config: c } = useEstado();
  const [atraso, setAtraso] = useState(8);
  const [holgura, setHolgura] = useState(0);
  const [hueco, setHueco] = useState(true);
  const d = aplicarRegla({ atraso, inicioSlot: hora(10, 20), holguraDespues: holgura, huecoLibre: hueco ? hora(12) : null, conAviso: true, config: c });
  const color = d.tipo === 'pasa' ? 'b-ok' : d.tipo === 'pasa_holgura' ? 'b-accent' : d.tipo === 'reubicar' ? 'b-warn-2' : 'b-bad';
  const nombre = { pasa: 'Pasa', pasa_holgura: 'Pasa con holgura', reubicar: 'Se reubica hoy', reagendar: 'Se reagenda' }[d.tipo];

  return (
    <div className="page">
      <header className="col" style={{ gap: 6 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>Regla de tolerancia dinámica</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Una regla, no la improvisación, decide qué pasa cuando alguien llega tarde. El paciente la acepta al reservar y
          cada clínica ajusta los umbrales por especialidad. Lo que cambies aquí se aplica en vivo a toda la jornada de la
          demo.
        </p>
      </header>

      <div className="split">
        <div className="main">
          <section className="card" aria-label="Seis escenarios">
            <h2>Seis escenarios, una respuesta clara</h2>
            <div className="scroll-x">
              <table className="simple">
                <thead>
                  <tr><th>Si ocurre…</th><th>Hora Justa…</th><th>Así evita…</th></tr>
                </thead>
                <tbody>
                  <tr><td>Llega hasta {c.toleranciaPasa} min tarde</td><td>Pasa; la consulta termina a la hora planificada</td><td>El atraso en cadena</td></tr>
                  <tr><td>Llega {c.toleranciaPasa + 1}–{c.toleranciaMax} min tarde y alcanza la consulta mínima</td><td>Pasa con el tiempo restante (o la holgura que haya), visible en el cronómetro</td><td>Gastar la holgura a ciegas</td></tr>
                  <tr><td>Llega {c.toleranciaPasa + 1}–{c.toleranciaMax} min tarde, sin holgura</td><td>Se reubica en el próximo hueco del mismo día</td><td>Que el puntual espere</td></tr>
                  <tr><td>Más de {c.toleranciaMax} min o sin aviso</td><td>Reagenda con prioridad o pasa a teleconsulta; su hora va a la lista de espera</td><td>Reclamos por cambio de hora</td></tr>
                  <tr><td>Hay urgencia clínica</td><td>Siempre pasa: decide el médico y queda registrado</td><td>Riesgo para el paciente</td></tr>
                  <tr><td>El atrasado es el médico</td><td>Avisa la nueva hora a todos y ofrece reagendar</td><td>La espera sin información</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="card" aria-label="Probador de la regla">
            <h2>Pruébala</h2>
            <p className="small muted">Cita de 10:20 a 10:40. Cambia el caso y mira la decisión.</p>
            <div className="grid-auto">
              <Campo label="Minutos de atraso" valor={atraso} min={0} max={30} onChange={setAtraso} />
              <Campo label="Holgura libre después de su cita" valor={holgura} min={0} max={20} onChange={setHolgura} />
              <div className="col" style={{ gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>¿Hay un hueco libre hoy?</span>
                <div className="seg" role="group" aria-label="Hueco libre">
                  <button aria-pressed={hueco} onClick={() => setHueco(true)}>Sí, a las 12:00</button>
                  <button aria-pressed={!hueco} onClick={() => setHueco(false)}>No</button>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--surface-2)', padding: 18 }}>
              <span className={`badge ${color}`} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{nombre}</span>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{d.texto}</span>
            </div>
          </section>
        </div>

        <div className="side">
          <section className="card" aria-label="Configuración">
            <h2>Configuración de la clínica</h2>
            <Campo label="Duración de la cita" valor={c.slotMin} min={10} max={40} step={5} onChange={(v) => cambiarConfig({ slotMin: v })} />
            <Campo label="Pasa sin más hasta (min)" valor={c.toleranciaPasa} min={0} max={10} onChange={(v) => cambiarConfig({ toleranciaPasa: v, toleranciaMax: Math.max(v + 1, c.toleranciaMax) })} />
            <Campo label="Reagenda sobre (min)" valor={c.toleranciaMax} min={c.toleranciaPasa + 1} max={30} onChange={(v) => cambiarConfig({ toleranciaMax: v })} />
            <Campo label="Consulta mínima (min)" valor={c.consultaMinima} min={5} max={c.slotMin} onChange={(v) => cambiarConfig({ consultaMinima: v })} />
            <div className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Regla en la jornada de la demo</span>
              <div className="seg" role="group" aria-label="Regla activa">
                <button aria-pressed={c.reglaActiva} onClick={() => cambiarConfig({ reglaActiva: true })}>Con Hora Justa</button>
                <button aria-pressed={!c.reglaActiva} onClick={() => cambiarConfig({ reglaActiva: false })}>Como hoy</button>
              </div>
            </div>
            <button className="btn sm" onClick={() => cambiarConfig({ slotMin: 20, toleranciaPasa: 5, toleranciaMax: 15, consultaMinima: 10, reglaActiva: true })}>
              Volver a los valores de la propuesta
            </button>
          </section>
          <section className="card">
            <h2>Piloto propuesto</h2>
            <p className="small" style={{ color: 'var(--ink-2)' }}>8 semanas en una especialidad. Se mide:</p>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>% de pacientes atendidos ±10 min de su hora</li>
              <li>Atraso acumulado por jornada</li>
              <li>Huecos reocupados</li>
              <li>Reclamos por tiempos</li>
            </ul>
            <p className="xs muted">Con esos datos se ajustan los umbrales por especialidad.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, valor, min, max, step = 1, onChange }: { label: string; valor: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const id = `c-${label.replace(/\W+/g, '-')}`;
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row between">
        <label htmlFor={id}>{label}</label>
        <span className="num bold">{valor} min</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={valor} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
