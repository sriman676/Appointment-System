/**
 * Simple iCalendar (.ics) generator for web browsers
 */

export const downloadICS = (title, description, date, startTime, duration = 30) => {
  const start = new Date(date);
  const [h, m] = startTime.split(':').map(Number);
  start.setHours(h, m, 0);

  const end = new Date(start.getTime() + duration * 60000);

  const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const icsMsg = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SRMAP Counselling//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description?.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsMsg], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
