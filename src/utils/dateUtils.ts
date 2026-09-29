/**
 * Convierte una fecha o timestamp a un texto relativo en español:
 * - < 15 segundos: "Recién"
 * - < 60 segundos: "Hace X seg"
 * - < 60 minutos: "Hace X min" / "Hace X mins"
 * - < 24 horas: "Hace X hora" / "Hace X horas"
 * - < 7 días: "Hace X día" / "Hace X días"
 * - < 30 días: "Hace X semana" / "Hace X semanas"
 * - < 365 días: "Hace X mes" / "Hace X meses"
 * - >= 365 días: "Hace X año" / "Hace X años"
 */
export function formatTimeAgo(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'Recién';

  // Si ya es un texto de fallback descriptivo legado y no es parseable como fecha ISO:
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.startsWith('Hace ') || trimmed === 'Recién' || trimmed === 'Reciente') {
      if (isNaN(Date.parse(trimmed))) {
        return trimmed;
      }
    }
  }

  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Recién';

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 15) {
    return 'Recién';
  }
  if (diffInSeconds < 60) {
    return `Hace ${diffInSeconds} seg`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? 'Hace 1 min' : `Hace ${diffInMinutes} mins`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? 'Hace 1 hora' : `Hace ${diffInHours} horas`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'Hace 1 día' : `Hace ${diffInDays} días`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) {
    return diffInWeeks === 1 ? 'Hace 1 semana' : `Hace ${diffInWeeks} semanas`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? 'Hace 1 mes' : `Hace ${diffInMonths} meses`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? 'Hace 1 año' : `Hace ${diffInYears} años`;
}
