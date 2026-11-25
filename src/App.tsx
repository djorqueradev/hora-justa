import { useRuta } from './router';
import { Marca } from './components/Comunes';
import { ControlDemo } from './components/ControlDemo';
import { Inicio } from './views/Inicio';
import { Paciente } from './views/Paciente';
import { Recepcion } from './views/Recepcion';
import { Medico } from './views/Medico';
import { Totem } from './views/Totem';
import { Checkin, Entrada } from './views/Entrada';
import { Simulacion } from './views/Simulacion';
import { Regla } from './views/Regla';
import { Proyecto } from './views/Proyecto';

const NAV: [string, string][] = [
  ['', 'Inicio'],
  ['c', 'Paciente'],
  ['recepcion', 'Recepción'],
  ['medico', 'Médico'],
  ['entrada', 'Pantalla QR'],
  ['totem', 'Tótem'],
  ['simulacion', 'Antes y después'],
  ['regla', 'Regla'],
  ['proyecto', 'Proyecto'],
];

export function App() {
  const { partes, query } = useRuta();
  const [seccion = '', arg] = partes;

  let vista;
  switch (seccion) {
    case 'c':
    case 'paciente':
      vista = <Paciente token={arg} />;
      break;
    case 'recepcion':
      vista = <Recepcion />;
      break;
    case 'medico':
      vista = <Medico />;
      break;
    case 'totem':
      vista = <Totem />;
      break;
    case 'entrada':
      vista = <Entrada />;
      break;
    case 'checkin':
      vista = <Checkin k={query.get('k') ?? ''} />;
      break;
    case 'simulacion':
      vista = <Simulacion />;
      break;
    case 'regla':
      vista = <Regla />;
      break;
    case 'proyecto':
      vista = <Proyecto />;
      break;
    default:
      vista = <Inicio />;
  }

  const activo = seccion === 'paciente' ? 'c' : seccion;

  return (
    <>
      <header className={`topbar ${['c', 'paciente', 'totem', 'entrada', 'checkin'].includes(seccion) ? 'inmersiva' : ''}`}>
        <div className="topbar-in">
          <a href="#/" style={{ textDecoration: 'none' }} aria-label="Hora Justa, inicio"><Marca /></a>
          <nav className="nav" aria-label="Pantallas">
            {NAV.map(([ruta, nombre]) => (
              <a key={ruta} href={`#/${ruta}`} aria-current={activo === ruta ? 'page' : undefined}>{nombre}</a>
            ))}
          </nav>
        </div>
      </header>
      <main>{vista}</main>
      {seccion !== 'simulacion' && seccion !== 'proyecto' && <ControlDemo />}
    </>
  );
}
