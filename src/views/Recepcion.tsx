import { useState } from 'react';
import { useJornada, despachar } from '../store';
import { hhmm, NOMBRE_CANAL } from '../engine/formato';
import { detallePaciente, estadoPaciente, horaAviso, semaforo } from '../components/Comunes';
import { Campana, Mas, Persona } from '../components/Iconos';
import type { Paciente } from '../engine/types';

export function Recepcion() {
  const { snap, t, estado } = useJornada();
  const { escenario: esc, metricas: m, config: c } = snap;
  const [llegadaManual, setLlegadaManual] = useState(false);
  const actual = snap.medico.actual;

  const agenda = [...snap.pacientes].sort((a, b) => {
    const sa = a.origen === 'urgencia' ? (a.inicio ?? a.slot) : a.slotOriginal;
    const sb = b.origen === 'urgencia' ? (b.inicio ?? b.slot) : b.slotOriginal;
    return sa - sb || (a.origen === 'lista_espera' ? 1 : 0) - (b.origen === 'lista_espera' ? 1 : 0);
  });
  const pendientes = snap.pacientes.filter((p) => p.estado === 'agendado' && p.origen !== 'urgencia');
  const holguraLibre = esc.slots.filter((s) => s > t && !snap.pacientes.some((p) => p.slot === s && ['agendado', 'en_sala', 'en_consulta', 'atendido'].includes(p.estado)));
  const avisosHoy = snap.avisos.filter((a) => a.t >= esc.inicioDia - 60).slice(0, 8);

  return (
    <div className="page">
      <header className="row wrap between">
        <div className="col" style={{ gap: 2 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Recepción · {esc.especialidad}</h1>
          <span className="muted small">{esc.medico} · {esc.box} · {esc.fecha}</span>
        </div>
        <div className="row">
          <span className="badge b-demo">Datos de demostración · {estado.modo === 'guiado' ? 'demo guiada' : 'modo libre'}</span>
          {!c.reglaActiva && <span className="badge b-bad">Regla desactivada</span>}
          <span className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>{hhmm(t)}</span>
        </div>
      </header>

      <section aria-label="Métricas de hoy" className="grid-auto">
        <div className="kpi">
          <span className="kpi-label">Atendidos ±10 min de su hora</span>
          <span className="kpi-value num">{m.puntualesAtendidos ? `${Math.round((m.aTiempo / m.puntualesAtendidos) * 100)}%` : '—'}</span>
          <span className="kpi-foot">{m.aTiempo} de {m.puntualesAtendidos} que llegaron a tiempo</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Atraso acumulado de la jornada</span>
          <span className="kpi-value num">{m.atrasoAcumulado} min</span>
          <span className="kpi-foot">Suma de lo que esperaron los puntuales</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Huecos reocupados</span>
          <span className="kpi-value num">{m.huecosTotales ? `${m.huecosReocupados} de ${m.huecosTotales}` : '—'}</span>
          <span className="kpi-foot">Desde la lista de espera</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Riesgo de reclamo por tiempos</span>
          <span className="kpi-value num">{m.riesgoReclamo}</span>
          <span className="kpi-foot">Puntuales con más de 15 min de espera</span>
        </div>
      </section>

      <div className="split">
        <div className="main">
          <section aria-label="Agenda de hoy" className="card">
            <div className="card-head">
              <h2>Agenda de hoy</h2>
              <span className="muted small">La regla de tolerancia decide; recepción solo confirma.</span>
            </div>
            <div>
              {agenda.map((p, i) => (
                <FilaAgenda key={p.id} p={p} t={t} sep={i > 0} />
              ))}
              {holguraLibre.map((s) => (
                <div key={s} className="agenda-row sep">
                  <span className="agenda-time num muted">{hhmm(s)}</span>
                  <div className="agenda-body">
                    <span className="agenda-name muted">Bloque libre</span>
                    <span className="agenda-detail">Holgura del día: sirve para reubicar atrasos o urgencias</span>
                  </div>
                  <span className="badge b-neutral">Holgura</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="Avisos enviados" className="card">
            <div className="card-head">
              <h2>Avisos enviados</h2>
              <span className="muted small">Por el canal que eligió cada paciente</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {avisosHoy.length === 0 && <span className="muted small">Todavía no hay avisos hoy.</span>}
              {avisosHoy.map((a, i) => (
                <div key={i} className="aviso">
                  <span className="aviso-t num">{horaAviso(a)}</span>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <span className="small bold">{a.para} · {NOMBRE_CANAL[a.canal]}</span>
                    <span className="small" style={{ color: 'var(--ink-2)' }}>{a.texto}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="side">
          <ConsultaEnCurso p={actual} t={t} siguiente={snap.pacientes.filter((p) => p.estado === 'en_sala').sort((a, b) => a.slot - b.slot)[0]} />

          <section aria-label="Regla de tolerancia" className="card">
            <div className="card-head">
              <h2>Regla de tolerancia</h2>
              <a href="#/regla" className="small bold">Configurar</a>
            </div>
            <ReglaResumen />
          </section>

          <section aria-label="Acciones rápidas" className="card">
            <h2>Acciones rápidas</h2>
            <button className="btn danger left" onClick={() => despachar({ tipo: 'urgencia', nombre: `Urgencia ${snap.pacientes.filter((p) => p.origen === 'urgencia').length + 1}` })}>
              <Mas />Urgencia clínica: pasar ahora
            </button>
            <button className="btn left" onClick={() => despachar({ tipo: 'medico_atraso', minutos: 10 })}>
              <Campana />Médico atrasado 10 min: avisar a todos
            </button>
            <button className="btn left" onClick={() => setLlegadaManual(!llegadaManual)} aria-expanded={llegadaManual}>
              <Persona />Registrar llegada sin celular
            </button>
            {llegadaManual && (
              <div className="col" style={{ gap: 8 }}>
                {pendientes.length === 0 && <span className="muted small">No hay pacientes por llegar.</span>}
                {pendientes.map((p) => (
                  <button key={p.id} className="btn sm left" onClick={() => { despachar({ tipo: 'checkin', pid: p.id, via: 'recepcion' }); setLlegadaManual(false); }}>
                    <span className="num bold">{hhmm(p.slot)}</span> {p.nombre}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Lista de espera" className="card">
            <h2>Lista de espera</h2>
            {snap.listaEspera.map((w) => (
              <div key={w.id} className="row between">
                <div className="col" style={{ gap: 0 }}>
                  <span className="bold small">{w.nombre}</span>
                  <span className="xs muted">{NOMBRE_CANAL[w.canal]}{w.aceptaEn === null ? ' · no suele responder' : ''}</span>
                </div>
                <span className={`badge ${w.estado === 'asignado' ? 'b-accent-2' : w.estado === 'ofrecido' ? 'b-warn-2' : 'b-neutral'}`}>
                  {w.estado === 'asignado' ? `Tomó ${hhmm(w.slot!)}` : w.estado === 'ofrecido' ? 'Cupo ofrecido' : 'En espera'}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function FilaAgenda({ p, t, sep }: { p: Paciente; t: number; sep: boolean }) {
  const e = estadoPaciente(p, t);
  const tachado = p.estado === 'reagendado' || p.estado === 'cancelado';
  const hora = p.origen === 'urgencia' ? (p.inicio ?? p.llegada!) : p.slotOriginal;
  return (
    <div className={`agenda-row ${e.tinte ?? (sep ? 'sep' : '')} ${p.estado === 'atendido' ? 'past' : ''}`}>
      <span className={`agenda-time num ${tachado ? 'strike' : ''}`}>{hhmm(hora)}</span>
      <div className="agenda-body">
        <span className="agenda-name">
          {p.nombre}
          {p.slot !== p.slotOriginal && p.estado !== 'reagendado' && <span className="muted small"> → {hhmm(p.slot)}</span>}
        </span>
        <span className="agenda-detail">{detallePaciente(p) || '—'}</span>
      </div>
      {p.estado === 'agendado' && p.origen !== 'urgencia' && t >= p.slot - 30 && (
        <button className="btn sm" onClick={() => despachar({ tipo: 'checkin', pid: p.id, via: 'recepcion' })}>Llegó</button>
      )}
      <span className={`badge ${e.clase}`}>{e.texto}</span>
    </div>
  );
}

export function ConsultaEnCurso({ p, t, siguiente }: { p?: Paciente; t: number; siguiente?: Paciente }) {
  if (!p) {
    return (
      <section aria-label="Consulta en curso" className="card dark">
        <span className="small" style={{ color: 'var(--dark-ink)' }}>Consulta en curso</span>
        <span style={{ fontSize: 20, fontWeight: 800 }}>Box libre</span>
        <span className="small" style={{ color: '#D5E3E7' }}>
          {siguiente ? `Siguiente: ${siguiente.nombre}, entra a las ${hhmm(Math.max(siguiente.slot, t))}.` : 'Nadie esperando en sala.'}
        </span>
      </section>
    );
  }
  const s = semaforo(p, t);
  return (
    <section aria-label="Consulta en curso" className="card dark" style={{ gap: 14 }}>
      <div className="row between">
        <span className="small" style={{ color: 'var(--dark-ink)' }}>Consulta en curso</span>
        <span className="badge" style={{ background: s.color, color: '#1F1300' }}>{s.nombre}</span>
      </div>
      <span style={{ fontSize: 17, fontWeight: 700 }}>{p.nombre}</span>
      <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
        <span className="timer" style={{ color: s.restante < 0 ? '#FF9B8F' : '#fff' }}>{s.texto}</span>
        <span className="small" style={{ color: 'var(--dark-ink)' }}>{s.restante < 0 ? 'excedido' : 'restantes'}</span>
      </div>
      <div className="bar"><div style={{ width: `${Math.round(s.usado * 100)}%`, background: s.color }} /></div>
      <span className="small" style={{ color: '#D5E3E7' }}>
        Termina a las {hhmm(p.finObjetivo!)}
        {siguiente ? ` para que ${siguiente.nombre.split(' ')[0]} entre a su hora.` : '.'}
      </span>
      <div className="row wrap xs" style={{ gap: 14, color: 'var(--dark-ink)' }}>
        <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: '#5FD39A' }} />Más de la mitad</span>
        <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: '#FFC46B' }} />Menos de la mitad</span>
        <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: '#FF7A6B' }} />Excedido</span>
      </div>
    </section>
  );
}

export function ReglaResumen() {
  const { snap } = useJornada();
  const c = snap.config;
  return (
    <>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="badge b-ok" style={{ minWidth: 84, justifyContent: 'center' }}>≤ {c.toleranciaPasa} min</span>
        <span className="small" style={{ color: 'var(--ink-2)' }}>Pasa; la consulta termina a la hora planificada.</span>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="badge b-warn-2" style={{ minWidth: 84, justifyContent: 'center' }}>{c.toleranciaPasa + 1}–{c.toleranciaMax} min</span>
        <span className="small" style={{ color: 'var(--ink-2)' }}>Pasa si alcanza {c.consultaMinima} min de consulta (con holgura); si no, se reubica en el próximo hueco del día.</span>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="badge b-bad" style={{ minWidth: 84, justifyContent: 'center' }}>&gt; {c.toleranciaMax} min</span>
        <span className="small" style={{ color: 'var(--ink-2)' }}>O sin aviso: reagenda con prioridad o pasa a teleconsulta.</span>
      </div>
      <span className="xs muted">Excepciones: la urgencia clínica siempre pasa y, si el atrasado es el médico, se avisa a todos.</span>
    </>
  );
}
