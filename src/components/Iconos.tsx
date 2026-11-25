type P = { size?: number; color?: string; stroke?: number };

const base = (size: number, color: string, stroke: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: stroke,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const Reloj = ({ size = 18, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const Check = ({ size = 14, color = 'currentColor', stroke = 3 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const Qr = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3zM20 14v.01M17 20h4v-3M14 20h.01" />
  </svg>
);
export const Mas = ({ size = 18, color = 'currentColor', stroke = 2.4 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Campana = ({ size = 18, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
);
export const Persona = ({ size = 18, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const Play = ({ size = 16, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M7 5v14l11-7z" fill={color} /></svg>
);
export const Pausa = ({ size = 16, color = 'currentColor', stroke = 2.6 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M8 5v14M16 5v14" /></svg>
);
export const Reinicio = ({ size = 16, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
);
export const Flecha = ({ size = 16, color = 'currentColor', stroke = 2.2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Telefono = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
);
export const Monitor = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
);
export const Estetoscopio = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M10 12v3a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="11" r="2" /></svg>
);
export const Grafico = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const Libro = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></svg>
);
export const Escudo = ({ size = 20, color = 'currentColor', stroke = 2 }: P) => (
  <svg {...base(size, color, stroke)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /></svg>
);
