const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_CORTO = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * Returns today's date label: "Lunes 16"
 */
export function getTodayLabel(): string {
    const now = new Date();
    return `${DIAS[now.getDay()]} ${now.getDate()}`;
}

/**
 * Returns current month and year: "Febrero 2024"
 */
export function getMonthYearLabel(): string {
    const now = new Date();
    return `${MESES[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Returns a week range string: "16–21 Feb"
 */
export function getWeekRange(startDate?: Date): string {
    const start = startDate || getMonday(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 5); // Mon-Sat
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = MESES_CORTO[end.getMonth()];
    return `${startDay}–${endDay} ${month}`;
}

/**
 * Get Monday of the current week.
 */
function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
}

/**
 * Format a date to a short string: "Hoy, 9:41 AM" or "12 Oct"
 */
export function formatDateShort(date: Date): string {
    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `Hoy, ${h}:${minutes} ${ampm}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `Ayer, ${h}:${minutes} ${ampm}`;
    }

    return `${date.getDate()} ${MESES_CORTO[date.getMonth()]}`;
}
