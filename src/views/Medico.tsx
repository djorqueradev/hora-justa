import { despachar, useJornada } from '../store';
import { hhmm } from '../engine/formato';
import { estadoPaciente, semaforo } from '../components/Comunes';
import { Campana, Mas } from '../components/Iconos';

export function Medico() {
  const { snap, t } = useJornada();
  const esc = snap.escenario;
  const p = snap.medico.actual;
  const sala = snap.pacientes
    .filter((x) => x.estado === 'en_sala' || x.estado === 'agendado')
    .sort((a, b) => (a.origen === 'urgencia' ? -1 : 0) - (b.origen === 'urgencia' ? -1 : 0) || (a.estimado ?? a.slot) - (b.estimado ?? b.slot));
  const siguiente = sala[0];
  const s = p ? semaforo(p, t) : null;

  return (
    <div className="page">
      <header className="row wrap between">
        <div className="col" style={{ gap: 2 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>{esc.box} · {esc.medico}</h1>
          <span className="muted small">Vista del médico: lo justo para cuidar el tiempo de cada paciente.</span>
        </div>
        <span className="num" style={{ fontSize: 30, fontWeight: 800 }}>{hhmm(t)}</span>
      </header>

      <div className="split">
        <div className="main">
          <section
            aria-label="Cronómetro de la consulta"
            className="card dark"
            style={{ padding: 32, gap: 18, minHeight: 380, justifyContent: 'center' }}
          >
            {p && s ? (
              <>
                <div className="row between wrap">
                  <span style={{ fontSize: 22, fontWeight: 800 }}>{p.nombre}</span>
                  <span className="badge" style={{ background: s.color, color: '#1F1300', fontSize: 14 }}>{s.nombre}</span>
                </div>
                <span className="num" style={{ fontSize: 120, fontWeight: 800, letterSpacing: -5, lineHeight: 1, color: s.restante < 0 ? '#FF9B8F' : '#fff' }}>
                  {s.texto}
                </span>
                <div className="bar" style={{ height: 16, borderRadius: 8 }}><div style={{ width: `${Math.round(s.usado * 100)}%`, background: s.color }} /></div>
                <span style={{ color: '#D5E3E7', fontSize: 16 }}>
                  Empezó {hhmm(p.inicio!)} · termina a las {hhmm(p.finObjetivo!)}
                  {p.decision && p.llegada !== undefined && p.llegada - p.slotOriginal > 0.5 ? ` · ${p.decision.texto}` : ''}
                </span>
                <div className="row wrap">
                  <button className="btn" style={{ background: '#fff' }} onClick={() => despachar({ tipo: 'terminar' })}>Terminar consulta</button>
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 15, color: 'var(--dark-ink)' }}>Box libre</span>
                <span style={{ fontSize: 34, fontWeight: 800 }}>
                  {siguiente ? `Siguiente: ${siguiente.nombre}` : 'Sin pacientes por ahora'}
                </span>
                {siguiente && (
                  <span style={{ color: '#D5E3E7', fontSize: 16 }}>
                    {siguiente.estado === 'en_sala' ? 'Está en sala' : 'Todavía no llega'} · entra a las {hhmm(siguiente.estimado ?? siguiente.slot)}
                  </span>
                )}
              </>
            )}
          </section>

          <section className="card" aria-label="Pacientes que siguen">
            <h2>Siguen</h2>
            {sala.length === 0 && <span className="muted small">No quedan pacientes en la agenda.</span>}
            {sala.map((x) => {
              const e = estadoPaciente(x, t);
              return (
                <div key={x.id} className="agenda-row sep">
                  <span className="agenda-time num">{hhmm(x.estimado ?? x.slot)}</span>
                  <div className="agenda-body">
                    <span className="agenda-name">{x.nombre}</span>
                    <span className="agenda-detail">Hora agendada {hhmm(x.slot)}{x.decision && x.decision.texto !== 'Llega a su hora.' ? ` · ${x.decision.texto}` : ''}</span>
                  </div>
                  <span className={`badge ${e.clase}`}>{e.texto}</span>
                </div>
              );
            })}
          </section>
        </div>

        <div className="side">
          <section className="card" aria-label="Avisar atraso">
            <h2>¿Te estás atrasando?</h2>
            <p className="small" style={{ color: 'var(--ink-2)' }}>
              Hora Justa avisa la nueva hora a todos los que siguen y les ofrece reagendar. Nadie espera sin saber.
            </p>
            <div className="row">
              {[5, 10, 15].map((m) => (
                <button key={m} className="chip" onClick={() => despachar({ tipo: 'medico_atraso', minutos: m })}>+{m} min</button>
              ))}
            </div>
            {snap.medico.atrasoAvisado > 0 && <span className="badge b-warn-2" style={{ alignSelf: 'flex-start' }}><Campana size={14} />Atraso avisado hoy: {snap.medico.atrasoAvisado} min</span>}
          </section>
          <section className="card" aria-label="Urgencia">
            <h2>Urgencia clínica</h2>
            <p className="small" style={{ color: 'var(--ink-2)' }}>Siempre pasa y decide el médico. Queda registrada y se avisa a quienes siguen si cambia su hora.</p>
            <button className="btn danger left" onClick={() => despachar({ tipo: 'urgencia', nombre: `Urgencia ${snap.pacientes.filter((x) => x.origen === 'urgencia').length + 1}` })}>
              <Mas />Pasar urgencia ahora
            </button>
          </section>
          <section className="card" aria-label="Semáforo">
            <h2>Cómo leer el semáforo</h2>
            <span className="row small"><span className="dot" style={{ background: '#5FD39A' }} />Verde: queda más de la mitad del tiempo.</span>
            <span className="row small"><span className="dot" style={{ background: '#FFC46B' }} />Ámbar: queda menos de la mitad.</span>
            <span className="row small"><span className="dot" style={{ background: '#FF7A6B' }} />Rojo: se pasó de la hora; el siguiente empieza a esperar.</span>
          </section>
        </div>
      </div>
    </div>
  );
}
