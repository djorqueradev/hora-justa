import type { ReactNode } from 'react';
import { MOMENTO_CLAVE, reiniciar, reloj, cambiarModo } from '../store';
import { Estetoscopio, Flecha, Grafico, Libro, Monitor, Qr, Escudo, Telefono, Persona } from '../components/Iconos';
import { ir } from '../router';

export function Inicio() {
  const empezar = () => {
    cambiarModo('guiado');
    reloj.velocidad(10);
    reloj.play();
    ir('/recepcion');
  };
  const momento = () => {
    reiniciar('guiado');
    reloj.irA(MOMENTO_CLAVE);
    ir('/recepcion');
  };

  return (
    <div className="page">
      <section className="card shadow" style={{ padding: '40px 40px', gap: 18 }}>
        <span className="badge b-accent" style={{ alignSelf: 'flex-start' }}>Prototipo · Salud Sin Espera</span>
        <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, maxWidth: 760 }}>
          Nadie que llega a su hora espera por el atraso de otro.
        </h1>
        <p className="muted" style={{ fontSize: 17, maxWidth: 720 }}>
          Hora Justa acompaña al paciente antes, al llegar, en la consulta y después. Una regla de tolerancia decide qué
          pasa con los atrasos, el médico ve su tiempo y los huecos se reocupan solos.
        </p>
        <div className="row wrap">
          <button className="btn primary lg" onClick={empezar}>Reproducir la jornada guiada <Flecha /></button>
          <button className="btn lg" onClick={momento}>Ir directo a las 10:35</button>
          <a className="btn lg" href="#/simulacion">Ver el antes y el después</a>
        </div>
      </section>

      <section className="col">
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Las pantallas</h2>
        <div className="grid-auto">
          <Pantalla href="#/c/7KQ2-M9" icono={<Telefono />} titulo="Paciente" texto="El link único de Camila: su hora, la hora estimada, check-in con QR y “voy atrasado”." />
          <Pantalla href="#/recepcion" icono={<Monitor />} titulo="Recepción" texto="Agenda en vivo, decisiones de la regla, avisos enviados, lista de espera y métricas." />
          <Pantalla href="#/medico" icono={<Estetoscopio />} titulo="Médico" texto="Cronómetro-semáforo de la consulta, quién sigue y aviso de atraso a todos." />
          <Pantalla href="#/entrada" icono={<Qr />} titulo="Pantalla de la entrada" texto="QR que cambia cada 30 segundos para registrar la llegada real." />
          <Pantalla href="#/totem" icono={<Persona />} titulo="Tótem" texto="Check-in con los últimos dígitos del RUT para quien no usa celular." />
          <Pantalla href="#/simulacion" icono={<Grafico />} titulo="Antes y después" texto="El ejemplo de la presentación 2, sin y con Hora Justa, con parámetros ajustables." />
          <Pantalla href="#/regla" icono={<Escudo />} titulo="Regla de tolerancia" texto="Los seis escenarios, un probador y la configuración por clínica." />
          <Pantalla href="#/proyecto" icono={<Libro />} titulo="Proyecto" texto="Problema, vigilancia tecnológica, Lean Canvas y fuentes." />
        </div>
      </section>

      <section className="card" aria-label="Cómo hacer la demo">
        <h2>Demo en 2 minutos</h2>
        <ol className="small" style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Abre <b>Recepción</b> en el computador y el <b>link de Camila</b> en otra pestaña (o en el celular, en el mismo navegador).</li>
          <li>Con el control de abajo a la derecha, reproduce la jornada a ×10 o salta a las <b>10:35</b>.</li>
          <li>Mira cómo Sofía llega 8 min tarde y pasa solo hasta las 10:40, Jorge avisa 20 min y su hora pasa a Marta desde la lista de espera.</li>
          <li>En <b>modo libre</b>, tú manejas a Camila: avisa un atraso o haz check-in y mira cómo reacciona la agenda.</li>
          <li>Desde Recepción o Médico, prueba una urgencia o un atraso del médico: todos reciben su nueva hora.</li>
        </ol>
        <p className="xs muted">Todos los nombres y datos son ficticios. El estado se guarda en este navegador y se sincroniza entre pestañas.</p>
      </section>
    </div>
  );
}

function Pantalla({ href, icono, titulo, texto }: { href: string; icono: ReactNode; titulo: string; texto: string }) {
  return (
    <a href={href} className="card" style={{ textDecoration: 'none', color: 'inherit', gap: 10 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icono}</span>
      <span style={{ fontSize: 16, fontWeight: 800 }}>{titulo}</span>
      <span className="small" style={{ color: 'var(--ink-2)' }}>{texto}</span>
    </a>
  );
}
