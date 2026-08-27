import { Resend } from 'resend';

interface BookingNotificationDay {
  date: string;
  start_time: string;
  end_time: string;
}

interface BookingNotificationParams {
  name: string;
  email: string;
  phone: string;
  service: string;
  resort: string;
  resortOther: string;
  message: string;
  days: BookingNotificationDay[];
}

export async function sendBookingNotificationEmail(params: BookingNotificationParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  const resend = new Resend(apiKey);
  const resortLabel = params.resort === 'Other' ? params.resortOther : params.resort;
  const daysList = params.days
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => `- ${d.date}: ${d.start_time.slice(0, 5)}–${d.end_time.slice(0, 5)}`)
    .join('\n');

  try {
    await resend.emails.send({
      from: 'Florencia Ski <onboarding@resend.dev>',
      to,
      subject: `Nueva reserva: ${params.name}`,
      text: [
        `Nombre: ${params.name}`,
        `Email: ${params.email}`,
        `Teléfono: ${params.phone || '—'}`,
        `Servicio: ${params.service}`,
        `Resort: ${resortLabel}`,
        '',
        'Días:',
        daysList,
        '',
        `Mensaje: ${params.message || '—'}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('notification email error:', err);
  }
}
