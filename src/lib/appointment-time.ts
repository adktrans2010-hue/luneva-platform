// Database timestamps represent UTC instants; schedule inputs are Moscow wall time.
export const APPOINTMENT_TIME_ZONE = "Europe/Moscow";
type Instant = Date | string;
function parts(value: Instant) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: APPOINTMENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
}
export function moscowDateInput(value: Instant) {
  const p = parts(value); return `${p.year}-${p.month}-${p.day}`;
}
export function formatMoscowTime(value: Instant) {
  const p = parts(value); return `${p.hour}:${p.minute}`;
}
export function moscowDateTimeInput(value: Instant) {
  return `${moscowDateInput(value)}T${formatMoscowTime(value)}`;
}
export function formatMoscowDate(value: Instant) {
  return new Intl.DateTimeFormat("ru-RU", {timeZone: APPOINTMENT_TIME_ZONE, day:"2-digit", month:"long", year:"numeric"}).format(new Date(value));
}
export function formatMoscowDateTime(value: Instant) {
  return `${formatMoscowDate(value)}, ${formatMoscowTime(value)}`;
}
export function parseMoscowAppointmentDate(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const target = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(target)) return null;
  let instant = target;
  for (let i=0;i<3;i++) {
    const p=parts(new Date(instant));
    const wall=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    instant += target-wall;
  }
  const result=new Date(instant);
  return moscowDateTimeInput(result) === `${date}T${time}` ? result : null;
}
export function parseAppointmentInput(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return parseMoscowAppointmentDate(value.slice(0,10),value.slice(11));
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date=new Date(value); return Number.isFinite(date.getTime()) ? date : null;
}
export function addCalendarDays(date: string, days: number) {
  const d=new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
}
