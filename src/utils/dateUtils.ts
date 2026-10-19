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

/**
 * Obtiene la fecha actual en la zona horaria de Argentina (America/Argentina/Buenos_Aires - UTC-3)
 * en formato estándar 'YYYY-MM-DD'. Evita desfasajes de medianoche UTC.
 */
export function getTodayBuenosAires(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Agrega o resta días a una fecha 'YYYY-MM-DD' en el calendario local sin alteración horaria.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayFormatted = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayFormatted}`;
}

/**
 * Obtiene el día de la semana de una fecha 'YYYY-MM-DD' (0 = Domingo, 1 = Lunes, ..., 6 = Sábado).
 */
export function getDayOfWeekFromDateStr(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

/**
 * Calcula las fechas de conveniencia ('Hoy', 'Mañana', 'Sábado', 'Domingo')
 * de manera estrictamente sincronizada con la zona horaria del complejo deportivo (UTC-3).
 * Si hoy es Sábado, 'Sábado' corresponde a hoy.
 * Si hoy es Domingo, 'Domingo' corresponde a hoy.
 */
export function getQuickDatesBuenosAires() {
  const today = getTodayBuenosAires();
  const tomorrow = addDaysToDate(today, 1);
  const dow = getDayOfWeekFromDateStr(today); // 0 = Domingo, 6 = Sábado

  // Sábado: si hoy es sábado (dow=6), diff = 0 (hoy). Si no, el sábado más próximo.
  const diffSat = (6 - dow + 7) % 7;
  const saturday = addDaysToDate(today, diffSat);

  // Domingo: si hoy es domingo (dow=0), diff = 0 (hoy). Si no, el domingo más próximo.
  const diffSun = (0 - dow + 7) % 7;
  const sunday = addDaysToDate(today, diffSun);

  return { today, tomorrow, saturday, sunday };
}

/**
 * Normaliza nombres de conveniencia ('Hoy', 'Mañana', 'Sábado', 'Domingo') a 'YYYY-MM-DD'.
 */
export function normalizeBookingDate(date: string): string {
  const { today, tomorrow, saturday, sunday } = getQuickDatesBuenosAires();
  if (date === 'Hoy') return today;
  if (date === 'Mañana') return tomorrow;
  if (date === 'Sábado') return saturday;
  if (date === 'Domingo') return sunday;
  return date;
}

/**
 * Formatea una fecha 'YYYY-MM-DD' en formato legible en español argentino
 * (ejemplo: 'domingo, 18 de octubre de 2026').
 */
export function formatDateSpanish(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

