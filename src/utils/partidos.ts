
import type { FixtureMatch } from '../data/mockData';

export const estadoVisiblePartido = (partido: FixtureMatch): string => {
  // No modificar partidos disputados, suspendidos,
  // reprogramados ni fechas libres.
  if (partido.status !== 'Programado' || partido.isFreeDate) {
    return partido.status;
  }

  const fecha = partido.date?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (!fecha) {
    return partido.status;
  }

  // Fecha actual en Argentina.
  const hoy = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  // Un partido sin resultado pasa a pendiente
  // desde el día siguiente al encuentro.
  if (fecha < hoy) {
    return 'Pendiente de resultado';
  }

  return partido.status;
};
