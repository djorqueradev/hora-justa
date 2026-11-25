/** Contexto del proyecto: problema, mercado, vigilancia tecnológica, Lean Canvas y fuentes. */
export function Proyecto() {
  return (
    <div className="page">
      <header className="col" style={{ gap: 6 }}>
        <span className="badge b-accent" style={{ alignSelf: 'flex-start' }}>Taller de Transferencia Tecnológica · UNAB</span>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Salud Sin Espera · Hora Justa</h1>
        <p className="muted" style={{ maxWidth: 820 }}>
          Equipo: Benjamín Zúñiga, Diego Jorquera y Mario Lamilla. Docente: Mauricio Pizarro Leyton. Este prototipo
          reúne lo trabajado en las presentaciones del ramo y lo convierte en algo que se puede usar.
        </p>
      </header>

      <section className="grid-auto">
        <div className="card">
          <span className="canvas-num">01 · Problema</span>
          <h2>La espera que agota la paciencia</h2>
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            El paciente espera sin saber cuánto falta, los turnos se manejan a mano y el atraso de uno se traspasa en
            cadena a los que llegaron a la hora. Termina en reclamos, aunque la atención médica sea buena.
          </p>
        </div>
        <div className="card">
          <span className="canvas-num">02 · Cliente y usuario</span>
          <h2>Quién paga y quién vive la espera</h2>
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            Paga la institución: clínicas privadas multiespecialidad y, en una segunda etapa, centros públicos y CESFAM.
            Lo usan el paciente (confirma, avisa su atraso, ve su turno), el médico (cronómetro) y recepción.
          </p>
        </div>
        <div className="card">
          <span className="canvas-num">03 · Mercado</span>
          <h2>Institucional, regulado, local con potencial regional</h2>
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            Competencia no ideal (sector regulado y barreras de integración), producto SaaS, compradores institucionales
            con ciclos de decisión largos, y partida en clínicas de Santiago.
          </p>
        </div>
      </section>

      <section className="card" aria-label="Vigilancia tecnológica">
        <h2>Vigilancia tecnológica: qué tomamos de cada región</h2>
        <div className="scroll-x">
          <table className="simple">
            <thead>
              <tr><th>Región</th><th>Soluciones revisadas</th><th>Dato clave</th><th>Lo que adopta Hora Justa</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="bold">Estados Unidos</td>
                <td>Epic Fast Pass, LeanTaaS iQueue, Clockwise.MD</td>
                <td>Fast Pass: el 48% que aceptó el cupo adelantó su endoscopía 50 días en promedio (Weill Cornell, 2024)</td>
                <td>Lista de espera automática y holguras calculadas con datos</td>
              </tr>
              <tr>
                <td className="bold">Europa</td>
                <td>Doctolib, NHS · DrDoctor, Qmatic</td>
                <td>Casi un tercio menos inasistencias en los hospitales que ya usaban DrDoctor (NHS England, 2018)</td>
                <td>Aviso automático del atraso y check-in autónomo</td>
              </tr>
              <tr>
                <td className="bold">Japón / China</td>
                <td>iTICKET, práctica de puntualidad, franjas de 30 min, IA de pre-consulta</td>
                <td>La espera es el ítem peor evaluado en Japón: 25,5% insatisfecho (MHLW, 2023)</td>
                <td>Política de puntualidad explícita y pre-consulta digital</td>
              </tr>
              <tr>
                <td className="bold">Chile</td>
                <td>Hospital Digital, Keirón, TeleSalud, Hora Salud</td>
                <td>15,6% de inasistencia en consultas de especialidad (2022); 271 mil citas perdidas en los CESFAM de Antofagasta (2025)</td>
                <td>Oportunidad: no encontramos una solución local que gestione en tiempo real el atraso dentro de la consulta</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="col" aria-label="Lean Canvas">
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Lean Canvas</h2>
        <p className="small muted">Cada bloque es una hipótesis que el piloto debe validar.</p>
        <div className="canvas-grid">
          <Celda n="1" t="Problema" items={['Espera sin información', 'El atraso de uno se traspasa en cadena', '15,6% de inasistencia en especialidades (2022)', 'Alternativas: teléfono, SMS sueltos, libro de reclamos']} />
          <Celda n="4" t="Solución" items={['Confirmación y botón “voy atrasado”', 'Check-in por QR o tótem con regla de tolerancia', 'Cronómetro-semáforo y reocupación automática de huecos']} />
          <Celda n="3" t="Propuesta de valor" items={['Nadie que llega a su hora espera por el atraso de otro', 'Como Waze para la sala de espera: ruta, tiempo y aviso en vivo']} />
          <Celda n="9" t="Ventaja injusta" items={['Regla validada con datos propios de puntualidad por especialidad', 'Diseño pensado para la Ley 20.584 y la Ley 21.719']} />
          <Celda n="2" t="Segmento de clientes" items={['Paga: clínicas privadas y CESFAM', 'Usan: pacientes, médicos y admisión', 'Early adopters: clínicas de 2 a 5 sucursales con quejas por tiempos y agenda digital']} />
          <Celda n="8" t="Métricas clave" items={['% atendidos ±10 min de su hora', 'Atraso acumulado por jornada', 'Huecos reocupados y reclamos por tiempos']} />
          <Celda n="5" t="Canales" items={['Venta directa a jefaturas de operaciones', 'Alianzas con proveedores de agenda / HIS', 'Congresos de gestión hospitalaria']} />
          <Celda n="7" t="Estructura de costos" items={['Desarrollo y mantención', 'Integración con la agenda de cada clínica', 'Soporte y capacitación', 'Nube y mensajería SMS/WhatsApp']} />
          <Celda n="6" t="Flujo de ingresos" items={['Suscripción mensual por sucursal', 'Implementación (pago único)', 'Planes según volumen de pacientes']} />
          <div className="canvas-cell" style={{ background: 'var(--accent-soft)' }}>
            <span className="canvas-num">Hipótesis de ingresos</span>
            <h3>$102,6 M CLP en el año 3</h3>
            <ul>
              <li>$300.000 mensuales por sucursal</li>
              <li>$1.500.000 de implementación</li>
              <li>3, 12 y 30 sucursales al cierre de cada año</li>
              <li>Cifras teóricas, a validar con cotizaciones</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card" aria-label="Qué demuestra el prototipo">
        <h2>Qué demuestra este prototipo</h2>
        <div className="grid-auto">
          <Item t="Antes" d="Confirmación 24 h y 2 h antes, link único por cita y botón “voy atrasado”." />
          <Item t="Llegada" d="Check-in con QR que cambia cada 30 s, tótem con RUT o recepción. La regla decide." />
          <Item t="Consulta" d="Cronómetro-semáforo para el médico y nueva hora estimada para los que siguen." />
          <Item t="Después" d="Los huecos se ofrecen a la lista de espera y se miden las cuatro métricas del canvas." />
        </div>
        <p className="xs muted">
          Límites: datos ficticios, sin integración con agendas reales ni envío real de WhatsApp/SMS, y el estado vive en
          el navegador. Son los siguientes pasos del piloto.
        </p>
      </section>

      <section className="card" aria-label="Fuentes">
        <h2>Fuentes de la vigilancia</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Yin, A. L. L., Beecy, A. et al. (2024). Implementing Epic Fast Pass for echocardiogram and endoscopy. npj Health Systems.</li>
          <li>LeanTaaS (2018). LeanTaaS reduces wait times for 1 million patient visits.</li>
          <li>Adena Health System (2019). Online reservation system (Clockwise.MD).</li>
          <li>Doctolib (s.f.). Centro de ayuda: aviso de retraso por SMS y lista de espera.</li>
          <li>NHS England (2018). NHS to trial tech to cut missed appointments.</li>
          <li>Qmatic (s.f.). Westfriesgasthuis customer story.</li>
          <li>Ministerio de Salud, Trabajo y Bienestar de Japón (2025). Encuesta de conducta de pacientes 2023 (確定数).</li>
          <li>Comisión Nacional de Salud de China (2020). 国卫办医函〔2020〕405号.</li>
          <li>Li, X., Tian, D. et al. (2021). AI-assisted reduction in patients’ waiting time for outpatient process. BMC Health Services Research.</li>
          <li>MINSAL (2019). Hospital Digital y agendamiento remoto.</li>
          <li>Muñoz, A. (2024). Pérdidas económicas por inasistencias a consultas de especialidad, 2022. Universidad de Chile.</li>
          <li>Keirón Healthtech (s.f.). Caso Hospital Carlos Van Buren.</li>
          <li>CMDS Antofagasta (2026). CESFAM pierden miles de horas por usuarios que no cancelan su cita.</li>
        </ul>
      </section>
    </div>
  );
}

function Celda({ n, t, items }: { n: string; t: string; items: string[] }) {
  return (
    <div className="canvas-cell">
      <span className="canvas-num">{n.padStart(2, '0')}</span>
      <h3>{t}</h3>
      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

function Item({ t, d }: { t: string; d: string }) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <span className="bold">{t}</span>
      <span className="small" style={{ color: 'var(--ink-2)' }}>{d}</span>
    </div>
  );
}
