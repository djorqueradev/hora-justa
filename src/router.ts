import { useEffect, useState } from 'react';

/** Rutas con hash (#/recepcion) para que funcione en GitHub Pages sin servidor. */
export interface Ruta {
  partes: string[];
  query: URLSearchParams;
}

function leerRuta(): Ruta {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [camino, q = ''] = hash.split('?');
  return { partes: camino.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function useRuta(): Ruta {
  const [ruta, setRuta] = useState(leerRuta);
  useEffect(() => {
    const fn = () => {
      setRuta(leerRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return ruta;
}

export function ir(camino: string) {
  window.location.hash = camino;
}

/** URL absoluta de una ruta interna (para QR y links únicos). */
export function urlAbsoluta(camino: string): string {
  const base = window.location.href.split('#')[0];
  return `${base}#${camino}`;
}
