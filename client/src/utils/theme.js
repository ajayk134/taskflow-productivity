export const DEFAULT_ACCENT = '#3b82f6';

export function accentShades(hex) {
  const norm = (hex || '').startsWith('#') ? hex : `#${hex}`;
  const parts = /^#([0-9a-f]{6})$/i.exec(norm || '');
  if (!parts) {
    return { 500: DEFAULT_ACCENT, 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' };
  }
  const base = parts[1].match(/.{2}/g).map((h) => parseInt(h, 16));
  const scale = (f) =>
    '#' + base.map((c) => Math.round(Math.min(255, c * f)).toString(16).padStart(2, '0')).join('');
  return {
    500: norm,
    600: norm,
    700: scale(0.7),
    800: scale(0.5),
  };
}

export function applyAccent(hex) {
  const root = document.documentElement;
  const shades = accentShades(hex);
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--color-brand-${shade}`, value);
  });
}